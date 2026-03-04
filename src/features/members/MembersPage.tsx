"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridApi, RowClickedEvent } from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import MemberFormModal, { type Member } from "@/components/members/MemberFormModal";

type Row = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  region?: string;
  role?: string;
  status?: string;
  lastLoginAt?: string;
};

export default function MembersPage() {
  const [keyword, setKeyword] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const gridApiRef = useRef<GridApi<Row> | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<Member | null>(null);
  const [pageSize, setPageSize] = useState(100);

  const colDefs = useMemo<ColDef<Row>[]>(
    () => [
      { headerName: "선택", checkboxSelection: true, headerCheckboxSelection: true, width: 70, pinned: "left" },
      { headerName: "아이디", field: "id", width: 120 },
      { headerName: "사용자성명", field: "name", flex: 1, minWidth: 140 },
      { headerName: "이메일", field: "email", flex: 1, minWidth: 180 },
      { headerName: "휴대폰", field: "phone", width: 150 },
      { headerName: "지역", field: "region", width: 120 },
      { headerName: "권한", field: "role", width: 120 },
      { headerName: "상태", field: "status", width: 120 },
      { headerName: "최종접속", field: "lastLoginAt", width: 170 },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), []);

  const fetchRows = async () => {
    const qs = new URLSearchParams();
    if (keyword.trim()) qs.set("q", keyword.trim());
    const res = await fetch(`/api/members?${qs.toString()}`, { cache: "no-store" });
    const json = await res.json();
    const items = (json.items ?? []) as Member[];
    setRows(
      items.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        region: m.region,
        role: (m as any).role,
        status: m.status,
        lastLoginAt: m.lastLoginAt,
      }))
    );
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = () => {
    setModalMode("create");
    setSelected(null);
    setModalOpen(true);
  };

  const onDelete = async () => {
    const selectedRows = gridApiRef.current?.getSelectedRows() ?? [];
    if (selectedRows.length === 0) {
      alert("삭제할 회원을 선택하세요.");
      return;
    }
    if (!confirm(`${selectedRows.length}건 삭제할까요?`)) return;

    const ids = selectedRows.map((r) => r.id).join(",");
    await fetch(`/api/members?ids=${encodeURIComponent(ids)}`, { method: "DELETE" });
    await fetchRows();
  };

  const openEdit = (row: Row) => {
    setModalMode("edit");
    setSelected({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      region: row.region,
      status: (row.status as any) ?? "ACTIVE",
      lastLoginAt: row.lastLoginAt,
    });
    setModalOpen(true);
  };

  const onRowClicked = (e: RowClickedEvent<Row>) => {
    if (!e.data) return;
    openEdit(e.data);
  };

  const onSave = async (member: Member) => {
    const method = modalMode === "create" ? "POST" : "PUT";
    const res = await fetch("/api/members", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.message ?? "저장 실패");
      return;
    }
    await fetchRows();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">회원관리</h1>
          <p className="text-sm text-[var(--muted)]">조회 조건 + 목록(AG Grid) + 등록/수정 모달</p>
        </div>

        <div className="flex gap-2">
          <select
            className="h-9 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            aria-label="페이지 사이즈"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
          <button className="h-9 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3" onClick={onCreate}>
            등록
          </button>
          <button className="h-9 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3" onClick={onDelete}>
            삭제
          </button>
        </div>
      </div>

      {/* 검색 폼 */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="space-y-1">
            <div className="text-xs text-[var(--muted)]">검색어</div>
            <input
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="아이디/이름/이메일"
            />
          </label>

          <div className="md:col-span-3 flex items-end justify-end gap-2">
            <button className="h-10 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4" onClick={fetchRows}>
              조회
            </button>
          </div>
        </div>
      </div>

      {/* 목록 */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="ag-theme-quartz" style={{ height: 560, width: "100%" }}>
          <AgGridReact<Row>
            rowData={rows}
            columnDefs={colDefs}
            defaultColDef={defaultColDef}
            pagination
            paginationPageSize={pageSize}
            rowSelection={{ mode: "multiRow", checkboxes: true, headerCheckbox: true }}
            animateRows
            onGridReady={(e) => {
              gridApiRef.current = e.api;
            }}
            onRowClicked={onRowClicked}
          />
        </div>
      </div>

      <MemberFormModal
        open={modalOpen}
        mode={modalMode}
        initial={selected}
        onClose={() => setModalOpen(false)}
        onSave={onSave}
      />
    </div>
  );
}
