import { MAX_BOARD_IMAGE_UPLOAD_BYTES } from "@/lib/imageUploadConstants"

/** 사용자가 초과 용량 이미지 압축 업로드를 취소했을 때 */
export class UserCancelledImageUploadError extends Error {
    constructor() {
        super("USER_CANCELLED_OVERSIZED_IMAGE")
        this.name = "UserCancelledImageUploadError"
    }
}

/**
 * 업로드 한도(maxBytes)를 넘는 파일에 대해, 리사이즈·압축 후 업로드할지 확인한다.
 */
export function confirmShrinkOversizedImage(
    file: File,
    maxBytes: number = MAX_BOARD_IMAGE_UPLOAD_BYTES
): boolean {
    if (file.size <= maxBytes) return true
    if (typeof window === "undefined") return false
    const mb = Math.floor(maxBytes / (1024 * 1024))
    return window.confirm(
        `선택한 이미지가 ${mb}MB를 넘습니다.\n리사이즈·압축 후 업로드되며 해상도·화질이 줄어들 수 있습니다.\n계속하시겠습니까?`
    )
}
