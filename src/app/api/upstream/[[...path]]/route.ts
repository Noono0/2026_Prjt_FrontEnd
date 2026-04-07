import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { forwardSpringSetCookies } from "@/lib/forwardSpringSetCookies";

type Ctx = { params: Promise<{ path?: string[] }> };

const FORWARD_REQ_HEADERS = ["cookie", "authorization", "content-type", "accept", "accept-language"];

function isAllowedPath(segments: string[] | undefined): boolean {
    return Boolean(segments?.length && segments[0] === "api");
}

async function proxy(req: NextRequest, ctx: Ctx): Promise<Response> {
    const { path: segments } = await ctx.params;
    if (!isAllowedPath(segments)) {
        return NextResponse.json({ success: false, message: "허용되지 않은 경로입니다." }, { status: 404 });
    }

    const targetUrl = `${API_BASE_URL}/${(segments as string[]).join("/")}${req.nextUrl.search}`;

    const headers = new Headers();
    for (const name of FORWARD_REQ_HEADERS) {
        const v = req.headers.get(name);
        if (v) headers.set(name, v);
    }

    const init: RequestInit = {
        method: req.method,
        headers,
        cache: "no-store",
    };

    if (!["GET", "HEAD"].includes(req.method)) {
        const buf = await req.arrayBuffer();
        if (buf.byteLength > 0) init.body = buf;
    }

    let res: Response;
    try {
        res = await fetch(targetUrl, init);
    } catch (e) {
        console.error("[upstream]", req.method, targetUrl, e);
        return NextResponse.json(
            { success: false, message: "백엔드 연결에 실패했습니다." },
            { status: 502 }
        );
    }

    const out = new NextResponse(res.body, { status: res.status });
    forwardSpringSetCookies(res, out);
    const ct = res.headers.get("content-type");
    if (ct) out.headers.set("Content-Type", ct);

    return out;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
