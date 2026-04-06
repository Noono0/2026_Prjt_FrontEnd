# lms-frontend-admin

Next.js(App Router) 기반 운영/관리 프론트엔드 스캐폴드입니다.

도메인을 **사용자(`gamcompany.kr`) / 관리자(`admin.gamcompany.kr`)** 서브도메인으로 나누어 배포하려면 [docs/DEPLOY-GAMCOMPANY.md](./docs/DEPLOY-GAMCOMPANY.md) 를 참고하세요.

## 사용 기술

| 구분 | 기술 |
|------|------|
| 런타임 | [Node.js](https://nodejs.org/) 20 LTS 권장 (Volta: 20.11.1) |
| 프레임워크 | [Next.js](https://nextjs.org/) 15 (App Router), React 19, TypeScript |
| 스타일 | [Tailwind CSS](https://tailwindcss.com/) v4, PostCSS, Sass |
| 상태·데이터 | [TanStack Query](https://tanstack.com/query), [Zustand](https://zustand-demo.pmnd.rs/) |
| 인증·테마 | [NextAuth.js](https://next-auth.js.org/) v4, [next-themes](https://github.com/pacocoursey/next-themes) |
| 그리드·차트 | [AG Grid](https://www.ag-grid.com/) React, [Recharts](https://recharts.org/) |
| 에디터 | [Tiptap](https://tiptap.dev/) |
| 캘린더 | [FullCalendar](https://fullcalendar.io/) |
| UI·기타 | Radix UI, Floating UI, Framer Motion, Lucide, Zod, date-fns, react-arborist 등 |
| 패키지 관리 | [pnpm](https://pnpm.io/) 9.x (`packageManager` 필드 참고) |
| 배포(선택) | [Wrangler](https://developers.cloudflare.com/workers/wrangler/) → **Cloudflare Pages**에 프론트 배포 |

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
pnpm add -D @tailwindcss/postcss tailwindcss postcss sass typescript @types/node @types/react @types/react-dom @types/canvas-confetti @types/lodash.throttle eslint eslint-config-next wrangler @base-ui/react class-variance-authority
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

### 기타 명령

```bash
pnpm build    # 프로덕션 빌드
pnpm start    # 빌드 결과 실행 (기본 포트 3000)
pnpm lint     # ESLint
```

캐시 문제 시(빌드/모듈 꼬임): `.next` 폴더 삭제 후 다시 `pnpm dev` 또는 `pnpm build`.

## 주요 페이지

- `/` 대시보드
- `/members` 회원 관리(예제)
- `/roles` 권한 관리(예제)
- `/menus` 메뉴 관리(조회 + AG Grid + 페이징)
- `/common-codes` 공통코드 관리(조회 + AG Grid + 페이징)

## 소셜 로그인 (Google / Kakao / Naver)

1. `.env.example`을 복사해 `.env.local` 생성
2. `NEXTAUTH_*` 및 각 Provider Client ID/Secret 입력
3. `pnpm dev` 후 상단 Login → 소셜 로그인

> SOOP(구 아프리카TV) OAuth는 공식 문서·제공 여부 확인이 필요해 본 프로젝트에는 포함하지 않았습니다.

---

## Cloudflare Pages로 배포 (Wrangler)

이 프로젝트는 로컬에서 **Wrangler CLI**로 정적 산출물(또는 Next용 어댑터 출력)을 **Cloudflare Pages**에 올리는 방식을 가정할 수 있습니다. (`wrangler pages deploy`는 **Pages** 제품이며, 실행은 Workers 기반 인프라입니다.)

### 1. 의존성 설치

```bash
pnpm install
```

(`wrangler`는 `devDependencies`에 포함되어 있습니다.)

### 2. Cloudflare 로그인

```bash
pnpm exec wrangler login
```

브라우저가 열리면 Cloudflare 계정으로 승인합니다. 터미널-only 환경이면 표시되는 링크로 수동 로그인할 수 있습니다.

확인:

```bash
pnpm exec wrangler whoami
```

### 3. 배포할 빌드 산출물 준비

**경로 `.vercel/output/static`** 은 보통 [**`@cloudflare/next-on-pages`**](https://developers.cloudflare.com/pages/framework-guides/nextjs/) 등으로 Next 앱을 Cloudflare용으로 빌드했을 때 생성됩니다.
이 저장소에 해당 빌드 스크립트가 아직 없다면, Cloudflare 문서에 맞게 어댑터를 추가한 뒤 빌드를 실행해야 합니다.

예시(프로젝트에 어댑터를 연결한 PR/설정 이후):

```bash
# Cloudflare 문서/프로젝트 스크립트에 맞는 빌드 명령 실행 (예: next-on-pages 빌드)
pnpm build
# 또는 문서에 나온 pages 전용 빌드 명령
```

**완전 정적 내보내기(`output: 'export'`)**만 쓰는 경우에는 산출 폴더가 `out/` 일 수 있으므로, 그때는 아래 배포 명령의 경로를 `./out` 등으로 바꿉니다.

### 4. Pages 프로젝트에 배포

Cloudflare 대시보드에서 **Pages** 프로젝트를 미리 만들었거나, 첫 배포 시 프로젝트 이름으로 생성됩니다.

```bash
pnpm exec wrangler pages deploy .vercel/output/static --project-name=2026-prjt-frontend
```

- `--project-name`: Cloudflare Pages의 프로젝트 이름(본인 계정에 맞게 변경)
- 산출 폴더 경로는 실제 빌드 결과에 맞게 수정

### 5. 프로덕션 환경 변수

Cloudflare 대시보드 → 해당 **Pages 프로젝트** → **Settings** → **Environment variables** 에서  
로컬 `.env.local`과 동일한 키(`NEXT_PUBLIC_*`, NextAuth에 필요한 시크릿 등)를 **Production**(및 Preview)에 등록합니다.  
변수 추가·변경 후에는 재배포가 필요할 수 있습니다.

### 6. (선택) Git 연동 자동 배포

대시보드에서 저장소를 연결해 `git push`마다 빌드·배포하도록 설정할 수 있습니다.  
이 경우에도 빌드 커맨드·산출 디렉터리는 위와 같이 Cloudflare/Next 어댑터 문서에 맞춥니다.

---

## 문제 해결

- **Windows**: 경로에 공백이 있으면 터미널에서 큰따옴표로 감싸 실행합니다.
- **pnpm / Node 버전**: `package.json`의 `volta`·`packageManager` 필드와 맞추면 재현이 쉽습니다.
