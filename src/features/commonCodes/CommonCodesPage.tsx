"use client";

import { useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridApi } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import PageHeader from "@/components/page/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

type CommonCodeRow = {
  id: number;
  groupCode: string;
  groupName: string;
  code: string;
  codeName: string;
  useYn: "Y" | "N";
  sortOrder: number;
  updatedAt: string;
};

const SAMPLE: CommonCodeRow[] = Array.from({ length: 132 }).map((_, i) => ({
  id: i + 1,
  groupCode: i % 3 === 0 ? "A010" : i % 3 === 1 ? "A020" : "A030",
  groupName: i % 3 === 0 ? "회원상태" : i % 3 === 1 ? "권한" : "메뉴",
  code: String(1000 + i),
  codeName: `코드명 ${i + 1}`,
  useYn: i % 7 === 0 ? "N" : "Y",
  sortOrder: (i % 20) + 1,
  updatedAt: "2026-03-01",
}));

export default function CommonCodesPage() {
  const gridRef = useRef<AgGridReact<CommonCodeRow>>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // search form state
  const [groupCode, setGroupCode] = useState<string>("");
  const [useYn, setUseYn] = useState<string>("ALL");
  const [keyword, setKeyword] = useState<string>("");

  // paging
  const [pageSize, setPageSize] = useState<number>(100);
  const [page, setPage] = useState<number>(1);

  const filtered = useMemo(() => {
    let rows = SAMPLE;
    if (groupCode.trim()) rows = rows.filter((r) => r.groupCode.includes(groupCode.trim()));
    if (useYn !== "ALL") rows = rows.filter((r) => r.useYn === useYn);
    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.groupName.toLowerCase().includes(k) ||
          r.code.toLowerCase().includes(k) ||
          r.codeName.toLowerCase().includes(k)
      );
    }
    return rows;
  }, [groupCode, useYn, keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const rowData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, pageSize, currentPage]);

  const columnDefs = useMemo<ColDef<CommonCodeRow>[]>(
    () => [
      { headerName: "순번", valueGetter: (p) => String((currentPage - 1) * pageSize + (p.node?.rowIndex ?? 0) + 1), width: 90 },
      { field: "groupCode", headerName: "그룹코드", width: 120 },
      { field: "groupName", headerName: "그룹명", flex: 1, minWidth: 160 },
      { field: "code", headerName: "코드", width: 120 },
      { field: "codeName", headerName: "코드명", flex: 1, minWidth: 180 },
      { field: "useYn", headerName: "사용", width: 90 },
      { field: "sortOrder", headerName: "정렬", width: 90 },
      { field: "updatedAt", headerName: "수정일", width: 140 },
    ],
    [currentPage, pageSize]
  );

  const defaultColDef = useMemo<ColDef>(() => ({ sortable: true, filter: true, resizable: true }), []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="공통코드관리"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "공통코드관리" }]}
        right={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => alert("등록(예시)")}>등록</Button>
            <Button variant="secondary" onClick={() => alert("엑셀(예시)")}>엑셀</Button>
          </div>
        }
      />

      <Card>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">그룹코드</div>
            <Input value={groupCode} onChange={(e) => setGroupCode(e.target.value)} placeholder="예) A010" />
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">사용여부</div>
            <Select
              value={useYn}
              onChange={(e) => setUseYn(e.target.value)}
              options={[
                { value: "ALL", label: "전체" },
                { value: "Y", label: "사용" },
                { value: "N", label: "미사용" },
              ]}
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <div className="text-sm text-muted-foreground">검색어</div>
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="그룹명/코드/코드명" />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">총 <span className="font-medium text-foreground">{filtered.length}</span>건</div>
          <div className="flex items-center gap-2">
            <Button variant="primary" onClick={() => { setPage(1); }}>검색</Button>
            <Button variant="ghost" onClick={() => { setGroupCode(""); setUseYn("ALL"); setKeyword(""); setPage(1); }}>초기화</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="ag-theme-quartz w-full" style={{ height: 520 }}>
          <AgGridReact<CommonCodeRow>
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={(e) => setGridApi(e.api)}
            rowSelection="single"
            animateRows
            domLayout="normal"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            보기 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filtered.length)} / {filtered.length}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setPage(1)} disabled={currentPage === 1}>⏮</Button>
            <Button variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>◀</Button>
            <div className="text-sm">
              페이지 <span className="font-medium">{currentPage}</span> / {totalPages}
            </div>
            <Button variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>▶</Button>
            <Button variant="ghost" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}>⏭</Button>

            <Select
              value={String(pageSize)}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              options={[
                { value: "20", label: "20" },
                { value: "50", label: "50" },
                { value: "100", label: "100" },
                { value: "200", label: "200" },
              ]}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
