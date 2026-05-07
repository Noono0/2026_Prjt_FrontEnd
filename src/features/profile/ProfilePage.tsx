"use client";

import React, { useEffect, useMemo, useState } from "react";
import { searchCodeDetails, searchCodeGroups } from "@/features/commonCodes/api";
import {
    ApiError,
    createGamniverseProfile,
    deleteGamniverseProfile,
    searchGamniverseProfiles,
    updateGamniverseProfile,
    type GamniverseProfileDto,
} from "./api";
import { SoopBroadcastIcon } from "@/components/icons/SoopBroadcastIcon";
import {
    AFFILIATION_CODE_GROUP_ID,
    CORE_COMPANY_AFFILIATION_CODE,
    PROFILE_FIELDS_JSON_PREFIX,
} from "@/constants/affiliationCodes";
import { uploadImageFile } from "@/lib/upload";
import styles from "./ProfilePage.module.css";

const INSTA_BTN_SVG = "/dashboard/insta_btn.svg";
const YOUTUBE_BTN_IMG = "/dashboard/youtube_btn.png";
const CAFE_BTN_IMG = "/dashboard/cafe_btn.png";

type Rank = "DIAMOND" | "GOLD" | "SILVER" | "IRON" | "WOOD";
type FieldItem = { id: string; label: string; value: string };

type ProfileRecord = {
    id: string;
    gamniverseProfileSeq?: number;
    title: string;
    sortOrder: number;
    rank: Rank;
    affiliationCode: string;
    broadcastLink: string;
    soopBroadcastLink: string;
    instagramUrl: string;
    youtubeUrl: string;
    cafeLink: string;
    imageUrl: string;
    imageFileSeq?: number | null;
    fields: FieldItem[];
};

type AffiliationOption = { value: string; label: string; attr1: string; attr2: string };

const RANK_OPTIONS: Array<{ value: Rank; label: string }> = [
    { value: "DIAMOND", label: "다이아" },
    { value: "GOLD", label: "골드" },
    { value: "SILVER", label: "실버" },
    { value: "IRON", label: "아이언" },
    { value: "WOOD", label: "우드" },
];

function codeToRank(code?: string): Rank {
    const c = (code ?? "").trim().toUpperCase();
    if (c === "DIAMOND" || c === "GOLD" || c === "SILVER" || c === "IRON" || c === "WOOD") {
        return c;
    }
    return "IRON";
}

function rankToGradeCode(rank: Rank): string {
    return rank;
}

function createEmptyProfile(): ProfileRecord {
    return {
        id: "",
        gamniverseProfileSeq: undefined,
        title: "",
        sortOrder: 0,
        rank: "IRON",
        affiliationCode: "",
        broadcastLink: "",
        soopBroadcastLink: "",
        instagramUrl: "",
        youtubeUrl: "",
        cafeLink: "",
        imageUrl: "",
        imageFileSeq: null,
        fields: [{ id: "field-1", label: "", value: "" }],
    };
}

function createField(seed?: number): FieldItem {
    return { id: `field-${Date.now()}-${seed ?? Math.random()}`, label: "", value: "" };
}

function parseFieldsFromCareerHistory(careerHistory?: string | null): FieldItem[] {
    const raw = (careerHistory ?? "").trim();
    if (!raw) return [createField(1)];

    if (raw.startsWith(PROFILE_FIELDS_JSON_PREFIX)) {
        const jsonPart = raw.slice(PROFILE_FIELDS_JSON_PREFIX.length);
        try {
            const parsed = JSON.parse(jsonPart) as Array<Partial<FieldItem>>;
            const normalized = (parsed ?? [])
                .map((item, idx) => ({
                    id: `field-loaded-${idx}`,
                    label: (item.label ?? "").trim(),
                    value: (item.value ?? "").trim(),
                }))
                .filter((item) => item.label || item.value);
            return normalized.length > 0 ? normalized : [createField(1)];
        } catch {
            return [createField(1)];
        }
    }

    return raw
        .split("\n")
        .map((line, idx) => {
            const [label, ...rest] = line.split(":");
            return {
                id: `field-legacy-${idx}`,
                label: (label ?? "").trim(),
                value: rest.join(":").trim(),
            };
        })
        .filter((item) => item.label || item.value);
}

function serializeFieldsForCareerHistory(fields: FieldItem[]): string {
    const normalized = fields
        .map((f) => ({ label: f.label.trim(), value: f.value.trim() }))
        .filter((f) => f.label || f.value);
    if (normalized.length === 0) return "";
    return `${PROFILE_FIELDS_JSON_PREFIX}${JSON.stringify(normalized)}`;
}

function toProfileRecord(raw: GamniverseProfileDto): ProfileRecord {
    const seq = raw.gamniverseProfileSeq ?? 0;
    return {
        id: String(seq),
        gamniverseProfileSeq: raw.gamniverseProfileSeq,
        title: raw.profileName ?? "",
        sortOrder: Number.isFinite(Number(raw.sortOrder)) ? Number(raw.sortOrder) : 0,
        rank: codeToRank(raw.rankCode),
        affiliationCode: raw.affiliationCode ?? "",
        broadcastLink: raw.broadcastLink ?? "",
        soopBroadcastLink: raw.soopBroadcastLink ?? "",
        instagramUrl: raw.instagramUrl ?? "",
        youtubeUrl: raw.youtubeUrl ?? "",
        cafeLink: raw.cafeLink ?? "",
        imageUrl: raw.profileImageFileSeq ? `/api/files/view/${raw.profileImageFileSeq}` : "",
        imageFileSeq: raw.profileImageFileSeq ?? null,
        fields: parseFieldsFromCareerHistory(raw.profileRowsJson),
    };
}

function FieldListEditor({ items, onChange }: { items: FieldItem[]; onChange: (next: FieldItem[]) => void }) {
    const updateItem = (id: string, key: "label" | "value", value: string) => {
        onChange(items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
    };
    const removeItem = (id: string) => {
        const next = items.filter((item) => item.id !== id);
        onChange(next.length > 0 ? next : [createField()]);
    };
    return (
        <div className={styles.fieldSection}>
            <div className={styles.fieldSectionHeader}>
                <strong>프로필 행</strong>
                <button
                    id="profile-field-add-button"
                    type="button"
                    onClick={() => onChange([...items, createField(items.length + 1)])}
                >
                    + 항목 추가
                </button>
            </div>
            {items.map((item) => (
                <div className={styles.fieldRow} key={item.id}>
                    <input
                        id={`profile-field-label-${item.id}`}
                        className={styles.input}
                        placeholder="항목명"
                        value={item.label}
                        onChange={(e) => updateItem(item.id, "label", e.target.value)}
                    />
                    <input
                        id={`profile-field-value-${item.id}`}
                        className={styles.input}
                        placeholder="내용"
                        value={item.value}
                        onChange={(e) => updateItem(item.id, "value", e.target.value)}
                    />
                    <button id={`profile-field-remove-${item.id}`} type="button" onClick={() => removeItem(item.id)}>
                        삭제
                    </button>
                </div>
            ))}
        </div>
    );
}

function openExternalLink(url: string, emptyMessage: string) {
    const u = url.trim();
    if (!u) {
        alert(emptyMessage);
        return;
    }
    const withProtocol = /^https?:\/\//i.test(u) ? u : `https://${u}`;
    window.open(withProtocol, "_blank", "noopener,noreferrer");
}

export default function ProfilePage() {
    const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
    const [editing, setEditing] = useState<ProfileRecord>(() => createEmptyProfile());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [keyword, setKeyword] = useState("");
    const [affiliationOptions, setAffiliationOptions] = useState<AffiliationOption[]>([]);

    useEffect(() => {
        let mounted = true;

        const loadAffiliations = async () => {
            try {
                const groups = await searchCodeGroups({
                    codeGroupId: AFFILIATION_CODE_GROUP_ID,
                    page: 1,
                    size: 1,
                });
                const codeGroupSeq = groups.items?.[0]?.codeGroupSeq;
                if (!codeGroupSeq) return;

                const details = await searchCodeDetails({
                    codeGroupSeq,
                    page: 1,
                    size: 999,
                    sortBy: "sortOrder",
                    sortDir: "asc",
                });
                if (!mounted) return;

                setAffiliationOptions(
                    (details.items ?? [])
                        .filter((item) => (item.useYn ?? "Y") !== "N" && (item.delYn ?? "N") !== "Y")
                        .map((item) => ({
                            value: item.codeId ?? item.codeValue ?? "",
                            label: item.codeName ?? item.codeValue ?? item.codeId ?? "",
                            attr1: item.attr1 ?? "",
                            attr2: item.attr2 ?? "",
                        }))
                        .filter((item) => item.value)
                );
            } catch (error) {
                console.warn(`소속 코드(${AFFILIATION_CODE_GROUP_ID}) 조회 실패`, error);
            }
        };

        void loadAffiliations();
        return () => {
            mounted = false;
        };
    }, []);

    const loadProfiles = async () => {
        setIsLoading(true);
        try {
            const page = await searchGamniverseProfiles({
                page: 1,
                size: 500,
                sortBy: "sortOrder",
                sortDir: "asc",
            });
            const rows = (page.items ?? [])
                .map(toProfileRecord)
                .filter(
                    (item) =>
                        item.affiliationCode ||
                        item.instagramUrl ||
                        item.youtubeUrl ||
                        item.cafeLink ||
                        item.broadcastLink ||
                        item.fields.some((f) => f.label || f.value)
                );
            setProfiles(rows);
        } catch (error) {
            const message = error instanceof ApiError ? error.message : "프로필 목록 조회에 실패했습니다.";
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadProfiles();
    }, []);

    const affiliationLabelMap = useMemo(() => {
        const map = new Map<string, string>();
        affiliationOptions.forEach((item) => map.set(item.value, item.label));
        return map;
    }, [affiliationOptions]);

    const filtered = useMemo(() => {
        const q = keyword.trim().toLowerCase();
        const searched = !q
            ? profiles
            : profiles.filter((item) => {
                  const haystack = [
                      item.title,
                      item.broadcastLink,
                      item.soopBroadcastLink,
                      item.instagramUrl,
                      item.youtubeUrl,
                      item.cafeLink,
                      ...item.fields.flatMap((f) => [f.label, f.value]),
                  ]
                      .join(" ")
                      .toLowerCase();
                  return haystack.includes(q);
              });
        return [...searched].sort((a, b) => a.sortOrder - b.sortOrder);
    }, [keyword, profiles]);

    const groupedProfiles = useMemo(() => {
        const attr1Map = new Map<string, string>();
        const attr2Map = new Map<string, string>();
        affiliationOptions.forEach((option) => {
            attr1Map.set(option.value, option.attr1 ?? "");
            attr2Map.set(option.value, option.attr2 ?? "");
        });

        const map = new Map<
            string,
            { code: string; label: string; attr1: string; attr2: string; isCore: boolean; items: ProfileRecord[] }
        >();
        filtered.forEach((item) => {
            const code = item.affiliationCode || "UNASSIGNED";
            const label = code === "UNASSIGNED" ? "미지정" : (affiliationLabelMap.get(code) ?? code);
            const attr1 = attr1Map.get(code) ?? "";
            const attr2 = attr2Map.get(code) ?? "";
            const isCore = code === CORE_COMPANY_AFFILIATION_CODE;
            const bucket = map.get(code);
            if (bucket) {
                bucket.items.push(item);
                return;
            }
            map.set(code, { code, label, attr1, attr2, isCore, items: [item] });
        });
        return Array.from(map.values()).sort((a, b) => {
            if (a.isCore && !b.isCore) return -1;
            if (!a.isCore && b.isCore) return 1;
            const aAttr = Number(a.attr1);
            const bAttr = Number(b.attr1);
            const aHasNumeric = /^\d+$/.test((a.attr1 ?? "").trim());
            const bHasNumeric = /^\d+$/.test((b.attr1 ?? "").trim());
            if (aHasNumeric && bHasNumeric && aAttr !== bAttr) {
                return aAttr - bAttr;
            }
            if (aHasNumeric && !bHasNumeric) return -1;
            if (!aHasNumeric && bHasNumeric) return 1;
            return a.label.localeCompare(b.label, "ko");
        });
    }, [affiliationLabelMap, affiliationOptions, filtered]);

    const patchEditing = (patch: Partial<ProfileRecord>) => {
        setEditing((prev) => ({ ...prev, ...patch }));
    };

    const handleNew = () => {
        setEditing(createEmptyProfile());
        setIsModalOpen(true);
    };

    const handleEdit = (id: string) => {
        const target = profiles.find((item) => item.id === id);
        if (!target) return;
        setEditing(structuredClone(target));
        setIsModalOpen(true);
    };

    const handleSave = () => {
        const run = async () => {
            const title = editing.title.trim();
            if (!title) {
                alert("방송명(회원명)은 필수입니다.");
                return;
            }
            setIsSaving(true);
            try {
                const payload = {
                    gamniverseProfileSeq: editing.gamniverseProfileSeq,
                    profileName: title,
                    sortOrder: Number.isFinite(Number(editing.sortOrder)) ? Number(editing.sortOrder) : 0,
                    rankCode: rankToGradeCode(editing.rank),
                    affiliationCode: editing.affiliationCode.trim(),
                    broadcastLink: editing.broadcastLink.trim(),
                    soopBroadcastLink: editing.soopBroadcastLink.trim(),
                    instagramUrl: editing.instagramUrl.trim(),
                    youtubeUrl: editing.youtubeUrl.trim(),
                    cafeLink: editing.cafeLink.trim(),
                    profileImageFileSeq: editing.imageFileSeq ?? null,
                    profileRowsJson: serializeFieldsForCareerHistory(editing.fields),
                    useYn: "Y",
                };
                if (editing.gamniverseProfileSeq) {
                    await updateGamniverseProfile(payload);
                } else {
                    await createGamniverseProfile(payload);
                }
                await loadProfiles();
                setIsModalOpen(false);
                alert(editing.gamniverseProfileSeq ? "수정되었습니다." : "등록되었습니다.");
            } catch (error) {
                const message = error instanceof ApiError ? error.message : "저장 중 오류가 발생했습니다.";
                alert(message);
            } finally {
                setIsSaving(false);
            }
        };
        void run();
    };

    const handleDelete = (id: string) => {
        const run = async () => {
            const target = profiles.find((item) => item.id === id);
            if (!target?.gamniverseProfileSeq) return;
            if (!confirm(`'${target.title || "이름 없음"}' 프로필을 삭제할까요?`)) return;
            try {
                await deleteGamniverseProfile(target.gamniverseProfileSeq);
                await loadProfiles();
                if (editing.id === id) {
                    setEditing(createEmptyProfile());
                    setIsModalOpen(false);
                }
            } catch (error) {
                const message = error instanceof ApiError ? error.message : "삭제 중 오류가 발생했습니다.";
                alert(message);
            }
        };
        void run();
    };

    const handleImageUpload = (file: File | null) => {
        const run = async () => {
            if (!file) return;
            try {
                const uploaded = await uploadImageFile(file, "/profile", "profile");
                patchEditing({
                    imageUrl: uploaded.fileUrl,
                    imageFileSeq: uploaded.fileSeq,
                });
            } catch (error) {
                alert(error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.");
            }
        };
        void run();
    };

    return (
        <div className={styles.page}>
            <h2 className={styles.title}>멤버스트리머 프로필</h2>
            <p className={styles.description}>
                소속 코드({AFFILIATION_CODE_GROUP_ID}) 기준으로 그룹 배치됩니다. 등록 버튼으로 모달에서 프로필을
                생성하세요.
            </p>

            <div className={styles.toolbar}>
                <input
                    id="profile-search-input"
                    className={styles.input}
                    placeholder="이름/링크/키워드 검색"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />
                <button id="profile-new-button" type="button" className={styles.primary} onClick={handleNew}>
                    등록
                </button>
            </div>

            <div className={styles.groupLayout}>
                {isLoading ? (
                    <div className={styles.empty}>불러오는 중...</div>
                ) : groupedProfiles.length === 0 ? (
                    <div className={styles.empty}>저장된 프로필이 없습니다.</div>
                ) : (
                    groupedProfiles.map((group) => (
                        <section
                            key={group.code}
                            className={`${styles.groupSection} ${group.isCore ? styles.coreGroupSection : ""}`}
                        >
                            <div className={styles.groupHeader}>
                                <strong>{group.label}</strong>
                                <span>({group.items.length})</span>
                            </div>
                            <div className={styles.groupGrid}>
                                {group.items.map((item) => (
                                    <article
                                        key={item.id}
                                        className={`${styles.memberCard} ${styles[`rank${item.rank}`]}`}
                                    >
                                        {item.imageUrl ? (
                                            <div className={`${styles.frameWrap} ${styles[`frame${item.rank}`]}`}>
                                                <img
                                                    className={styles.memberImage}
                                                    src={item.imageUrl}
                                                    alt={`${item.title} 프로필`}
                                                />
                                            </div>
                                        ) : (
                                            <div
                                                className={`${styles.memberImagePlaceholder} ${styles[`rankPlaceholder${item.rank}`]}`}
                                            >
                                                NO IMAGE
                                            </div>
                                        )}
                                        <div className={styles.memberName}>{item.title || "(제목 없음)"}</div>
                                        <div className={styles.memberLinks}>
                                            {item.broadcastLink.trim() && (
                                                <button
                                                    type="button"
                                                    className={`${styles.linkIconBtn} ${styles.linkIconBtnSoop}`}
                                                    title={`${item.title || "프로필"} SOOP 방송국`}
                                                    aria-label={`${item.title || "프로필"} SOOP 방송국 이동`}
                                                    onClick={() =>
                                                        openExternalLink(
                                                            item.broadcastLink,
                                                            "등록된 방송국 링크가 없습니다."
                                                        )
                                                    }
                                                >
                                                    <SoopBroadcastIcon size={28} />
                                                </button>
                                            )}
                                            {item.cafeLink.trim() && (
                                                <button
                                                    type="button"
                                                    className={styles.linkIconBtn}
                                                    title={`${item.title || "프로필"} 네이버 카페`}
                                                    aria-label={`${item.title || "프로필"} 네이버 카페 이동`}
                                                    onClick={() =>
                                                        openExternalLink(item.cafeLink, "등록된 카페 링크가 없습니다.")
                                                    }
                                                >
                                                    <img
                                                        src={CAFE_BTN_IMG}
                                                        alt=""
                                                        width={28}
                                                        height={28}
                                                        decoding="async"
                                                    />
                                                </button>
                                            )}
                                            {item.instagramUrl.trim() && (
                                                <button
                                                    type="button"
                                                    className={styles.linkIconBtn}
                                                    title={`${item.title || "프로필"} 인스타그램`}
                                                    aria-label={`${item.title || "프로필"} 인스타그램 이동`}
                                                    onClick={() =>
                                                        openExternalLink(
                                                            item.instagramUrl,
                                                            "등록된 인스타그램 링크가 없습니다."
                                                        )
                                                    }
                                                >
                                                    <img src={INSTA_BTN_SVG} alt="" />
                                                </button>
                                            )}
                                            {item.youtubeUrl.trim() && (
                                                <button
                                                    type="button"
                                                    className={styles.linkIconBtn}
                                                    title={`${item.title || "프로필"} 유튜브`}
                                                    aria-label={`${item.title || "프로필"} 유튜브 이동`}
                                                    onClick={() =>
                                                        openExternalLink(
                                                            item.youtubeUrl,
                                                            "등록된 유튜브 링크가 없습니다."
                                                        )
                                                    }
                                                >
                                                    <img src={YOUTUBE_BTN_IMG} alt="" />
                                                </button>
                                            )}
                                        </div>
                                        <div className={styles.cardActions}>
                                            <button
                                                id={`profile-edit-${item.id}`}
                                                type="button"
                                                onClick={() => handleEdit(item.id)}
                                            >
                                                수정
                                            </button>
                                            <button
                                                id={`profile-delete-${item.id}`}
                                                type="button"
                                                className={styles.danger}
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <section className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <strong>{editing.gamniverseProfileSeq ? "프로필 수정" : "프로필 등록"}</strong>
                            <button
                                id="profile-modal-close-top-button"
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                            >
                                닫기
                            </button>
                        </div>

                        <div className={styles.fieldSection}>
                            <div className={styles.fieldSectionHeader}>
                                <strong>프로필 이미지</strong>
                                <label className={styles.fileLabel}>
                                    이미지 추가
                                    <input
                                        id="profile-image-file-input"
                                        className={styles.hiddenFileInput}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            handleImageUpload(e.target.files?.[0] ?? null);
                                            e.currentTarget.value = "";
                                        }}
                                    />
                                </label>
                            </div>
                            <div className={styles.imageGrid}>
                                {!editing.imageUrl ? (
                                    <div className={styles.empty}>등록된 이미지가 없습니다.</div>
                                ) : (
                                    <div className={styles.imageCard}>
                                        <img
                                            src={editing.imageUrl}
                                            alt="프로필 이미지"
                                            className={styles.previewImage}
                                        />
                                        <button
                                            id="profile-image-remove-button"
                                            type="button"
                                            className={styles.danger}
                                            onClick={() => patchEditing({ imageUrl: "", imageFileSeq: null })}
                                        >
                                            삭제
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.formGrid}>
                            <label>
                                방송명
                                <input
                                    id="profile-title-input"
                                    className={styles.input}
                                    value={editing.title}
                                    onChange={(e) => patchEditing({ title: e.target.value })}
                                    placeholder="예: 박재현 프로필"
                                />
                            </label>
                            <label>
                                메인 노출 순서 (sort)
                                <input
                                    id="profile-sort-order-input"
                                    className={styles.input}
                                    type="number"
                                    value={editing.sortOrder}
                                    onChange={(e) => patchEditing({ sortOrder: Number(e.target.value) || 0 })}
                                    placeholder="참고용 표시값"
                                />
                            </label>
                            <label>
                                직급
                                <select
                                    id="profile-rank-select"
                                    className={styles.input}
                                    value={editing.rank}
                                    onChange={(e) => patchEditing({ rank: e.target.value as ProfileRecord["rank"] })}
                                >
                                    {RANK_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                소속 ({AFFILIATION_CODE_GROUP_ID})
                                <select
                                    id="profile-affiliation-select"
                                    className={styles.input}
                                    value={editing.affiliationCode}
                                    onChange={(e) => patchEditing({ affiliationCode: e.target.value })}
                                >
                                    <option value="">선택하세요</option>
                                    {affiliationOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                방송국 링크
                                <input
                                    id="profile-broadcast-link-input"
                                    className={styles.input}
                                    value={editing.broadcastLink}
                                    onChange={(e) => patchEditing({ broadcastLink: e.target.value })}
                                    placeholder="https://example.com/channel"
                                />
                            </label>
                            <label>
                                숲 방송링크
                                <input
                                    id="profile-soop-broadcast-link-input"
                                    className={styles.input}
                                    value={editing.soopBroadcastLink}
                                    onChange={(e) => patchEditing({ soopBroadcastLink: e.target.value })}
                                    placeholder="https://play.sooplive.com/{bjId}"
                                />
                            </label>
                            <label>
                                인스타 링크
                                <input
                                    id="profile-instagram-link-input"
                                    className={styles.input}
                                    value={editing.instagramUrl}
                                    onChange={(e) => patchEditing({ instagramUrl: e.target.value })}
                                    placeholder="https://instagram.com/..."
                                />
                            </label>
                            <label>
                                유튜브 링크
                                <input
                                    id="profile-youtube-link-input"
                                    className={styles.input}
                                    value={editing.youtubeUrl}
                                    onChange={(e) => patchEditing({ youtubeUrl: e.target.value })}
                                    placeholder="https://youtube.com/..."
                                />
                            </label>
                            <label>
                                네이버 카페 링크
                                <input
                                    id="profile-cafe-link-input"
                                    className={styles.input}
                                    value={editing.cafeLink}
                                    onChange={(e) => patchEditing({ cafeLink: e.target.value })}
                                    placeholder="https://cafe.naver.com/..."
                                />
                            </label>
                        </div>

                        <FieldListEditor items={editing.fields} onChange={(next) => patchEditing({ fields: next })} />

                        <div className={styles.footerActions}>
                            <button
                                id="profile-save-button"
                                type="button"
                                className={styles.primary}
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? "저장중..." : "저장"}
                            </button>
                            <button
                                id="profile-modal-cancel-button"
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                            >
                                취소
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
