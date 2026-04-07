import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function GET() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/roles`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
        { success: false, message: "권한 목록 조회 실패" },
        { status: 500 }
    );
  }
}
