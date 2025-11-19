# API Contracts: 權限管理系統

**Date**: 2025-11-19
**Feature**: 權限管理系統
**Version**: 1.0.0
**Base URL**: `/api`

## 概述

本文件定義權限管理系統的 RESTful API 契約，遵循 V3.Admin.Backend.API.yaml 規範。所有 API 使用 JWT Bearer Token 進行身份驗證，並採用統一的回應格式 `ApiResponse<T>`。

## 通用規範

### 身份驗證

所有 API 端點都需要在 HTTP Header 中包含 JWT Token：

```http
Authorization: Bearer {JWT_TOKEN}
```

### 通用回應格式

```typescript
{
  "success": boolean,      // 操作是否成功
  "code": string,          // 業務代碼
  "message": string,       // 訊息
  "data": T | null,        // 資料（泛型）
  "timestamp": string,     // 時間戳（ISO 8601）
  "traceId": string        // 追蹤 ID
}
```

### 通用錯誤代碼

| 代碼 | HTTP Status | 說明 |
|------|-------------|------|
| `SUCCESS` | 200/201 | 操作成功 |
| `VALIDATION_ERROR` | 400 | 請求資料驗證失敗 |
| `UNAUTHORIZED` | 401 | 未授權（Token 無效或過期） |
| `FORBIDDEN` | 403 | 無權限執行此操作 |
| `NOT_FOUND` | 404 | 資源不存在 |
| `CONCURRENT_UPDATE_CONFLICT` | 409 | 並行更新衝突（版本號不匹配） |
| `INTERNAL_ERROR` | 500 | 伺服器內部錯誤 |

### 權限管理特定錯誤代碼

| 代碼 | HTTP Status | 說明 |
|------|-------------|------|
| `DUPLICATE_CODE` | 400 | 權限代碼已存在 |
| `PERMISSION_IN_USE` | 400 | 權限正在使用中，無法刪除 |
| `SYSTEM_PERMISSION_PROTECTED` | 400 | 系統內建權限，無法刪除或修改 |

## API 端點

### 1. 查詢權限列表

查詢系統中的所有權限，支援搜尋和分頁。

**端點**: `GET /api/permissions`

**需要權限**: `permission.read`

**查詢參數**:

| 參數 | 類型 | 必填 | 說明 | 預設值 |
|------|------|------|------|--------|
| keyword | string | 否 | 搜尋關鍵字（搜尋 name 或 code） | - |
| pageNumber | number | 否 | 頁碼（從 1 開始） | 1 |
| pageSize | number | 否 | 每頁筆數（1-100） | 20 |
| sortBy | string | 否 | 排序欄位（name/code/createdAt/updatedAt） | createdAt |
| sortOrder | string | 否 | 排序方向（asc/desc） | desc |

**請求範例**:

```http
GET /api/permissions?keyword=user&pageNumber=1&pageSize=20&sortBy=name&sortOrder=asc
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**回應範例（成功）**:

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "查詢成功",
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "新增使用者",
        "code": "user:create",
        "description": "允許建立新的使用者帳號",
        "isSystem": false,
        "version": 1,
        "createdAt": "2025-11-19T10:00:00Z",
        "updatedAt": "2025-11-19T10:00:00Z",
        "createdBy": "550e8400-e29b-41d4-a716-446655440000",
        "updatedBy": null
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "name": "編輯使用者資料",
        "code": "user:profile:edit",
        "description": "允許修改使用者的個人資料",
        "isSystem": false,
        "version": 2,
        "createdAt": "2025-11-19T10:05:00Z",
        "updatedAt": "2025-11-19T11:30:00Z",
        "createdBy": "550e8400-e29b-41d4-a716-446655440000",
        "updatedBy": "550e8400-e29b-41d4-a716-446655440000"
      }
    ],
    "pageNumber": 1,
    "pageSize": 20,
    "totalCount": 2,
    "totalPages": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  },
  "timestamp": "2025-11-19T12:00:00Z",
  "traceId": "abc123-def456-ghi789"
}
```

**回應範例（錯誤 - 未授權）**:

```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "Token 無效或已過期",
  "data": null,
  "timestamp": "2025-11-19T12:00:00Z",
  "traceId": "abc123-def456-ghi789"
}
```

---

### 2. 查詢單一權限

根據 ID 查詢特定權限的詳細資訊。

**端點**: `GET /api/permissions/{id}`

**需要權限**: `permission.read`

**路徑參數**:

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | string | 是 | 權限 ID（UUID） |

**請求範例**:

```http
GET /api/permissions/550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**回應範例（成功）**:

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "查詢成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "新增使用者",
    "code": "user:create",
    "description": "允許建立新的使用者帳號",
    "isSystem": false,
    "version": 1,
    "createdAt": "2025-11-19T10:00:00Z",
    "updatedAt": "2025-11-19T10:00:00Z",
    "createdBy": "550e8400-e29b-41d4-a716-446655440000",
    "updatedBy": null
  },
  "timestamp": "2025-11-19T12:00:00Z",
  "traceId": "abc123-def456-ghi789"
}
```

**回應範例（錯誤 - 資源不存在）**:

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "找不到指定的權限",
  "data": null,
  "timestamp": "2025-11-19T12:00:00Z",
  "traceId": "abc123-def456-ghi789"
}
```

---

### 3. 新增權限

建立一個新的權限。

**端點**: `POST /api/permissions`

**需要權限**: `permission.create`

**請求內容**:

```typescript
{
  "name": string,          // 權限名稱（1-100 字元）
  "code": string,          // 權限代碼（符合格式 module:action）
  "description"?: string   // 權限描述（最多 500 字元，可選）
}
```

**請求範例**:

```http
POST /api/permissions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "刪除使用者",
  "code": "user:delete",
  "description": "允許刪除使用者帳號"
}
```

**回應範例（成功）**:

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "權限建立成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "刪除使用者",
    "code": "user:delete",
    "description": "允許刪除使用者帳號",
    "isSystem": false,
    "version": 1,
    "createdAt": "2025-11-19T12:30:00Z",
    "updatedAt": "2025-11-19T12:30:00Z",
    "createdBy": "550e8400-e29b-41d4-a716-446655440000",
    "updatedBy": null
  },
  "timestamp": "2025-11-19T12:30:00Z",
  "traceId": "abc123-def456-ghi789"
}
```

**回應範例（錯誤 - 權限代碼重複）**:

```json
{
  "success": false,
  "code": "DUPLICATE_CODE",
  "message": "權限代碼 'user:delete' 已存在",
  "data": null,
  "timestamp": "2025-11-19T12:30:00Z",
  "traceId": "abc123-def456-ghi789"
}
```

**回應範例（錯誤 - 驗證失敗）**:

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "資料驗證失敗",
  "data": {
    "errors": {
      "code": ["權限代碼格式不正確，應符合 module:action 格式"]
    }
  },
  "timestamp": "2025-11-19T12:30:00Z",
  "traceId": "abc123-def456-ghi789"
}
```

---

### 4. 更新權限

更新現有權限的資訊。

**端點**: `PUT /api/permissions/{id}`

**需要權限**: `permission.update`

**路徑參數**:

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | string | 是 | 權限 ID（UUID） |

**請求內容**:

```typescript
{
  "name": string,          // 權限名稱（1-100 字元）
  "code": string,          // 權限代碼（符合格式 module:action）
  "description"?: string,  // 權限描述（最多 500 字元，可選）
  "version": number        // 當前版本號（用於樂觀鎖定）
}
```

**請求範例**:

```http
PUT /api/permissions/550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "建立使用者",
  "code": "user:create",
  "description": "允許建立新的使用者帳號（更新後的描述）",
  "version": 1
}
```

**回應範例（成功）**:

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "權限更新成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "建立使用者",
    "code": "user:create",
    "description": "允許建立新的使用者帳號（更新後的描述）",
    "isSystem": false,
    "version": 2,
    "createdAt": "2025-11-19T10:00:00Z",
    "updatedAt": "2025-11-19T13:00:00Z",
    "createdBy": "550e8400-e29b-41d4-a716-446655440000",
    "updatedBy": "550e8400-e29b-41d4-a716-446655440000"
  },
  "timestamp": "2025-11-19T13:00:00Z",
  "traceId": "abc123-def456-ghi789"
}
```

**回應範例（錯誤 - 並行更新衝突）**:

```json
{
  "success": false,
  "code": "CONCURRENT_UPDATE_CONFLICT",
  "message": "資料已被其他使用者修改，請重新載入",
  "data": {
    "currentVersion": 3,
    "submittedVersion": 1
  },
  "timestamp": "2025-11-19T13:00:00Z",
  "traceId": "abc123-def456-ghi789"
}
```

**回應範例（錯誤 - 系統權限保護）**:

```json
{
  "success": false,
  "code": "SYSTEM_PERMISSION_PROTECTED",
  "message": "系統內建權限無法修改",
  "data": null,
  "timestamp": "2025-11-19T13:00:00Z",
  "traceId": "abc123-def456-ghi789"
}
```

---

### 5. 刪除權限

刪除指定的權限（僅限未被使用的權限）。

**端點**: `DELETE /api/permissions/{id}`

**需要權限**: `permission.delete`

**路徑參數**:

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | string | 是 | 權限 ID（UUID） |

**請求範例**:

```http
DELETE /api/permissions/550e8400-e29b-41d4-a716-446655440003
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**回應範例（成功）**:

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "權限刪除成功",
  "data": null,
  "timestamp": "2025-11-19T14:00:00Z",
  "traceId": "abc123-def456-ghi789"
}
```

**回應範例（錯誤 - 權限使用中）**:

```json
{
  "success": false,
  "code": "PERMISSION_IN_USE",
  "message": "該權限已被 3 個角色使用，無法刪除",
  "data": {
    "roleCount": 3,
    "roles": [
      { "id": "role-001", "name": "系統管理員" },
      { "id": "role-002", "name": "部門主管" },
      { "id": "role-003", "name": "一般使用者" }
    ]
  },
  "timestamp": "2025-11-19T14:00:00Z",
  "traceId": "abc123-def456-ghi789"
}
```

**回應範例（錯誤 - 系統權限保護）**:

```json
{
  "success": false,
  "code": "SYSTEM_PERMISSION_PROTECTED",
  "message": "系統內建權限無法刪除",
  "data": null,
  "timestamp": "2025-11-19T14:00:00Z",
  "traceId": "abc123-def456-ghi789"
}
```

---

### 6. 查詢權限使用情況

查詢指定權限被哪些角色使用。

**端點**: `GET /api/permissions/{id}/usage`

**需要權限**: `permission.read`

**路徑參數**:

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | string | 是 | 權限 ID（UUID） |

**請求範例**:

```http
GET /api/permissions/550e8400-e29b-41d4-a716-446655440001/usage
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**回應範例（成功 - 有使用）**:

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "查詢成功",
  "data": {
    "permissionId": "550e8400-e29b-41d4-a716-446655440001",
    "roleCount": 2,
    "roles": [
      {
        "id": "role-001",
        "name": "系統管理員"
      },
      {
        "id": "role-002",
        "name": "部門主管"
      }
    ]
  },
  "timestamp": "2025-11-19T14:30:00Z",
  "traceId": "abc123-def456-ghi789"
}
```

**回應範例（成功 - 無使用）**:

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "查詢成功",
  "data": {
    "permissionId": "550e8400-e29b-41d4-a716-446655440003",
    "roleCount": 0,
    "roles": []
  },
  "timestamp": "2025-11-19T14:30:00Z",
  "traceId": "abc123-def456-ghi789"
}
```

---

## 前端 API 客戶端範例

### Axios 實例設定

```typescript
// @/pages/permission-management/apis/permission.ts
import axios from 'axios'
import type { 
  Permission, 
  CreatePermissionDto, 
  UpdatePermissionDto,
  PermissionQuery,
  PagedResult,
  PermissionUsage,
  ApiResponse 
} from '../types'

const api = axios.create({
  baseURL: '/api'
})

// 請求攔截器：加入 JWT Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 回應攔截器：統一錯誤處理
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 處理未授權：導向登入頁
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

### API 函式

```typescript
/**
 * 查詢權限列表
 */
export async function getPermissions(
  query: PermissionQuery
): Promise<ApiResponse<PagedResult<Permission>>> {
  const response = await api.get('/permissions', { params: query })
  return response.data
}

/**
 * 查詢單一權限
 */
export async function getPermission(
  id: string
): Promise<ApiResponse<Permission>> {
  const response = await api.get(`/permissions/${id}`)
  return response.data
}

/**
 * 新增權限
 */
export async function createPermission(
  data: CreatePermissionDto
): Promise<ApiResponse<Permission>> {
  const response = await api.post('/permissions', data)
  return response.data
}

/**
 * 更新權限
 */
export async function updatePermission(
  id: string,
  data: UpdatePermissionDto
): Promise<ApiResponse<Permission>> {
  const response = await api.put(`/permissions/${id}`, data)
  return response.data
}

/**
 * 刪除權限
 */
export async function deletePermission(
  id: string
): Promise<ApiResponse<null>> {
  const response = await api.delete(`/permissions/${id}`)
  return response.data
}

/**
 * 查詢權限使用情況
 */
export async function getPermissionUsage(
  id: string
): Promise<ApiResponse<PermissionUsage>> {
  const response = await api.get(`/permissions/${id}/usage`)
  return response.data
}
```

## 測試案例

### 端到端測試場景

1. **新增權限成功**：提交有效資料 → 回應 201 Created
2. **新增權限失敗（代碼重複）**：提交重複代碼 → 回應 400 DUPLICATE_CODE
3. **更新權限成功**：提交正確版本號 → 回應 200 OK，版本號遞增
4. **更新權限失敗（並行衝突）**：提交過時版本號 → 回應 409 CONCURRENT_UPDATE_CONFLICT
5. **刪除權限成功**：刪除未使用權限 → 回應 200 OK
6. **刪除權限失敗（使用中）**：刪除使用中權限 → 回應 400 PERMISSION_IN_USE
7. **刪除權限失敗（系統權限）**：刪除系統權限 → 回應 400 SYSTEM_PERMISSION_PROTECTED
8. **查詢權限使用情況**：查詢任意權限 → 回應 200 OK，包含角色列表

## 版本控制

**Version**: 1.0.0
**Last Updated**: 2025-11-19
**Changelog**:
- 1.0.0 (2025-11-19): 初始版本，定義所有權限管理 API 端點

## 總結

本 API 契約定義了完整的權限管理功能所需的 6 個端點：

1. `GET /api/permissions` - 查詢權限列表（含搜尋與分頁）
2. `GET /api/permissions/{id}` - 查詢單一權限
3. `POST /api/permissions` - 新增權限
4. `PUT /api/permissions/{id}` - 更新權限（含樂觀鎖定）
5. `DELETE /api/permissions/{id}` - 刪除權限（含使用檢查）
6. `GET /api/permissions/{id}/usage` - 查詢權限使用情況

所有端點均遵循 RESTful 設計原則和 V3.Admin.Backend.API.yaml 規範，包含完整的錯誤處理和安全機制。
