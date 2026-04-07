# gamcompany.kr — 사용자 / 관리자 서브도메인 분리

**사용자(일반)**: `https://gamcompany.kr` 또는 `https://www.gamcompany.kr`  
**관리자(운영)**: `https://admin.gamcompany.kr` ← `prjt-frontend-operational` 배포 대상

같은 등록 도메인에서 **서브도메인만** 나누므로 **도메인 추가 구매는 없음**.  
[Vercel](https://vercel.com/)에 **프로젝트를 두 개** 두는 방식을 권장합니다(사용자 앱 / 관리자 앱). Git 연동 없이 로컬에서 `vercel link` / `vercel --prod`로 올리려면 저장소 **README**의 「Vercel 수동 배포」를 따르세요.

## 1. Vercel 프로젝트 두 개

| 프로젝트 | 소스 / 빌드 | 커스텀 도메인 예 |
|----------|-------------|------------------|
| `gamcompany-user` | 사용자용 Next (`prjt-FrontUser` 등) | `gamcompany.kr`, `www.gamcompany.kr` |
| `gamcompany-admin` | 관리자 Next (`prjt-frontend-operational`) | `admin.gamcompany.kr` |

각 프로젝트 → **Settings → Domains**에서 위 호스트를 연결합니다. SSL은 Vercel이 발급합니다.

- Install command가 필요하면 `pnpm install`로 지정합니다.
- Build command는 기본 `next build`(또는 `pnpm build`)입니다.

## 2. DNS

도메인 DNS는 **등록업체 또는 Cloudflare 등 DNS 호스트** 어디에 두어도 됩니다. Vercel에 커스텀 도메인을 추가하면 **안내하는 레코드(A/CNAME)**를 그대로 넣으면 됩니다.

일반적으로:

- **이름** `admin` → Vercel이 안내하는 관리자 프로젝트 대상(보통 `cname.vercel-dns.com` 등)
- **이름** `www` → 사용자 프로젝트 대상
- **루트 `gamcompany.kr`**: Apex는 등록업체/Vercel 안내에 따라 `A` 레코드 또는 권장 CNAME 정책을 따릅니다. 보통 **사용자 사이트**를 apex에 두고, `www`도 같은 프로젝트로 묶는 경우가 많습니다.

(한 호스트에 두 배포를 섞지 마세요. 호스트 하나당 **배포 하나**입니다.)

## 3. 관리자 앱 환경 변수 (`prjt-frontend-operational`)

Vercel → **gamcompany-admin** → **Settings → Environment Variables**

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

- [ ] 사용자 / 관리자 Vercel 빌드·배포 성공
- [ ] `admin` / `www`(및 apex) DNS 연결 및 SSL 활성
- [ ] 두 앱의 `NEXT_PUBLIC_API_BASE_URL` 및 관리자 `NEXTAUTH_URL` 반영
- [ ] 백엔드 CORS에 세 오리진 반영
- [ ] 소셜 로그인 콘솔에 콜백 URL 등록
