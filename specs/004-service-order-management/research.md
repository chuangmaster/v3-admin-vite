# Research: 服務單管理技術研究

**Date**: 2025-12-14  
**Feature**: 服務單管理（寄賣單與收購單）  
**Purpose**: 解決技術實作中的不明確項目，研究最佳實踐與技術選型

## 研究主題

### 1. 後端 API 契約定義

#### 決策
目前專案尚未有服務單相關的後端 API 規格，需要在前端開發過程中定義清楚的 API 契約，確保前後端分離開發時的一致性。

#### 理由
- 遵循憲章原則 VII（Backend API Contract Compliance）
- 提前定義契約可避免前後端整合時的錯誤
- 使用 OpenAPI 3.0 格式定義，便於文件化與工具整合

#### 替代方案
- **方案 A**：等待後端提供 API 規格後才開始前端開發
  - **拒絕原因**：會延遲開發進度，無法並行作業
- **方案 B**：前端直接實作，不定義契約
  - **拒絕原因**：違反憲章原則，易造成整合問題

---

### 2. 身分證自動辨識技術

#### 決策
採用第三方 OCR 服務（如 Google Cloud Vision API、Azure Computer Vision 或開源的 Tesseract.js）進行身分證文字辨識。

#### 理由
- **準確率需求**：目標達到 85% 以上準確率（規格 SC-002）
- **成本考量**：優先選擇具有免費額度的雲端服務或開源方案
- **實作簡易性**：避免自建 OCR 模型，降低複雜度
- **隱私考量**：需確保身分證圖片不會永久儲存於第三方服務

#### 技術選項比較

| 方案 | 優點 | 缺點 | 推薦度 |
|------|------|------|--------|
| **Google Cloud Vision API** | 準確率高、支援繁體中文、API 簡單 | 需付費（超過免費額度）、依賴外部服務 | ⭐⭐⭐⭐ |
| **Azure Computer Vision** | 準確率高、整合 Azure 生態系 | 需付費、需 Azure 帳號 | ⭐⭐⭐ |
| **Tesseract.js** | 開源免費、可離線執行、隱私性佳 | 準確率較低、需訓練資料 | ⭐⭐⭐⭐⭐ |
| **自建 OCR 模型** | 客製化程度高 | 開發成本極高、維護困難 | ⭐ |

#### 最終選擇
**Tesseract.js** + **預處理優化**

**實作策略**：
1. 前端上傳圖片前進行預處理（灰階化、對比增強、去噪）
2. 使用 Tesseract.js 進行文字辨識
3. 使用正則表達式解析辨識結果（姓名、身分證字號等）
4. 若準確率不足，提供手動修正與訓練資料回饋機制

**替代方案**：
- 若 Tesseract.js 準確率無法達標，備案為整合 Google Cloud Vision API（需評估成本）

---

### 3. 線上簽名整合（Dropbox Sign API）

#### 決策
使用 Dropbox Sign（前身為 HelloSign）API 進行線上簽名流程整合。

#### 理由
- **規格需求**：FR-008、FR-019 明確要求使用 Dropbox Sign API
- **功能完整**：支援 Email 簽名邀請、簽名狀態追蹤、文件下載
- **開發友善**：提供完整的 REST API 與 SDK

#### 實作重點
1. **API 整合流程**：
   - 前端提交服務單後，後端呼叫 Dropbox Sign API 建立簽名請求
   - Dropbox Sign 寄送簽名邀請至客戶 Email
   - 客戶完成簽名後，Dropbox Sign 透過 Webhook 通知後端
   - 後端更新服務單簽名狀態
2. **前端職責**：
   - 提供「複製簽名連結」功能（FR-034）
   - 提供「重新寄送簽名邀請」功能（FR-035）
   - 顯示簽名狀態（待簽名、已簽名、已拒絕等）
3. **錯誤處理**：
   - 檢測 Email 無效或寄送失敗（邊界案例）
   - 提示店員改用線下簽名

#### 相關資源
- [Dropbox Sign API 文件](https://developers.hellosign.com/)
- Webhook 事件：`signature_request_signed`, `signature_request_declined`

---

### 4. 觸控簽名功能實作

#### 決策
使用開源套件 **signature_pad**（或 Vue 包裝版本 `vue-signature-pad`）實作網頁觸控簽名功能。

#### 理由
- **跨平台支援**：支援滑鼠、觸控筆、手指操作（FR-007、FR-018）
- **輕量化**：純前端實作，無需額外後端支援
- **成熟穩定**：GitHub 星數 3k+，廣泛使用
- **易於整合**：提供簡單的 API（清除、匯出 PNG/SVG）

#### 實作重點
1. **簽名板元件**（`SignaturePad.vue`）：
   - 使用 HTML5 Canvas
   - 支援觸控與滑鼠事件
   - 提供「清除」與「確認」按鈕
   - 匯出簽名為 Base64 PNG 圖片
2. **簽名即時儲存**（FR-007）：
   - 每次簽名完成後立即上傳至後端
   - 後端儲存簽名圖片並關聯至服務單
3. **多文件簽名**：
   - 收購單需簽署兩份文件（收購合約、一時貿易申請書）
   - 寄賣單需簽署一份文件（寄賣合約書）
   - 每份文件獨立簽名並儲存

#### 相關資源
- [signature_pad GitHub](https://github.com/szimek/signature_pad)
- [vue-signature-pad (若使用)](https://www.npmjs.com/package/vue-signature-pad)

---

### 5. Excel 匯出功能

#### 決策
使用 **SheetJS (xlsx)** 套件實作前端 Excel 匯出功能。

#### 理由
- **功能完整**：支援多種格式（.xlsx, .csv 等）
- **前端執行**：無需後端支援，降低伺服器負載
- **輕量化**：僅引入匯出功能所需的模組
- **專案既有實作**：參考 `user-management` 模組的 `useExportExcel.ts`

#### 實作重點（參考既有模組）
1. **組合式函式**：`useExportExcel.ts`
2. **匯出欄位**（FR-037）：
   - 服務單編號、客戶名稱、品牌名稱、款式、內碼、商品數量、金額、狀態、建立日期
3. **檔案命名**（FR-038）：
   - 格式：`服務單報表_YYYYMMDD_HHMMSS.xlsx`
4. **資料來源**：
   - 匯出當前畫面顯示的查詢結果（FR-036）
   - 若資料量過大（> 10,000 筆），提示縮小範圍（邊界案例）

#### 相關資源
- [SheetJS 官方文件](https://docs.sheetjs.com/)
- 參考檔案：`src/pages/user-management/composables/useExportExcel.ts`

---

### 6. 檔案上傳與拍照功能

#### 決策
使用 Element Plus 的 **el-upload** 元件 + HTML5 **File Input** 的 `capture` 屬性實作。

#### 理由
- **既有技術**：專案已使用 Element Plus，無需引入額外套件
- **拍照支援**：HTML5 `<input type="file" capture="environment">` 可直接啟動裝置相機
- **檔案驗證**：Element Plus 提供檔案類型、大小驗證
- **預覽功能**：支援圖片預覽

#### 實作重點
1. **上傳元件**（`IDCardUpload.vue`）：
   - 支援點擊上傳與拖曳上傳
   - 支援相機拍照（行動裝置）
   - 限制檔案類型：`image/jpeg, image/png`（FR-003）
   - 限制檔案大小：10MB（Constraints）
2. **自動辨識按鈕**（⚡️ 圖示）：
   - 上傳後顯示辨識按鈕
   - 點擊後呼叫 OCR 服務（Tesseract.js）
   - 辨識結果自動填入表單（FR-005）
   - 若已選擇客戶，比對資料一致性（FR-006）
3. **錯誤處理**：
   - 檔案格式不符：提示正確格式（邊界案例）
   - 辨識失敗：提示重新拍攝或手動輸入（邊界案例）

---

### 7. 表單草稿儲存（離線支援）

#### 決策
使用 **LocalStorage** 實作表單草稿自動儲存功能。

#### 理由
- **使用者體驗**：避免店員中途離開導致資料遺失（邊界案例）
- **簡單實作**：無需後端支援
- **即時儲存**：使用 `watch` 監聽表單變更，debounce 後自動儲存

#### 實作重點
1. **自動儲存邏輯**：
   - 表單變更後 2 秒自動儲存至 LocalStorage
   - Key 格式：`service-order-draft-{timestamp}`
2. **草稿恢復**：
   - 進入建立頁面時檢查是否有未完成草稿
   - 若有，提示「是否恢復上次未完成的表單？」
3. **草稿清理**：
   - 提交成功後清除草稿
   - 草稿超過 7 天自動清理

---

### 8. 服務單狀態管理

#### 決策
定義清楚的狀態轉換規則與前端驗證邏輯。

#### 理由
- **業務規則**（FR-032）：
  - 「待處理」→「已完成」或「已終止」
  - 「已完成」→「待處理」
  - 「已終止」為終態，不可逆
- **前端驗證**：避免無效的狀態轉換請求
- **使用者體驗**：根據當前狀態動態顯示可用操作

#### 實作重點
1. **狀態列舉**：
```typescript
enum ServiceOrderStatus {
  PENDING = "pending",      // 待處理
  COMPLETED = "completed",  // 已完成
  TERMINATED = "terminated" // 已終止
}
```
2. **狀態轉換驗證函式**：
```typescript
function canTransitionTo(
  currentStatus: ServiceOrderStatus, 
  targetStatus: ServiceOrderStatus
): boolean {
  const transitions = {
    [ServiceOrderStatus.PENDING]: [ServiceOrderStatus.COMPLETED, ServiceOrderStatus.TERMINATED],
    [ServiceOrderStatus.COMPLETED]: [ServiceOrderStatus.PENDING],
    [ServiceOrderStatus.TERMINATED]: [] // 終態
  }
  return transitions[currentStatus]?.includes(targetStatus) ?? false
}
```
3. **UI 呈現**：
   - 根據當前狀態顯示可用的狀態選項
   - 嘗試無效轉換時顯示錯誤提示（邊界案例）

---

### 9. 分頁與大量資料處理

#### 決策
採用**後端分頁 + 前端虛擬滾動**（若需要）策略。

#### 理由
- **效能需求**：服務單資料量可能達 50,000+ 筆
- **查詢效能**：SC-004 要求 2 秒內返回結果
- **使用者體驗**：避免載入過多資料造成卡頓

#### 實作重點
1. **後端分頁**：
   - 參數：`pageNumber`（從 1 開始）、`pageSize`（預設 20）
   - 回應：包含 `items`、`totalRecords`、`totalPages`
2. **前端分頁元件**：
   - 使用 Element Plus 的 `el-pagination`
   - 設定 `@current-change` 和 `@size-change` 事件
3. **匯出限制**：
   - 單次最多匯出 10,000 筆（邊界案例）
   - 超過時提示「請縮小篩選範圍」

---

### 10. 權限控制整合

#### 決策
遵循既有權限系統，新增服務單相關權限常數。

#### 理由
- **一致性**：與 user-management、permission-management 模組一致
- **細粒度控制**：支援頁面級與按鈕級權限

#### 實作重點
1. **權限常數定義**（`src/common/constants/permissions.ts`）：
```typescript
export const SERVICE_ORDER_PERMISSIONS = {
  // 寄賣單權限
  INBOUND_ORDER_READ: "inboundOrder.read",
  INBOUND_ORDER_CREATE: "inboundOrder.create",
  INBOUND_ORDER_UPDATE: "inboundOrder.update",
  INBOUND_ORDER_DELETE: "inboundOrder.delete",
  // 收購單權限
  BUYBACK_ORDER_READ: "buybackOrder.read",
  BUYBACK_ORDER_CREATE: "buybackOrder.create",
  BUYBACK_ORDER_UPDATE: "buybackOrder.update",
  BUYBACK_ORDER_DELETE: "buybackOrder.delete"
} as const
```
2. **使用 v-permission 指令**：
```vue
<el-button
  v-permission="[SERVICE_ORDER_PERMISSIONS.INBOUND_ORDER_CREATE]"
  type="primary"
  @click="handleCreate"
>
  新增寄賣單
</el-button>
```

---

## 技術風險與緩解策略

| 風險 | 影響 | 機率 | 緩解策略 |
|------|------|------|----------|
| OCR 準確率不足 | 使用者體驗差，需大量手動修正 | 中 | 提供手動修正功能、優化圖片預處理、備案使用雲端 OCR |
| Dropbox Sign API 不穩定 | 線上簽名功能失效 | 低 | 提供線下簽名替代方案、實作重試機制 |
| 大量資料查詢效能問題 | 查詢速度慢於 2 秒 | 中 | 後端索引優化、前端分頁、限制查詢範圍 |
| 觸控簽名在特定裝置失效 | 線下簽名功能無法使用 | 低 | 裝置相容性測試、提供降級方案（鍵盤輸入） |
| 檔案上傳失敗（網路不穩） | 服務單建立失敗 | 中 | 實作重試機制、提示使用者檢查網路 |

---

## 參考資源

### 專案內部
- `src/pages/user-management/` - 參考既有模組架構
- `src/common/constants/permissions.ts` - 權限定義範例
- `.specify/memory/plan-instruction.md` - 開發規範

### 外部技術文件
- [Tesseract.js 官方文件](https://tesseract.projectnaptha.com/)
- [Dropbox Sign API](https://developers.hellosign.com/)
- [signature_pad](https://github.com/szimek/signature_pad)
- [SheetJS (xlsx)](https://docs.sheetjs.com/)
- [Element Plus Upload](https://element-plus.org/zh-CN/component/upload.html)

---

## 結論

所有技術不明確項目已完成研究，主要決策如下：

1. ✅ **後端 API 契約**：Phase 1 定義 OpenAPI 規格
2. ✅ **OCR 技術**：Tesseract.js（備案：Google Cloud Vision）
3. ✅ **線上簽名**：Dropbox Sign API
4. ✅ **觸控簽名**：signature_pad
5. ✅ **Excel 匯出**：SheetJS（參考既有實作）
6. ✅ **檔案上傳**：Element Plus el-upload + HTML5 capture
7. ✅ **草稿儲存**：LocalStorage
8. ✅ **狀態管理**：明確定義狀態轉換規則
9. ✅ **分頁策略**：後端分頁 + 限制匯出數量
10. ✅ **權限控制**：整合既有系統，新增權限常數

**無需進一步澄清的項目**，可進入 Phase 1 設計階段。
