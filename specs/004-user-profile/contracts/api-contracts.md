# API Contracts: 用戶個人資料與密碼管理

**Date**: 2026-01-19  
**Feature**: 004-user-profile  
**Status**: ✅ Complete

## Overview

本文件定義前端與後端 API 的介面合約，確保雙方對資料格式、錯誤處理與業務邏輯的一致理解。所有 API 遵循 `V3.Admin.Backend.API.yaml` 規格。

---

## API Endpoints

### 1. 取得當前用戶資訊

**Endpoint**: `GET /api/Account/me`

**描述**: 取得當前登入用戶的完整個人資料，包含帳號、顯示名稱、角色、權限與版本號。

**Authorization**: ✅ Required (JWT Bearer Token)

#### Request

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Query Parameters**: 無

**Request Body**: 無

---

#### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "操作成功",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "account": "john.doe",
    "displayName": "John Doe",
    "roles": ["Admin", "User"],
    "permissions": [
      "account.read",
      "account.write",
      "permission.read",
      "role.read"
    ],
    "version": 5
  },
  "timestamp": "2026-01-19T10:30:00.000Z",
  "traceId": "abc123def456"
}
```

**Error Responses**:

| Status Code | Code | Message | 處理方式 |
|------------|------|---------|---------|
| 401 Unauthorized | `UNAUTHORIZED` | "未授權或 Token 已過期" | 重導至登入頁面 |
| 500 Internal Server Error | `INTERNAL_ERROR` | "伺服器內部錯誤" | 顯示通用錯誤訊息 |

**Error Response Example (401)**:
```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "未授權或 Token 已過期",
  "data": null,
  "timestamp": "2026-01-19T10:30:00.000Z",
  "traceId": "xyz789abc123"
}
```

---

#### Frontend Integration

**API Function** (`@/common/apis/users/index.ts`):
```typescript
import type { UserProfile } from '@/pages/profile/types'
import { request } from '@/http/axios'

/** 取得當前登入用戶詳情 */
export function getCurrentUserApi() {
  return request<ApiResponse<UserProfile>>({
    url: '/Account/me',
    method: 'get'
  })
}
```

**Usage Example**:
```typescript
// 在組合式函式中使用
const fetchUserProfile = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await getCurrentUserApi()
    if (response.success) {
      userInfo.value = response.data
    } else {
      error.value = response.message
    }
  } catch (err: any) {
    if (err.response?.status === 401) {
      // 重導至登入頁面
      router.push('/login')
    } else {
      error.value = '載入用戶資料失敗，請稍後再試'
    }
  } finally {
    loading.value = false
  }
}
```

---

### 2. 修改密碼

**Endpoint**: `PUT /api/Account/{id}/password`

**描述**: 更新指定用戶的密碼，需提供舊密碼驗證與版本號進行併發控制。

**Authorization**: ✅ Required (JWT Bearer Token)

#### Request

**Path Parameters**:
| 參數 | 型別 | 描述 | 範例 |
|-----|------|------|------|
| `id` | `string` (UUID) | 用戶 ID（來自 `/api/Account/me` 回應） | `3fa85f64-5717-4562-b3fc-2c963f66afa6` |

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "oldPassword": "CurrentP@ssw0rd",
  "newPassword": "NewSecureP@ss123",
  "version": 5
}
```

**Field Descriptions**:
| 欄位 | 型別 | 必填 | 描述 | 驗證規則 |
|-----|------|------|------|---------|
| `oldPassword` | `string` | ✅ | 當前密碼 | 必填，後端驗證正確性 |
| `newPassword` | `string` | ✅ | 新密碼 | 必填，後端驗證強度規則 |
| `version` | `number` | ✅ | 資料版本號 | 整數，用於併發控制 |

---

#### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "密碼修改成功",
  "data": null,
  "timestamp": "2026-01-19T10:35:00.000Z",
  "traceId": "def456ghi789"
}
```

**Error Responses**:

| Status Code | Code | Message | 描述 | 前端處理 |
|------------|------|---------|------|---------|
| 400 Bad Request | `VALIDATION_ERROR` | "新密碼不符合安全規範" | 密碼強度不足 | 顯示具體錯誤訊息 |
| 401 Unauthorized | `INVALID_OLD_PASSWORD` | "舊密碼不正確" | 舊密碼驗證失敗 | 提示用戶重新輸入 |
| 409 Conflict | `CONCURRENT_UPDATE_CONFLICT` | "資料已被修改，請重新整理" | 版本號不匹配 | 重新載入用戶資料 |
| 500 Internal Server Error | `INTERNAL_ERROR` | "伺服器內部錯誤" | 未預期錯誤 | 顯示通用錯誤訊息 |

**Error Response Example (409 Conflict)**:
```json
{
  "success": false,
  "code": "CONCURRENT_UPDATE_CONFLICT",
  "message": "資料已被修改，請重新整理後再試",
  "data": null,
  "timestamp": "2026-01-19T10:35:00.000Z",
  "traceId": "ghi789jkl012"
}
```

**Error Response Example (401 Invalid Password)**:
```json
{
  "success": false,
  "code": "INVALID_OLD_PASSWORD",
  "message": "舊密碼不正確，請重新輸入",
  "data": null,
  "timestamp": "2026-01-19T10:35:00.000Z",
  "traceId": "jkl012mno345"
}
```

---

#### Frontend Integration

**API Function** (`@/pages/user-management/apis/user.ts`):
```typescript
import type { ChangePasswordRequest } from '@/pages/profile/types'
import { request } from '@/http/axios'

/**
 * 變更密碼
 * @param request - 變更密碼請求資料（包含 id, oldPassword, newPassword, version）
 * @returns 變更結果（data 為 null）
 */
export async function changePassword(
  request: ChangePasswordRequest
): Promise<ApiResponse<null>> {
  const { id, ...data } = request
  return request({ 
    url: `/account/${id}/password`, 
    method: 'PUT', 
    data 
  })
}
```

**Usage Example**:
```typescript
// 在組合式函式中使用
const handleSubmit = async (userId: string, version: number) => {
  // 表單驗證
  const isValid = await validateForm()
  if (!isValid) return
  
  submitting.value = true
  
  try {
    const response = await changePassword({
      id: userId,
      oldPassword: formData.oldPassword,
      newPassword: formData.newPassword,
      version
    })
    
    if (response.success) {
      ElMessage.success('密碼修改成功')
      handleReset()
      // 重新載入用戶資料
      emit('password-changed')
    } else {
      ElMessage.error(response.message)
    }
  } catch (err: any) {
    const status = err.response?.status
    const code = err.response?.data?.code
    
    if (status === 409 && code === 'CONCURRENT_UPDATE_CONFLICT') {
      ElMessage.error('資料已被其他使用者修改，請重新整理後再試')
      emit('refresh-required')
    } else if (status === 401 && code === 'INVALID_OLD_PASSWORD') {
      ElMessage.error('舊密碼不正確，請重新輸入')
    } else {
      ElMessage.error('密碼修改失敗，請稍後再試')
    }
  } finally {
    submitting.value = false
  }
}
```

---

## Data Type Specifications

### TypeScript Type Definitions

```typescript
// 位置：@/pages/profile/types.ts

/** API 標準回應格式 */
export interface ApiResponse<T> {
  success: boolean
  code: string
  message: string
  data: T
  timestamp: string
  traceId: string
}

/** 用戶資料實體（對應 /api/Account/me 回應） */
export interface UserProfile {
  id: string                // UUID v4
  account: string           // 用戶帳號
  displayName: string       // 顯示名稱
  roles: string[]           // 角色列表
  permissions: string[]     // 權限列表
  version: number           // 資料版本號
}

/** 密碼修改請求（對應 PUT /api/Account/{id}/password） */
export interface ChangePasswordRequest {
  oldPassword: string       // 當前密碼
  newPassword: string       // 新密碼
  version: number           // 資料版本號
}

/** 密碼修改表單（含前端驗證欄位） */
export interface ChangePasswordFormData {
  oldPassword: string
  newPassword: string
  confirmPassword: string   // 僅用於前端驗證，不傳送至後端
}
```

---

## Business Rules

### 1. 密碼強度規則（後端實作）

**預期規則**（根據一般實務）:
- 最小長度：6 字元
- 必須包含：字母與數字
- 可選：特殊字元（`@`, `#`, `$`, `%`, `&`, `*`）
- 禁止：與舊密碼相同（後端警告，但允許設定）

**前端驗證** (部分規則前置檢查):
```typescript
{
  min: 6,
  pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
  message: '密碼至少 6 字元，且包含字母與數字'
}
```

**後端驗證** (完整規則):
- 檢查密碼強度（複雜度）
- 檢查是否與舊密碼相同（可選警告）
- 檢查是否為常見弱密碼（如 `123456`）

---

### 2. 併發控制規則

**樂觀鎖機制**:
1. 前端從 `/api/Account/me` 取得 `version` 值
2. 用戶修改密碼時，將 `version` 一併傳送
3. 後端比對資料庫版本號：
   - **一致** → 執行更新 → 版本號 +1
   - **不一致** → 拒絕更新 → 回傳 `409 Conflict`
4. 前端處理衝突：
   - 顯示錯誤訊息
   - 重新載入用戶資料（取得最新 `version`）
   - 提示用戶重新提交

**衝突場景**:
- 同一用戶在多個裝置同時修改密碼
- 系統管理員與用戶同時修改同一帳號

---

### 3. Session 管理規則

**密碼修改後的 Session 處理**:
- **當前 Session**（修改密碼的裝置）：保持登入狀態
- **其他 Session**（其他裝置/瀏覽器）：失效，需重新登入

**實作方式**（後端負責）:
- 方案 A：JWT Token 黑名單（記錄失效的 Token）
- 方案 B：更新 Token Secret（使所有舊 Token 失效，發放新 Token 給當前裝置）
- 方案 C：Session ID 管理（記錄所有 Session，失效除當前外的所有 Session）

**前端職責**:
- 修改成功後顯示提示：「密碼已更新，其他裝置需重新登入」
- 無需額外邏輯（後端自動處理）

---

## Error Handling Matrix

| 場景 | HTTP Status | Error Code | 前端處理 | 用戶提示 |
|-----|------------|------------|---------|---------|
| 舊密碼錯誤 | 401 | `INVALID_OLD_PASSWORD` | 清空密碼欄位，焦點回到舊密碼欄位 | "舊密碼不正確，請重新輸入" |
| 新密碼強度不足 | 400 | `VALIDATION_ERROR` | 高亮新密碼欄位，顯示具體規則 | "密碼至少 6 字元，需包含字母與數字" |
| 併發衝突 | 409 | `CONCURRENT_UPDATE_CONFLICT` | 重新載入用戶資料，清空表單 | "資料已被修改，請重新整理後再試" |
| Token 過期 | 401 | `UNAUTHORIZED` | 重導至登入頁面 | "登入已過期，請重新登入" |
| 網路錯誤 | - | - | 顯示重試按鈕 | "網路連線異常，請檢查網路後重試" |
| 伺服器錯誤 | 500 | `INTERNAL_ERROR` | 記錄錯誤日誌，顯示通用訊息 | "系統暫時無法處理，請稍後再試" |

---

## Testing Scenarios

### API 整合測試

**Test Case 1: 取得用戶資料成功**
```typescript
describe('GET /api/Account/me', () => {
  it('should return user profile with version', async () => {
    const response = await getCurrentUserApi()
    
    expect(response.success).toBe(true)
    expect(response.data).toHaveProperty('id')
    expect(response.data).toHaveProperty('version')
    expect(typeof response.data.version).toBe('number')
  })
})
```

**Test Case 2: 修改密碼成功**
```typescript
describe('PUT /api/Account/{id}/password', () => {
  it('should change password successfully', async () => {
    const userId = 'test-user-id'
    const request: ChangePasswordRequest = {
      oldPassword: 'OldPass123',
      newPassword: 'NewPass456',
      version: 1
    }
    
    const response = await changePassword(userId, request)
    
    expect(response.success).toBe(true)
    expect(response.message).toContain('成功')
  })
})
```

**Test Case 3: 併發衝突處理**
```typescript
describe('Concurrent Update Handling', () => {
  it('should handle 409 conflict error', async () => {
    const userId = 'test-user-id'
    const request: ChangePasswordRequest = {
      oldPassword: 'OldPass123',
      newPassword: 'NewPass456',
      version: 1  // 過期的版本號
    }
    
    try {
      await changePassword(userId, request)
      fail('Should throw error')
    } catch (error: any) {
      expect(error.response.status).toBe(409)
      expect(error.response.data.code).toBe('CONCURRENT_UPDATE_CONFLICT')
    }
  })
})
```

---

## API Contract Checklist

✅ **所有 API 遵循 `ApiResponseModel<T>` 格式**  
✅ **使用 JWT Bearer Token 認證（除 `/api/auth/login`）**  
✅ **錯誤代碼定義明確（`SUCCESS`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `CONCURRENT_UPDATE_CONFLICT`）**  
✅ **併發控制使用 `version` 欄位**  
✅ **分頁參數標準化（本功能不涉及分頁）**  
✅ **請求/回應型別與 Schema 定義一致**  
✅ **不假設或發明未在規格中的 API 行為**  
✅ **API 需求不明確時，優先參考規格文件**

---

**Phase 1.2 Complete** ✅  
**Next**: 建立 `quickstart.md`
