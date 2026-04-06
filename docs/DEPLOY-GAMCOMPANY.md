# gamcompany.kr — 사용자 / 관리자 서브도메인 분리

**사용자(일반)**: `https://gamcompany.kr` 또는 `https://www.gamcompany.kr`  
**관리자(운영)**: `https://admin.gamcompany.kr` ← `prjt-frontend-operational` 배포 대상

같은 등록 도메인에서 **서브도메인만** 나누므로 **도메인 추가 구매는 없음**.  
Cloudflare **한 계정** 안에 **Pages 프로젝트를 두 개** 두는 방식을 권장합니다.

## 1. Cloudflare Pages 프로젝트 두 개

| 프로젝트 | 소스 / 빌드 | 커스텀 도메인 예 |
|----------|-------------|------------------|
| `gamcompany-user` | 사용자용 Next (`prjt-FrontUser` 등) | `gamcompany.kr`, `www.gamcompany.kr` |
| `gamcompany-admin` | 관리자 Next (`prjt-frontend-operational`) | `admin.gamcompany.kr` |

각 프로젝트 → **Custom domains**에서 위 호스트를 연결합니다. SSL은 자동입니다.

## 2. DNS (Cloudflare DNS 탭)

Pages에 도메인을 붙이면 **권장 CNAME**이 안내됩니다. 일반적으로:

- **이름** `admin` → 관리자 Pages 대상 (예: `gamcompany-admin.pages.dev`)
- **이름** `www` → 사용자 Pages 대상
- **루트 `gamcompany.kr`**: Apex는 `A`/`AAAA` 또는 **CNAME flattening** 정책에 따라 Cloudflare가 안내하는 대로 연결. 보통 **사용자 사이트**를 apex에 두고, `www`도 같은 프로젝트로 묶는 경우가 많습니다.

(한 호스트에 두 Pages를 섞지 마세요. 호스트 하나당 **배포 하나**입니다.)

## 3. 관리자 앱 환경 변수 (`prjt-frontend-operational`)

Cloudflare Pages → **gamcompany-admin** → **Settings → Environment variables**

| 변수 | 예시 (프로덕션) |
|------|------------------|
| `NEXTAUTH_URL` | `https://admin.gamcompany.kr` |
| `NEXTAUTH_SECRET` | (랜덤 긴 문자열) |
| `NEXT_PUBLIC_API_BASE_URL` | 백엔드 공개 URL (예: `https://api.gamcompany.kr` 또는 동일 서버 경로) |
| `NEXT_PUBLIC_USER_SITE_URL` | (선택) `https://gamcompany.kr` — 사용자 사이트로 링크할 때 |

OAuth 사용 시 Google/Kakao/Naver **승인 리디렉션 URI**에  
`https://admin.gamcompany.kr/api/auth/callback/google` 형태를 등록합니다.

## 4. 사용자 앱 환경 변수 (`prjt-FrontUser` 등)

| 변수 | 예시 |
|------|------|
| `NEXT_PUBLIC_API_BASE_URL` | 백엔드 URL |
| `NEXT_PUBLIC_SITE_URL` | `https://gamcompany.kr` (절대 URL이 필요할 때) |
| `NEXT_PUBLIC_ADMIN_SITE_URL` | (선택) `https://admin.gamcompany.kr` |

## 5. 백엔드 CORS

브라우저에서 API를 직접 호출하는 경우, 스프링 `SecurityConfig`의 `allowedOriginPatterns`에 다음이 포함되어야 합니다.

- `https://gamcompany.kr`
- `https://www.gamcompany.kr`
- `https://admin.gamcompany.kr`

로컬은 기존 `localhost:3000`, `3001` 유지.

## 6. `basePath` 필요 여부

- **관리자만** `admin.gamcompany.kr`에 올리고, 앱 루트가 `/` 이면 **`basePath` 없음**이 맞습니다.
- **같은 호스트**에서 `/admin`으로 나눌 때만 `basePath: '/admin'`이 필요합니다. (지금 구성은 서브도메인 분리이므로 해당 없음.)

## 7. 체크리스트

- [ ] 사용자 / 관리자 Pages 빌드·배포 성공
- [ ] `admin` / `www`(및 apex) DNS 연결 및 SSL 활성
- [ ] 두 앱의 `NEXT_PUBLIC_API_BASE_URL` 및 관리자 `NEXTAUTH_URL` 반영
- [ ] 백엔드 CORS에 세 오리진 반영
- [ ] 소셜 로그인 콘솔에 콜백 URL 등록
