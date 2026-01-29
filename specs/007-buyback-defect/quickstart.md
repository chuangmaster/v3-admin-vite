# Quickstart Guide: 收購單瑕疵欄位

**Feature**: 007-buyback-defect  
**Date**: 2026-01-30  
**For**: 開發人員快速上手指南

## 目標

為收購單商品項目新增瑕疵欄位多選功能，完全仿效既有寄賣單的實作。使用 Checkbox 群組呈現四種瑕疵選項，以固定代碼儲存，支援建立、查詢、修改與 Excel 匯出。

---

## Quick Start (5 分鐘快速理解)

### 核心變更

1. **型別定義** (`types.ts`): 在 `CreateBuybackProductItemRequest` 新增 `defects?: string[]`
2. **表單元件** (`ProductItemForm.vue`): 移除 `v-if="isConsignment"` 條件，使收購單也顯示瑕疵欄位
3. **表單邏輯** (`useServiceOrderForm.ts`): 在收購單請求映射中新增 `defects` 欄位
4. **Excel 匯出** (`utils/export-excel.ts`): 新增「商品瑕疵處」欄位

### 參照實作

完全參照既有寄賣單的瑕疵欄位實作，無需重新設計。

---

## Prerequisites

### 開發環境

- Node.js 18+
- pnpm 8+
- Vue 3.5+
- TypeScript 4.9+
- Element Plus (既有依賴)

### 專案設定

```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev

# 執行單元測試
pnpm test
```

### 必讀文件

- 📄 [Feature Spec](spec.md) - 功能規格完整說明
- 📄 [Research](research.md) - 技術研究與決策
- 📄 [Data Model](data-model.md) - 資料模型定義
- 📄 [API Contracts](contracts/api-updates.md) - API 契約變更

---

## Implementation Steps

### Step 1: 更新型別定義 (5 分鐘)

**檔案**: `src/pages/service-order-management/types.ts`

**修改內容**:
```typescript
/** 建立收購單商品項目請求 */
export interface CreateBuybackProductItemRequest {
  sequenceNumber: number
  brandName: string
  styleName?: string
  internalCode?: string
  accessories?: string[]
  defects?: string[]  // ✨ 新增此行，移除註釋中的「僅寄賣單」限制
}
```

**驗證**: 
- ESLint 無錯誤
- TypeScript 編譯正常

---

### Step 2: 更新表單元件 (10 分鐘)

**檔案**: `src/pages/service-order-management/components/ProductItemForm.vue`

**修改內容**:

**Before** (Line 135-145):
```vue
<!-- 寄賣單額外欄位:瑕疵處 -->
<template v-if="isConsignment">
  <el-form-item label="瑕疵處" prop="defects">
    <el-checkbox-group v-model="formData.defects">
      <el-checkbox v-for="option in DEFECT_OPTIONS" :key="option.value" :value="option.value">
        {{ option.label }}
      </el-checkbox>
    </el-checkbox-group>
  </el-form-item>
</template>
```

**After** (移除 `v-if="isConsignment"` 條件):
```vue
<!-- 瑕疵處 (收購單與寄賣單共用) -->
<el-form-item label="瑕疵處" prop="defects">
  <el-checkbox-group v-model="formData.defects">
    <el-checkbox v-for="option in DEFECT_OPTIONS" :key="option.value" :value="option.value">
      {{ option.label }}
    </el-checkbox>
  </el-checkbox-group>
</el-form-item>
```

**同時修改提交邏輯** (Line 120-135):

**Before**:
```typescript
const item: Partial<ProductItem> = {
  brandName: formData.brandName,
  style: formData.style,
  internalCode: formData.internalCode || undefined,
  grade: formData.grade || undefined,
  amount: formData.amount,
  accessories: formData.accessories.length > 0 ? formData.accessories.map(String) : undefined,
  // 瑕疵欄位只有寄賣單才有
  ...(isConsignment.value && {
    defects: formData.defects.length > 0 ? formData.defects.map(String) : undefined
  })
}
```

**After** (移除條件判斷):
```typescript
const item: Partial<ProductItem> = {
  brandName: formData.brandName,
  style: formData.style,
  internalCode: formData.internalCode || undefined,
  grade: formData.grade || undefined,
  amount: formData.amount,
  accessories: formData.accessories.length > 0 ? formData.accessories.map(String) : undefined,
  defects: formData.defects.length > 0 ? formData.defects.map(String) : undefined  // ✨ 收購單與寄賣單共用
}
```

**驗證**:
- 開啟建立收購單頁面，確認瑕疵欄位顯示
- 勾選瑕疵選項，表單資料正確更新

---

### Step 3: 更新 API 請求映射 (5 分鐘)

**檔案**: `src/pages/service-order-management/composables/useServiceOrderForm.ts`

**修改內容** (Line 225-240):

**Before**:
```typescript
if (formData.orderType === ServiceOrderType.BUYBACK) {
  const requestData: CreateBuybackOrderRequest = {
    orderType: formData.orderType!,
    orderSource: formData.orderSource!,
    customerId: formData.customerId!,
    productItems: productItems.value.map((item, index) => ({
      sequenceNumber: index + 1,
      brandName: item.brandName!,
      styleName: item.style,
      internalCode: item.internalCode,
      grade: item.grade,
      amount: item.amount,
      accessories: item.accessories
      // ⚠️ 缺少 defects 欄位
    })),
    totalAmount: formData.totalAmount!,
    // ...
  }
  response = await createBuybackOrder(requestData)
}
```

**After**:
```typescript
if (formData.orderType === ServiceOrderType.BUYBACK) {
  const requestData: CreateBuybackOrderRequest = {
    orderType: formData.orderType!,
    orderSource: formData.orderSource!,
    customerId: formData.customerId!,
    productItems: productItems.value.map((item, index) => ({
      sequenceNumber: index + 1,
      brandName: item.brandName!,
      styleName: item.style,
      internalCode: item.internalCode,
      grade: item.grade,
      amount: item.amount,
      accessories: item.accessories,
      defects: item.defects  // ✨ 新增此行
    })),
    totalAmount: formData.totalAmount!,
    // ...
  }
  response = await createBuybackOrder(requestData)
}
```

**驗證**:
- 提交收購單表單，檢查 Network 請求 payload 包含 `defects` 欄位
- 確認後端 API 接收正常

---

### Step 4: 更新顯示邏輯 (已完成)

**檔案**: `create.vue` 與 `detail.vue`

**說明**: 既有寄賣單的顯示邏輯已包含瑕疵欄位處理，無需修改。系統會自動根據 `orderType` 顯示對應欄位。

**驗證** (Line 580-593 in `detail.vue`):
```vue
<el-descriptions-item label="商品瑕疵處">
  <template v-if="row.defects && row.defects.length > 0">
    <el-tag
      v-for="defect in row.defects"
      :key="defect"
      type="warning"
      style="margin-right: 8px;"
    >
      {{ getDefectLabel(defect) }}
    </el-tag>
  </template>
  <span v-if="!row.defects || row.defects.length === 0">-</span>
</el-descriptions-item>
```

**檢查內容**:
- ✅ 已有 `getDefectLabel()` 函式進行代碼轉換 (Line 407)
- ✅ 空值處理邏輯完整 (`!row.defects || row.defects.length === 0`)
- ✅ Tag 顯示樣式與配件一致

**驗證**:
- 查詢收購單詳細頁面，確認瑕疵資訊正確顯示

---

### Step 5: 擴展 Excel 匯出 (15 分鐘)

**檔案**: `src/pages/service-order-management/utils/export-excel.ts` (或類似檔案)

**新增工具函式**:
```typescript
import { DEFECT_OPTIONS } from "../types"

/**
 * 格式化瑕疵資訊為 Excel 顯示文字
 */
function formatDefectsForExcel(defects?: string[]): string {
  if (!defects || defects.length === 0) return "無"
  
  return defects
    .map(code => DEFECT_OPTIONS.find(opt => opt.value === code)?.label || code)
    .join("、")
}
```

**修改匯出邏輯** (新增欄位):
```typescript
// 範例:假設使用 xlsx 或類似套件
const worksheet = [
  ["服務單號", "客戶姓名", "品牌名稱", "款式", "內碼", "商品配件", "商品瑕疵處", "金額"],  // ✨ 新增「商品瑕疵處」
  ...orders.map(order => [
    order.orderNumber,
    order.customerName,
    order.productItems[0].brandName,
    order.productItems[0].style,
    order.productItems[0].internalCode || "-",
    formatAccessoriesForExcel(order.productItems[0].accessories),
    formatDefectsForExcel(order.productItems[0].defects),  // ✨ 新增此欄
    order.totalAmount
  ])
]
```

**驗證**:
- 匯出 Excel 檔案，確認「商品瑕疵處」欄位存在
- 檢查瑕疵資訊顯示正確（頓號分隔）
- 確認空值顯示為「無」

---

### Step 6: 單元測試 (10 分鐘)

**新增測試檔案**: `tests/pages/service-order-management/utils/defects.test.ts`

```typescript
import { describe, it, expect } from "vitest"
import { DEFECT_OPTIONS } from "@/pages/service-order-management/types"

describe("瑕疵欄位工具函式", () => {
  describe("getDefectLabel", () => {
    it("應正確轉換瑕疵代碼為顯示標籤", () => {
      const getDefectLabel = (code: string) => 
        DEFECT_OPTIONS.find(opt => opt.value === code)?.label || code
      
      expect(getDefectLabel("hardwareRustScratchLoss")).toBe("五金生鏽/刮痕/掉")
      expect(getDefectLabel("leatherWearScratchDent")).toBe("皮質磨損/刮痕/壓痕")
      expect(getDefectLabel("liningDirty")).toBe("內裡髒污")
      expect(getDefectLabel("cornerWear")).toBe("四角磨損")
    })

    it("應處理無效代碼", () => {
      const getDefectLabel = (code: string) => 
        DEFECT_OPTIONS.find(opt => opt.value === code)?.label || code
      
      expect(getDefectLabel("invalidCode")).toBe("invalidCode")
    })
  })

  describe("formatDefectsForExcel", () => {
    const formatDefectsForExcel = (defects?: string[]) => {
      if (!defects || defects.length === 0) return "無"
      return defects.map(code => 
        DEFECT_OPTIONS.find(opt => opt.value === code)?.label || code
      ).join("、")
    }

    it("應正確格式化瑕疵陣列", () => {
      expect(formatDefectsForExcel(["hardwareRustScratchLoss", "liningDirty"]))
        .toBe("五金生鏽/刮痕/掉、內裡髒污")
    })

    it("應處理空陣列", () => {
      expect(formatDefectsForExcel([])).toBe("無")
    })

    it("應處理 undefined", () => {
      expect(formatDefectsForExcel(undefined)).toBe("無")
    })
  })
})
```

**執行測試**:
```bash
pnpm test defects.test.ts
```

---

## Testing Checklist

### 手動測試

- [ ] **建立收購單 - 含瑕疵**
  - 選擇收購單類型
  - 新增商品項目
  - 勾選一個或多個瑕疵選項
  - 提交表單
  - 驗證 API 請求包含 `defects` 欄位
  - 確認後端回應成功

- [ ] **建立收購單 - 無瑕疵**
  - 選擇收購單類型
  - 新增商品項目
  - 不勾選任何瑕疵選項
  - 提交表單
  - 驗證 API 請求 `defects` 為空陣列或 undefined
  - 確認後端回應成功

- [ ] **查詢收購單詳細**
  - 查詢包含瑕疵資訊的收購單
  - 確認瑕疵資訊正確顯示（Tag 形式）
  - 查詢無瑕疵資訊的收購單
  - 確認顯示「-」或「無」

- [ ] **查詢既有收購單（向後相容）**
  - 查詢功能上線前的既有收購單
  - 確認瑕疵欄位顯示「-」或「無」
  - 無錯誤或崩潰

- [ ] **編輯收購單（如支援）**
  - 進入收購單編輯模式
  - 修改瑕疵選項（新增/移除）
  - 提交更新
  - 確認瑕疵資訊正確更新

- [ ] **Excel 匯出**
  - 匯出包含瑕疵資訊的收購單清單
  - 開啟 Excel 檔案
  - 確認「商品瑕疵處」欄位存在
  - 確認瑕疵資訊正確顯示（頓號分隔）
  - 確認無瑕疵記錄顯示「無」或空白

### 自動化測試

- [ ] 單元測試: `pnpm test`
- [ ] ESLint 檢查: `pnpm lint`
- [ ] TypeScript 編譯: `pnpm type-check`
- [ ] 構建測試: `pnpm build`

---

## Troubleshooting

### 問題 1: 瑕疵欄位未顯示

**症狀**: 建立收購單時,瑕疵欄位 Checkbox 群組未顯示

**可能原因**:
- `v-if="isConsignment"` 條件未移除
- 元件未正確匯入 `DEFECT_OPTIONS`

**解決方案**:
1. 檢查 `ProductItemForm.vue` 第 135-145 行
2. 確認移除 `<template v-if="isConsignment">` 包裹
3. 檢查 `import { DEFECT_OPTIONS } from "../types"`

---

### 問題 2: API 請求未包含 defects 欄位

**症狀**: Network 請求 payload 中缺少 `defects` 欄位

**可能原因**:
- `useServiceOrderForm.ts` 的請求映射未更新
- ProductItem 型別定義錯誤

**解決方案**:
1. 檢查 `useServiceOrderForm.ts` 第 225-240 行
2. 確認收購單請求映射包含 `defects: item.defects`
3. 檢查 TypeScript 編譯錯誤

---

### 問題 3: 後端 API 回傳錯誤

**症狀**: 提交表單後收到 400 Bad Request

**可能原因**:
- 後端 API 尚未支援 `defects` 欄位
- 瑕疵代碼不在白名單內
- API 契約版本不一致

**解決方案**:
1. 確認後端 V3.Admin.Backend.API.yaml 已更新
2. 與後端團隊確認 API 版本
3. 檢查錯誤訊息中的具體原因（`response.message`）
4. 參考 [API Contracts](contracts/api-updates.md) 確認契約一致

---

### 問題 4: Excel 匯出瑕疵欄位空白

**症狀**: 匯出的 Excel 檔案中瑕疵欄位為空白

**可能原因**:
- 匯出邏輯未包含 `defects` 欄位
- `formatDefectsForExcel` 函式未正確呼叫

**解決方案**:
1. 檢查 Excel 匯出檔案（`utils/export-excel.ts`）
2. 確認工作表標題列包含「商品瑕疵處」
3. 確認資料列正確呼叫 `formatDefectsForExcel(item.defects)`
4. 測試不同情境（有瑕疵/無瑕疵/undefined）

---

## Performance Considerations

- ✅ 瑕疵欄位資料量極小（最多 4 個選項，每個約 20 字元）
- ✅ 不影響頁面載入時間
- ✅ Checkbox 群組無效能問題（選項少）
- ✅ Excel 匯出新增一個欄位，影響可忽略

---

## Next Steps

完成本功能後,考慮以下後續工作:

1. **監控與反饋**:
   - 觀察使用者使用情況
   - 收集商品瑕疵的統計資料
   - 評估是否需要新增其他瑕疵選項

2. **功能優化**:
   - 考慮瑕疵選項的動態配置
   - 支援自訂瑕疵說明（文字輸入）
   - 瑕疵圖片上傳功能

3. **報表功能**:
   - 瑕疵統計報表
   - 品牌瑕疵分布分析
   - 瑕疵趨勢追蹤

---

## Resources

### 文件連結

- 📄 [Feature Spec](spec.md) - 完整功能規格
- 📄 [Research](research.md) - 技術研究文件
- 📄 [Data Model](data-model.md) - 資料模型定義
- 📄 [API Contracts](contracts/api-updates.md) - API 契約變更
- 📄 [Implementation Plan](plan.md) - 實作計劃
- 📄 [Constitution](.specify/memory/constitution.md) - 專案憲章

### 參考程式碼

- `src/pages/service-order-management/types.ts` - 型別定義
- `src/pages/service-order-management/components/ProductItemForm.vue` - 表單元件
- `src/pages/service-order-management/composables/useServiceOrderForm.ts` - 表單邏輯
- `src/pages/service-order-management/detail.vue` - 詳細頁面
- `src/pages/service-order-management/create.vue` - 建立頁面

### 外部文件

- [Element Plus Checkbox](https://element-plus.org/en-US/component/checkbox.html)
- [Vue 3 Composition API](https://vuejs.org/guide/components/v-model.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Contact & Support

**功能負責人**: [待填寫]  
**技術負責人**: [待填寫]  
**後端協調**: [待填寫]

**問題回報**: 請在專案 Issue Tracker 中建立問題

---

**Quickstart Status**: ✅ Complete  
**Last Updated**: 2026-01-30
