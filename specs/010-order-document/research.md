# Research: 商品訂購單文件產生

**Feature**: 010-order-document  
**Date**: 2026-02-18  
**Status**: ✅ Complete

## 研究目標

本研究旨在確認技術可行性，並為訂購單文件產生功能制定最佳實作方案，包含：
1. 列印友善的 CSS 樣式設計（A4 格式）
2. ElDialog 預覽與列印整合最佳實踐
3. 訂購單內容排版與格式化策略
4. 動態欄位顯示邏輯（預購 vs 現貨）
5. 自動分頁處理機制

---

## 決策 1：列印友善的 CSS 樣式設計

### 決策內容
採用 CSS `@media print` 規則結合 A4 紙張設定，實現列印友善的訂購單格式。

### 理由
- **標準化格式**：使用 `@page { size: A4 portrait; margin: 15mm; }` 確保跨瀏覽器一致的列印輸出
- **內容完整性**：透過 `break-inside: avoid` 防止商品項目跨頁分割
- **視覺保真**：使用 `print-color-adjust: exact` 保留背景顏色與品牌標的
- **已驗證方案**：ShippingLabelPreview.vue 已成功實現此模式

### 考慮的替代方案
1. **使用第三方 PDF 產生庫（如 jsPDF、pdfmake）**
   - 優點：更精確的排版控制、可在任何時刻產生 PDF
   - 缺點：增加專案複雜度與依賴項，違反憲章「簡化架構」原則，且列印預覽無法即時顯示
   - **拒絕原因**：瀏覽器原生列印功能已足夠滿足需求，無必要引入額外依賴

2. **使用 Canvas 繪製文件**
   - 優點：完全控制像素級排版
   - 缺點：開發成本高、文字選取與無障礙支援差、維護困難
   - **拒絕原因**：過度工程化，且犧牲使用者體驗

### 實作細節
```css
@media print {
  @page {
    size: A4 portrait;
    margin: 15mm;
  }
  
  /* 隱藏非必要元素 */
  .el-dialog__header,
  .el-dialog__footer {
    display: none !important;
  }
  
  /* 確保商品項目不跨頁 */
  .order-item {
    break-inside: avoid;
  }
  
  /* 保留背景顏色 */
  .brand-banner,
  .section-header {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
```

---

## 決策 2：ElDialog 預覽與列印整合

### 決策內容
使用 Element Plus 的 `ElDialog` 元件作為預覽容器，結合瀏覽器原生 `window.print()` 實現列印功能。

### 理由
- **用戶體驗一致性**：與現有出貨單（ShippingLabelPreview）保持相同的互動模式
- **響應式支援**：ElDialog 自動適應桌機與平板裝置
- **零依賴**：無需第三方套件，利用瀏覽器原生能力
- **簡單可靠**：`window.print()` 觸發系統列印對話框，支援實體列印與 PDF 儲存

### 考慮的替代方案
1. **使用獨立的全頁預覽路由**
   - 優點：列印時無需處理 Overlay 樣式隱藏
   - 缺點：打斷使用者流程（需跳轉頁面），增加路由配置複雜度
   - **拒絕原因**：對話框預覽更符合快速檢視與列印的使用情境

2. **使用 Drawer 側邊滑出**
   - 優點：適合行動裝置
   - 缺點：列印預覽顯示空間受限，不適合 A4 文件
   - **拒絕原因**：訂購單為正式文件，需要完整頁面預覽

### 實作細節
```vue
<template>
  <ElDialog
    v-model="visible"
    title="訂購單預覽"
    width="800px"
    :close-on-click-modal="false"
    append-to-body
  >
    <OrderDocumentContent :data="orderData" />
    
    <template #footer>
      <ElButton @click="handleClose">關閉</ElButton>
      <ElButton type="primary" :icon="Printer" @click="handlePrint">
        列印
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
function handlePrint() {
  window.print()
}
</script>
```

**列印樣式特殊處理**（參考 ShippingLabelPreview）：
```css
@media print {
  /* 隱藏所有非訂購單對話框的內容 */
  body > *:not(.el-overlay) {
    display: none !important;
  }
  
  /* 只顯示包含訂購單的 overlay */
  body > .el-overlay:not([style*="display: none"]):has(.order-document-dialog) {
    display: block !important;
    position: static !important;
    background: none !important;
  }
}
```

---

## 決策 3：訂購單內容排版與格式化

### 決策內容
採用「語義化 HTML + CSS Grid/Flexbox」佈局，使用 `ElDescriptions` 元件顯示結構化資訊。

### 理由
- **可維護性**：語義化 HTML 易於理解與修改
- **響應式**：Grid/Flexbox 自動適配不同螢幕尺寸
- **元件複用**：Element Plus 的 `ElDescriptions` 提供開箱即用的描述列表樣式
- **列印友善**：表格與網格佈局在列印時表現穩定

### 內容區塊結構
```
1. 品牌標的（BrandBanner）
2. 訂單基本資訊（訂單編號、日期、客戶姓名、電話、Line ID、銀行帳號末五碼）
3. 商品明細（動態欄位：預購訂單不顯示配件）
4. 付款紀錄（列表，包含日期、金額、方式）
5. 商品預購定金須知（固定法律條款）
```

### 考慮的替代方案
1. **使用純 HTML Table**
   - 優點：最傳統的列印佈局方式
   - 缺點：響應式支援差，行動裝置體驗不佳
   - **拒絕原因**：需支援平板預覽，Table 難以適配

2. **完全自訂 CSS 樣式（不使用 ElDescriptions）**
   - 優點：完全控制細節
   - 缺點：增加開發與維護成本，與專案現有風格不一致
   - **拒絕原因**：Element Plus 元件已滿足需求

### 實作細節
```vue
<template>
  <div class="order-document-content">
    <!-- 品牌標的 -->
    <div class="document-header">
      <BrandBanner />
      <h2 class="document-title">商品訂購單</h2>
    </div>

    <!-- 訂購人資訊 -->
    <ElDescriptions :column="2" border size="small" title="訂購人資訊">
      <ElDescriptionsItem label="姓名">{{ data.customerName }}</ElDescriptionsItem>
      <ElDescriptionsItem label="電話">{{ data.customerPhone }}</ElDescriptionsItem>
      <ElDescriptionsItem label="Line ID">
        {{ data.customerLineId || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="銀行帳號末五碼">
        {{ data.customerBankAccountLast5 || '-' }}
      </ElDescriptionsItem>
    </ElDescriptions>

    <!-- 商品明細 -->
    <div class="items-section">
      <h3 class="section-title">商品明細</h3>
      <div
        v-for="(item, index) in data.orderItems"
        :key="item.id"
        class="order-item"
      >
        <!-- 商品資訊卡片，根據訂單類型動態顯示欄位 -->
      </div>
    </div>

    <!-- 付款紀錄 -->
    <div v-if="data.paymentRecords?.length" class="payment-section">
      <h3 class="section-title">付款紀錄</h3>
      <ElDescriptions
        v-for="(record, index) in data.paymentRecords"
        :key="record.id"
        :column="3"
        border
        size="small"
        :title="`第 ${index + 1} 筆`"
      >
        <ElDescriptionsItem label="付款日期">
          {{ formatDate(record.paymentDate) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="付款金額">
          {{ formatCurrency(record.paymentAmount) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="付款方式">
          {{ PAYMENT_METHOD_LABELS[record.paymentMethod] }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </div>

    <!-- 定金須知 -->
    <div class="terms-section">
      <h3 class="section-title">商品預購定金須知</h3>
      <div class="terms-content">
        <!-- 固定條款內容 -->
      </div>
    </div>
  </div>
</template>
```

---

## 決策 4：動態欄位顯示邏輯（預購 vs 現貨）

### 決策內容
使用 Vue 的 `v-if` 條件渲染，根據 `orderType` 動態控制商品明細的欄位顯示。

### 理由
- **需求明確**：規格要求預購訂單不顯示配件欄位
- **效能最佳**：`v-if` 不渲染不需要的 DOM 節點
- **易於理解**：條件邏輯清晰，維護簡單

### 實作細節
```vue
<template>
  <div class="order-item">
    <div class="item-field">
      <span class="field-label">品牌</span>
      <span class="field-value">{{ item.brandName }}</span>
    </div>
    <div class="item-field">
      <span class="field-label">商品名稱</span>
      <span class="field-value">{{ item.productName }}</span>
    </div>
    <div class="item-field">
      <span class="field-label">款式</span>
      <span class="field-value">{{ item.productStyle }}</span>
    </div>
    
    <!-- 配件欄位僅在現貨訂單顯示 -->
    <div v-if="data.orderType === OrderType.SPOT_PURCHASE" class="item-field">
      <span class="field-label">配件</span>
      <span class="field-value">{{ formatAccessories(item.accessories) }}</span>
    </div>
    
    <div class="item-field">
      <span class="field-label">數量</span>
      <span class="field-value">{{ item.quantity }}</span>
    </div>
    <div class="item-field">
      <span class="field-label">單價</span>
      <span class="field-value">{{ formatCurrency(item.unitPrice) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { OrderType } from '@/pages/order-management/types'

interface Props {
  data: OrderDocumentData
}

const props = defineProps<Props>()
</script>
```

### 考慮的替代方案
1. **使用計算屬性過濾欄位陣列**
   - 優點：更動態、可配置
   - 缺點：增加複雜度，當前需求不需要此彈性
   - **拒絕原因**：只有兩種訂單類型，直接使用 `v-if` 更直觀

---

## 決策 5：自動分頁處理機制

### 決策內容
使用 CSS `break-inside: avoid` 屬性，防止商品項目在列印時跨頁分割，由瀏覽器自動處理分頁。

### 理由
- **原生支援**：現代瀏覽器（Chrome、Firefox、Edge、Safari）皆支援此屬性
- **零邏輯**：無需 JavaScript 計算頁面高度與項目數量
- **可靠**：ShippingLabelPreview 已驗證此方案有效
- **維護簡單**：一行 CSS 即可解決問題

### 實作細節
```css
.order-item {
  break-inside: avoid;
  page-break-inside: avoid; /* 舊版瀏覽器相容 */
}

.terms-section {
  break-inside: avoid;
  page-break-inside: avoid;
}

/* 確保區段標題與內容不分離 */
.section-title {
  break-after: avoid;
  page-break-after: avoid;
}
```

### 考慮的替代方案
1. **手動 JavaScript 計算分頁**
   - 優點：可精確控制每頁內容
   - 缺點：複雜度高、易出錯、難以維護、需處理不同紙張尺寸與邊界
   - **拒絕原因**：過度工程化，CSS 原生方案已足夠

2. **固定每頁顯示項目數量**
   - 優點：簡單直接
   - 缺點：無法適應不同商品項目的高度變化（單行 vs 多行）
   - **拒絕原因**：不靈活，可能造成頁面空白浪費

### 瀏覽器相容性
| 瀏覽器 | 支援版本 | 備註 |
|--------|---------|------|
| Chrome | 50+ | 完全支援 |
| Firefox | 65+ | 完全支援 |
| Safari | 10+ | 完全支援 |
| Edge | 79+ (Chromium) | 完全支援 |

---

## 技術棧選擇總結

| 技術/工具 | 用途 | 選擇理由 |
|-----------|------|----------|
| Vue 3 Composition API | 元件邏輯 | 專案標準，響應式資料管理 |
| TypeScript | 型別安全 | 專案標準，防止型別錯誤 |
| Element Plus | UI 元件 | 專案標準，提供 Dialog、Descriptions 等元件 |
| SCSS | 樣式預處理 | 專案標準，支援變數與巢狀 |
| CSS @media print | 列印樣式 | 原生支援，無需額外依賴 |
| window.print() | 列印功能 | 瀏覽器原生 API，觸發系統列印對話框 |
| break-inside: avoid | 分頁控制 | CSS 原生屬性，防止元素跨頁 |
| BrandBanner 元件 | 品牌標的 | 複用現有元件，保持品牌一致性 |

---

## 風險評估與緩解

### 風險 1：跨瀏覽器列印差異
- **影響**：不同瀏覽器的列印輸出可能有細微差異（字體渲染、邊界計算）
- **機率**：中等
- **緩解措施**：
  1. 使用 Web 安全字型（專案已引入 fonts.css）
  2. 測試主流瀏覽器（Chrome、Edge、Firefox）
  3. 使用明確的尺寸與邊界設定（避免使用相對單位）

### 風險 2：長內容項目跨頁問題
- **影響**：若單一商品項目或法律條款過長，`break-inside: avoid` 可能導致大量空白
- **機率**：低（根據現有資料，商品項目欄位有長度限制）
- **緩解措施**：
  1. 前端驗證欄位長度（業務邏輯層已驗證）
  2. 使用合理的字體大小與行高，確保項目不會過高
  3. 如遇極端情況，可考慮拆分長文字

### 風險 3：ElDialog Overlay 列印干擾
- **影響**：列印時可能誤印其他對話框或頁面元素
- **機率**：低（ShippingLabelPreview 已解決此問題）
- **緩解措施**：
  1. 使用精確的 CSS 選擇器（`:has()` 偽類）只顯示目標對話框
  2. 測試列印預覽，確保只有訂購單內容顯示

---

## 未解決問題

**無** - 所有技術細節皆有明確決策，無阻塞性問題。

---

## 參考資料

1. **MDN - CSS Paged Media**: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_paged_media
2. **MDN - break-inside**: https://developer.mozilla.org/en-US/docs/Web/CSS/break-inside
3. **Element Plus Dialog**: https://element-plus.org/en-US/component/dialog.html
4. **專案現有實作**: `src/pages/order-management/components/ShippingLabelPreview.vue`
5. **專案開發規範**: `.specify/memory/plan-instruction.md`

---

**研究結論**: 所有技術決策皆已確定，無需額外研究或第三方依賴，可直接進入 Phase 1 設計階段。
