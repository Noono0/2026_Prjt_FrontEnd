import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.search;

    const res = await fetch(`${API_BASE_URL}/api/members${search}`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("GET /api/members error =", error);
    return NextResponse.json(
        { success: false, message: "회원 목록 조회 실패" },
        { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = req.headers.get("x-api-action");

    let targetUrl = `${API_BASE_URL}/api/members/createMember`;

    if (action === "search") {
      targetUrl = `${API_BASE_URL}/api/members/search`;
    } else if (action === "create") {
      targetUrl = `${API_BASE_URL}/api/members/createMember`;
    }

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("POST /api/members error =", error);
    return NextResponse.json(
        { success: false, message: "회원 처리 실패" },
        { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${API_BASE_URL}/api/members/updateMember`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("PUT /api/members error =", error);
    return NextResponse.json(
        { success: false, message: "회원 수정 실패" },
        { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${API_BASE_URL}/api/members/deleteMember`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("DELETE /api/members error =", error);
    return NextResponse.json(
        { success: false, message: "회원 삭제 실패" },
        { status: 500 }
    );
  }
}