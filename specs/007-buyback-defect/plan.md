# Implementation Plan: 收購單瑕疵欄位

**Branch**: `007-buyback-defect` | **Date**: 2026-01-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-buyback-defect/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

為收購單商品項目新增瑕疵欄位多選功能，完全仿效現有寄賣單的瑕疵欄位實作。使用 Checkbox 群組呈現四種瑕疵選項（五金生鏽/刮痕/掉、皮質磨損/刮痕/壓痕、內裡髒污、四角磨損），以固定代碼儲存（hardwareRustScratchLoss、leatherWearScratchDent、liningDirty、cornerWear），確保歷史記錄向後相容。支援建立、查詢、修改與 Excel 匯出功能。

## Technical Context

**Language/Version**: TypeScript 4.9+ (Vue 3.5+)  
**Primary Dependencies**: Vue 3, Element Plus, Pinia, Vue Router, Vite 7+, Axios  
**Storage**: 後端 API (REST) - 遵循 V3.Admin.Backend.API.yaml 規範  
**Testing**: Vitest (單元測試)  
**Target Platform**: 現代網頁瀏覽器 (Chrome, Firefox, Safari, Edge)
**Project Type**: Web (單一前端專案)  
**Performance Goals**: 
  - 瑕疵欄位表單互動響應時間 < 100ms
  - 收購單詳細頁面載入時間 < 1 秒
  - Excel 匯出（含 100 筆記錄）< 3 秒
  
**Constraints**: 
  - 必須與現有寄賣單瑕疵欄位 UI/UX 完全一致
  - 必須支援既有收購單記錄的向後相容（無瑕疵資料視為空陣列）
  - 必須遵循 V3.Admin.Backend.API.yaml 的 API 契約規範
  - 瑕疵代碼必須使用駝峰命名，與寄賣單保持一致
  
**Scale/Scope**: 
  - 影響範圍：收購單建立表單、詳細頁面、編輯功能、Excel 匯出
  - 預估修改檔案數：5-8 個檔案（types, components, APIs, composables）
  - 單一商品項目最多 4 個瑕疵選項

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Documentation Language ✅
- 所有規格文件與實作計劃使用繁體中文
- 程式碼註解使用繁體中文

### II. Simplified Architecture ✅
- 重用既有 ProductItem 型別，僅新增 defects 屬性
- 直接參考寄賣單的實作模式，避免重新發明輪子
- 不引入額外抽象層或複雜模式

### III. Latest Tech Stack ✅
- 使用專案現有技術棧（Vue 3.5+, Element Plus, TypeScript）
- 不引入新依賴，所有功能透過現有套件實現

### IV. Code Quality & Testing ✅
- 必須通過 ESLint 檢查
- 關鍵工具函式（瑕疵代碼轉換）需有單元測試
- 遵循專案既有命名規範與程式碼風格

### V. User Experience First ✅
- 使用 Checkbox 群組確保選項清晰可見
- 與寄賣單 UI/UX 保持一致，降低學習成本
- 提供即時互動反饋（勾選/取消即時更新）
- 既有記錄向後相容，顯示「無」或留空

### VI. Brownfield Project Protection ✅
- 僅擴展 ProductItem 型別，不修改既有屬性
- 新增欄位為選填，不影響既有功能
- API 整合遵循既有模式，不破壞現有 API 呼叫
- 既有收購單記錄自動相容（空陣列處理）

### VII. Backend API Contract Compliance ✅
- 必須參考 V3.Admin.Backend.API.yaml 中的收購單相關 API 規範
- 商品項目的 defects 欄位必須符合後端 schema 定義
- 錯誤處理必須處理標準錯誤代碼（VALIDATION_ERROR, CONCURRENT_UPDATE_CONFLICT 等）
- 請求/回應格式必須符合 ApiResponseModel<T> 標準

**GATE STATUS: ✅ PASS** - 無違反憲章原則，可進入 Phase 0 研究階段

---

### Phase 1 Design Review (Re-check after design)

**Re-evaluation Date**: 2026-01-30  
**Status**: ✅ PASS - Phase 1 設計完成後重新檢查，所有憲章原則持續符合

**變更確認**:
- ✅ 資料模型變更最小化（僅擴展 defects 欄位）
- ✅ API 契約遵循 V3.Admin.Backend.API.yaml 規範
- ✅ 無新增第三方依賴
- ✅ 實作方案完全參照既有寄賣單，符合簡化架構原則
- ✅ 測試策略涵蓋單元測試與整合測試
- ✅ 向後相容性完整考慮，無破壞性變更

**Final Approval**: ✅ Ready for Phase 2 (Task Breakdown)

## Project Structure

### Documentation (this feature)

```text
specs/007-buyback-defect/
├── spec.md              # 功能規格文件
├── plan.md              # 本檔案 (/speckit.plan 命令輸出)
├── research.md          # Phase 0 輸出 (/speckit.plan 命令)
├── data-model.md        # Phase 1 輸出 (/speckit.plan 命令)
├── quickstart.md        # Phase 1 輸出 (/speckit.plan 命令)
├── contracts/           # Phase 1 輸出 (/speckit.plan 命令)
│   └── api-updates.md   # API 契約更新說明
├── checklists/          # 檢查清單目錄（已存在）
└── tasks.md             # Phase 2 輸出 (/speckit.tasks 命令 - 非 /speckit.plan 建立)
```

### Source Code (repository root)

```text
src/
├── pages/
│   └── service-order-management/    # 服務單管理模組
│       ├── types.ts                  # [修改] 型別定義 - 新增/確認 ProductItem.defects
│       ├── constants.ts              # [修改] 常數定義 - 確認 DEFECT_OPTIONS
│       ├── components/
│       │   ├── BuybackForm.vue       # [修改] 收購單表單 - 新增瑕疵欄位 UI
│       │   ├── ProductItemForm.vue   # [修改] 商品項目表單 - 新增瑕疵 Checkbox 群組
│       │   └── OrderDetail.vue       # [修改] 訂單詳細頁面 - 顯示瑕疵資訊
│       ├── composables/
│       │   └── useDefectOptions.ts   # [新增] 瑕疵選項處理邏輯（代碼/顯示名稱轉換）
│       └── utils/
│           └── export-excel.ts       # [修改] Excel 匯出 - 新增瑕疵欄位
├── common/
│   └── constants/
│       └── defect-options.ts         # [可選新增] 共用瑕疵選項定義（若需跨模組使用）
└── ...

tests/
├── pages/
│   └── service-order-management/
│       └── composables/
│           └── useDefectOptions.test.ts  # [新增] 瑕疵選項處理單元測試
└── ...
```

**Structure Decision**: 
- 採用 Web application 單一前端專案結構
- 所有變更集中在 `src/pages/service-order-management/` 模組內
- 瑕疵選項常數已存在於 `types.ts`（DEFECT_OPTIONS），無需新增檔案
- 建立 composable 處理瑕疵代碼與顯示名稱轉換邏輯
- 修改既有元件（表單、詳細頁面、Excel 匯出）以支援瑕疵欄位

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**N/A** - Constitution Check 全數通過，無違反憲章原則，無需複雜度追蹤。
