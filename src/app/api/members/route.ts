import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.search;
    const res = await fetch(`${API_BASE_URL}/api/members${search}`, {
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
        { message: "회원 목록 조회 실패" },
        { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("=== POST /api/members start ===");
    const body = await req.json();
    console.log("body =", JSON.stringify(body, null, 2));
    const url = `${API_BASE_URL}/api/members/createMember`;
    console.log("request url =", url);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log("backend status =", res.status);
    const data = await res.json();
    console.log("backend response =", JSON.stringify(data, null, 2));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("POST /api/members error =", error);
    return NextResponse.json(
        { message: "회원 등록 실패" },
        { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${API_BASE_URL}/api/members`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
        { message: "회원 수정 실패" },
        { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const search = req.nextUrl.search;

    const res = await fetch(`${API_BASE_URL}/api/members${search}`, {
      method: "DELETE",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
        { message: "회원 삭제 실패" },
        { status: 500 }
    );
  }
}