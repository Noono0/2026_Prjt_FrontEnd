import NoticeBoardDetailPage from "@/features/noticeBoards/NoticeBoardDetailPage";

type Props = {
    params: Promise<{
        noticeBoardSeq: string;
    }>;
};

export default async function Page({ params }: Props) {
    const { noticeBoardSeq: seqStr } = await params;
    const noticeBoardSeq = Number(seqStr);
    return <NoticeBoardDetailPage noticeBoardSeq={noticeBoardSeq} />;
}
