import { redirect } from "next/navigation";

type Props = {
    params: Promise<{
        noticeBoardSeq: string;
    }>;
};

export default async function Page({ params }: Props) {
    const { noticeBoardSeq } = await params;
    redirect(`/notice-board/${noticeBoardSeq}`);
}
