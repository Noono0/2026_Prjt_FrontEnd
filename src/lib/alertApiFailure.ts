/** Next/API 프록시가 넘기는 Spring `ApiResponse` 형태 */
export type ApiEnvelope = {
    success?: boolean;
    message?: string;
};

/**
 * `fetch` 직후 JSON을 파싱했을 때, 실패 응답이면 서버 `message`로 alert 하고 true.
 * 성공이면 false (alert 없음).
 */
export function alertIfApiFailed(res: Response, body: ApiEnvelope | null, fallback: string): boolean {
    const failed = !res.ok || body?.success === false;
    if (!failed) {
        return false;
    }
    const msg =
        typeof body?.message === "string" && body.message.trim().length > 0 ? body.message.trim() : fallback;
    alert(msg);
    return true;
}
