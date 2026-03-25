type UploadBoardImageResponse = {
    imageUrl?: string;
    data?: {
        imageUrl?: string;
    };
};

export async function uploadBoardImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/files/upload/board-image", {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        throw new Error("이미지 업로드에 실패했습니다.");
    }

    const payload = (await res.json()) as UploadBoardImageResponse;
    const imageUrl = payload.imageUrl ?? payload.data?.imageUrl;

    if (!imageUrl) {
        throw new Error("업로드 응답에 imageUrl이 없습니다.");
    }

    return imageUrl;
}