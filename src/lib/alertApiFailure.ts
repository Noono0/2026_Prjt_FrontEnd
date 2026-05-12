/** Next/API 프록시가 넘기는 Spring `ApiResponse` 형태 */
export type ApiEnvelope = {
    success?: boolean;
    message?: string;
};

/**
 * `fetch` 직후 JSON을 파싱했을 때, 실패 응답이면 서버 `message`(없으면 fallback)를 반환.
 * 성공이면 null.
 */
export function getApiFailureMessage(res: Response, body: ApiEnvelope | null, fallback: string): string | null {
    const failed = !res.ok || body?.success === false;
    if (!failed) {
        return null;
    }
    return typeof body?.message === "string" && body.message.trim().length > 0 ? body.message.trim() : fallback;
}
