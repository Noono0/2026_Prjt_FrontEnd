import SiteSupportItemDetailPage from "@/features/siteSupport/SiteSupportItemDetailPage";

export default async function Page({ params }: { params: Promise<{ supportSeq: string }> }) {
    const { supportSeq: seqStr } = await params;
    const supportSeq = Number(seqStr);
    if (Number.isNaN(supportSeq)) {
        return (
            <div className="min-h-[50vh] rounded-2xl border border-slate-800 bg-[#0c1017] px-5 py-10 text-center text-amber-300">
                잘못된 요청입니다.
            </div>
        );
    }
    return <SiteSupportItemDetailPage supportSeq={supportSeq} />;
}
