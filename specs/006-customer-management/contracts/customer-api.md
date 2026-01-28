# API Contracts: 客戶管理模組

**Branch**: `006-customer-management` | **Date**: 2026-01-28  
**Backend API Version**: OpenAPI 3.0  
**Base URL**: `/api`

---

## Authentication

所有 API 端點均需 JWT Bearer Token 驗證：

```http
Authorization: Bearer <token>
```

### 權限對照表

| 操作 | 權限代碼 | 說明 |
|------|---------|------|
| 查詢客戶列表 | `customer.read` | 讀取客戶資料 |
| 新增客戶 | `customer.create` | 建立新客戶 |
| 更新客戶 | `customer.update` | 修改客戶資料 |
| 刪除客戶 | `customer.delete` | 軟刪除客戶 |

### 權限驗證流程

**前端（UI 控制）**:
- 使用 `v-permission` 指令檢查權限並控制按鈕/功能顯示
- 範例: `<el-button v-permission="CUSTOMER_PERMISSIONS.CREATE">新增客戶</el-button>`
- 目的: 提升使用者體驗，隱藏無權限功能

**後端（強制執行）**:
- 每個 API 端點驗證 JWT Token 中的權限宣告
- 無權限時回傳 `403 Forbidden` 與錯誤訊息
- 目的: 確保資料安全，防止繞過前端檢查

**錯誤處理**:
```json
{
  "success": false,
  "message": "您沒有權限執行此操作",
  "data": null,
  "traceId": "trace-xyz-123",
  "code": 403
}
```

前端收到 403 錯誤時應:
1. 顯示 `ElMessage.warning(response.message)`
2. 不重試請求（權限不足無法透過重試解決）
3. 記錄錯誤日誌（console.warn + traceId）

---

## Response Format

所有 API 回應皆遵循統一格式 `ApiResponseModel<T>`：

```typescript
interface ApiResponseModel<T> {
  /** 操作是否成功 */
  success: boolean
  
  /** 回應訊息（通常於失敗時提供） */
  message: string | null
  
  /** 業務資料（成功時提供） */
  data: T | null
  
  /** 總筆數（僅於分頁查詢時提供） */
  totalCount: number
  
  /** 追蹤 ID（用於錯誤追蹤） */
  traceId: string | null
  
  /** 業務處理代碼（200: 成功，4xx/5xx: 錯誤） */
  code: number
}
```

---

## Endpoint 1: 查詢客戶列表

### 基本資訊

```http
GET /api/customers/search
```

**權限**: `customer.read`

### Request Parameters

| 參數 | 類型 | 必填 | 說明 | 範例 |
|------|------|------|------|------|
| `pageNumber` | integer | ✅ | 頁碼（從 1 開始） | `1` |
| `pageSize` | integer | ✅ | 每頁筆數（1-100） | `20` |
| `keyword` | string | ❌ | 搜尋關鍵字（模糊比對姓名/電話/Email/身分證字號） | `王小明` |

### Request Example

```http
GET /api/customers/search?pageNumber=1&pageSize=20&keyword=王小明
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response 200 OK

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "王小明",
      "phoneNumber": "0912345678",
      "email": "wang@example.com",
      "idNumber": "A123456789",
      "residentialAddress": "台北市信義區信義路五段7號",
      "lineId": "wangxiaoming",
      "createdAt": "2026-01-15T08:30:00Z",
      "updatedAt": "2026-01-20T10:15:00Z",
      "version": 2
    }
  ],
  "totalCount": 156,
  "traceId": null,
  "code": 200
}
```

### Error Responses

| HTTP Status | Code | Message | 說明 |
|-------------|------|---------|------|
| 400 | 400 | "Invalid pagination parameters" | 分頁參數錯誤（pageSize > 100） |
| 401 | 401 | "Unauthorized" | Token 無效或過期 |
| 403 | 403 | "Forbidden" | 無 `customer.read` 權限 |
| 500 | 500 | "Internal server error" | 伺服器內部錯誤 |

---

## Endpoint 2: 新增客戶

### 基本資訊

```http
POST /api/customers
```

**權限**: `customer.create`

### Request Body

```json
{
  "name": "王小明",
  "phoneNumber": "0912345678",
  "email": "wang@example.com",
  "idNumber": "A123456789",
  "residentialAddress": "台北市信義區信義路五段7號",
  "lineId": "wangxiaoming"
}
```

### Field Validation

| 欄位 | 類型 | 必填 | 驗證規則 |
|------|------|------|---------|
| `name` | string | ✅ | 1-100 字元 |
| `phoneNumber` | string | ✅ | 10 字元，格式：`09\d{8}` |
| `email` | string | ❌ | Email 格式，最多 100 字元 |
| `idNumber` | string | ✅ | 10 字元，台灣身分證格式 + 檢查碼驗證 |
| `residentialAddress` | string | ✅ | 1-200 字元 |
| `lineId` | string | ❌ | 最多 50 字元 |

### Response 201 Created

```json
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "王小明",
    "phoneNumber": "0912345678",
    "email": "wang@example.com",
    "idNumber": "A123456789",
    "residentialAddress": "台北市信義區信義路五段7號",
    "lineId": "wangxiaoming",
    "createdAt": "2026-01-28T03:15:00Z",
    "updatedAt": null,
    "version": 1
  },
  "totalCount": 0,
  "traceId": "abc123-def456",
  "code": 201
}
```

### Error Responses

| HTTP Status | Code | Message | 說明 |
|-------------|------|---------|------|
| 400 | 400 | "Invalid input data" | 欄位驗證失敗（格式錯誤、長度超過限制） |
| 401 | 401 | "Unauthorized" | Token 無效或過期 |
| 403 | 403 | "Forbidden" | 無 `customer.create` 權限 |
| 422 | 422 | "ID number already exists" | 身分證字號重複 |
| 500 | 500 | "Internal server error" | 伺服器內部錯誤 |

### Business Rules

- **身分證字號唯一性**: 若 `idNumber` 已存在，回應 HTTP 422
- **Email 唯一性**: 不強制唯一（同一人可能有多筆記錄）
- **電話號碼**: 不強制唯一（共用電話情境）

---

## Endpoint 3: 取得單一客戶

### 基本資訊

```http
GET /api/customers/{id}
```

**權限**: `customer.read`

### Path Parameters

| 參數 | 類型 | 說明 | 範例 |
|------|------|------|------|
| `id` | UUID | 客戶唯一識別碼 | `3fa85f64-5717-4562-b3fc-2c963f66afa6` |

### Request Example

```http
GET /api/customers/3fa85f64-5717-4562-b3fc-2c963f66afa6
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response 200 OK

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "王小明",
    "phoneNumber": "0912345678",
    "email": "wang@example.com",
    "idNumber": "A123456789",
    "residentialAddress": "台北市信義區信義路五段7號",
    "lineId": "wangxiaoming",
    "createdAt": "2026-01-15T08:30:00Z",
    "updatedAt": "2026-01-20T10:15:00Z",
    "version": 2
  },
  "totalCount": 0,
  "traceId": null,
  "code": 200
}
```

### Error Responses

| HTTP Status | Code | Message | 說明 |
|-------------|------|---------|------|
| 401 | 401 | "Unauthorized" | Token 無效或過期 |
| 403 | 403 | "Forbidden" | 無 `customer.read` 權限 |
| 404 | 404 | "Customer not found" | 客戶不存在或已刪除 |
| 500 | 500 | "Internal server error" | 伺服器內部錯誤 |

---

## Endpoint 4: 更新客戶

### 基本資訊

```http
PUT /api/customers/{id}
```

**權限**: `customer.update`

### Path Parameters

| 參數 | 類型 | 說明 |
|------|------|------|
| `id` | UUID | 客戶唯一識別碼 |

### Request Body

```json
{
  "name": "王小明（已修改）",
  "phoneNumber": "0987654321",
  "email": "wang_new@example.com",
  "residentialAddress": "台北市大安區敦化南路二段100號",
  "lineId": "wang_new_line",
  "version": 2
}
```

### Field Validation

| 欄位 | 類型 | 必填 | 驗證規則 | 備註 |
|------|------|------|---------|------|
| `name` | string | ✅ | 1-100 字元 | 可更新 |
| `phoneNumber` | string | ✅ | 10 字元 | 可更新 |
| `email` | string | ❌ | Email 格式 | 可更新 |
| `residentialAddress` | string | ✅ | 1-200 字元 | 可更新 |
| `lineId` | string | ❌ | 最多 50 字元 | 可更新 |
| `version` | integer | ✅ | ≥ 1 | **不可更新（用於樂觀鎖定）** |

**重要**: `idNumber` 不可更新（不包含在 Request Body 中）

### Response 200 OK

```json
{
  "success": true,
  "message": "Customer updated successfully",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "王小明（已修改）",
    "phoneNumber": "0987654321",
    "email": "wang_new@example.com",
    "idNumber": "A123456789",
    "residentialAddress": "台北市大安區敦化南路二段100號",
    "lineId": "wang_new_line",
    "createdAt": "2026-01-15T08:30:00Z",
    "updatedAt": "2026-01-28T05:20:00Z",
    "version": 3
  },
  "totalCount": 0,
  "traceId": "xyz789-uvw012",
  "code": 200
}
```

**注意**: `version` 自動遞增為 `3`

### Error Responses

| HTTP Status | Code | Message | 說明 |
|-------------|------|---------|------|
| 400 | 400 | "Invalid input data" | 欄位驗證失敗 |
| 401 | 401 | "Unauthorized" | Token 無效或過期 |
| 403 | 403 | "Forbidden" | 無 `customer.update` 權限 |
| 404 | 404 | "Customer not found" | 客戶不存在 |
| 409 | 409 | "Conflict: resource version mismatch" | **並發衝突（版本號不符）** |
| 500 | 500 | "Internal server error" | 伺服器內部錯誤 |

### Optimistic Locking Flow

```text
1. 前端取得客戶資料（version = 2）
2. 使用者修改欄位
3. 前端發送 PUT 請求，包含 version = 2
4. 後端檢查資料庫：
   - 若當前 version = 2 → 更新成功，version 遞增為 3
   - 若當前 version ≠ 2 → 回應 HTTP 409 Conflict
5. 前端處理 409 錯誤：
   - 顯示提示：「此客戶資料已被其他使用者修改，請重新載入」
   - 自動重新載入最新資料
```

---

## Endpoint 5: 刪除客戶

### 基本資訊

```http
DELETE /api/customers/{id}
```

**權限**: `customer.delete`

### Path Parameters

| 參數 | 類型 | 說明 |
|------|------|------|
| `id` | UUID | 客戶唯一識別碼 |

### Request Example

```http
DELETE /api/customers/3fa85f64-5717-4562-b3fc-2c963f66afa6
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response 200 OK

```json
{
  "success": true,
  "message": "Customer deleted successfully",
  "data": null,
  "totalCount": 0,
  "traceId": "delete-trace-123",
  "code": 200
}
```

### Error Responses

| HTTP Status | Code | Message | 說明 |
|-------------|------|---------|------|
| 401 | 401 | "Unauthorized" | Token 無效或過期 |
| 403 | 403 | "Forbidden" | 無 `customer.delete` 權限 |
| 404 | 404 | "Customer not found" | 客戶不存在或已刪除 |
| 500 | 500 | "Internal server error" | 伺服器內部錯誤 |

### Business Rules

- **軟刪除**: 後端執行軟刪除（標記為已刪除，但不實際刪除資料）
- **關聯檢查**: 若客戶有關聯的服務單（由服務單模組管理），後端應回應錯誤（具體錯誤碼待後端定義）

---

## AI OCR API Contract

### Endpoint 6: Gemini AI 身分證辨識

#### 基本資訊

```http
POST /api/ocr/id-card-multi
Content-Type: multipart/form-data
```

**權限**: `customer.create` 或 `customer.update`

#### Request Body (multipart/form-data)

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `images` | File[] | ✅ | 身分證正反面圖片（JPG/PNG, 每張 ≤5MB，共 2 張） |

#### Request Example

```typescript
const formData = new FormData()
formData.append('images', frontFile)  // 身分證正面
formData.append('images', backFile)   // 身分證背面

const response = await axios.post('/api/ocr/id-card-multi', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 30000  // 30 秒逾時
})
```

#### Response 200 OK

```json
{
  "success": true,
  "message": null,
  "data": {
    "name": "王小明",
    "idNumber": "A123456789",
    "address": "台北市信義區信義路五段7號"
  },
  "totalCount": 0,
  "traceId": "ocr-gemini-abc123",
  "code": 200
}
```

**部分辨識成功範例**：

```json
{
  "success": true,
  "message": "Partial recognition success",
  "data": {
    "name": "王小明",
    "idNumber": null,
    "address": "台北市信義區信義路五段7號"
  },
  "totalCount": 0,
  "traceId": "ocr-gemini-def456",
  "code": 200
}
```

#### Error Responses

| HTTP Status | Code | Message | 說明 |
|-------------|------|---------|------|
| 400 | 400 | "Invalid file format" | 檔案格式錯誤（非 JPG/PNG） |
| 400 | 400 | "File size exceeds limit" | 檔案大小超過 5MB |
| 401 | 401 | "Unauthorized" | Token 無效 |
| 504 | 504 | "OCR service timeout" | AI 服務逾時（> 30 秒） |
| 500 | 500 | "OCR service error" | AI 服務錯誤 |

---

## Error Code Summary

### HTTP Status Codes

| Code | 用途 | 前端處理 |
|------|------|---------|
| 200 | 請求成功 | 顯示成功訊息 |
| 201 | 資源建立成功 | 顯示成功訊息，關閉表單 |
| 400 | 請求參數錯誤 | 顯示 `ElMessage.error(message)` |
| 401 | 未授權（Token 無效/過期） | 重新導向至登入頁 |
| 403 | 權限不足 | 顯示「您沒有權限執行此操作」 |
| 404 | 資源不存在 | 顯示「找不到指定的客戶資料」 |
| 409 | 並發衝突（樂觀鎖定） | 顯示 `ElMessageBox.alert` 並重新載入 |
| 422 | 業務邏輯錯誤（如重複） | 顯示 `ElMessage.warning(message)` |
| 500 | 伺服器內部錯誤 | 顯示「系統錯誤，請稍後再試」+ traceId |
| 504 | 服務逾時 | 顯示「請求逾時，請檢查網路連線」 |

### Business Code Mapping

| Code | 說明 | 前端處理 |
|------|------|---------|
| 200 | 成功 | 正常處理 |
| 400 | 參數錯誤 | 顯示錯誤訊息 |
| 422 | 身分證字號重複 | 標記欄位錯誤，提示使用者 |
| 409 | 資料版本衝突 | 重新載入資料 |

---

## Frontend Integration

### Axios Instance Configuration

```typescript
// http/axios.ts
import axios from 'axios'
import type { ApiResponseModel } from '@@/types/api'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000
})

// Request Interceptor: 加入 JWT Token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: 統一處理錯誤
instance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token 過期，重新導向至登入頁
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

export default instance
```

### API Service Layer

```typescript
// pages/customer-management/apis/customer.ts
import request from '@/http/axios'
import type { ApiResponseModel } from '@@/types/api'
import type { 
  Customer, 
  CreateCustomerRequest, 
  UpdateCustomerRequest,
  CustomerListParams 
} from '../types'

export const customerApi = {
  /** 查詢客戶列表 */
  search(params: CustomerListParams): Promise<ApiResponseModel<Customer[]>> {
    return request.get('/api/customers/search', { params })
  },
  
  /** 建立客戶 */
  create(data: CreateCustomerRequest): Promise<ApiResponseModel<Customer>> {
    return request.post('/api/customers', data)
  },
  
  /** 取得單一客戶 */
  getById(id: string): Promise<ApiResponseModel<Customer>> {
    return request.get(`/api/customers/${id}`)
  },
  
  /** 更新客戶 */
  update(id: string, data: UpdateCustomerRequest): Promise<ApiResponseModel<Customer>> {
    return request.put(`/api/customers/${id}`, data)
  },
  
  /** 刪除客戶 */
  delete(id: string): Promise<ApiResponseModel<null>> {
    return request.delete(`/api/customers/${id}`)
  }
}
```

---

**Next Steps**:
- ✅ API 合約定義完成
- ➡️ 繼續生成 quickstart.md
