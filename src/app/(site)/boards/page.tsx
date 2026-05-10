/**
 * 자유게시판 — 목록 화면
 * URL: `/boards`
 * 다음: `features/boards/BoardsPage.tsx` → `searchBoards()` → POST `/api/boards/search`
 * 흐름 요약: `features/boards/CRUD_FLOW.md`
 */
import BoardsPage from "@/features/boards/BoardsPage";

export default function Page() {
    return <BoardsPage />;
}
