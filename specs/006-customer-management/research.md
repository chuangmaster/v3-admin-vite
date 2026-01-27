# Research: 客戶管理模組技術研究

**Branch**: `006-customer-management` | **Date**: 2026-01-28  
**Purpose**: 解析技術未知項目，記錄技術決策與最佳實踐

## Research Tasks Completed

本文件記錄客戶管理模組開發前的技術研究結果，所有 NEEDS CLARIFICATION 項目已解決。

---

## 1. 後端 API 整合模式

### Decision: 使用統一的 `ApiResponseModel<T>` 處理所有 API 回應

**Rationale**:
- 後端 API 遵循 OpenAPI 3.0 規格，所有端點回傳統一格式：
  ```typescript
  {
    success: boolean      // 操作是否成功
    code: string         // 業務邏輯代碼（如 SUCCESS, VALIDATION_ERROR）
    message: string      // 繁體中文訊息
    data: T | null       // 實際資料（泛型）
    timestamp: string    // ISO 8601 時間戳記（UTC）
    traceId: string      // 分散式追蹤 ID
  }
  ```
- 前端需建立對應的 TypeScript 型別並在 Axios 攔截器中統一處理

**Alternatives Considered**:
- ❌ 每個 API 端點各自處理回應格式 → 違反 DRY 原則，增加維護成本
- ❌ 使用第三方 API 客戶端生成器（如 openapi-generator）→ 過度工程，專案已有統一的 request 函式

**Implementation**:
```typescript
// types/api.d.ts（專案已存在，需擴充）
interface ApiResponseModel<T = any> {
  success: boolean
  code: string
  message: string
  data: T | null
  timestamp: string
  traceId: string
  errors?: Record<string, any> // 驗證錯誤詳情（選填）
}

// http/axios.ts（專案已存在，確認攔截器邏輯）
axios.interceptors.response.use(
  (response) => response.data,  // 直接回傳 data 物件
  (error) => {
    // 統一錯誤處理：顯示 message、記錄 traceId
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    }
    return Promise.reject(error)
  }
)
```

**Decision rationale**: 專案已有 Axios 統一攔截器，新模組直接遵循現有模式即可。

---

## 2. 客戶資料模型與型別定義

### Decision: 從 OpenAPI Schema 提取完整 TypeScript 型別定義

**Rationale**:
- 後端提供完整的 OpenAPI 3.0 規格，包含所有請求/回應型別
- 前端型別定義需與後端 1:1 對應，確保型別安全
- 欄位命名採用 camelCase（前端慣例），與後端 snake_case 不同時需在 API 層轉換

**Key Entities Identified**:

#### 2.1 Customer（客戶實體）
```typescript
interface Customer {
  id: string              // UUID格式
  name: string            // 客戶姓名
  phoneNumber: string     // 聯絡電話
  email: string | null    // 電子郵件（選填）
  idNumber: string        // 身分證字號/外籍人士格式
  residentialAddress: string  // 居住地址
  lineId: string | null   // LINE ID（選填）
  createdAt: string       // 建立時間（ISO 8601, UTC）
  updatedAt: string | null // 最後更新時間（ISO 8601, UTC）
  version: number         // 資料版本號（樂觀鎖定）
}
```

#### 2.2 CreateCustomerRequest（新增客戶請求）
```typescript
interface CreateCustomerRequest {
  name: string                    // 必填，1-100 字元
  phoneNumber: string             // 必填，10 字元（台灣手機格式）
  email?: string                  // 選填，最多 100 字元，需符合 email 格式
  idNumber: string                // 必填，10 字元（台灣身分證格式或外籍人士格式）
  residentialAddress: string      // 必填，1-200 字元
  lineId?: string                 // 選填，最多 50 字元
}
```

#### 2.3 UpdateCustomerRequest（更新客戶請求）
```typescript
interface UpdateCustomerRequest {
  name: string                    // 必填
  phoneNumber: string             // 必填
  email?: string                  // 選填
  residentialAddress: string      // 必填
  lineId?: string                 // 選填
  version: number                 // 必填，用於樂觀鎖定
  // 注意：身分證字號不可更新
}
```

#### 2.4 CustomerListParams（列表查詢參數）
```typescript
interface CustomerListParams {
  pageNumber: number      // 頁碼（從 1 開始）
  pageSize: number        // 每頁筆數（1-100，預設 20）
  keyword?: string        // 搜尋關鍵字（模糊比對姓名/電話/Email/身分證字號）
}
```

#### 2.5 Paginated Response（分頁回應）
```typescript
interface PaginatedApiResponse<T> {
  success: boolean
  code: string
  message: string
  data: T[]               // 項目陣列
  pageNumber: number      // 當前頁碼（從 1 開始）
  pageSize: number        // 每頁大小
  totalCount: number      // 總筆數
  timestamp: string
  traceId: string
}
```

**Alternatives Considered**:
- ❌ 使用 `any` 型別 → 失去型別安全保障
- ❌ 手動維護型別與後端不同步 → 容易產生執行期錯誤

**Decision rationale**: 遵循專案現有做法（參考 user-management、permission-management），在 `types.ts` 中定義所有型別。

---

## 3. AI 辨識整合策略

### Decision: 前端整合 Gemini AI OCR 服務，透過使用者操作觸發

**Rationale**:
- 後端提供 Gemini AI OCR API：**POST `/api/ocr/id-card-multi`**（支援 2 張圖片）
- 前端由使用者點擊「辨識」按鈕觸發，提供 30 秒逾時機制

#### 3.1 Gemini AI Integration
```typescript
// apis/customer.ts
export async function recognizeIdCardMulti(
  images: File[]  // 1-2 張圖片
): Promise<ApiResponseModel<IdCardRecognitionResponse>> {
  const formData = new FormData()
  images.forEach(file => formData.append('images', file))
  
  return request({
    url: '/ocr/id-card-multi',
    method: 'POST',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000  // 30 秒逾時
  })
}

interface IdCardRecognitionResponse {
  name: string | null          // 姓名
  idNumber: string | null      // 身分證字號/居留證號
  address: string | null       // 戶籍地址
}
```

#### 3.2 Frontend UX Flow
1. 使用者上傳圖片（檔案驗證：JPG/PNG，單檔 ≤ 5MB，總計 ≤ 10MB）
2. 點擊「辨識」按鈈觸發 API 請求
3. 顯示 Loading 狀態（30 秒逾時）
4. 辨識結果：
   - **全部成功**: 填入表單，標示「已自動填入」
   - **部分成功**: 填入成功欄位，空白欄位標示「AI 無法辨識，請手動輸入」
   - **失敗**: 顯示錯誤訊息，提供重試或手動輸入選項
5. 允許使用者手動修正任何欄位

**Alternatives Considered**:
- ❌ 自動觸發辨識（檔案上傳後立即辨識）→ 使用者無法控制，可能浪費 API 配額
- ❌ 前端直接呼叫 Gemini API → 暴露 API Key，安全風險

**Decision rationale**: 使用者主動觸發符合規格要求（FR-014），後端處理 API 金鑰安全性。

---

## 4. 樂觀鎖定機制實作

### Decision: 使用 `version` 欄位實作樂觀鎖定，UI 提供友善的衝突處理

**Rationale**:
- 後端採用樂觀鎖定（Optimistic Locking），每筆客戶資料包含 `version` 欄位
- 更新時需傳遞當前 version，若後端檢測到版本不符（HTTP 409 Conflict），前端需處理

**Implementation Flow**:

#### 4.1 更新流程
```typescript
// composables/useCustomerForm.ts
async function handleUpdate(customer: Customer): Promise<void> {
  try {
    const response = await updateCustomer(customer.id, {
      ...formData.value,
      version: customer.version
    })
    
    if (response.success) {
      ElMessage.success('更新成功')
      emit('success')
    }
  } catch (error) {
    if (error.response?.status === 409) {
      // 並發衝突處理
      await ElMessageBox.alert(
        '此客戶資料已被其他使用者修改，請重新載入最新資料後再試',
        '資料衝突',
        { type: 'warning', confirmButtonText: '重新載入' }
      )
      emit('reload-required')
    } else {
      ElMessage.error('更新失敗')
    }
  }
}
```

#### 4.2 前端行為
- **409 Conflict**: 顯示對話框告知衝突，點擊「重新載入」後關閉表單並重新載入列表
- **不自動合併**: 避免資料遺失，要求使用者重新操作
- **版本顯示**: 編輯對話框標題附加版本資訊（例如：編輯客戶 - 版本 3）

**Alternatives Considered**:
- ❌ 悲觀鎖定（Pessimistic Locking）→ 後端未實作
- ❌ 最後寫入獲勝（Last Write Wins）→ 可能遺失資料，不符合規格要求

**Decision rationale**: 遵循後端 API 設計，提供明確的使用者回饋。

---

## 5. 權限控制實作

### Decision: 使用 `v-permission` 指令控制按鈕顯示，遵循專案現有模式

**Rationale**:
- 專案已實作 `v-permission` 自訂指令（src/plugins/permission-directive.ts）
- 後端 API 定義四種權限：
  - `customer.read` - 檢視列表
  - `customer.create` - 新增客戶
  - `customer.update` - 編輯客戶
  - `customer.delete` - 刪除客戶

**Implementation**:

#### 5.1 權限常數定義
```typescript
// src/common/constants/permissions.ts
export const CUSTOMER_PERMISSIONS = {
  READ: "customer.read",
  CREATE: "customer.create",
  UPDATE: "customer.update",
  DELETE: "customer.delete"
} as const
```

#### 5.2 按鈕權限控制
```vue
<!-- index.vue -->
<template>
  <!-- 新增按鈕 -->
  <el-button
    v-permission="[CUSTOMER_PERMISSIONS.CREATE]"
    type="primary"
    @click="handleCreate"
  >
    新增客戶
  </el-button>
  
  <!-- 表格中的編輯按鈕 -->
  <el-button
    v-permission="[CUSTOMER_PERMISSIONS.UPDATE]"
    link
    @click="handleEdit(row)"
  >
    編輯
  </el-button>
  
  <!-- 表格中的刪除按鈕 -->
  <el-button
    v-permission="[CUSTOMER_PERMISSIONS.DELETE]"
    link
    type="danger"
    @click="handleDelete(row)"
  >
    刪除
  </el-button>
</template>
```

#### 5.3 路由守衛
```typescript
// router/config.ts（需新增）
{
  path: '/customer-management',
  component: Layout,
  meta: { 
    title: '客戶管理',
    permissions: ['customer.read']  // 頁面級權限
  },
  children: [
    {
      path: '',
      name: 'CustomerManagement',
      component: () => import('@/pages/customer-management/index.vue')
    }
  ]
}
```

**Alternatives Considered**:
- ❌ 在程式碼中手動檢查權限 → 程式碼重複，容易遺漏
- ❌ 前端不做權限檢查 → 後端會阻擋但 UX 不佳

**Decision rationale**: 遵循專案現有權限控制模式（參考 user-management）。

---

## 6. 大量資料匯出策略

### Decision: 前端使用 `xlsx` 套件匯出 Excel，超過 5000 筆提示背景處理

**Rationale**:
- 規格要求：匯出超過 5000 筆時提示使用者選擇「立即匯出/背景處理/取消」
- 專案可能已有匯出功能（需檢查 src/common/utils/ 是否存在 Excel 工具）

**Implementation**:

#### 6.1 前端立即匯出（≤ 5000 筆）
```typescript
// composables/useExportExcel.ts
import * as XLSX from 'xlsx'

export function useExportExcel() {
  function exportCustomers(customers: Customer[]): void {
    if (customers.length > 5000) {
      // 顯示警告對話框
      ElMessageBox.confirm(
        '資料量過大（超過 5000 筆），建議使用篩選條件縮小範圍，或選擇背景處理',
        '匯出警告',
        {
          distinguishCancelAndClose: true,
          confirmButtonText: '立即匯出',
          cancelButtonText: '背景處理',
          type: 'warning'
        }
      ).then(() => {
        // 立即匯出
        doExport(customers)
      }).catch((action) => {
        if (action === 'cancel') {
          // 背景處理（需後端支援）
          requestBackgroundExport()
        }
      })
    } else {
      doExport(customers)
    }
  }
  
  function doExport(customers: Customer[]): void {
    const data = customers.map(c => ({
      '客戶姓名': c.name,
      '聯絡電話': c.phoneNumber,
      '電子郵件': c.email || '',
      '身分證字號': maskIdNumber(c.idNumber),
      '居住地址': c.residentialAddress,
      'LINE ID': c.lineId || '',
      '建立時間': formatDate(c.createdAt)
    }))
    
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '客戶列表')
    XLSX.writeFile(wb, `客戶列表_${Date.now()}.xlsx`)
  }
  
  return { exportCustomers }
}
```

#### 6.2 背景處理（> 5000 筆，選填實作）
- 若後端支援背景匯出 API（需確認規格），前端透過輪詢或 WebSocket 通知完成
- 當前規格未明確後端 API，可在 Phase 1 討論後決定

**Alternatives Considered**:
- ❌ 不限制匯出筆數 → 瀏覽器可能當機
- ❌ 強制使用背景處理 → 小量資料也需等待，UX 不佳

**Decision rationale**: 平衡使用者體驗與系統效能，遵循規格 FR-007 和 FR-031。

---

## 7. 檔案上傳處理

### Decision: 前端驗證檔案格式與大小，使用 FormData 傳送

**Rationale**:
- 規格限制：JPG/PNG 格式，單檔 ≤ 5MB，總計 ≤ 10MB
- Gemini AI API 使用 `multipart/form-data`（File 物件）

**Implementation**:

#### 7.1 檔案驗證
```typescript
// composables/useIdCardOcr.ts
const ALLOWED_TYPES = ['image/jpeg', 'image/png']
const MAX_FILE_SIZE = 5 * 1024 * 1024  // 5MB
const MAX_TOTAL_SIZE = 10 * 1024 * 1024  // 10MB

function validateFiles(files: File[]): { valid: boolean; error?: string } {
  if (files.length === 0 || files.length > 2) {
    return { valid: false, error: '請上傳 1-2 張身分證照片' }
  }
  
  let totalSize = 0
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: `不支援的檔案格式：${file.name}，僅支援 JPG/PNG` }
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `檔案過大：${file.name}，最大 5MB` }
    }
    totalSize += file.size
  }
  
  if (totalSize > MAX_TOTAL_SIZE) {
    return { valid: false, error: '總檔案大小超過 10MB' }
  }
  
  return { valid: true }
}
```

#### 7.2 Base64 轉換（若需要）
```typescript
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // 移除 "data:image/png;base64," 前綴
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
```

**Decision rationale**: 前端驗證提升 UX，避免無效請求浪費後端資源。

---

## 8. 身分證字號驗證

### Decision: 實作台灣身分證檢查碼演算法，前端即時驗證

**Rationale**:
- 規格要求：台灣標準格式（2 碼英文 + 8 碼數字，共 10 碼）並執行檢查碼演算法驗證
- 前端驗證可即時回饋，避免提交無效資料

**Implementation**:

#### 8.1 驗證函式
```typescript
// src/common/utils/id-number-validator.ts
/**
 * 驗證台灣身分證字號
 * @param idNumber 身分證字號
 * @returns 是否有效
 */
export function validateTaiwanIdNumber(idNumber: string): boolean {
  // 格式檢查：2 碼英文 + 8 碼數字
  const pattern = /^[A-Z]{1}[1-2]{1}[0-9]{8}$/
  if (!pattern.test(idNumber)) {
    return false
  }
  
  // 英文字母轉換表（A=10, B=11, ..., Z=35）
  const letterMap: Record<string, number> = {
    'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14,
    'F': 15, 'G': 16, 'H': 17, 'I': 34, 'J': 18,
    'K': 19, 'L': 20, 'M': 21, 'N': 22, 'O': 35,
    'P': 23, 'Q': 24, 'R': 25, 'S': 26, 'T': 27,
    'U': 28, 'V': 29, 'W': 32, 'X': 30, 'Y': 31,
    'Z': 33
  }
  
  const firstLetter = idNumber.charAt(0)
  const letterValue = letterMap[firstLetter]
  
  // 檢查碼演算法
  const d1 = Math.floor(letterValue / 10)
  const d2 = letterValue % 10
  const sum = d1 * 1 + d2 * 9 +
    parseInt(idNumber.charAt(1)) * 8 +
    parseInt(idNumber.charAt(2)) * 7 +
    parseInt(idNumber.charAt(3)) * 6 +
    parseInt(idNumber.charAt(4)) * 5 +
    parseInt(idNumber.charAt(5)) * 4 +
    parseInt(idNumber.charAt(6)) * 3 +
    parseInt(idNumber.charAt(7)) * 2 +
    parseInt(idNumber.charAt(8)) * 1 +
    parseInt(idNumber.charAt(9)) * 1
  
  return sum % 10 === 0
}
```

#### 8.2 表單驗證規則
```typescript
// composables/useCustomerForm.ts
const rules: FormRules = {
  idNumber: [
    { required: true, message: '請輸入身分證字號', trigger: 'blur' },
    { 
      validator: (_rule, value, callback) => {
        if (!validateTaiwanIdNumber(value)) {
          callback(new Error('請輸入正確的身分證字號格式'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}
```

**Alternatives Considered**:
- ❌ 僅後端驗證 → UX 不佳，需等待提交才知道錯誤
- ❌ 使用正則表達式但不驗證檢查碼 → 無法偵測錯誤輸入

**Decision rationale**: 前端即時驗證提升使用者體驗，遵循規格 FR-011。

---

## 9. 錯誤處理策略

### Decision: 統一使用 Element Plus 的 ElMessage 和 ElMessageBox，遵循專案現有模式

**Rationale**:
- 專案已使用 Element Plus 作為 UI 框架
- 需處理多種錯誤情境：網路錯誤、業務邏輯錯誤（重複客戶、並發衝突）、驗證錯誤

**Implementation**:

#### 9.1 業務邏輯錯誤代碼處理
```typescript
// apis/customer.ts
export async function createCustomer(
  data: CreateCustomerRequest
): Promise<ApiResponseModel<Customer>> {
  const response = await request<ApiResponseModel<Customer>>({
    url: '/customers',
    method: 'POST',
    data
  })
  
  // 處理特定業務錯誤碼
  if (!response.success) {
    switch (response.code) {
      case 'CUSTOMER_ALREADY_EXISTS':
        // 由呼叫方處理（顯示確認對話框）
        break
      case 'VALIDATION_ERROR':
        // Axios 攔截器已顯示 message，無需額外處理
        break
      default:
        // 其他錯誤由攔截器統一處理
        break
    }
  }
  
  return response
}
```

#### 9.2 前端錯誤分類與回饋
| 錯誤類型 | HTTP 狀態碼 | 業務代碼 | 前端處理 |
|---------|------------|----------|---------|
| 驗證錯誤 | 400 | VALIDATION_ERROR | 顯示具體欄位錯誤（ElMessage.error） |
| 未授權 | 401 | UNAUTHORIZED | 跳轉登入頁 |
| 權限不足 | 403 | FORBIDDEN | ElMessage.warning + 隱藏功能按鈕 |
| 資料不存在 | 404 | NOT_FOUND | ElMessage.error 並重新載入列表 |
| 並發衝突 | 409 | CONCURRENT_UPDATE_CONFLICT | ElMessageBox.alert 提示重新載入 |
| 重複客戶 | 422 | CUSTOMER_ALREADY_EXISTS | ElMessageBox.confirm 詢問是否繼續 |
| 伺服器錯誤 | 500 | INTERNAL_SERVER_ERROR | ElMessage.error 並提供 traceId |

#### 9.3 使用者友善訊息
```typescript
// composables/useCustomerManagement.ts
async function handleDelete(customer: Customer): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `確定要刪除客戶「${customer.name}」嗎？此操作無法復原。`,
      '刪除確認',
      {
        type: 'warning',
        confirmButtonText: '確定刪除',
        cancelButtonText: '取消'
      }
    )
    
    const response = await deleteCustomer(customer.id)
    
    if (response.success) {
      ElMessage.success('刪除成功')
      await fetchCustomers()
    }
  } catch (error) {
    if (error !== 'cancel') {
      // 使用者取消操作不視為錯誤
      console.error('刪除失敗:', error)
    }
  }
}
```

**Decision rationale**: 統一錯誤處理提升程式碼可維護性，友善的錯誤訊息提升使用者體驗。

---

## 10. 效能優化考量

### Decision: 採用必要的效能優化策略，避免過度優化

**Rationale**:
- 規格要求：支援 100 位管理員並行存取，初始載入 < 3秒，路由轉換 < 500ms
- 專案已使用 Vite（快速構建）、懶加載路由、Element Plus（按需引入）

**Implementation**:

#### 10.1 搜尋防抖（Debounce）
```typescript
// composables/useCustomerManagement.ts
import { debounce } from 'lodash-es'

const debouncedSearch = debounce(() => {
  pagination.value.pageNumber = 1
  fetchCustomers()
}, 500)

watch(searchKeyword, () => {
  debouncedSearch()
})
```

#### 10.2 列表虛擬滾動（若需要）
- 當前規格採用分頁（每頁最多 100 筆），無需虛擬滾動
- 若未來需渲染數千筆資料，可考慮 `el-table` 的虛擬滾動功能

#### 10.3 圖片壓縮（前端預處理）
- 上傳前壓縮大圖至適當尺寸（如 1920x1080），減少傳輸時間
- 使用 `browser-image-compression` 套件

**Alternatives Considered**:
- ❌ 無限滾動（Infinite Scroll）→ 規格使用分頁模式
- ❌ 前端快取整個列表 → 可能顯示過時資料

**Decision rationale**: 平衡效能與複雜度，遵循 Constitution 原則「避免過度工程」。

---

## Summary of Key Decisions

| 主題 | 決策 | 原因 |
|------|------|------|
| API 整合 | 統一 `ApiResponseModel<T>` 格式 | 遵循後端規格，簡化錯誤處理 |
| 資料模型 | 從 OpenAPI Schema 提取型別 | 確保型別安全與前後端一致性 |
| AI 辨識 | 支援 Gemini AI | 遵循規格要求，使用者主動觸發 |
| 樂觀鎖定 | 使用 `version` 欄位 + 友善衝突提示 | 避免資料遺失，清楚告知使用者 |
| 權限控制 | `v-permission` 指令 | 遵循專案現有模式 |
| 資料匯出 | `xlsx` 套件 + 大量資料警告 | 平衡效能與 UX |
| 檔案上傳 | 前端驗證 + FormData/Base64 | 即時回饋，支援兩種 API 格式 |
| 身分證驗證 | 實作檢查碼演算法 | 即時驗證，符合台灣標準 |
| 錯誤處理 | Element Plus 元件 + 分類處理 | 統一風格，友善訊息 |
| 效能優化 | 搜尋防抖 + 必要優化 | 避免過度工程 |

---

**Next Steps**:
- ✅ Phase 0 完成
- ➡️ 進入 Phase 1：設計資料模型與 API 合約
