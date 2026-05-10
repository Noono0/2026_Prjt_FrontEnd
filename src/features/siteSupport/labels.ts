import type { SiteSupportCategoryCode } from "./types";

export function supportCategoryLabel(code: string | undefined): string {
    const c = (code ?? "").toUpperCase();
    if (c === "AD") return "광고";
    if (c === "SPONSOR") return "협찬";
    if (c === "HELPER") return "도움 주신 분들";
    return code ?? "-";
}

export const SUPPORT_CATEGORY_OPTIONS: { value: SiteSupportCategoryCode; label: string }[] = [
    { value: "AD", label: "광고" },
    { value: "SPONSOR", label: "협찬" },
    { value: "HELPER", label: "도움 주신 분들" },
];
