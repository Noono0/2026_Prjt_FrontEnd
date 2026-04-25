/**
 * 자유게시판 — 글쓰기 (Create)
 * URL: `/boards/write`
 * 다음: `components/editor/BoardWritePage.tsx` → `POST /api/boards/create` (api.ts의 apiFetch 아님)
 * 흐름: `features/boards/CRUD_FLOW.md`
 */
import BoardWritePage from "../../../components/editor/BoardWritePage";

export default function Page() {
    return <BoardWritePage />;
}
