import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

type Params = {
    params: Promise<{ boardSeq: string; commentSeq: string }>;
};

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const { boardSeq, commentSeq } = await params;
        const cookie = req.headers.get("cookie") ?? "";
        const body = await req.json();
        const res = await fetch(`${API_BASE_URL}/api/boards/${boardSeq}/comments/${commentSeq}`, {
            method: "PUT",
            cache: "no-store",
            headers: {
                "Content-Type": "application/json",
                ...(cookie ? { cookie } : {}),
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("PUT /api/boards/.../comments/[commentSeq] error =", error);
        return NextResponse.json({ success: false, message: "댓글 수정 실패" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const { boardSeq, commentSeq } = await params;
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/boards/${boardSeq}/comments/${commentSeq}`, {
            method: "DELETE",
            cache: "no-store",
            headers: cookie ? { cookie } : {},
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("DELETE /api/boards/.../comments/[commentSeq] error =", error);
        return NextResponse.json({ success: false, message: "댓글 삭제 실패" }, { status: 500 });
    }
}
