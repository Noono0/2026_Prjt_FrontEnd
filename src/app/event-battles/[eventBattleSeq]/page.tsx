import EventBattleDetailPage from "@/features/eventBattles/EventBattleDetailPage";

type Params = { params: Promise<{ eventBattleSeq: string }> };

export default async function Page({ params }: Params) {
    const { eventBattleSeq } = await params;
    const seq = Number(eventBattleSeq);
    if (!Number.isFinite(seq) || seq < 1) {
        return <div className="p-6 text-slate-400">잘못된 경로입니다.</div>;
    }
    return <EventBattleDetailPage eventBattleSeq={seq} />;
}
