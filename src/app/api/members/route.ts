import { NextResponse } from "next/server";

// Dev-only in-memory store so the 화면이 바로 동작하게.
// 실제 운영에서는 백엔드(Spring) API로 교체하세요.

type Member = {
  id: string;
  name: string;
  birthYmd?: string;
  gender?: "M" | "F";
  phone?: string;
  email?: string;
  region?: string;
  status?: "ACTIVE" | "SUSPENDED" | "WITHDRAWN";
  role?: string;
  lastLoginAt?: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __MEMBERS__: Member[] | undefined;
}

function store(): Member[] {
  if (!globalThis.__MEMBERS__) {
    globalThis.__MEMBERS__ = [
      {
        id: "000001",
        name: "(샘플)홍길동",
        birthYmd: "1997-02-03",
        gender: "M",
        phone: "010-1234-5678",
        email: "sample@naver.com",
        region: "서울",
        status: "ACTIVE",
        role: "ADMIN",
        lastLoginAt: "2026-03-01 11:38:58",
      },
    ];
  }
  return globalThis.__MEMBERS__;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();

  const data = store();
  const filtered = !q
    ? data
    : data.filter(
        (m) => m.id.toLowerCase().includes(q) || (m.name ?? "").toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q)
      );

  return NextResponse.json({ items: filtered, total: filtered.length });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Member;
  const data = store();

  if (!body?.id) return NextResponse.json({ message: "id is required" }, { status: 400 });
  if (data.some((m) => m.id === body.id)) return NextResponse.json({ message: "duplicate id" }, { status: 409 });

  data.push({ ...body });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request) {
  const body = (await req.json()) as Member;
  const data = store();

  const idx = data.findIndex((m) => m.id === body.id);
  if (idx < 0) return NextResponse.json({ message: "not found" }, { status: 404 });

  data[idx] = { ...data[idx], ...body };
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const ids = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length === 0) return NextResponse.json({ message: "ids required" }, { status: 400 });

  const data = store();
  globalThis.__MEMBERS__ = data.filter((m) => !ids.includes(m.id));
  return NextResponse.json({ ok: true });
}
