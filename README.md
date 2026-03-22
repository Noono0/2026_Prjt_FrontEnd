# lms-frontend-admin (요구사항 반영 스캐폴드)

- Next.js(App Router) + TS
- Tailwind v4
- 다크/라이트 모드 (next-themes)
- 사이드 메뉴: 4-depth 지원
- 메인 화면은 바로 보임 (로그인 화면 X)
- 상단 우측 Login 버튼 → 팝업(모달) 로그인
- 목록은 AG Grid 예제 + paging 템플릿 포함

## 실행
```bash
pnpm i
pnpm dev
```

## 페이지
- `/` 대시보드
- `/members` 회원관리(예제)
- `/roles` 권한관리(예제)
- `/menus` 메뉴관리(조회조건 + AG Grid + 페이징 템플릿)
- `/common-codes` 공통코드관리(조회조건 + AG Grid + 페이징 템플릿)

## 실행 (pnpm)
```bash
# (Windows) node_modules 없으면 먼저 설치!
pnpm i
pnpm add lucide-react
npm install @tanstack/react-query zustand --legacy-peer-deps
pnpm add @tanstack/react-query-devtools
pnpm add react-arborist

//npm install react-arborist  // 메뉴화면 tree 라이브러리
// 안되면 이걸로 npm install react-arborist --legacy-peer-deps 

Remove-Item -Recurse -Force .next

pnpm dev
```

## 소셜 로그인 (Google/Kakao/Naver)
1) `.env.example` 를 복사해서 `.env.local` 생성  
2) NEXTAUTH_* 및 각 Provider Client ID/Secret 입력  
3) `pnpm dev` 후 우측 상단 Login → 소셜 로그인 버튼 사용

> SOOP(구 아프리카TV) 인증은 공식 OAuth 제공 여부/문서 확인이 필요해서, 지금 프로젝트엔 미포함입니다.
