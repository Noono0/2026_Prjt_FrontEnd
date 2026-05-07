"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { searchCodeDetails, searchCodeGroups } from "@/features/commonCodes/api";
import { AFFILIATION_CODE_GROUP_ID, CORE_COMPANY_AFFILIATION_CODE } from "@/constants/affiliationCodes";
import { ApiError, searchGamniverseProfiles } from "@/features/profile/api";
import {
    affiliationMetaFromDetails,
    buildAffiliationLabelMap,
    dtoToMember,
    groupMembersByAffiliation,
    memberHasDashboardPayload,
    type AffiliationMeta,
    type GroupSection,
    type MemberRow,
} from "./dashboardUtils";
import styles from "./Dashboard.module.css";

const CORE_FIRST_ROW = 7;
const INSTA_BTN_SVG = "/dashboard/insta_btn.svg";
const YOUTUBE_BTN_IMG = "/dashboard/youtube_btn.png";
const CAFE_BTN_IMG = "/dashboard/cafe_btn.png";

function openExternal(url: string) {
    const trimmed = url.trim();
    if (!trimmed) return;
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    window.open(withProtocol, "_blank", "noopener,noreferrer");
}

function MemberTile({
    item,
    openMenuId,
    onToggleMenu,
    onViewProfile,
}: {
    item: MemberRow;
    openMenuId: string | null;
    onToggleMenu: (id: string) => void;
    onViewProfile: (row: MemberRow) => void;
}) {
    const frameClass = styles[`frame${item.rank}`];
    const expanded = openMenuId === item.id;

    return (
        <article className={styles.memberTile} data-member-menu-boundary="true">
            <button
                type="button"
                className={`${styles.avatarWrap} ${frameClass}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleMenu(item.id);
                }}
                aria-expanded={expanded}
                aria-label={`${item.title} 메뉴`}
            >
                {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className={styles.avatar} />
                ) : (
                    <div className={`${styles.avatar} ${styles.noImage}`}>NO IMG</div>
                )}
                {item.isLive ? <span className={styles.liveBadge}>LIVE</span> : null}
            </button>
            <div className={styles.namePlate}>{item.title || "-"}</div>
            {expanded ? (
                <div className={styles.optionMenu} role="menu">
                    {item.isLive && item.soopBroadcastLink.trim() ? (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                openExternal(item.soopBroadcastLink);
                            }}
                        >
                            {item.title} LIVE 이동
                        </button>
                    ) : null}
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            onViewProfile(item);
                        }}
                    >
                        {item.title} 프로필보기
                    </button>
                </div>
            ) : null}
        </article>
    );
}

function ProfilePreviewModal({ profile, onClose }: { profile: MemberRow; onClose: () => void }) {
    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3>{profile.title}</h3>
                {profile.imageUrl ? (
                    <div className={`${styles.modalFrame} ${styles[`frame${profile.rank}`]}`}>
                        <img src={profile.imageUrl} alt="" className={styles.modalImage} />
                    </div>
                ) : null}
                <div className={styles.modalLinkIcons}>
                    {profile.broadcastLink.trim() ? (
                        <button
                            type="button"
                            className={`${styles.linkIconBtn} ${styles.linkIconBtnSoop}`}
                            title={`${profile.title || "프로필"} SOOP 방송국`}
                            aria-label={`${profile.title || "프로필"} SOOP 방송국 이동`}
                            onClick={() => openExternal(profile.broadcastLink)}
                        >
                            <span className={styles.soopText}>SOOP</span>
                        </button>
                    ) : null}
                    {profile.cafeLink.trim() ? (
                        <button
                            type="button"
                            className={styles.linkIconBtn}
                            title={`${profile.title || "프로필"} 네이버 카페`}
                            aria-label={`${profile.title || "프로필"} 네이버 카페 이동`}
                            onClick={() => openExternal(profile.cafeLink)}
                        >
                            <img src={CAFE_BTN_IMG} alt="" width={28} height={28} decoding="async" />
                        </button>
                    ) : null}
                    {profile.instagramUrl.trim() ? (
                        <button
                            type="button"
                            className={styles.linkIconBtn}
                            title={`${profile.title || "프로필"} 인스타그램`}
                            aria-label={`${profile.title || "프로필"} 인스타그램 이동`}
                            onClick={() => openExternal(profile.instagramUrl)}
                        >
                            <img src={INSTA_BTN_SVG} alt="" />
                        </button>
                    ) : null}
                    {profile.youtubeUrl.trim() ? (
                        <button
                            type="button"
                            className={styles.linkIconBtn}
                            title={`${profile.title || "프로필"} 유튜브`}
                            aria-label={`${profile.title || "프로필"} 유튜브 이동`}
                            onClick={() => openExternal(profile.youtubeUrl)}
                        >
                            <img src={YOUTUBE_BTN_IMG} alt="" />
                        </button>
                    ) : null}
                </div>
                <div className={styles.modalFields}>
                    {profile.fields.length === 0 ? (
                        <div className={styles.modalMuted}>추가 프로필 행이 없습니다.</div>
                    ) : (
                        profile.fields.map((f) => (
                            <div key={f.id}>
                                <strong>{f.label || "-"}</strong>: {f.value || "-"}
                            </div>
                        ))
                    )}
                </div>
                <div className={styles.modalActions}>
                    <button type="button" className={styles.modalCloseBtn} onClick={onClose}>
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [affiliations, setAffiliations] = useState<AffiliationMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [viewingProfile, setViewingProfile] = useState<MemberRow | null>(null);

    const boardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onDocMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest("[data-member-menu-boundary='true']")) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", onDocMouseDown);
        return () => document.removeEventListener("mousedown", onDocMouseDown);
    }, []);

    useEffect(() => {
        let mounted = true;
        let timer: ReturnType<typeof setInterval> | null = null;

        const load = async (opts?: { silent?: boolean }) => {
            if (!opts?.silent) {
                setLoading(true);
            }
            try {
                const groups = await searchCodeGroups({
                    codeGroupId: AFFILIATION_CODE_GROUP_ID,
                    page: 1,
                    size: 1,
                });
                const codeGroupSeq = groups.items?.[0]?.codeGroupSeq;

                const detailPromise =
                    codeGroupSeq != null
                        ? searchCodeDetails({
                              codeGroupSeq,
                              page: 1,
                              size: 999,
                              sortBy: "sortOrder",
                              sortDir: "asc",
                          })
                        : Promise.resolve({ items: [] as never[] });

                const profilesPromise = searchGamniverseProfiles({
                    page: 1,
                    size: 500,
                    sortBy: "sortOrder",
                    sortDir: "asc",
                });

                const [details, profilePage] = await Promise.all([detailPromise, profilesPromise]);

                if (!mounted) return;

                const meta = affiliationMetaFromDetails(details.items ?? []);
                setAffiliations(meta);

                const rows = (profilePage.items ?? []).map(dtoToMember).filter(memberHasDashboardPayload);
                console.log("[Dashboard] 메인 데이터", {
                    codeGroupSeq,
                    affiliationGroups: groups,
                    affiliationDetails: details.items ?? [],
                    gamniverseProfiles: profilePage.items ?? [],
                    parsedMembers: rows,
                });
                setMembers(rows);
            } catch (e) {
                if (!mounted) return;
                console.warn("[Dashboard] 로드 실패", e);
                const msg = e instanceof ApiError ? e.message : "대시보드 데이터를 불러오지 못했습니다.";
                alert(msg);
            } finally {
                if (mounted && !opts?.silent) setLoading(false);
            }
        };

        void load();
        timer = setInterval(() => {
            void load({ silent: true });
        }, 5000);
        return () => {
            mounted = false;
            if (timer) {
                clearInterval(timer);
            }
        };
    }, []);

    const labelMap = useMemo(() => buildAffiliationLabelMap(affiliations), [affiliations]);

    const grouped = useMemo(
        () => groupMembersByAffiliation(members, affiliations, labelMap),
        [affiliations, labelMap, members]
    );

    const coreGroup = useMemo(() => grouped.find((g) => g.isCore) ?? null, [grouped]);
    const otherGroups = useMemo(() => grouped.filter((g) => !g.isCore), [grouped]);

    useEffect(() => {
        console.log("[Dashboard][CoreGroupSummary]", {
            coreAffiliationCode: CORE_COMPANY_AFFILIATION_CODE,
            coreGroupCode: coreGroup?.code ?? null,
            coreGroupSize: coreGroup?.items.length ?? 0,
            groupedCodes: grouped.map((g) => ({ code: g.code, isCore: g.isCore, count: g.items.length })),
        });
    }, [coreGroup, grouped]);

    const toggleMemberMenu = (id: string) => {
        setOpenMenuId((prev) => (prev === id ? null : id));
    };

    const openProfile = (item: MemberRow) => {
        setViewingProfile(item);
        setOpenMenuId(null);
    };

    const renderMemberTile = (item: MemberRow) => (
        <MemberTile
            key={item.id}
            item={item}
            openMenuId={openMenuId}
            onToggleMenu={toggleMemberMenu}
            onViewProfile={openProfile}
        />
    );

    const renderGroupSection = (group: GroupSection, opts?: { hideHeader?: boolean }) => (
        <section
            key={group.code}
            className={`${styles.groupSection} ${group.isCore ? styles.coreGroupSection : styles.otherGroupSection}`}
        >
            {!opts?.hideHeader ? (
                <header className={styles.groupHeader}>
                    <strong>{group.label}</strong>
                    <span>({group.items.length})</span>
                </header>
            ) : null}
            <div className={`${styles.groupBody} ${opts?.hideHeader ? styles.groupBodyFlush : ""}`}>
                <div className={styles.emblemCell}>
                    {group.emblemUrl ? (
                        <img src={group.emblemUrl} alt={`${group.label} 소속`} className={styles.emblemImg} />
                    ) : (
                        <div className={styles.emblemPlaceholder}>{group.label.slice(0, 4)}</div>
                    )}
                </div>
                <div className={styles.membersArea}>
                    {group.isCore ? (
                        <>
                            <div className={styles.coreRow7}>
                                {group.items.slice(0, CORE_FIRST_ROW).map(renderMemberTile)}
                            </div>
                            {group.items.length > CORE_FIRST_ROW ? (
                                <div className={styles.coreRow8}>
                                    {group.items.slice(CORE_FIRST_ROW).map(renderMemberTile)}
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <div className={styles.standardGrid9}>{group.items.map(renderMemberTile)}</div>
                    )}
                </div>
            </div>
        </section>
    );

    return (
        <div className={styles.page}>
            <section ref={boardRef}>
                {loading ? (
                    <div className={styles.empty}>불러오는 중...</div>
                ) : grouped.length === 0 ? (
                    <div className={styles.empty}>등록된 멤버스트리머 프로필이 없습니다. 메뉴에서 등록해 주세요.</div>
                ) : (
                    <div className={styles.mainBoard}>
                        {coreGroup ? (
                            <div className={styles.coreZone}>
                                <div className={styles.coreRibbon}>
                                    <span className={styles.coreRibbonMark}>CORE</span>
                                    <span className={styles.coreRibbonTitle}>
                                        감컴퍼니
                                        <span className={styles.coreCount}> ({coreGroup.items.length})</span>
                                    </span>
                                    <span className={styles.coreRibbonHint}>
                                        공통코드 {CORE_COMPANY_AFFILIATION_CODE} · 상단 고정
                                    </span>
                                </div>
                                {renderGroupSection(coreGroup, { hideHeader: true })}
                                <div className={styles.coreBrandBar} aria-hidden>
                                    <span className={styles.coreBrandText}>CORE MEMBER</span>
                                </div>
                            </div>
                        ) : null}

                        {otherGroups.length > 0 ? (
                            <div className={styles.vendorZone}>
                                <div className={styles.vendorGrid}>{otherGroups.map((g) => renderGroupSection(g))}</div>
                            </div>
                        ) : null}
                    </div>
                )}
            </section>

            {viewingProfile ? (
                <ProfilePreviewModal profile={viewingProfile} onClose={() => setViewingProfile(null)} />
            ) : null}
        </div>
    );
}
