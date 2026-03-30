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
