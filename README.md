# lms-frontend-admin

Next.js(App Router) 기반 운영/관리 프론트엔드 스캐폴드입니다.

도메인을 **사용자(`gamcompany.kr`) / 관리자(`admin.gamcompany.kr`)** 서브도메인으로 나누어 배포하려면 [docs/DEPLOY-GAMCOMPANY.md](./docs/DEPLOY-GAMCOMPANY.md) 를 참고하세요.

## 사용 기술

| 구분                | 기술                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 런타임              | [Node.js](https://nodejs.org/) 20 LTS 권장 (Volta: 20.11.1)                                                                        |
| 프레임워크          | [Next.js](https://nextjs.org/) 15 (App Router), React 19, TypeScript                                                               |
| 스타일              | [Tailwind CSS](https://tailwindcss.com/) v4, PostCSS, Sass                                                                         |
| 상태·데이터         | [TanStack Query](https://tanstack.com/query), [Zustand](https://zustand-demo.pmnd.rs/)                                             |
| 인증·테마           | [Auth.js / next-auth](https://authjs.dev/) v5, [next-themes](https://github.com/pacocoursey/next-themes)                           |
| 그리드·차트         | [AG Grid](https://www.ag-grid.com/) React, [Recharts](https://recharts.org/)                                                       |
| 에디터              | [Tiptap](https://tiptap.dev/)                                                                                                      |
| 캘린더              | [FullCalendar](https://fullcalendar.io/)                                                                                           |
| UI·기타             | Radix UI, Floating UI, Framer Motion, Lucide, Zod, date-fns, react-arborist 등                                                     |
| API 클라이언트 생성 | [Orval](https://orval.dev/) — OpenAPI 스펙에서 TypeScript 클라이언트·모델 생성 (`pnpm gen:openapi`, 산출물 `src/generated/orval/`) |
| 테스트              | [Vitest](https://vitest.dev/) (단위), [Playwright](https://playwright.dev/) (E2E, `e2e/`)                                          |
| 패키지 관리         | [pnpm](https://pnpm.io/) 9.x (`packageManager` 필드 참고)                                                                          |
| 배포                | [Vercel](https://vercel.com/) 권장 (Next.js 기본, Node 런타임·API Routes 호환)                                                     |

## 사전 준비

- **Node.js** 20 이상
- **pnpm** (`corepack enable` 후 `corepack prepare pnpm@9.15.4 --activate` 또는 npm 전역 설치)

## Git clone 후 로컬 실행

저장소 루트(`prjt-frontend-operational`)에서:

```bash
pnpm install
```

의존성 이름·버전은 모두 `package.json` / `pnpm-lock.yaml`에 들어 있으므로, **정상적으로 clone 받았다면 위 한 줄이면 충분**합니다.  
아래 `pnpm add` 묶음은 **다른 빈 프로젝트에 비슷한 스택을 옮길 때** 또는 **누락된 패키지만 보강할 때** 참고용입니다(버전은 필요 시 `package.json`과 맞추세요).

<details>
<summary><strong>참고: 주요 패키지 수동 설치 (pnpm add)</strong></summary>

```bash
# 앱 코어
pnpm add next@15 react@19 react-dom@19 next-auth next-themes

# 데이터·상태
pnpm add @tanstack/react-query @tanstack/react-query-devtools zustand

# Tiptap (에디터·보드 등) — 핵심만 쓰는 경우
pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-file-handler

# Tiptap — 이 저장소와 동일하게 확장까지 맞출 때
pnpm add @tiptap/core @tiptap/extension-link @tiptap/extension-placeholder @tiptap/extension-text-align @tiptap/extension-underline @tiptap/extension-highlight @tiptap/extension-horizontal-rule @tiptap/extension-list @tiptap/extension-subscript @tiptap/extension-superscript @tiptap/extension-typography @tiptap/extensions

# FullCalendar
pnpm add @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction

# AG Grid
pnpm add ag-grid-community ag-grid-react

# UI·차트·기타
pnpm add @radix-ui/react-dropdown-menu @radix-ui/react-popover @floating-ui/react framer-motion lucide-react classnames canvas-confetti date-fns date-holidays lodash.throttle react-arborist react-custom-roulette react-hotkeys-hook recharts zod

# 개발 의존성
pnpm add -D @tailwindcss/postcss tailwindcss postcss sass typescript @types/node @types/react @types/react-dom @types/canvas-confetti @types/lodash.throttle eslint eslint-config-next @base-ui/react class-variance-authority
```

Windows / PowerShell에서도 그대로 실행할 수 있게 **한 줄짜리 명령**만 두었습니다.  
(Tiptap은 위 블록에서 **핵심만** / **확장까지** 순서로 나눴습니다.)

</details>

환경 변수:

```bash
# Windows: copy .env.example .env.local
# macOS/Linux: cp .env.example .env.local
```

`.env.local`에서 `NEXT_PUBLIC_API_BASE_URL`, NextAuth 관련 값을 채웁니다.  
로컬 개발 서버는 **포트 3001**을 씁니다. `NEXTAUTH_URL`을 `http://localhost:3001`로 맞춥니다.

```bash
pnpm dev
```

브라우저에서 `http://localhost:3001` 로 접속합니다.

### OpenAPI 클라이언트 생성 (Orval)

백엔드가 OpenAPI를 노출하는 상태에서 실행합니다(로컬 기본: `http://127.0.0.1:8080/v3/api-docs`).

```bash
pnpm gen:openapi
```

다른 스펙 URL을 쓰려면:

```bash
set OPENAPI_URL=http://호스트:포트/v3/api-docs
pnpm gen:openapi
```

(macOS/Linux: `export OPENAPI_URL=...`)

### 기타 명령

```bash
pnpm build           # 프로덕션 빌드
pnpm start           # 빌드 결과 실행 (기본 포트 3000)
pnpm lint            # ESLint
pnpm test            # Vitest 단위 테스트
pnpm test:watch      # Vitest 감시 모드
pnpm test:e2e        # Playwright E2E (아래 브라우저 설치 후)
pnpm test:e2e:ui     # Playwright UI 모드
pnpm test:e2e:headed # 브라우저 창을 띄워 실행
pnpm test:e2e:install # 최초 1회: Playwright용 Chromium 등 설치
```

E2E는 `playwright.config.ts`에서 `http://localhost:3001`을 `baseURL`로 쓰며, `pnpm test:e2e` 실행 시 필요하면 `pnpm dev`를 자동으로 띄웁니다(CI에서는 `CI` 환경 변수 등에 맞게 동작).

캐시 문제 시(빌드/모듈 꼬임): `.next` 폴더 삭제 후 다시 `pnpm dev` 또는 `pnpm build`.

### API 문서 (백엔드 기동 시, 로컬 개발)

백엔드(springdoc)가 켜져 있을 때 브라우저에서 확인할 수 있습니다.

| 구분         | URL (예: 백엔드 `localhost:8080`)         |
| ------------ | ----------------------------------------- |
| Swagger UI   | `http://localhost:8080/swagger-ui.html`   |
| Scalar       | `http://localhost:8080/scalar/index.html` |
| OpenAPI JSON | `http://localhost:8080/v3/api-docs`       |

운영 `prod` 프로필 등에서 springdoc이 꺼져 있으면 위 주소는 동작하지 않을 수 있습니다.

## 주요 페이지

- `/` 대시보드
- `/members` 회원 관리(예제)
- `/roles` 권한 관리(예제)
- `/menus` 메뉴 관리(조회 + AG Grid + 페이징)
- `/common-codes` 공통코드 관리(조회 + AG Grid + 페이징)
- `/profile` 멤버스트리머 프로필 관리

## 소속 이미지(attr2) 설정 가이드

소속 이미지는 공통코드 **중분류(`A0004`)의 `attr2`** 값을 사용합니다.

- 관리 위치: 공통코드 관리 화면(`/common-codes`)에서 `A0004` 그룹의 상세 코드 편집
- 저장 규칙: 프로필의 `affiliationCode`는 중분류 **코드 ID(`codeId`)** 기준으로 저장/비교
- 이미지 경로 규칙(`attr2`):
    - `https://...` : 외부 URL 그대로 사용
    - `/...` : 프론트 정적/내부 경로로 그대로 사용
    - 숫자만 입력(예: `123`) : 파일 시퀀스로 간주해 `/api/files/view/123`으로 변환

코드 기준 참고 경로:

- 소속 코드 상수: `src/constants/affiliationCodes.ts`
- 프로필 소속 옵션 매핑(`value = codeId`): `src/features/profile/ProfilePage.tsx`
- 대시보드 소속 그룹/엠블럼 변환: `src/features/dashboard/dashboardUtils.ts`
- 대시보드 메인 화면: `src/features/dashboard/Dashboard.tsx`

## 소셜 로그인 (Google / Kakao / Naver)

1. `.env.example`을 복사해 `.env.local` 생성
2. `NEXTAUTH_*` 및 각 Provider Client ID/Secret 입력
3. `pnpm dev` 후 상단 Login → 소셜 로그인

> SOOP(구 아프리카TV) OAuth는 공식 문서·제공 여부 확인이 필요해 본 프로젝트에는 포함하지 않았습니다.

---

## Vercel 수동 배포 (CLI, Git 연동 없음)

저장소를 Vercel에 연결하지 않고, **로컬에서 CLI만**으로 빌드·업로드하는 흐름입니다. [`vercel`](https://vercel.com/docs/cli)은 이 프로젝트의 `devDependencies`에 포함되어 있습니다.

### 최초 1회

1. [Vercel](https://vercel.com/) 웹에서 계정을 준비합니다.
2. 프로젝트 루트에서 로그인합니다.

    ```bash
    pnpm exec vercel login
    ```

3. 같은 디렉터리에서 프로젝트를 링크합니다(질문에 따라 팀·프로젝트 이름을 선택).

    ```bash
    pnpm exec vercel link
    ```

4. **환경 변수**는 [대시보드](https://vercel.com/dashboard) → 해당 프로젝트 → **Settings → Environment Variables**에 로컬 `.env.local`과 맞춰 넣거나, 터미널에서 `pnpm exec vercel env add`로 추가합니다.  
   필수 예: `NEXT_PUBLIC_*`, `AUTH_SECRET` 또는 `NEXTAUTH_SECRET`, OAuth 클라이언트, 프로덕션 **`NEXTAUTH_URL`**.

### 배포할 때마다

- **프로덕션**(실서비스 도메인에 연결된 배포):

    ```bash
    pnpm run vercel:deploy
    ```

    (`vercel --prod`와 동일)

- **프리뷰**(임시 URL만 바꿔 보고 싶을 때):

    ```bash
    pnpm run vercel:preview
    ```

Vercel이 원격에서 `pnpm install` → `next build`를 수행합니다. 로컬 **Install Command**를 쓰려면 대시보드 → **Settings → General → Install Command**에 `pnpm install`을 지정하면 됩니다.

배포 후 커스텀 도메인(예: `admin.gamcompany.kr`)은 대시보드 **Domains**에서 연결하고, **`NEXTAUTH_URL`**을 그 공개 URL과 동일하게 맞춥니다.

자세한 서브도메인·DNS·CORS는 [docs/DEPLOY-GAMCOMPANY.md](./docs/DEPLOY-GAMCOMPANY.md)를 참고하세요.

---

## 문제 해결

- **Vercel: 배포는 Ready인데 브라우저에서 404**: 이 저장소는 `src/app/page.tsx`로 루트 `/`가 있습니다. 여전히 404면 대부분 **프로젝트 설정** 문제입니다.
    1. **Root Directory**: Git 루트가 이 폴더가 **아닌** 상위 모노레포면, Vercel → Project → **Settings → General → Root Directory**에 이 Next 앱 폴더(예: `real/prjt-frontend-operational`)를 지정합니다. 비어 있으면 저장소 루트의 `package.json`만 보고 빌드해 **앱이 아닌 디렉터리**에서 빌드할 수 있습니다.
    2. **Output Directory**: Next.js는 보통 비웁니다. **Settings → Build & Development → Output Directory**에 `out`, `dist`, `.next` 등을 넣어 두었으면 **지웁니다**(정적 export(`output: 'export'`)가 아니면 잘못된 설정입니다).
    3. **프레임워크**: **Next.js**로 인식되는지 확인합니다. 저장소 루트에 `vercel.json`으로 `framework` / `pnpm` 빌드가 명시돼 있습니다.
    4. 빌드 로그 하단에 로컬 `pnpm run build` 때와 같이 **`○ /`**(루트 라우트)가 찍히는지 확인합니다. 루트가 목록에 없으면 위 1번 가능성이 큽니다.
- **Vercel: “Vulnerable version of Next.js” + 로그에 `Using prebuilt build artifacts from .vercel/output`**: 예전에 `vercel build`로 만들어 둔 **`.vercel/output`을 Git에 올린 상태**이면, `package.json`을 올려도 산출물 안의 Next 버전(예: 15.5.2)으로 검사됩니다. **`.vercel/output/`은 커밋하지 마세요.**(저장소 `.gitignore`에 포함됨) 해당 폴더를 삭제·추적 해제한 뒤 다시 푸시하면 원격에서 `next build`가 돌아갑니다.
- **Windows**: 경로에 공백이 있으면 터미널에서 큰따옴표로 감싸 실행합니다.
- **`pnpm install` 시 esbuild가 ELF(리눅스) 바이너리 오류**: 같은 폴더를 WSL과 Windows가 공유하면 `node_modules`가 섞일 수 있습니다. **프로젝트 루트에서 `node_modules` 폴더를 삭제한 뒤, 지금 쓰는 OS에서 다시 `pnpm install`** 하세요.
- **Auth.js(next-auth v5) 시크릿**: Vercel·로컬 모두 **`AUTH_SECRET`**(또는 기존과 동일 값의 **`NEXTAUTH_SECRET`**)이 필요합니다. `src/auth.ts`는 둘 다 읽습니다.
- **pnpm / Node 버전**: `package.json`의 `volta`·`packageManager` 필드와 맞추면 재현이 쉽습니다.
