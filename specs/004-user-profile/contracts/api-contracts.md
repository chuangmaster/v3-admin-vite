# API Contracts: 用戶個人資料與選單權限管理

**Date**: 2026-01-16  
**Feature**: 004-user-profile  
**Backend API Spec**: http://localhost:5176/swagger/v1/swagger.json

---

## 概述

本文件定義前端與後端 API 的契約規範，所有端點均遵循後端 OpenAPI 規格 (V3.Admin.Backend.API.yaml)。

---

## 1. 查詢當前用戶個人資料

### Endpoint
```
GET /api/Account/me
```

### 描述
允許已登入用戶查詢自己的個人資料，包含用戶名稱、顯示名稱和角色清單。

### 權限
- **需要**: `user.profile.read`
- **Authentication**: JWT Bearer Token

### Request

#### Headers
```
Authorization: Bearer {jwt_token}
```

#### Query Parameters
無

#### Request Body
無

### Response

#### Success (200 OK)
```typescript
{
  "success": true,
  "code": "SUCCESS",
  "message": "查詢成功",
  "data": {
    "account": "admin",           // 帳號
    "displayName": "管理員",      // 顯示名稱
    "roles": ["系統管理員"],      // 角色名稱清單
    "permissions": [              // 權限代碼清單 (聚合所有角色權限，去重)
      "user.read",
      "user.create",
      "permission.read"
    ]
  },
  "timestamp": "2026-01-16T10:30:00Z",
  "traceId": "abc123"
}
```

**Data Schema**: `UserProfileResponse`
- `account`: string | null - 帳號
- `displayName`: string | null - 顯示名稱
- `roles`: string[] - 角色名稱清單 (若無角色則為空陣列)
- `permissions`: string[] - 權限代碼清單 (若無權限則為空陣列)

#### Error Responses

**401 Unauthorized** - Token 無效、過期或用戶已停用
```typescript
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "未授權 - Token 無效、過期或用戶已停用",
  "data": null,
  "timestamp": "2026-01-16T10:30:00Z",
  "traceId": "abc123"
}
```

**403 Forbidden** - 無 `user.profile.read` 權限
```typescript
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "禁止存取 - 無 user.profile.read 權限",
  "data": null,
  "timestamp": "2026-01-16T10:30:00Z",
  "traceId": "abc123"
}
```

**404 Not Found** - 用戶不存在
```typescript
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "用戶不存在",
  "data": null,
  "timestamp": "2026-01-16T10:30:00Z",
  "traceId": "abc123"
}
```

### 前端處理邏輯

```typescript
// @/common/apis/account/profile.ts
export async function getUserProfile(): Promise<ApiResponse<UserProfileResponse>> {
  return request({
    url: "/api/Account/me",
    method: "GET"
  })
}

// 使用範例
try {
  const response = await getUserProfile()
  if (response.success && response.data) {
    userStore.profile = response.data
  } else {
    ElMessage.error(response.message || "載入個人資料失敗")
  }
} catch (error) {
  console.error("getUserProfile error:", error)
  ElMessage.error("網路連線錯誤")
}
```

---

## 2. 變更密碼

### Endpoint
```
PUT /api/Account/{id}/password
```

### 描述
變更指定帳號的密碼，需要提供舊密碼與新密碼。變更成功後，該用戶的其他 session 將失效。

### 權限
- **需要**: 用戶本人或具有 `user.update` 權限
- **Authentication**: JWT Bearer Token

### Request

#### Path Parameters
- `id` (string, required): 帳號 ID (UUID 格式)

#### Query Parameters
- `version` (integer, optional): 版本號 (預設 1，用於樂觀並發控制)

#### Headers
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

#### Request Body
```typescript
{
  "oldPassword": "OldPass123",
  "newPassword": "NewPass456"
}
```

**Schema**: `ChangePasswordRequest`
- `oldPassword`: string (required) - 舊密碼
- `newPassword`: string (required) - 新密碼

### Response

#### Success (200 OK)
```typescript
{
  "success": true,
  "code": "SUCCESS",
  "message": "變更成功",
  "data": null,
  "timestamp": "2026-01-16T10:35:00Z",
  "traceId": "def456"
}
```

#### Error Responses

**400 Bad Request** - 輸入驗證錯誤
```typescript
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "輸入驗證錯誤",
  "data": null,
  "timestamp": "2026-01-16T10:35:00Z",
  "traceId": "def456"
}
```

**401 Unauthorized** - 未授權或舊密碼錯誤
```typescript
{
  "success": false,
  "code": "OLD_PASSWORD_INCORRECT", // 或 "UNAUTHORIZED"
  "message": "未授權或舊密碼錯誤",
  "data": null,
  "timestamp": "2026-01-16T10:35:00Z",
  "traceId": "def456"
}
```

**404 Not Found** - 帳號不存在
```typescript
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "帳號不存在",
  "data": null,
  "timestamp": "2026-01-16T10:35:00Z",
  "traceId": "def456"
}
```

**409 Conflict** - 並發更新衝突
```typescript
{
  "success": false,
  "code": "CONCURRENT_UPDATE_CONFLICT",
  "message": "並發更新衝突",
  "data": null,
  "timestamp": "2026-01-16T10:35:00Z",
  "traceId": "def456"
}
```

**422 Unprocessable Entity** - 新密碼與舊密碼相同
```typescript
{
  "success": false,
  "code": "SAME_AS_OLD_PASSWORD",
  "message": "新密碼與舊密碼相同",
  "data": null,
  "timestamp": "2026-01-16T10:35:00Z",
  "traceId": "def456"
}
```

### 前端處理邏輯

```typescript
// @/common/apis/account/profile.ts
export async function changePassword(
  id: string,
  data: ChangePasswordRequest,
  version: number = 1
): Promise<ApiResponse<null>> {
  return request({
    url: `/api/Account/${id}/password?version=${version}`,
    method: "PUT",
    data
  })
}

// 使用範例
async function handleChangePassword(formData: ChangePasswordFormData) {
  // 前端驗證
  if (formData.newPassword !== formData.confirmPassword) {
    ElMessage.error("兩次密碼輸入不一致")
    return
  }

  try {
    const userId = userStore.profile?.id // 假設 profile 包含 id
    const version = userStore.profile?.version || 1
    
    const response = await changePassword(
      userId!,
      {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword
      },
      version
    )

    if (response.success) {
      ElMessage.success("密碼修改成功")
      // 不執行登出，保持當前 session
    } else {
      // 根據錯誤碼顯示對應訊息
      switch (response.code) {
        case "OLD_PASSWORD_INCORRECT":
          ElMessage.error("舊密碼不正確")
          break
        case "SAME_AS_OLD_PASSWORD":
          ElMessage.warning("新密碼與舊密碼相同")
          // 允許繼續，不阻擋提交
          break
        case "CONCURRENT_UPDATE_CONFLICT":
          ElMessage.error("資料已被修改，請重新整理")
          break
        default:
          ElMessage.error(response.message || "密碼修改失敗")
      }
    }
  } catch (error) {
    console.error("changePassword error:", error)
    ElMessage.error("網路連線錯誤")
  }
}
```

---

## 標準 API 回應格式

所有 API 端點均遵循統一的 `ApiResponseModel<T>` 格式：

```typescript
interface ApiResponseModel<T = any> {
  /** 操作是否成功 (通常與 HTTP 狀態碼對應) */
  success: boolean
  
  /** 業務邏輯代碼，用於細分不同的業務場景 */
  code: string
  
  /** 響應訊息 (繁體中文) */
  message: string
  
  /** 回應資料 (可為 null) */
  data: T | null
  
  /** 回應時間戳記 (ISO 8601, UTC) */
  timestamp: string
  
  /** 分散式追蹤 ID */
  traceId: string
}
```

### 業務錯誤碼清單

| Code | HTTP Status | Description | Frontend Action |
|------|-------------|-------------|-----------------|
| `SUCCESS` | 200/201 | 操作成功 | 顯示成功訊息 |
| `VALIDATION_ERROR` | 400 | 輸入驗證錯誤 | 顯示驗證錯誤訊息 |
| `UNAUTHORIZED` | 401 | 未授權 | 導向登入頁 |
| `FORBIDDEN` | 403 | 禁止存取 | 顯示權限不足訊息 |
| `NOT_FOUND` | 404 | 資源不存在 | 顯示找不到訊息 |
| `CONCURRENT_UPDATE_CONFLICT` | 409 | 並發衝突 | 提示重新載入 |
| `SAME_AS_OLD_PASSWORD` | 422 | 新舊密碼相同 | 顯示警告 (不阻擋) |
| `OLD_PASSWORD_INCORRECT` | 401 | 舊密碼錯誤 | 標記欄位錯誤 |

---

## 前端 Axios 請求攔截器配置

```typescript
// @/http/axios.ts

// Request Interceptor
request.interceptors.request.use(
  (config) => {
    const token = userStore.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor
request.interceptors.response.use(
  (response) => response.data, // 直接回傳 ApiResponseModel
  (error) => {
    if (error.response?.status === 401) {
      // Token 失效，清除用戶資料並導向登入頁
      userStore.clearUser()
      router.push("/login")
    }
    return Promise.reject(error)
  }
)
```

---

## 總結

### API 端點清單
1. **GET /api/Account/me**: 查詢當前用戶個人資料
2. **PUT /api/Account/{id}/password**: 變更密碼

### 關鍵約定
- **認證方式**: JWT Bearer Token (所有端點除 `/api/Auth/login` 外均需要)
- **回應格式**: 統一使用 `ApiResponseModel<T>`
- **錯誤處理**: 根據 `code` 欄位對應前端訊息
- **時區**: 所有時間戳記使用 UTC (ISO 8601 格式)
- **樂觀鎖定**: 修改操作需帶 `version` 參數

### 前端實作要點
- 所有 API 呼叫均透過 `@/http/axios` 的 `request` 函式
- 統一錯誤處理於 Axios 攔截器
- 業務錯誤碼對應繁體中文訊息於元件層級
- Session 失效自動導向登入頁 (401 攔截器)
