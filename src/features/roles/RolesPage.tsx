"use client";
import { useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

type Row = { id: number; role: string; desc: string };

export default function RolesPage() {
  const [rowData] = useState<Row[]>(
    [{ id: 1, role: "ADMIN", desc: "전체 권한" }, { id: 2, role: "CS", desc: "CS 권한" }]
  );

  const colDefs = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 90 },
      { field: "role", headerName: "권한명", width: 140 },
      { field: "desc", headerName: "설명", flex: 1 },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">권한관리</h1>

      <div className="rounded-2xl border p-4" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--card))" }}>
        <div className="text-sm text-[rgb(var(--muted))] mb-3">조회조건(예시)</div>
        <div className="grid md:grid-cols-4 gap-3">
          <input className="rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "rgb(var(--border))" }} placeholder="권한명" />
          <div />
          <div />
          <button className="rounded-lg bg-[rgb(var(--primary))] text-white px-3 py-2 text-sm">조회</button>
        </div>
      </div>

      <div className="rounded-2xl border p-4" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg))" }}>
        <div className="ag-theme-quartz" style={{ height: 420 }}>
          <AgGridReact rowData={rowData} columnDefs={colDefs as any} pagination={true} paginationPageSize={10} />
        </div>
      </div>
    </div>
  );
}
