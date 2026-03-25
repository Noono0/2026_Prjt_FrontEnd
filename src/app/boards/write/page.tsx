import Link from "next/link";

export default function Page() {
    return (
        <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-slate-800 bg-[#0c1017] p-8 text-slate-200 shadow-xl">
            <h1 className="text-xl font-bold text-white">글쓰기</h1>
            <p className="text-sm text-slate-400">
                관리자 프론트(`prjt-frontend-operational`)에 먼저 UI를 구성해두었습니다. 등록 API·에디터 연동은 다음 단계에서
                붙이면 됩니다.
            </p>
            <Link href="/boards" className="inline-block text-sm text-sky-400 hover:text-sky-300">
                ← 목록으로
            </Link>
        </div>
    );
}

