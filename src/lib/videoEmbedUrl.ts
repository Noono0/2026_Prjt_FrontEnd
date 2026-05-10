/**
 * 게시판 본문에 넣을 수 있는 영상 임베드 URL(화이트리스트).
 * 실제 영상 파일은 저장하지 않고, iframe src URL만 HTML에 남깁니다.
 */

export type TrustedVideoEmbed = {
    embedSrc: string;
    originalUrl: string;
};

const SOOP_VOD_HOSTS = new Set(["vod.sooplive.com", "vod.sooplive.co.kr"]);

function normalizeOneLineUrl(raw: string): string | null {
    const t = raw.trim();
    if (!t || /\s/.test(t)) return null;
    if (!/^https?:\/\//i.test(t)) return null;
    try {
        return new URL(t).href;
    } catch {
        return null;
    }
}

function youtubeEmbedFrom(u: URL): string | null {
    const host = u.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
        const id = u.pathname.split("/").filter(Boolean)[0];
        if (id && /^[\w-]{11}$/.test(id)) {
            return `https://www.youtube.com/embed/${id}`;
        }
        return null;
    }

    const isYt = host === "youtube.com" || host === "m.youtube.com";
    const isYtNc = host === "youtube-nocookie.com";
    if (isYt || isYtNc) {
        const base = isYtNc ? "https://www.youtube-nocookie.com" : "https://www.youtube.com";

        if (u.pathname.startsWith("/embed/")) {
            const rest = u.pathname.slice("/embed/".length).split("/")[0];
            if (rest && /^[\w-]{11}$/.test(rest)) {
                return `${base}/embed/${rest}${u.search || ""}`;
            }
        }

        if (u.pathname === "/watch" || u.pathname.startsWith("/watch/")) {
            const v = u.searchParams.get("v");
            if (v && /^[\w-]{11}$/.test(v)) {
                return `${base}/embed/${v}`;
            }
        }

        if (u.pathname.startsWith("/shorts/")) {
            const id = u.pathname.split("/").filter(Boolean)[1];
            if (id && /^[\w-]{11}$/.test(id)) {
                return `${base}/embed/${id}`;
            }
        }

        if (u.pathname.startsWith("/live/")) {
            const id = u.pathname.split("/").filter(Boolean)[1];
            if (id && /^[\w-]{11}$/.test(id)) {
                return `${base}/embed/${id}`;
            }
        }
    }

    return null;
}

/**
 * SOOP: `/player/{id}/catch` 등은 풀 페이지, iframe에는 `/player/{id}/embed`만 쓰는 것이
 * 플레이어 중심 화면으로 맞춰지는 경우가 많습니다(공개 링크 패턴 기준).
 */
function soopVodEmbedFrom(u: URL): string | null {
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (!SOOP_VOD_HOSTS.has(host)) {
        return null;
    }

    const m = u.pathname.match(/^\/player\/(\d+)(?:\/([^/\s]+))?\/?$/i);
    if (!m) return null;
    const id = m[1];
    const segment = (m[2] ?? "").toLowerCase();
    const origin = u.origin;

    if (segment === "embed") {
        const qs = u.search?.trim() && u.search !== "?" ? u.search : "";
        return `${origin}/player/${id}/embed${qs}`;
    }

    return `${origin}/player/${id}/embed`;
}

/**
 * 붙여넣기·검증용: 허용된 영상 페이지 URL만 임베드 주소로 변환합니다.
 */
export function parseTrustedVideoEmbed(raw: string): TrustedVideoEmbed | null {
    const normalized = normalizeOneLineUrl(raw);
    if (!normalized) return null;

    let u: URL;
    try {
        u = new URL(normalized);
    } catch {
        return null;
    }

    const yt = youtubeEmbedFrom(u);
    if (yt) {
        return { embedSrc: yt, originalUrl: normalized };
    }

    const soop = soopVodEmbedFrom(u);
    if (soop) {
        return { embedSrc: soop, originalUrl: normalized };
    }

    return null;
}
