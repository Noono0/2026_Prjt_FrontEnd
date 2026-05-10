/**
 * 자유게시판 — 상세 (Read) / 같은 페이지에서 수정·삭제 (Update·Delete)
 * URL: `/boards/123` , 수정 모드: `/boards/123?mode=edit` (작성자만)
 * 다음: `BoardDetailPage` → `fetchBoardDetail` / `updateBoard` / `deleteMyBoard`
 * 흐름: `features/boards/CRUD_FLOW.md`
 */
import BoardDetailPage from "@/features/boards/BoardDetailPage";

type Props = {
    params: Promise<{
        boardSeq: string;
    }>;
};

export default async function Page({ params }: Props) {
    const { boardSeq: seqStr } = await params;
    const boardSeq = Number(seqStr);
    return <BoardDetailPage boardSeq={boardSeq} />;
}
