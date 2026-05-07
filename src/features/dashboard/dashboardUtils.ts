import type { CodeDetailRow } from "@/features/commonCodes/api";
import type { GamniverseProfileDto } from "@/features/profile/api";
import { CORE_COMPANY_AFFILIATION_CODE, PROFILE_FIELDS_JSON_PREFIX } from "@/constants/affiliationCodes";

export type Rank = "DIAMOND" | "GOLD" | "SILVER" | "IRON" | "WOOD";

export type FieldItem = { id: string; label: string; value: string };

export type MemberRow = {
    id: string;
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
    isLive: boolean;
    fields: FieldItem[];
};

export type AffiliationMeta = {
    value: string;
    label: string;
    attr1: string;
    attr2: string;
};

export type GroupSection = {
    code: string;
    label: string;
    attr1: string;
    attr2: string;
    emblemUrl: string | null;
    isCore: boolean;
    items: MemberRow[];
};

export function codeToRank(code?: string): Rank {
    const c = (code ?? "").trim().toUpperCase();
    if (c === "DIAMOND" || c === "GOLD" || c === "SILVER" || c === "IRON" || c === "WOOD") return c;
    return "IRON";
}

/** 공통코드 attr2: 업로드 파일 시퀀스(숫자만), `/` 경로, 또는 `https://` URL */
export function resolveAffiliationEmblemUrl(attr2?: string): string | null {
    const v = (attr2 ?? "").trim();
    if (!v) return null;
    if (/^https?:\/\//i.test(v)) return v;
    if (v.startsWith("/")) return v;
    if (/^\d+$/.test(v)) return `/api/files/view/${v}`;
    return null;
}

export function parseProfileRows(profileRowsJson?: string | null): FieldItem[] {
    const raw = (profileRowsJson ?? "").trim();
    if (!raw) return [];

    if (raw.startsWith(PROFILE_FIELDS_JSON_PREFIX)) {
        try {
            const parsed = JSON.parse(raw.slice(PROFILE_FIELDS_JSON_PREFIX.length)) as Array<Partial<FieldItem>>;
            return (parsed ?? [])
                .map((item, idx) => ({
                    id: `f-${idx}`,
                    label: (item.label ?? "").trim(),
                    value: (item.value ?? "").trim(),
                }))
                .filter((item) => item.label || item.value);
        } catch {
            return [];
        }
    }

    return raw
        .split("\n")
        .map((line, idx) => {
            const [label, ...rest] = line.split(":");
            return {
                id: `legacy-${idx}`,
                label: (label ?? "").trim(),
                value: rest.join(":").trim(),
            };
        })
        .filter((item) => item.label || item.value);
}

export function dtoToMember(dto: GamniverseProfileDto): MemberRow {
    const seq = dto.gamniverseProfileSeq ?? 0;
    return {
        id: String(seq),
        title: dto.profileName ?? "",
        sortOrder: Number.isFinite(Number(dto.sortOrder)) ? Number(dto.sortOrder) : 0,
        rank: codeToRank(dto.rankCode),
        affiliationCode: (dto.affiliationCode ?? "").trim().toUpperCase(),
        broadcastLink: dto.broadcastLink ?? "",
        soopBroadcastLink: dto.soopBroadcastLink ?? "",
        instagramUrl: dto.instagramUrl ?? "",
        youtubeUrl: dto.youtubeUrl ?? "",
        cafeLink: dto.cafeLink ?? "",
        imageUrl: dto.profileImageFileSeq ? `/api/files/view/${dto.profileImageFileSeq}` : "",
        isLive: Boolean(dto.isLive),
        fields: parseProfileRows(dto.profileRowsJson),
    };
}

export function affiliationMetaFromDetails(details: CodeDetailRow[]): AffiliationMeta[] {
    return details
        .filter((item) => (item.useYn ?? "Y") !== "N" && (item.delYn ?? "N") !== "Y")
        .map((item) => ({
            value: item.codeId ?? item.codeValue ?? "",
            label: item.codeName ?? item.codeValue ?? item.codeId ?? "",
            attr1: item.attr1 ?? "",
            attr2: item.attr2 ?? "",
        }))
        .filter((item) => item.value);
}

export function memberHasDashboardPayload(item: MemberRow): boolean {
    return Boolean(
        item.affiliationCode ||
        item.broadcastLink ||
        item.instagramUrl ||
        item.youtubeUrl ||
        item.cafeLink ||
        item.fields.length > 0 ||
        item.imageUrl
    );
}

export function buildAffiliationLabelMap(affiliations: AffiliationMeta[]): Map<string, string> {
    const m = new Map<string, string>();
    affiliations.forEach((a) => m.set(a.value, a.label));
    return m;
}

export function groupMembersByAffiliation(
    members: MemberRow[],
    affiliations: AffiliationMeta[],
    labelMap: Map<string, string>
): GroupSection[] {
    const map = new Map<string, GroupSection>();
    const affiliationByCode = new Map(affiliations.map((affiliation) => [affiliation.value, affiliation] as const));

    for (const item of members) {
        const code = (item.affiliationCode ?? "").trim().toUpperCase() || "UNASSIGNED";
        const meta = affiliationByCode.get(code);
        const label = code === "UNASSIGNED" ? "미지정" : (labelMap.get(code) ?? code);
        const attr1 = meta?.attr1 ?? "";
        const attr2 = meta?.attr2 ?? "";
        const emblemUrl = resolveAffiliationEmblemUrl(attr2);
        const isCore = code === CORE_COMPANY_AFFILIATION_CODE.trim().toUpperCase();
        console.log("[Dashboard][CoreGroupCheck]", {
            memberId: item.id,
            memberTitle: item.title,
            affiliationCode: code,
            rawAffiliationCode: item.affiliationCode,
            coreAffiliationCode: CORE_COMPANY_AFFILIATION_CODE.trim().toUpperCase(),
            isCore,
            member: item,
        });

        const bucket = map.get(code);
        if (bucket) {
            bucket.items.push(item);
            continue;
        }

        map.set(code, {
            code,
            label,
            attr1,
            attr2,
            emblemUrl,
            isCore,
            items: [item],
        });
    }

    for (const g of map.values()) {
        g.items.sort(
            (a, b) =>
                Number(Boolean(b.isLive)) - Number(Boolean(a.isLive)) ||
                a.sortOrder - b.sortOrder ||
                a.title.localeCompare(b.title, "ko")
        );
    }

    return Array.from(map.values()).sort((a, b) => {
        if (a.isCore && !b.isCore) return -1;
        if (!a.isCore && b.isCore) return 1;

        const aNum = /^\d+$/.test((a.attr1 ?? "").trim());
        const bNum = /^\d+$/.test((b.attr1 ?? "").trim());
        const av = Number(a.attr1);
        const bv = Number(b.attr1);

        if (aNum && bNum && av !== bv) return av - bv;
        if (aNum && !bNum) return -1;
        if (!aNum && bNum) return 1;

        return a.label.localeCompare(b.label, "ko");
    });
}
