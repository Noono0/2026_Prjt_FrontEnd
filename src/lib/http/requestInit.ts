/**
 * 백엔드 Spring Security 세션(JSESSIONID)을 쿠키로 보내기 위해 사용.
 * `app.security.permit-all=false` 로 운영할 때 로그인 후 API 호출에 필요합니다.
 */
export const defaultApiRequestInit: RequestInit = {
    credentials: "include",
    cache: "no-store",
};
