# API Contracts: 角色管理系統

**Feature**: 角色管理系統 (Role Management)
**Date**: 2025-11-21
**Version**: 1.0
**Backend Spec**: V3.Admin.Backend.API.yaml

## Overview

本文件定義前端角色管理功能所需的所有 API 契約，基於後端 OpenAPI 規格（`V3.Admin.Backend.API.yaml`）。所有端點均需 JWT Bearer Token 認證（在 `Authorization` 標頭中提供），除了 `/api/auth/login` 端點。

## Common Response Format

所有 API 回應均遵循統一的 `ApiResponseModel<T>` 格式：

```typescript
interface ApiResponse<T = any> {
  /** 操作是否成功 */
  success: boolean
  
  /** 業務邏輯代碼 */
  code: string
  
  /** 繁體中文訊息 */
  message: string
  
  /** 回應資料（可為 null） */
  data: T | null
  
  /** 回應時間戳記（ISO 8601, UTC） */
  timestamp: string
  
  /** 分散式追蹤 ID */
  traceId: string
}
```

## Authentication

**Header**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Token 來源**: 透過 `/api/auth/login` 取得
**Token 有效期**: 1 小時

---

## API Endpoints

### 1. 查詢角色列表（分頁）

**Endpoint**: `GET /api/role`

**描述**: 取得所有角色的分頁列表

**權限需求**: `role.read`

**Query Parameters**:

| 參數 | 型別 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| `pageNumber` | number | ❌ | 1 | 頁碼（從 1 開始） |
| `pageSize` | number | ❌ | 10 | 每頁筆數（1-100） |

**Request Example**:
```http
GET /api/role?pageNumber=1&pageSize=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "查詢成功",
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "roleName": "管理員",
        "description": "系統管理員角色",
        "createdAt": "2025-11-20T08:00:00Z",
        "version": 1
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "roleName": "編輯者",
        "description": null,
        "createdAt": "2025-11-21T09:30:00Z",
        "version": 1
      }
    ],
    "totalCount": 2,
    "pageNumber": 1,
    "pageSize": 20
  },
  "timestamp": "2025-11-21T10:00:00Z",
  "traceId": "7d3e5f8a-2b4c-4d9e-8f7a-1c2d3e4f5a6b"
}
```

**Error Responses**:

| Code | HTTP Status | 說明 |
|------|-------------|------|
| `UNAUTHORIZED` | 401 | 未授權（Token 無效或過期） |
| `FORBIDDEN` | 403 | 無 `role.read` 權限 |
| `INTERNAL_ERROR` | 500 | 系統內部錯誤 |

---

### 2. 查詢單一角色

**Endpoint**: `GET /api/role/{id}`

**描述**: 根據 ID 取得角色的基本資訊

**權限需求**: `role.read`

**Path Parameters**:

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | string (UUID) | ✅ | 角色 ID |

**Request Example**:
```http
GET /api/role/550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "查詢成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "roleName": "管理員",
    "description": "系統管理員角色",
    "createdAt": "2025-11-20T08:00:00Z",
    "version": 1
  },
  "timestamp": "2025-11-21T10:00:00Z",
  "traceId": "abc123"
}
```

**Error Responses**:

| Code | HTTP Status | 說明 |
|------|-------------|------|
| `NOT_FOUND` | 404 | 角色不存在 |
| `UNAUTHORIZED` | 401 | 未授權 |
| `FORBIDDEN` | 403 | 無權限 |

---

### 3. 查詢角色詳細資訊（含權限）

**Endpoint**: `GET /api/role/{id}/permissions`

**描述**: 取得角色的詳細資訊，包含該角色擁有的所有權限

**權限需求**: `role.read`

**Path Parameters**:

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | string (UUID) | ✅ | 角色 ID |

**Request Example**:
```http
GET /api/role/550e8400-e29b-41d4-a716-446655440001/permissions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "查詢成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "roleName": "管理員",
    "description": "系統管理員角色",
    "createdAt": "2025-11-20T08:00:00Z",
    "version": 1,
    "permissions": [
      {
        "id": "650e8400-e29b-41d4-a716-446655440001",
        "permissionCode": "user.read",
        "name": "查看用戶",
        "description": "允許查看用戶列表與詳情",
        "permissionType": "function",
        "createdAt": "2025-11-10T08:00:00Z",
        "updatedAt": null,
        "version": 1
      },
      {
        "id": "650e8400-e29b-41d4-a716-446655440002",
        "permissionCode": "user.create",
        "name": "建立用戶",
        "description": "允許建立新用戶",
        "permissionType": "function",
        "createdAt": "2025-11-10T08:00:00Z",
        "updatedAt": null,
        "version": 1
      }
    ]
  },
  "timestamp": "2025-11-21T10:00:00Z",
  "traceId": "abc123"
}
```

**Error Responses**: 同上（查詢單一角色）

---

### 4. 建立角色

**Endpoint**: `POST /api/role`

**描述**: 建立一個新的角色

**權限需求**: `role.create`

**Request Body**:
```typescript
{
  roleName: string      // 必填，長度 1-100 字元
  description?: string  // 選填，最大 500 字元
}
```

**Request Example**:
```http
POST /api/role
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "roleName": "編輯者",
  "description": "負責內容編輯的角色"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "角色建立成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "roleName": "編輯者",
    "description": "負責內容編輯的角色",
    "createdAt": "2025-11-21T10:05:00Z",
    "version": 1
  },
  "timestamp": "2025-11-21T10:05:00Z",
  "traceId": "abc123"
}
```

**Error Responses**:

| Code | HTTP Status | 說明 | 範例訊息 |
|------|-------------|------|----------|
| `VALIDATION_ERROR` | 400 | 驗證錯誤 | "角色名稱長度需介於 1-100 字元" |
| `DUPLICATE_NAME` | 422 | 角色名稱已存在 | "角色名稱「編輯者」已存在" |
| `UNAUTHORIZED` | 401 | 未授權 | "未授權，請先登入" |
| `FORBIDDEN` | 403 | 無 `role.create` 權限 | "無建立角色權限" |
| `INTERNAL_ERROR` | 500 | 系統錯誤 | "系統內部錯誤，請稍後再試" |

---

### 5. 更新角色

**Endpoint**: `PUT /api/role/{id}`

**描述**: 更新指定角色的資訊

**權限需求**: `role.update`

**Path Parameters**:

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | string (UUID) | ✅ | 角色 ID |

**Request Body**:
```typescript
{
  roleName: string   // 必填，長度 1-100 字元
  description?: string  // 選填，最大 500 字元
  version: number    // 必填，樂觀鎖版本號
}
```

**Request Example**:
```http
PUT /api/role/550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "roleName": "超級管理員",
  "description": "系統最高權限管理員",
  "version": 1
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "角色更新成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "roleName": "超級管理員",
    "description": "系統最高權限管理員",
    "createdAt": "2025-11-20T08:00:00Z",
    "version": 2
  },
  "timestamp": "2025-11-21T10:10:00Z",
  "traceId": "abc123"
}
```

**Error Responses**:

| Code | HTTP Status | 說明 | 範例訊息 |
|------|-------------|------|----------|
| `VALIDATION_ERROR` | 400 | 驗證錯誤 | "版本號為必填欄位" |
| `NOT_FOUND` | 404 | 角色不存在 | "找不到指定的角色" |
| `CONCURRENT_UPDATE_CONFLICT` | 409 | 樂觀鎖衝突 | "資料已被其他用戶更新，請重新載入後再試" |
| `DUPLICATE_NAME` | 422 | 角色名稱已存在 | "角色名稱「超級管理員」已存在" |
| `UNAUTHORIZED` | 401 | 未授權 | "未授權，請先登入" |
| `FORBIDDEN` | 403 | 無權限 | "無更新角色權限" |

---

### 6. 刪除角色

**Endpoint**: `DELETE /api/role/{id}`

**描述**: 刪除指定角色（軟刪除）

**權限需求**: `role.delete`

**Path Parameters**:

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | string (UUID) | ✅ | 角色 ID |

**Request Body**:
```typescript
{
  version: number  // 必填，樂觀鎖版本號
}
```

**Request Example**:
```http
DELETE /api/role/550e8400-e29b-41d4-a716-446655440003
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "version": 1
}
```

**Response (204 No Content)**:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "角色刪除成功",
  "data": null,
  "timestamp": "2025-11-21T10:15:00Z",
  "traceId": "abc123"
}
```

**Error Responses**:

| Code | HTTP Status | 說明 | 範例訊息 |
|------|-------------|------|----------|
| `NOT_FOUND` | 404 | 角色不存在 | "找不到指定的角色" |
| `CONCURRENT_UPDATE_CONFLICT` | 409 | 樂觀鎖衝突 | "資料已被其他用戶更新，請重新載入後再試" |
| `ROLE_IN_USE` | 422 | 角色正在使用中 | "該角色正在使用中，無法刪除。請先移除所有用戶的該角色後再試。" |
| `UNAUTHORIZED` | 401 | 未授權 | "未授權，請先登入" |
| `FORBIDDEN` | 403 | 無權限 | "無刪除角色權限" |

---

### 7. 為角色分配權限

**Endpoint**: `POST /api/role/{id}/permissions`

**描述**: 為指定角色分配一個或多個權限

**權限需求**: `permission.assign`

**Path Parameters**:

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | string (UUID) | ✅ | 角色 ID |

**Request Body**:
```typescript
{
  permissionIds: string[]  // 必填，權限 ID 陣列（UUID[]）
}
```

**Request Example**:
```http
POST /api/role/550e8400-e29b-41d4-a716-446655440001/permissions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "permissionIds": [
    "650e8400-e29b-41d4-a716-446655440001",
    "650e8400-e29b-41d4-a716-446655440002"
  ]
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "權限分配成功",
  "data": null,
  "timestamp": "2025-11-21T10:20:00Z",
  "traceId": "abc123"
}
```

**Error Responses**:

| Code | HTTP Status | 說明 | 範例訊息 |
|------|-------------|------|----------|
| `VALIDATION_ERROR` | 400 | 驗證錯誤 | "權限 ID 陣列不可為空" |
| `NOT_FOUND` | 404 | 角色或權限不存在 | "找不到指定的角色或權限" |
| `UNAUTHORIZED` | 401 | 未授權 | "未授權，請先登入" |
| `FORBIDDEN` | 403 | 無權限 | "無分配權限的權限" |

---

### 8. 從角色移除權限

**Endpoint**: `DELETE /api/role/{roleId}/permissions/{permissionId}`

**描述**: 從指定角色移除一個權限

**權限需求**: `permission.remove`

**Path Parameters**:

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `roleId` | string (UUID) | ✅ | 角色 ID |
| `permissionId` | string (UUID) | ✅ | 權限 ID |

**Request Example**:
```http
DELETE /api/role/550e8400-e29b-41d4-a716-446655440001/permissions/650e8400-e29b-41d4-a716-446655440001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (204 No Content)**:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "權限移除成功",
  "data": null,
  "timestamp": "2025-11-21T10:25:00Z",
  "traceId": "abc123"
}
```

**Error Responses**:

| Code | HTTP Status | 說明 | 範例訊息 |
|------|-------------|------|----------|
| `NOT_FOUND` | 404 | 角色或權限不存在，或該角色未擁有此權限 | "找不到指定的角色權限關聯" |
| `UNAUTHORIZED` | 401 | 未授權 | "未授權，請先登入" |
| `FORBIDDEN` | 403 | 無權限 | "無移除權限的權限" |

---

### 9. 查詢用戶的所有角色

**Endpoint**: `GET /api/users/{userId}/roles`

**描述**: 查詢指定用戶擁有的所有角色

**權限需求**: `role.read`

**Path Parameters**:

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `userId` | string (UUID) | ✅ | 用戶 ID |

**Request Example**:
```http
GET /api/users/450e8400-e29b-41d4-a716-446655440001/roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "查詢成功",
  "data": [
    {
      "userId": "450e8400-e29b-41d4-a716-446655440001",
      "roleId": "550e8400-e29b-41d4-a716-446655440001",
      "roleName": "管理員",
      "assignedAt": "2025-11-20T09:00:00Z"
    },
    {
      "userId": "450e8400-e29b-41d4-a716-446655440001",
      "roleId": "550e8400-e29b-41d4-a716-446655440002",
      "roleName": "編輯者",
      "assignedAt": "2025-11-21T10:00:00Z"
    }
  ],
  "timestamp": "2025-11-21T10:30:00Z",
  "traceId": "abc123"
}
```

**Error Responses**:

| Code | HTTP Status | 說明 | 範例訊息 |
|------|-------------|------|----------|
| `NOT_FOUND` | 404 | 用戶不存在 | "找不到指定的用戶" |
| `UNAUTHORIZED` | 401 | 未授權 | "未授權，請先登入" |
| `FORBIDDEN` | 403 | 無權限 | "無查詢角色權限" |

---

### 10. 為用戶指派角色

**Endpoint**: `POST /api/users/{userId}/roles`

**描述**: 為指定用戶指派一個或多個角色

**權限需求**: `role.assign`

**Path Parameters**:

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `userId` | string (UUID) | ✅ | 用戶 ID |

**Request Body**:
```typescript
{
  roleIds: string[]  // 必填，角色 ID 陣列（UUID[]）
}
```

**Request Example**:
```http
POST /api/users/450e8400-e29b-41d4-a716-446655440001/roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "roleIds": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ]
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "角色指派成功",
  "data": null,
  "timestamp": "2025-11-21T10:35:00Z",
  "traceId": "abc123"
}
```

**Error Responses**:

| Code | HTTP Status | 說明 | 範例訊息 |
|------|-------------|------|----------|
| `VALIDATION_ERROR` | 400 | 驗證錯誤 | "角色 ID 陣列不可為空" |
| `NOT_FOUND` | 404 | 用戶或角色不存在 | "找不到指定的用戶或角色" |
| `UNAUTHORIZED` | 401 | 未授權 | "未授權，請先登入" |
| `FORBIDDEN` | 403 | 無權限 | "無指派角色權限" |

---

### 11. 從用戶移除角色

**Endpoint**: `DELETE /api/users/{userId}/roles/{roleId}`

**描述**: 從指定用戶移除一個角色

**權限需求**: `role.remove`

**Path Parameters**:

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `userId` | string (UUID) | ✅ | 用戶 ID |
| `roleId` | string (UUID) | ✅ | 角色 ID |

**Request Example**:
```http
DELETE /api/users/450e8400-e29b-41d4-a716-446655440001/roles/550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (204 No Content)**:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "角色移除成功",
  "data": null,
  "timestamp": "2025-11-21T10:40:00Z",
  "traceId": "abc123"
}
```

**Error Responses**:

| Code | HTTP Status | 說明 | 範例訊息 |
|------|-------------|------|----------|
| `NOT_FOUND` | 404 | 用戶或角色不存在，或該用戶未擁有此角色 | "找不到指定的用戶角色關聯" |
| `UNAUTHORIZED` | 401 | 未授權 | "未授權，請先登入" |
| `FORBIDDEN` | 403 | 無權限 | "無移除角色權限" |

---

### 12. 查詢用戶的所有有效權限（多角色合併）

**Endpoint**: `GET /api/users/{userId}/roles/permissions`

**描述**: 查詢指定用戶通過所有角色獲得的有效權限（去重合併）

**權限需求**: `permission.read`

**Path Parameters**:

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `userId` | string (UUID) | ✅ | 用戶 ID |

**Request Example**:
```http
GET /api/users/450e8400-e29b-41d4-a716-446655440001/roles/permissions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "查詢成功",
  "data": {
    "userId": "450e8400-e29b-41d4-a716-446655440001",
    "permissions": [
      {
        "id": "650e8400-e29b-41d4-a716-446655440001",
        "permissionCode": "user.read",
        "name": "查看用戶",
        "description": "允許查看用戶列表與詳情",
        "permissionType": "function",
        "createdAt": "2025-11-10T08:00:00Z",
        "updatedAt": null,
        "version": 1
      },
      {
        "id": "650e8400-e29b-41d4-a716-446655440002",
        "permissionCode": "user.create",
        "name": "建立用戶",
        "description": "允許建立新用戶",
        "permissionType": "function",
        "createdAt": "2025-11-10T08:00:00Z",
        "updatedAt": null,
        "version": 1
      }
    ]
  },
  "timestamp": "2025-11-21T10:45:00Z",
  "traceId": "abc123"
}
```

**Error Responses**:

| Code | HTTP Status | 說明 | 範例訊息 |
|------|-------------|------|----------|
| `NOT_FOUND` | 404 | 用戶不存在 | "找不到指定的用戶" |
| `UNAUTHORIZED` | 401 | 未授權 | "未授權，請先登入" |
| `FORBIDDEN` | 403 | 無權限 | "無查詢權限的權限" |

---

## Error Code Reference

### 標準錯誤代碼

| Code | HTTP Status | 說明 | 處理建議 |
|------|-------------|------|----------|
| `SUCCESS` | 200/201/204 | 操作成功 | - |
| `VALIDATION_ERROR` | 400 | 輸入驗證失敗 | 顯示具體的驗證錯誤訊息 |
| `UNAUTHORIZED` | 401 | 未授權 | 導向登入頁面或刷新 Token |
| `FORBIDDEN` | 403 | 無權限 | 顯示權限不足提示 |
| `NOT_FOUND` | 404 | 資源不存在 | 顯示「找不到資源」提示 |
| `CONCURRENT_UPDATE_CONFLICT` | 409 | 樂觀鎖衝突 | 提示用戶重新載入資料後再試 |
| `DUPLICATE_NAME` | 422 | 角色名稱重複 | 提示用戶使用其他名稱 |
| `ROLE_IN_USE` | 422 | 角色正在使用中 | 提示用戶先移除所有用戶的該角色 |
| `INTERNAL_ERROR` | 500 | 系統內部錯誤 | 顯示通用錯誤訊息並記錄日誌 |

---

## Frontend Implementation Guidelines

### 1. API Client 封裝

```typescript
// src/pages/role-management/apis/role.ts
import axios from '@/http/axios'
import type { ApiResponse } from '@@/types/api'
import type { 
  RoleDto, 
  RoleDetailDto, 
  RoleListResponse, 
  CreateRoleRequest,
  UpdateRoleRequest,
  DeleteRoleRequest,
  AssignRolePermissionsRequest
} from '../types'

export const roleApi = {
  /** 查詢角色列表 */
  getRoles(pageNumber = 1, pageSize = 10) {
    return axios.get<ApiResponse<RoleListResponse>>('/api/role', {
      params: { pageNumber, pageSize }
    })
  },
  
  /** 查詢單一角色 */
  getRole(id: string) {
    return axios.get<ApiResponse<RoleDto>>(`/api/role/${id}`)
  },
  
  /** 查詢角色詳細資訊（含權限） */
  getRoleDetail(id: string) {
    return axios.get<ApiResponse<RoleDetailDto>>(`/api/role/${id}/permissions`)
  },
  
  /** 建立角色 */
  createRole(data: CreateRoleRequest) {
    return axios.post<ApiResponse<RoleDto>>('/api/role', data)
  },
  
  /** 更新角色 */
  updateRole(id: string, data: UpdateRoleRequest) {
    return axios.put<ApiResponse<RoleDto>>(`/api/role/${id}`, data)
  },
  
  /** 刪除角色 */
  deleteRole(id: string, data: DeleteRoleRequest) {
    return axios.delete<ApiResponse<null>>(`/api/role/${id}`, { data })
  },
  
  /** 為角色分配權限 */
  assignPermissions(id: string, data: AssignRolePermissionsRequest) {
    return axios.post<ApiResponse<null>>(`/api/role/${id}/permissions`, data)
  },
  
  /** 從角色移除權限 */
  removePermission(roleId: string, permissionId: string) {
    return axios.delete<ApiResponse<null>>(`/api/role/${roleId}/permissions/${permissionId}`)
  }
}
```

### 2. 錯誤處理

```typescript
// src/http/axios.ts 中的全域錯誤處理器擴展
import { ElMessage } from 'element-plus'

const errorHandlers: Record<string, (message: string) => void> = {
  UNAUTHORIZED: () => {
    ElMessage.error('未授權，請重新登入')
    router.push('/login')
  },
  FORBIDDEN: (message) => {
    ElMessage.error(message || '無權限執行此操作')
  },
  NOT_FOUND: (message) => {
    ElMessage.error(message || '找不到指定的資源')
  },
  CONCURRENT_UPDATE_CONFLICT: (message) => {
    ElMessage.warning({
      message: message || '資料已被其他用戶更新，請重新載入後再試',
      duration: 5000,
      showClose: true
    })
  },
  DUPLICATE_NAME: (message) => {
    ElMessage.error(message || '名稱已存在，請使用其他名稱')
  },
  ROLE_IN_USE: (message) => {
    ElMessage.error({
      message: message || '該角色正在使用中，無法刪除',
      duration: 5000,
      showClose: true
    })
  },
  VALIDATION_ERROR: (message) => {
    ElMessage.error(message || '輸入資料格式錯誤')
  }
}

// Response interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const { code, message } = error.response?.data || {}
    const handler = errorHandlers[code]
    if (handler) {
      handler(message)
    } else {
      ElMessage.error('系統錯誤，請稍後再試')
    }
    return Promise.reject(error)
  }
)
```

### 3. TypeScript 型別定義範例

```typescript
// src/pages/role-management/types.ts
export interface RoleDto {
  id: string
  roleName: string
  description: string | null
  createdAt: string
  version: number
}

export interface RoleDetailDto extends RoleDto {
  permissions: PermissionDto[]
}

export interface CreateRoleRequest {
  roleName: string
  description?: string
}

export interface UpdateRoleRequest {
  roleName: string
  description?: string
  version: number
}

export interface DeleteRoleRequest {
  version: number
}

export interface AssignRolePermissionsRequest {
  permissionIds: string[]
}

export interface RoleListResponse {
  items: RoleDto[]
  totalCount: number
  pageNumber: number
  pageSize: number
}
```

---

## Summary

本 API 契約文件涵蓋：
- ✅ 12 個角色管理相關 API 端點
- ✅ 完整的請求/回應範例（含 JSON 格式）
- ✅ 所有錯誤代碼與處理建議
- ✅ 前端實作指引（API Client 封裝、錯誤處理、型別定義）
- ✅ 符合後端 OpenAPI 規格（V3.Admin.Backend.API.yaml）
- ✅ 支援樂觀鎖機制（版本號驗證）
- ✅ 統一的 ApiResponse 回應格式

所有端點均經過後端 API 規格驗證，確保前後端契約一致性。
