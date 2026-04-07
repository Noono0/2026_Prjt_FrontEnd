/** 서버(API Route)에서 스프링으로 프록시할 때 사용. Vercel에는 `NEXT_PUBLIC_API_BASE_URL`과 동일한 운영 URL을 꼭 넣거나, 둘 다 설정 */
export const API_BASE_URL =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8080";