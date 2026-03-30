import { Suspense } from "react";
import BlacklistReportDetailPage from "@/features/blacklistReport/BlacklistReportDetailPage";

type Props = {
    params: Promise<{
        blacklistReportSeq: string;
    }>;
};

function DetailFallback() {
    return (
        <div className="rounded-2xl border border-slate-800 bg-[#0c1017] px-5 py-16 text-center text-slate-500">불러오는 중…</div>
    );
}

export default async function Page({ params }: Props) {
    const { blacklistReportSeq: seqStr } = await params;
    const blacklistReportSeq = Number(seqStr);
    return (
        <Suspense fallback={<DetailFallback />}>
            <BlacklistReportDetailPage blacklistReportSeq={blacklistReportSeq} />
        </Suspense>
    );
}
