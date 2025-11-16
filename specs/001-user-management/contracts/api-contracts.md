# API Contracts: 用戶管理系統

**Feature**: 用戶管理系統
**Date**: 2025-11-16
**Backend API Spec**: `V3.Admin.Backend.API.yaml`

本文件定義用戶管理功能的前端 API 契約，所有端點嚴格遵循後端 API 規格。

---

## 基礎資訊

### Base URL

- **開發環境**: `http://localhost:5176`
- **測試環境**: `https://staging-api.v3admin.example.com`
- **生產環境**: `https://api.v3admin.example.com`

### 身份驗證

除了登入端點外，所有 API 請求都需要 JWT Bearer Token：

```http
Authorization: Bearer <token>
```

### 回應格式

所有 API 回應都遵循 `ApiResponseModel<T>` 格式：

```typescript
{
  "success": boolean,       // 操作是否成功
  "code": string,           // 業務邏輯代碼
  "message": string,        // 繁體中文訊息
  "data": T | null,         // 回應資料
  "timestamp": string,      // ISO 8601 時間戳記
  "traceId": string         // 分散式追蹤 ID
}
```

---

## 1. 查詢用戶列表

### Endpoint

```http
GET /api/accounts
```

### Query Parameters

| 參數       | 類型   | 必填 | 預設值 | 說明              |
| ---------- | ------ | ---- | ------ | ----------------- |
| pageNumber | number | 否   | 1      | 頁碼（從 1 開始） |
| pageSize   | number | 否   | 10     | 每頁筆數（1-100） |

### Request Example

```typescript
// 前端呼叫範例
import axios from "axios"

async function getUserList(params: { pageNumber: number, pageSize: number }) {
  const response = await axios.get("/api/accounts", { params })
  return response.data
}
```

### Response Success (200)

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "查詢成功",
  "data": {
    "items": [
      {
        "id": "00000000-0000-0000-0000-000000000001",
        "username": "admin",
        "displayName": "系統管理員",
        "createdAt": "2025-10-26T08:00:00Z",
        "updatedAt": null
      }
    ],
    "totalCount": 1,
    "pageNumber": 1,
    "pageSize": 10,
    "totalPages": 1
  },
  "timestamp": "2025-11-16T14:30:00Z",
  "traceId": "7d3e5f8a-2b4c-4d9e-8f7a-1c2d3e4f5a6b"
}
```

### Response Error (401 Unauthorized)

```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "未授權,請先登入",
  "data": null,
  "timestamp": "2025-11-16T14:30:00Z",
  "traceId": "7d3e5f8a-2b4c-4d9e-8f7a-1c2d3e4f5a6b"
}
```

---

## 2. 新增用戶

### Endpoint

```http
POST /api/accounts
```

### Request Body

```json
{
  "username": "newuser",
  "password": "SecureP@ss123",
  "displayName": "新使用者"
}
```

### Request Example

```typescript
async function createUser(data: CreateUserRequest) {
  const response = await axios.post("/api/accounts", data)
  return response.data
}
```

### Response Success (201 Created)

```json
{
  "success": true,
  "code": "CREATED",
  "message": "帳號建立成功",
  "data": {
    "id": "00000000-0000-0000-0000-000000000003",
    "username": "newuser",
    "displayName": "新使用者",
    "createdAt": "2025-11-16T14:30:00Z",
    "updatedAt": null
  },
  "timestamp": "2025-11-16T14:30:00Z",
  "traceId": "7d3e5f8a-2b4c-4d9e-8f7a-1c2d3e4f5a6b"
}
```

### Response Error (400 Validation Error)

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "帳號或密碼格式不正確",
  "data": null,
  "timestamp": "2025-11-16T14:30:00Z",
  "traceId": "7d3e5f8a-2b4c-4d9e-8f7a-1c2d3e4f5a6b"
}
```

### Response Error (422 Username Exists)

```json
{
  "success": false,
  "code": "USERNAME_EXISTS",
  "message": "帳號已存在",
  "data": null,
  "timestamp": "2025-11-16T14:30:00Z",
  "traceId": "7d3e5f8a-2b4c-4d9e-8f7a-1c2d3e4f5a6b"
}
```

---

## 3. 查詢單一用戶

### Endpoint

```http
GET /api/accounts/{id}
```

### Path Parameters

| 參數 | 類型   | 必填 | 說明            |
| ---- | ------ | ---- | --------------- |
| id   | string | 是   | 用戶 ID（UUID） |

### Request Example

```typescript
async function getUserById(id: string) {
  const response = await axios.get(`/api/accounts/${id}`)
  return response.data
}
```

### Response Success (200)

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "查詢成功",
  "data": {
    "id": "00000000-0000-0000-0000-000000000001",
    "username": "admin",
    "displayName": "系統管理員",
    "createdAt": "2025-10-26T08:00:00Z",
    "updatedAt": null
  },
  "timestamp": "2025-11-16T14:30:00Z",
  "traceId": "7d3e5f8a-2b4c-4d9e-8f7a-1c2d3e4f5a6b"
}
```

### Response Error (404 Not Found)

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "帳號不存在",
  "data": null,
  "timestamp": "2025-11-16T14:30:00Z",
  "traceId": "7d3e5f8a-2b4c-4d9e-8f7a-1c2d3e4f5a6b"
}
```

---

## 4. 更新用戶資訊

### Endpoint

```http
PUT /api/accounts/{id}
```

### Path Parameters

| 參數 | 類型   | 必填 | 說明            |
| ---- | ------ | ---- | --------------- |
| id   | string | 是   | 用戶 ID（UUID） |

### Request Body

```json
{
  "displayName": "新的顯示名稱"
}
```

### Request Example

```typescript
async function updateUser(id: string, data: UpdateUserRequest) {
  const response = await axios.put(`/api/accounts/${id}`, data)
  return response.data
}
```

### Response Success (200)

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "更新成功",
  "data": {
    "id": "00000000-0000-0000-0000-000000000001",
    "username": "admin",
    "displayName": "新的顯示名稱",
    "createdAt": "2025-10-26T08:00:00Z",
    "updatedAt": "2025-11-16T14:30:00Z"
  },
  "timestamp": "2025-11-16T14:30:00Z",
  "traceId": "7d3e5f8a-2b4c-4d9e-8f7a-1c2d3e4f5a6b"
}
```

### Response Error (403 Forbidden)

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "您無權執行此操作",
  "data": null,
  "timestamp": "2025-11-16T14:30:00Z",
  "traceId": "7d3e5f8a-2b4c-4d9e-8f7a-1c2d3e4f5a6b"
}
```

### Response Error (409 Concurrent Update Conflict)

```json
{
  "success": false,
  "code": "CONCURRENT_UPDATE_CONFLICT",
  "message": "資料已被其他使用者更新，請重新載入後再試",
  "data": null,
  "timestamp": "2025-11-16T14:30:00Z",
  "traceId": "7d3e5f8a-2b4c-4d9e-8f7a-1c2d3e4f5a6b"
}
```

---

## 5. 刪除用戶（軟刪除）

### Endpoint

```http
DELETE /api/accounts/{id}
```

### Path Parameters

| 參數 | 類型   | 必填 | 說明            |
| ---- | ------ | ---- | --------------- |
| id   | string | 是   | 用戶 ID（UUID） |

### Request Body

```json
{
  "confirmation": "CONFIRM"
}
```

### Request Example

```typescript
async function deleteUser(id: string) {
  const response = await axios.delete(`/api/accounts/${id}`, {
    data: { confirmation: "CONFIRM" }
  })
  return response.data
}
```

### Response Success (200)

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "帳號刪除成功",
  "data": null,
  "timestamp": "2025-11-16T14:30:00Z",
  "traceId": "7d3e5f8a-2b4c-4d9e-8f7a-1c2d3e4f5a6b"
}
```

### Response Error (403 Cannot Delete Self)

```json
{
  "success": false,
  "code": "CANNOT_DELETE_SELF",
  "message": "無法刪除當前登入帳號",
  "data": null,
  "timestamp": "2025-11-16T14:30:00Z",
  "traceId": "7d3e5f8a-2b4c-4d9e-8f7a-1c2d3e4f5a6b"
}
```

### Response Error (422 Last Account)

```json
{
  "success": false,
  "code": "LAST_ACCOUNT_CANNOT_DELETE",
  "message": "無法刪除最後一個帳號",
  "data": null,
  "timestamp": "2025-11-16T14:30:00Z",
  "traceId": "7d3e5f8a-2b4c-4d9e-8f7a-1c2d3e4f5a6b"
}
```

---

## 6. 變更密碼

### Endpoint

```http
PUT /api/accounts/{id}/password
```

### Path Parameters

| 參數 | 類型   | 必填 | 說明            |
| ---- | ------ | ---- | --------------- |
| id   | string | 是   | 用戶 ID（UUID） |

### Request Body

```json
{
  "oldPassword": "OldP@ss123",
  "newPassword": "NewSecureP@ss456"
}
```

### Request Example

```typescript
async function changePassword(id: string, data: ChangePasswordRequest) {
  const response = await axios.put(`/api/accounts/${id}/password`, data)
  return response.data
}
```

### Response Success (200)

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "密碼變更成功",
  "data": null,
  "timestamp": "2025-11-16T14:30:00Z",
  "traceId": "7d3e5f8a-2b4c-4d9e-8f7a-1c2d3e4f5a6b"
}
```

### Response Error (401 Invalid Credentials)

```json
{
  "success": false,
  "code": "INVALID_CREDENTIALS",
  "message": "舊密碼錯誤",
  "data": null,
  "timestamp": "2025-11-16T14:30:00Z",
  "traceId": "7d3e5f8a-2b4c-4d9e-8f7a-1c2d3e4f5a6b"
}
```

### Response Error (422 Password Same As Old)

```json
{
  "success": false,
  "code": "PASSWORD_SAME_AS_OLD",
  "message": "新密碼與舊密碼相同",
  "data": null,
  "timestamp": "2025-11-16T14:30:00Z",
  "traceId": "7d3e5f8a-2b4c-4d9e-8f7a-1c2d3e4f5a6b"
}
```

---

## 錯誤碼彙總

| 錯誤碼                       | HTTP Status | 說明                             |
| ---------------------------- | ----------- | -------------------------------- |
| `SUCCESS`                    | 200         | 操作成功                         |
| `CREATED`                    | 201         | 資源建立成功                     |
| `VALIDATION_ERROR`           | 400         | 輸入驗證失敗                     |
| `UNAUTHORIZED`               | 401         | 未授權（缺少或無效的 JWT Token） |
| `INVALID_CREDENTIALS`        | 401         | 帳號或密碼錯誤                   |
| `FORBIDDEN`                  | 403         | 禁止操作（權限不足）             |
| `CANNOT_DELETE_SELF`         | 403         | 無法刪除當前登入帳號             |
| `NOT_FOUND`                  | 404         | 資源不存在                       |
| `CONCURRENT_UPDATE_CONFLICT` | 409         | 並發更新衝突（樂觀鎖）           |
| `USERNAME_EXISTS`            | 422         | 用戶名已存在                     |
| `LAST_ACCOUNT_CANNOT_DELETE` | 422         | 無法刪除最後一個帳號             |
| `PASSWORD_SAME_AS_OLD`       | 422         | 新密碼與舊密碼相同               |
| `INTERNAL_ERROR`             | 500         | 系統內部錯誤                     |

---

## TypeScript API 封裝範例

```typescript
import type {
  ApiResponse,
  ChangePasswordRequest,
  CreateUserRequest,
  DeleteUserRequest,
  UpdateUserRequest,
  User,
  UserListParams,
  UserListResponse
} from "../types"
// @/pages/user-management/apis/account.ts
import axios from "@/http/axios"

/**
 * 查詢用戶列表
 */
export async function getUserList(params: UserListParams): Promise<ApiResponse<UserListResponse>> {
  return axios.get("/api/account", { params })
}

/**
 * 查詢單一用戶
 */
export async function getUserById(id: string): Promise<ApiResponse<User>> {
  return axios.get(`/api/account/${id}`)
}

/**
 * 新增用戶
 */
export async function createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
  return axios.post("/api/account", data)
}

/**
 * 更新用戶資訊
 */
export async function updateUser(id: string, data: UpdateUserRequest): Promise<ApiResponse<User>> {
  return axios.put(`/api/account/${id}`, data)
}

/**
 * 刪除用戶（軟刪除）
 */
export async function deleteUser(id: string): Promise<ApiResponse<null>> {
  return axios.delete(`/api/account/${id}`, {
    data: { confirmation: "CONFIRM" } as DeleteUserRequest
  })
}

/**
 * 變更密碼
 */
export async function changePassword(id: string, data: ChangePasswordRequest): Promise<ApiResponse<null>> {
  return axios.put(`/api/account/${id}/password`, data)
}
```

---

## 總結

API 契約文件完成，涵蓋以下內容：

1. **6 個 API 端點**：列表查詢、單一查詢、新增、更新、刪除、變更密碼
2. **完整的請求/回應範例**：包含成功與失敗情境
3. **錯誤碼彙總表**：所有業務邏輯代碼與 HTTP Status 對應
4. **TypeScript 封裝範例**：可直接用於前端開發

所有契約均嚴格遵循 `V3.Admin.Backend.API.yaml` 規格，可進入 quickstart 生成階段。
