import SitePopupDetailPage from "@/features/sitePopups/SitePopupDetailPage";

export default async function Page({ params }: { params: Promise<{ sitePopupSeq: string }> }) {
    const { sitePopupSeq: seqStr } = await params;
    const sitePopupSeq = Number(seqStr);
    if (Number.isNaN(sitePopupSeq)) {
        return (
            <div className="min-h-[50vh] rounded-2xl border border-slate-800 bg-[#0c1017] px-5 py-10 text-center text-amber-300">
                잘못된 요청입니다.
            </div>
        );
    }
    return <SitePopupDetailPage sitePopupSeq={sitePopupSeq} />;
}
