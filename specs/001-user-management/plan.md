# Implementation Plan: User Management System

**Branch**: `001-user-management` | **Date**: 2025-01-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-user-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

實作使用者帳號管理系統，包含帳號的 CRUD 操作、角色與權限控制。採用 Vue 3 Composition API + Element Plus 構建前端介面，使用 SheetJS 進行前端 Excel 匯出，無需後端報表服務。權限系統採用 `account.read`、`account.create`、`account.update`、`account.delete` 四種權限代碼進行精細化訪問控制。

## Technical Context

**Language/Version**: TypeScript 5.9.2, Vue 3.5.21
**Primary Dependencies**: Element Plus 2.11.2, Pinia 3.0.3, Axios 1.12.2, xlsx (SheetJS)
**Storage**: 後端 API (REST, JWT Bearer Token, ApiResponseModel<T> 格式)
**Testing**: Vitest 3.2.4, @vue/test-utils 2.4.6
**Target Platform**: 現代瀏覽器 (ES2020+)
**Project Type**: Web application (Frontend only, backend API exists)
**Performance Goals**: <500ms 頁面載入時間, <100ms 互動回應時間
**Constraints**: 前端 Excel 匯出 (無後端依賴), 權限驗證 (v-permission 指令 + 路由守衛)
**Scale/Scope**: ~10 個元件, ~500 行業務邏輯代碼, 支援數千筆用戶數據分頁查詢

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── pages/
│   └── user-management/           # 使用者管理模組 (本功能)
│       ├── index.vue              # 主頁面
│       ├── components/            # 私有元件
│       │   ├── UserTable.vue      # 使用者表格元件
│       │   └── UserForm.vue       # 使用者表單元件 (新增/編輯)
│       ├── composables/           # 私有組合式函式
│       │   ├── useUserManagement.ts   # 使用者列表邏輯 (查詢/刪除)
│       │   ├── useUserForm.ts         # 表單邏輯 (新增/編輯/驗證)
│       │   └── useExportExcel.ts      # Excel 匯出邏輯 (SheetJS)
│       └── apis/                  # 私有 API
│           └── user.ts            # 使用者 API 服務
│
├── common/
│   ├── constants/
│   │   └── permissions.ts         # 權限常數 (包含 account.read/create/update/delete)
│   └── utils/
│       └── permission.ts          # 權限工具函式 (已存在，用於 v-permission 指令)
│
├── router/
│   └── index.ts                   # 路由設定 (添加 user-management 路由與權限守衛)
│
└── plugins/
    └── permission-directive.ts    # v-permission 自訂指令 (已存在)

tests/
├── components/
│   ├── UserTable.test.ts          # UserTable 元件測試
│   └── UserForm.test.ts           # UserForm 元件測試
└── composables/
    ├── useUserManagement.test.ts  # useUserManagement 組合式函式測試
    ├── useUserForm.test.ts        # useUserForm 組合式函式測試
    └── useExportExcel.test.ts     # useExportExcel 組合式函式測試
```

**Structure Decision**: 採用專案現有的模組化結構，所有使用者管理相關程式碼集中於 `@/pages/user-management/` 目錄下，遵循「同一業務邏輯的程式碼與資源集中在一起」的原則。權限常數放置於 `@/common/constants/` 以供全域使用。測試檔案按元件與組合式函式分類放置於 `tests/` 目錄。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
