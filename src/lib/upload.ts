type FileUploadApiData = {
    fileSeq?: number;
    fileUrl?: string;
    downloadUrl?: string;
    originalName?: string;
    contentType?: string;
    fileSize?: number;
    menuUrl?: string;
};

type ApiEnvelope = {
    success?: boolean;
    data?: FileUploadApiData;
    message?: string;
};

const MAX_IMAGE_DIMENSION = 1600;
const OUTPUT_QUALITY = 0.8;

function shouldCompressImage(file: File): boolean {
    return file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp";
}

async function compressImageIfNeeded(file: File): Promise<File> {
    if (typeof window === "undefined") return file;
    if (!shouldCompressImage(file)) return file;

    const imageBitmap = await createImageBitmap(file);
    const { width, height } = imageBitmap;
    const maxSize = Math.max(width, height);
    const scale = maxSize > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / maxSize : 1;
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) {
        imageBitmap.close();
        return file;
    }

    context.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
    imageBitmap.close();

    const outputMimeType = file.type === "image/png" ? "image/webp" : file.type;
    const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, outputMimeType, OUTPUT_QUALITY);
    });

    if (!blob) return file;
    if (blob.size >= file.size) return file;

    const nextExt = outputMimeType === "image/webp" ? ".webp" : outputMimeType === "image/jpeg" ? ".jpg" : ".png";
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    return new File([blob], `${baseName}${nextExt}`, { type: outputMimeType });
}

export type UploadedImageMeta = {
    fileUrl: string;
    fileSeq: number;
};

/**
 * 공통 이미지 업로드 (DB attach_file + Spring 디스크)
 * @param menuUrl 업로드 시점 화면 경로 (예: `window.location.pathname`). 추적용.
 */
export async function uploadImageFile(file: File, menuUrl?: string): Promise<UploadedImageMeta> {
    const optimizedFile = await compressImageIfNeeded(file);
    const formData = new FormData();
    formData.append("file", optimizedFile);
    if (menuUrl?.trim()) {
        formData.append("menuUrl", menuUrl.trim().slice(0, 500));
    }

    const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("이미지 업로드에 실패했습니다.");
    }

    const payload = (await res.json()) as ApiEnvelope;
    const data = payload.data;
    const imageUrl = data?.fileUrl;
    const rawSeq = data?.fileSeq;

    if (!imageUrl) {
        throw new Error("업로드 응답에 fileUrl이 없습니다.");
    }
    if (rawSeq == null || !Number.isFinite(Number(rawSeq))) {
        throw new Error("업로드 응답에 fileSeq가 없습니다.");
    }

    return { fileUrl: imageUrl, fileSeq: Number(rawSeq) };
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
    const path =
        menuUrl ??
        (typeof window !== "undefined" ? window.location.pathname : undefined);
    return uploadImage(file, path);
}
