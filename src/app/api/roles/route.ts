import { NextResponse } from "next/server";

// role 테이블 예시 데이터. 실제 운영에서는 DB 조회로 교체하세요.
// 컬럼: id, role_name
type RoleRow = { id: number; role_name: string };

const ROLES: RoleRow[] = [
  { id: 1, role_name: "ADMIN" },
  { id: 2, role_name: "CS" },
];

export async function GET() {
  return NextResponse.json({ items: ROLES });
}
