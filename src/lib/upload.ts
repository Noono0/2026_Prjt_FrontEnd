import { MAX_BOARD_IMAGE_UPLOAD_BYTES } from "@/lib/imageUploadConstants";
import { useAuthStore } from "@/stores/authStore";

type FileUploadApiData = {
    fileSeq?: number;
    fileUrl?: string;
    downloadUrl?: string;
    originalName?: string;
    contentType?: string;
    fileSize?: number;
    menuUrl?: string;
    imageDowngraded?: boolean;
    optimizationNotice?: string | null;
};

type ApiEnvelope = {
    success?: boolean;
    data?: FileUploadApiData;
    message?: string;
};

const MAX_IMAGE_DIMENSION = 1600;
const OUTPUT_QUALITY = 0.8;

/** OAuth 직후 Spring JSESSION 이 아직 없을 때 업로드가 먼저 도는 레이스 완화 */
async function ensureSpringSessionForUpload(): Promise<void> {
    if (!useAuthStore.getState().oauthSpringPending) return;
    try {
        const res = await fetch("/api/auth/spring-sync", {
            method: "POST",
            credentials: "include",
        });
        const text = await res.text();
        let parsed: { success?: boolean } = {};
        try {
            parsed = text ? (JSON.parse(text) as { success?: boolean }) : {};
        } catch {
            /* ignore */
        }
        if (res.ok && parsed.success === true) {
            useAuthStore.getState().markOAuthSpringDone();
        }
    } catch {
        /* 업로드 요청에서 백엔드 메시지로 실패 원인 표시 */
    }
}

function shouldCompressImage(file: File): boolean {
    return file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp";
}

/** Canvas 로 JPEG 재인코딩(서버 ImageIO 호환). 실패 시 null */
async function encodeRasterToJpeg(file: File, maxLongEdge: number, quality: number): Promise<File | null> {
    if (typeof window === "undefined") return null;
    if (!shouldCompressImage(file)) return null;
    try {
        const imageBitmap = await createImageBitmap(file);
        const { width, height } = imageBitmap;
        const maxDim = Math.max(width, height);
        const scale = maxDim > maxLongEdge ? maxLongEdge / maxDim : 1;
        const targetWidth = Math.max(1, Math.round(width * scale));
        const targetHeight = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const context = canvas.getContext("2d");
        if (!context) {
            imageBitmap.close();
            return null;
        }

        context.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
        imageBitmap.close();

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, "image/jpeg", quality);
        });

        if (!blob) return null;
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
    } catch {
        return null;
    }
}

async function compressImageIfNeeded(file: File): Promise<File> {
    if (typeof window === "undefined") return file;
    if (!shouldCompressImage(file)) return file;

    const out = await encodeRasterToJpeg(file, MAX_IMAGE_DIMENSION, OUTPUT_QUALITY);
    if (!out || out.size === 0) return file;
    if (out.size >= file.size) return file;
    return out;
}

/** 5MB 등 서버 한도 이하가 될 때까지 더 작은 변·낮은 품질로 반복 */
async function compressUntilUnderLimit(file: File, maxBytes: number): Promise<File> {
    if (file.size <= maxBytes) return file;
    if (!shouldCompressImage(file)) {
        throw new Error("이 형식(GIF 등)은 자동 압축으로 용량을 맞출 수 없습니다. 더 작은 파일을 사용해 주세요.");
    }

    const maxEdges = [1600, 1280, 1024, 800, 640, 480];
    const qualities = [0.8, 0.72, 0.62, 0.52, 0.42, 0.35];
    let best: File = file;

    for (const edge of maxEdges) {
        for (const q of qualities) {
            const next = await encodeRasterToJpeg(file, edge, q);
            if (!next || next.size === 0) continue;
            if (next.size < best.size) best = next;
            if (next.size <= maxBytes) return next;
        }
    }

    if (best.size > maxBytes) {
        throw new Error("압축·리사이즈 후에도 업로드 한도를 넘습니다. 더 작은 이미지를 사용해 주세요.");
    }
    return best;
}

export type UploadedImageMeta = {
    fileUrl: string;
    fileSeq: number;
    imageDowngraded?: boolean;
    optimizationNotice?: string | null;
};

/**
 * 공통 이미지 업로드 (DB attach_file + Spring 디스크)
 * @param menuUrl 업로드 시점 화면 경로 (예: `window.location.pathname`). 추적용.
 * @param uploadPurpose `board`(기본) | `profile` — 서버 리사이즈·목표 용량 정책
 */
export async function uploadImageFile(
    file: File,
    menuUrl?: string,
    uploadPurpose: "board" | "profile" = "board"
): Promise<UploadedImageMeta> {
    await ensureSpringSessionForUpload();
    let optimizedFile = await compressImageIfNeeded(file);
    if (optimizedFile.size > MAX_BOARD_IMAGE_UPLOAD_BYTES) {
        optimizedFile = await compressUntilUnderLimit(file, MAX_BOARD_IMAGE_UPLOAD_BYTES);
    }
    if (optimizedFile.size <= 0) {
        throw new Error(
            "이미지 데이터를 읽을 수 없습니다. 다른 방식으로 저장한 뒤 파일 첨부하거나, 화면 캡처 후 다시 붙여 넣어 보세요."
        );
    }
    const formData = new FormData();
    formData.append("file", optimizedFile);
    if (menuUrl?.trim()) {
        formData.append("menuUrl", menuUrl.trim().slice(0, 500));
    }
    formData.append("uploadPurpose", uploadPurpose);

    const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
    });

    const raw = await res.text();
    let payload: ApiEnvelope = {};
    try {
        payload = raw ? (JSON.parse(raw) as ApiEnvelope) : {};
    } catch {
        throw new Error(raw?.trim().slice(0, 160) || "이미지 업로드에 실패했습니다. (응답 파싱 오류)");
    }

    if (!res.ok || payload.success === false) {
        const msg =
            payload.message?.trim() ||
            (raw?.trim().slice(0, 160) ?? "") ||
            `이미지 업로드에 실패했습니다. (${res.status})`;
        throw new Error(msg);
    }

    const data = payload.data;
    const rawSeq = data?.fileSeq;

    if (rawSeq == null || !Number.isFinite(Number(rawSeq))) {
        throw new Error("업로드 응답에 fileSeq가 없습니다.");
    }
    const fileSeq = Number(rawSeq);
    // Spring 이 주는 absolute fileUrl(백엔드 Host/IP)을 img src 로 쓰면: HTTPS 사이트에서 HTTP 혼합 콘텐츠 차단,
    // 또는 사용자 PC 가 :8080 미노출 시 X박스. Next BFF 와 동일 출처 상대 경로만 사용.
    const fileUrl = `/api/files/view/${fileSeq}`;

    return {
        fileUrl,
        fileSeq,
        imageDowngraded: data?.imageDowngraded,
        optimizationNotice: data?.optimizationNotice,
    };
}

/**
 * 공통 이미지 업로드 — URL 문자열만 필요할 때 (에디터 삽입 등)
 */
export async function uploadImage(file: File, menuUrl?: string): Promise<string> {
    const { fileUrl } = await uploadImageFile(file, menuUrl);
    return fileUrl;
}

/** @deprecated 호환용 — 내부적으로 uploadImage와 동일 */
export async function uploadBoardImage(file: File, menuUrl?: string): Promise<string> {
    const path = menuUrl ?? (typeof window !== "undefined" ? window.location.pathname : undefined);
    return uploadImage(file, path);
}
