"use client";

import { useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

/**
 * 메뉴관리 화면 템플릿
 * - 상단: 조회조건 form(이미지 스타일에 맞춰 grid)
 * - 하단: AG Grid 목록 + pagination
 * - 실제 백엔드 붙일 때:
 *   1) 조회 버튼 클릭 시 API 호출
 *   2) server-side pagination이면 rowData 대신 datasource 사용(AgGrid Server-Side Row Model)
 */
type Row = {
  id: number;
  depth: number;
  name: string;
  path?: string;
  sortOrder: number;
  useYn: "Y" | "N";
};

export default function MenusPage() {
  const [name, setName] = useState("");
  const [useYn, setUseYn] = useState<"" | "Y" | "N">("");

  const allRows: Row[] = useMemo(() => ([
    { id: 1, depth: 1, name: "회원관리", sortOrder: 1, useYn: "Y" },
    { id: 2, depth: 2, name: "회원 목록", path: "/members", sortOrder: 1, useYn: "Y" },
    { id: 3, depth: 1, name: "권한관리", sortOrder: 2, useYn: "Y" },
    { id: 4, depth: 2, name: "권한 목록", path: "/roles", sortOrder: 1, useYn: "Y" },
    { id: 5, depth: 1, name: "메뉴관리", sortOrder: 3, useYn: "Y" },
    { id: 6, depth: 2, name: "메뉴 목록", path: "/menus", sortOrder: 1, useYn: "Y" },
    { id: 7, depth: 3, name: "4depth 예시-1", path: "/menus", sortOrder: 1, useYn: "Y" },
    { id: 8, depth: 4, name: "4depth 예시-2", path: "/menus", sortOrder: 1, useYn: "Y" },
  ]), []);

  const [rowData, setRowData] = useState<Row[]>(allRows);

  const colDefs = useMemo<ColDef<Row>[]>(() => [
    { field: "id", headerName: "ID", width: 90 },
    { field: "depth", headerName: "Depth", width: 110 },
    { field: "name", headerName: "메뉴명", flex: 1 },
    { field: "path", headerName: "Path", flex: 1 },
    { field: "sortOrder", headerName: "정렬", width: 110 },
    { field: "useYn", headerName: "사용", width: 110 },
  ], []);

  function onSearch() {
    const filtered = allRows.filter((r) => {
      if (name && !r.name.includes(name)) return false;
      if (useYn && r.useYn !== useYn) return false;
      return true;
    });
    setRowData(filtered);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">메뉴관리</h1>

      {/* 조회조건 */}
      <div className="rounded-2xl border p-4" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--card))" }}>
        <div className="text-sm text-[rgb(var(--muted))] mb-3">조회조건</div>
        <div className="grid md:grid-cols-6 gap-3 items-end">
          <label className="md:col-span-2 block">
            <div className="text-xs text-[rgb(var(--muted))] mb-1">메뉴명</div>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
              style={{ borderColor: "rgb(var(--border))" }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예) 회원"
            />
          </label>

          <label className="md:col-span-2 block">
            <div className="text-xs text-[rgb(var(--muted))] mb-1">사용여부</div>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
              style={{ borderColor: "rgb(var(--border))" }}
              value={useYn}
              onChange={(e) => setUseYn(e.target.value as any)}
            >
              <option value="">전체</option>
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </label>

          <div className="md:col-span-2 flex gap-2 justify-end">
            <button className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgb(var(--border))" }} onClick={() => { setName(""); setUseYn(""); setRowData(allRows); }}>
              초기화
            </button>
            <button className="rounded-lg bg-[rgb(var(--primary))] text-white px-3 py-2 text-sm" onClick={onSearch}>
              조회
            </button>
          </div>
        </div>
      </div>

      {/* 목록 */}
      <div className="rounded-2xl border p-4" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg))" }}>
        <div className="ag-theme-quartz" style={{ height: 560 }}>
          <AgGridReact
            rowData={rowData}
            columnDefs={colDefs as any}
            pagination={true}
            paginationPageSize={10}
          />
        </div>
        <div className="text-xs text-[rgb(var(--muted))] mt-2">
          paging은 현재 client pagination(AgGrid pagination). 서버 paging으로 바꾸려면 datasource로 교체하세요.
        </div>
      </div>
    </div>
  );
}
