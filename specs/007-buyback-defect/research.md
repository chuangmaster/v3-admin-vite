# Research: 收購單瑕疵欄位研究

**Feature**: 007-buyback-defect  
**Date**: 2026-01-30  
**Researcher**: AI Agent  

## Executive Summary

完成收購單瑕疵欄位功能所需的技術研究，確認實作方案完全參照既有寄賣單的瑕疵欄位實作模式。主要修改集中在：移除 ProductItemForm.vue 中的 `v-if="isConsignment"` 條件判斷、在收購單 API 請求中新增 defects 欄位對應、以及擴展 Excel 匯出功能。

## Research Findings

### 1. 既有寄賣單瑕疵欄位實作分析

**Decision**: 完全參照寄賣單的瑕疵欄位實作模式

**現有實作架構**:
- **型別定義** (`types.ts`):
  - `DEFECT_OPTIONS` 常數陣列已定義四種瑕疵選項：
    ```typescript
    export const DEFECT_OPTIONS = [
      { label: "五金生鏽/刮痕/掉", value: "hardwareRustScratchLoss" },
      { label: "皮質磨損/刮痕/壓痕", value: "leatherWearScratchDent" },
      { label: "內裡髒污", value: "liningDirty" },
      { label: "四角磨損", value: "cornerWear" }
    ] as const
    ```
  - `ProductItem` 介面已包含 `defects?: string[]` 屬性
  - `CreateConsignmentProductItemRequest` 已包含 `defects?: string[]`

- **UI 元件** (`ProductItemForm.vue`):
  - 使用 Element Plus `el-checkbox-group` 元件
  - 瑕疵欄位目前有條件顯示：`<template v-if="isConsignment">`
  - 表單資料定義：`defects: (string | number)[]`
  - 提交時轉換為字串陣列：`formData.defects.map(String)`

- **表單處理邏輯** (`useServiceOrderForm.ts`):
  - 寄賣單請求已包含 defects 對應 (line 270)
  - 收購單請求目前**不包含** defects 對應 (line 223-240)

- **顯示邏輯** (`create.vue`, `detail.vue`):
  - 使用 `getDefectLabel()` 函式將代碼轉換為顯示標籤
  - 商品項目清單以 `el-tag` 顯示瑕疵項目
  - 空陣列顯示為 "-"

**Rationale**: 既有寄賣單實作已驗證可行，程式碼結構清晰，型別定義完整。直接沿用可確保 UI/UX 一致性，減少重複工作。

**Alternatives considered**:
- ❌ 重新設計瑕疵欄位的 UI 元件 → 違反需求（完全仿效寄賣單）
- ❌ 建立獨立的收購單瑕疵選項常數 → 增加維護成本，違反 DRY 原則

---

### 2. Element Plus Checkbox 群組最佳實踐

**Decision**: 使用既有的 `el-checkbox-group` + `el-checkbox` 組合模式

**Key Patterns**:
```vue
<el-form-item label="瑕疵處" prop="defects">
  <el-checkbox-group v-model="formData.defects">
    <el-checkbox 
      v-for="option in DEFECT_OPTIONS" 
      :key="option.value" 
      :value="option.value"
    >
      {{ option.label }}
    </el-checkbox>
  </el-checkbox-group>
</el-form-item>
```

**Best Practices Applied**:
- 使用 `v-model` 雙向綁定陣列資料
- 使用 `:value` 綁定選項值（而非 `:label`）
- 每個 checkbox 使用 `option.value` 作為 key
- 顯示文字從 `option.label` 取得

**Performance Considerations**:
- 選項數量少（4 個），無需虛擬滾動或懶加載
- 不需要額外的效能優化

**Rationale**: Element Plus 官方推薦模式，專案內既有使用經驗，無學習成本。

---

### 3. 收購單與寄賣單的型別與 API 差異分析

**Decision**: 擴展收購單 API 請求以支援 defects 欄位

**Current State**:
- `CreateBuybackProductItemRequest` (types.ts):
  ```typescript
  export interface CreateBuybackProductItemRequest {
    sequenceNumber: number
    brandName: string
    styleName?: string
    internalCode?: string
    accessories?: string[]
    // ⚠️ 目前缺少 defects 欄位
  }
  ```

- `CreateConsignmentProductItemRequest` (types.ts):
  ```typescript
  export interface CreateConsignmentProductItemRequest {
    sequenceNumber: number
    brandName: string
    styleName?: string
    internalCode?: string
    accessories?: string[]
    defects?: string[]  // ✅ 寄賣單已有
  }
  ```

**Required Changes**:
1. **型別定義** (`types.ts`):
   - 在 `CreateBuybackProductItemRequest` 新增 `defects?: string[]`
   - 確保與 `ProductItem.defects` 型別一致

2. **API 請求映射** (`useServiceOrderForm.ts`):
   ```typescript
   // 收購單請求需新增 defects 對應
   productItems: productItems.value.map((item, index) => ({
     sequenceNumber: index + 1,
     brandName: item.brandName!,
     styleName: item.style,
     internalCode: item.internalCode,
     grade: item.grade,
     amount: item.amount,
     accessories: item.accessories,
     defects: item.defects  // 新增此行
   }))
   ```

**Rationale**: 後端 API 規範（V3.Admin.Backend.API.yaml）應已支援或需要同步更新以支援收購單的 defects 欄位。前端型別定義需與後端契約保持一致。

---

### 4. 向後相容性處理策略

**Decision**: 空陣列處理，無需資料遷移

**Compatibility Strategy**:
- **既有記錄處理**:
  - 後端 API 回傳的既有收購單若無 defects 欄位，前端自動視為 `undefined` 或 `[]`
  - 顯示邏輯判斷：`!row.defects || row.defects.length === 0` → 顯示 "-"
  
- **型別定義**:
  - `defects?: string[]` 保持選填（optional）
  - 空陣列 `[]` 代表「已確認無瑕疵」
  - `undefined` 代表「未填寫」（既有記錄）
  
- **表單驗證**:
  - 不加入必填驗證（`required: false`）
  - 允許提交空陣列

**Edge Cases**:
- 既有記錄查詢：顯示 "-" 或「無」
- 既有記錄編輯：允許新增瑕疵資訊，儲存後變為已填寫狀態
- Excel 匯出：空陣列或 undefined 顯示為空白或「無」

**Rationale**: 符合規格要求（FR-006-1），避免資料遷移的風險與成本，與既有配件欄位處理邏輯一致。

---

### 5. Excel 匯出功能擴展

**Decision**: 在商品項目列新增「商品瑕疵處」欄位

**Implementation Approach**:
- **欄位位置**: 商品配件欄位後方（建議）或適當位置
- **資料格式**: 使用頓號「、」分隔多個瑕疵項目
  - 範例：`五金生鏽/刮痕/掉、皮質磨損/刮痕/壓痕`
- **空值處理**: 
  - `undefined` 或 `[]` → 顯示空白或「無」
- **代碼轉換**: 
  - 使用 `DEFECT_OPTIONS.find()` 將代碼轉換為顯示標籤
  - 範例：`hardwareRustScratchLoss` → `五金生鏽/刮痕/掉`

**Code Pattern**:
```typescript
// 瑕疵轉換函式（參考 getDefectLabel）
function formatDefectsForExcel(defects?: string[]): string {
  if (!defects || defects.length === 0) return "無"
  return defects
    .map(code => DEFECT_OPTIONS.find(opt => opt.value === code)?.label || code)
    .join("、")
}
```

**Excel Column Structure**:
```
| 品牌名稱 | 款式 | 內碼 | 商品等級 | 商品配件 | 商品瑕疵處 | 金額 |
```

**Rationale**: 與規格要求（FR-008, FR-009）完全一致，符合中文閱讀習慣（頓號分隔）。

---

### 6. 瑕疵代碼與顯示名稱對應機制

**Decision**: 使用固定代碼儲存，前端透過查表轉換顯示

**Code-to-Label Mapping**:
| 代碼 (value) | 顯示名稱 (label) |
|--------------|-----------------|
| `hardwareRustScratchLoss` | 五金生鏽/刮痕/掉 |
| `leatherWearScratchDent` | 皮質磨損/刮痕/壓痕 |
| `liningDirty` | 內裡髒污 |
| `cornerWear` | 四角磨損 |

**Conversion Utilities**:
- **已存在**: `getDefectLabel(value: string)` 在 `create.vue` 和 `detail.vue`
- **可重構**: 考慮抽取為 composable `useDefectOptions.ts` 供多處使用

**Benefits**:
- ✅ 資料穩定性：代碼不變，顯示名稱可調整
- ✅ 國際化擴展性：可輕鬆支援多語系
- ✅ 歷史記錄可讀性：既有記錄仍可正確解析

**Rationale**: 符合規格要求（FR-001-1），與寄賣單實作一致，遵循最佳實踐（資料與顯示分離）。

---

### 7. UI/UX 一致性確保

**Decision**: 完全複用寄賣單的視覺與互動設計

**Consistency Checklist**:
- ✅ 相同的 Checkbox 群組樣式
- ✅ 相同的欄位標籤文字（「商品瑕疵處」）
- ✅ 相同的空值顯示邏輯（"-" 或「無」）
- ✅ 相同的 Tag 顯示風格（商品清單中）
- ✅ 相同的表單驗證規則（非必填）

**User Experience Considerations**:
- 收購單與寄賣單填寫流程保持一致，降低認知負擔
- 選項一次展開可見，無需點擊下拉選單
- 即時反饋：勾選/取消即時更新表單狀態

**Rationale**: 符合憲章原則（V. User Experience First）與規格要求（FR-001-2）。

---

## Implementation Risks & Mitigations

### Risk 1: 後端 API 尚未支援收購單 defects 欄位
**Likelihood**: 中  
**Impact**: 高  
**Mitigation**: 
- 優先確認後端 API 規範（V3.Admin.Backend.API.yaml）
- 與後端團隊同步需求，確保 API 版本一致
- 前端實作時加入錯誤處理，若後端拒絕則顯示明確錯誤訊息

### Risk 2: 既有收購單記錄的 defects 欄位處理
**Likelihood**: 低  
**Impact**: 中  
**Mitigation**:
- 使用 optional chaining 與空值檢查（`row.defects?.length`）
- 單元測試覆蓋空值、undefined、空陣列等情境
- 前端容錯邏輯確保不會因資料格式異常而崩潰

### Risk 3: Excel 匯出瑕疵欄位格式問題
**Likelihood**: 低  
**Impact**: 低  
**Mitigation**:
- 參考既有配件欄位的匯出邏輯
- 測試特殊字元（斜線「/」、頓號「、」）的正確顯示
- 確保 Excel 欄位對齊無誤

---

## Technology Stack Decisions

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| Vue 3 | 3.5+ | 前端框架 | 專案既有技術棧 |
| TypeScript | 4.9+ | 型別安全 | 專案既有技術棧 |
| Element Plus | Latest | UI 元件庫 | Checkbox 群組元件 |
| Composition API | - | 邏輯組織 | 專案統一使用 |
| Vite | 7+ | 構建工具 | 專案既有技術棧 |

**No New Dependencies Required** ✅

---

## Open Questions & Follow-ups

### 需與後端確認
1. ✅ V3.Admin.Backend.API.yaml 是否已包含收購單 defects 欄位規範？
2. ✅ 後端是否需要同步更新以支援該欄位？
3. ✅ 既有收購單記錄在 API 回傳時，defects 欄位格式為何（null / undefined / 不存在）？

### 需與 PM/設計確認
1. ✅ 收購單詳細頁面的瑕疵顯示位置是否與寄賣單一致？
2. ✅ Excel 匯出的欄位順序是否需要特別指定？

---

## References

- Feature Spec: `specs/007-buyback-defect/spec.md`
- 既有寄賣單實作:
  - `src/pages/service-order-management/components/ProductItemForm.vue`
  - `src/pages/service-order-management/composables/useServiceOrderForm.ts`
  - `src/pages/service-order-management/types.ts`
- Element Plus Checkbox 文件: https://element-plus.org/en-US/component/checkbox.html
- Vue 3 Composition API 文件: https://vuejs.org/guide/components/v-model.html

---

**Research Status**: ✅ Complete  
**Ready for Phase 1**: ✅ Yes  
**Blockers**: None
