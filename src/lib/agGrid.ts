// src/lib/agGrid.ts
// AG Grid 전역 설정 + 스타일 로드
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

// v33 이후에는 모듈 등록이 필요해서 한 번만 전역 등록
ModuleRegistry.registerModules([AllCommunityModule]);