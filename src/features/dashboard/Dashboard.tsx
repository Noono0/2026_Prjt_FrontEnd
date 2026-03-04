export default function Dashboard() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">대시보드</h1>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="rounded-2xl border p-4" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--card))" }}>
          <div className="text-sm text-[rgb(var(--muted))]">상태</div>
          <div className="text-lg font-semibold">정상</div>
        </div>
        <div className="rounded-2xl border p-4" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--card))" }}>
          <div className="text-sm text-[rgb(var(--muted))]">오늘 주문</div>
          <div className="text-lg font-semibold">-</div>
        </div>
        <div className="rounded-2xl border p-4" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--card))" }}>
          <div className="text-sm text-[rgb(var(--muted))]">알림</div>
          <div className="text-lg font-semibold">-</div>
        </div>
      </div>
      <p className="text-sm text-[rgb(var(--muted))]">
        메인 화면은 로그인 없이도 보이고, 우측 상단 Login 버튼으로 팝업 로그인됩니다.
      </p>
    </div>
  );
}
