# Implementation Plan: 用戶管理（User Management）

**Branch**: `001-user-management` | **Date**: 2025-11-16 | **Spec**: `specs/001-user-management/spec.md`
**Input**: 依據 `spec.md` 與後端 API 規格 `V3.Admin.Backend.API.yaml` 重新規劃

## Summary

此計畫旨在於前端實作「用戶管理」模組，提供用戶列表（分頁/搜尋）、新增、編輯、刪除（軟刪除）、變更密碼與匯出 Excel 等功能。實作以 Vue 3 + TypeScript 為主，使用 Element Plus 作為 UI 元件，並嚴格依照後端 OpenAPI 規格（`V3.Admin.Backend.API.yaml`）進行 API 呼叫與錯誤處理。

主要技術與作法：
- 前端使用組合式函式（Composables）封裝模組邏輯，必要時才使用 Pinia。
- 權限採路由守衛（route meta）與 `v-permission` 指令（按鈕級）結合。
- Excel 匯出優先採 client-side（SheetJS），若面臨資料量/效能問題再提出後端導出 API。
- 以 `ApiResponseModel<T>` 的 `code` 與 `message` 統一處理錯誤；在 `@/http/axios.ts` 建置 response handler。

## Technical Context

**Language/Version**: Vue 3.5+, TypeScript 5.x
**Primary Dependencies**: Vite 7+, Element Plus, Pinia (按需), axios, xlsx (SheetJS), dayjs
**Storage**: 後端為 API（無專用前端 DB）；前端使用記憶體/頁面快取，必要時 localStorage（短期快取）
**Testing**: Vitest + @vue/test-utils
**Target Platform**: 現代 Web 瀏覽器（desktop 優先）
**Project Type**: Web application（前端模組在 `src/pages/user-management`）
**Performance Goals**: 首次載入在常見情境下 < 2s（資料量 1,000 筆、分頁載入）；匯出 500 筆 .xlsx < 5s
**Constraints**: 頁面分頁依 API 使用 `pageNumber`（從 1 開始）與 `pageSize`（1-100）；所有 API 呼叫需提供 JWT Bearer Token（除 `/api/auth/login` 以外）；不可假設後端未定義行為
**Scale/Scope**: 支援至少 10k 用戶的分頁瀏覽（以後端分頁為主）；並發使用者數 50+ 為目標

## Constitution Check

以下以 `.specify/memory/constitution.md` 為準則檢查：

- **I. Documentation Language**: PASS（計畫與產出檔案皆為繁體中文）
- **II. Simplified Architecture**: PASS（優先 Composables，僅必要時使用 Pinia，避免過度抽象）
- **III. Latest Tech Stack**: PASS（採用 Vue3 + Vite + Element Plus）
- **IV. Code Quality & Testing**: PASS（測試策略已規劃：Vitest 與元件測試）
- **V. User Experience First**: PASS（提供即時驗證、清晰錯誤提示、匯出 UX）
- **VI. Brownfield Project Protection**: PASS（將變更限制於 `src/pages/user-management`，避免無必要修改既有程式）
- **VII. Backend API Contract Compliance**: PARTIAL PASS — 需確認以下 gating 項目：
  - 是否需後端新增 `export` 專用 API（若匯出大量資料或因合規需由後端產生檔案）；目前採用前端匯出策略，但若遇到大資料量會提出後端變更請求。
  - 權限代碼命名（`user.create` / `user.update` / `user.delete` / `user.export`）需與後端現有權限碼核對或協商。

結論：憲章檢查無阻礙性違反，但有兩項需在 Phase 1 前與後端確認（export API 與最終權限碼）。若後端拒絕或無對應權限，需在 tasks 中補上同步變更工作。

## Project Structure

選擇 Web application 前端模組方式，實作檔案置於：

```text
src/pages/user-management/
├── apis/                # API 封裝（對應 contracts）
├── components/          # 小型元件（UserTable, UserForm）
├── composables/         # 用戶管理邏輯（useUserManagement, useUserForm, useExportExcel）
├── types.ts             # 模組型別定義
└── index.vue            # 主頁面
```

**Structure Decision**: 使用現有專案結構，不新增獨立前端專案，僅在 `src/pages/user-management` 上擴充，遵循憲章的 Brownfield 原則。

## Complexity Tracking

無憲章違規需特殊說明；所有設計選擇優先符合「簡化架構」原則。

## Next Steps / Phase 0→1 交接

1. Phase 0 已完成研究並生成 `research.md`（已存在）。
2. Phase 1（Design & Contracts）：生成 `data-model.md`、`contracts/api-contracts.md`、`quickstart.md`（均已生成/存在）。
3. 與後端同步：確認 `user.export` 權限與是否需要新增後端匯出 API（列入 gating 項）。
4. 執行 agent context 更新腳本：`.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`。

產物：`specs/001-user-management/{plan.md,research.md,data-model.md,quickstart.md,contracts/*}`

