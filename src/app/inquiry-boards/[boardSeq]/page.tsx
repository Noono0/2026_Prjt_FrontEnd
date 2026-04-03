import InquiryBoardDetailPage from "@/features/inquiryBoards/InquiryBoardDetailPage";

type Props = {
    params: Promise<{ boardSeq: string }>;
};

export default async function Page({ params }: Props) {
    const { boardSeq: seqStr } = await params;
    return <InquiryBoardDetailPage boardSeq={Number(seqStr)} />;
}

