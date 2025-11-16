# Data Model: 用戶管理系統

**Feature**: 用戶管理系統
**Date**: 2025-11-16
**Status**: Complete

本文件定義用戶管理功能的資料模型與型別規範。

---

## 實體概覽

用戶管理系統涉及以下核心實體：

1. **User**：用戶實體（對應後端 Account）
2. **Permission**：權限實體
3. **Role**：角色實體（規格中提及，但本階段專注於用戶 CRUD）

---

## 1. User（用戶實體）

### 描述

代表系統的使用者帳號，包含基本資訊、狀態、角色與權限。

### 欄位定義

| 欄位名稱      | 型別      | 必填 | 說明                                | 驗證規則                          | 來源                            |
| ------------- | --------- | ---- | ----------------------------------- | --------------------------------- | ------------------------------- |
| `id`          | `string`  | 是   | 用戶唯一識別碼（UUID）              | -                                 | 後端產生                        |
| `username`    | `string`  | 是   | 帳號名稱（登入用）                  | 3-20 字元，僅允許英數字與底線     | 前端輸入，後端驗證              |
| `displayName` | `string`  | 是   | 顯示名稱                            | 1-100 字元                        | 前端輸入，後端驗證              |
| `password`    | `string`  | 是   | 密碼（僅新增/變更時需要）           | 最少 8 字元，包含大小寫字母與數字 | 前端輸入，後端加密存儲          |
| `status`      | `string`  | 是   | 用戶狀態                            | `active` 或 `inactive`            | 後端管理（刪除時變為 inactive） |
| `createdAt`   | `string`  | 是   | 建立時間（ISO 8601）                | -                                 | 後端產生                        |
| `updatedAt`   | `string?` | 否   | 最後更新時間（ISO 8601，可為 null） | -                                 | 後端產生                        |

### TypeScript 型別定義

```typescript
/**
 * 用戶實體
 * 對應後端 AccountResponse
 */
export interface User {
  /** 用戶唯一識別碼（UUID） */
  id: string
  /** 帳號名稱（登入用） */
  username: string
  /** 顯示名稱 */
  displayName: string
  /** 用戶狀態：active（啟用）、inactive（已停用） */
  status: "active" | "inactive"
  /** 建立時間（ISO 8601） */
  createdAt: string
  /** 最後更新時間（ISO 8601，可為 null） */
  updatedAt: string | null
}

/**
 * 新增用戶請求
 * 對應後端 CreateAccountRequest
 */
export interface CreateUserRequest {
  /** 帳號名稱（3-20 字元，僅英數字與底線） */
  username: string
  /** 密碼（最少 8 字元，包含大小寫字母與數字） */
  password: string
  /** 顯示名稱（1-100 字元） */
  displayName: string
}

/**
 * 更新用戶請求
 * 對應後端 UpdateAccountRequest
 */
export interface UpdateUserRequest {
  /** 顯示名稱（1-100 字元） */
  displayName: string
}

/**
 * 變更密碼請求
 * 對應後端 ChangePasswordRequest
 */
export interface ChangePasswordRequest {
  /** 舊密碼 */
  oldPassword: string
  /** 新密碼（最少 8 字元，包含大小寫字母與數字） */
  newPassword: string
}

/**
 * 刪除用戶請求
 * 對應後端 DeleteAccountRequest
 */
export interface DeleteUserRequest {
  /** 確認訊息（必須為 "CONFIRM"） */
  confirmation: "CONFIRM"
}

/**
 * 用戶列表查詢參數
 */
export interface UserListParams {
  /** 頁碼（從 1 開始） */
  pageNumber: number
  /** 每頁筆數（1-100） */
  pageSize: number
  /** 搜尋關鍵字（可選，搜尋用戶名或顯示名稱） */
  searchKeyword?: string
  /** 狀態篩選（可選） */
  status?: "active" | "inactive"
}

/**
 * 用戶列表回應
 * 對應後端 AccountListResponse
 */
export interface UserListResponse {
  /** 用戶清單 */
  items: User[]
  /** 總筆數 */
  totalCount: number
  /** 當前頁碼 */
  pageNumber: number
  /** 每頁筆數 */
  pageSize: number
  /** 總頁數 */
  totalPages: number
}
```

---

## 2. Permission（權限實體）

### 描述

定義系統的權限項目，包含路由權限與功能權限。

### 欄位定義

| 欄位名稱         | 型別      | 必填 | 說明                         | 驗證規則              | 來源     |
| ---------------- | --------- | ---- | ---------------------------- | --------------------- | -------- |
| `id`             | `string`  | 是   | 權限唯一識別碼（UUID）       | -                     | 後端產生 |
| `permissionCode` | `string`  | 是   | 權限代碼（如 `user:create`） | 最多 100 字元         | 前端定義 |
| `name`           | `string`  | 是   | 權限名稱（如「新增用戶」）   | 最多 200 字元         | 前端定義 |
| `description`    | `string?` | 否   | 權限描述                     | -                     | 前端定義 |
| `permissionType` | `string`  | 是   | 權限類型                     | `route` 或 `function` | 前端定義 |
| `routePath`      | `string?` | 否   | 路由路徑（僅路由權限需要）   | 最多 500 字元         | 前端定義 |
| `createdAt`      | `string`  | 是   | 建立時間（ISO 8601）         | -                     | 後端產生 |
| `updatedAt`      | `string?` | 否   | 最後更新時間（ISO 8601）     | -                     | 後端產生 |
| `version`        | `number`  | 是   | 版本號（樂觀鎖）             | -                     | 後端管理 |

### TypeScript 型別定義

```typescript
/**
 * 權限實體
 * 對應後端 PermissionDto
 */
export interface Permission {
  /** 權限唯一識別碼（UUID） */
  id: string
  /** 權限代碼（如 user:create） */
  permissionCode: string
  /** 權限名稱（如「新增用戶」） */
  name: string
  /** 權限描述 */
  description: string | null
  /** 權限類型：route（路由權限）、function（功能權限） */
  permissionType: "route" | "function"
  /** 路由路徑（僅路由權限需要） */
  routePath: string | null
  /** 建立時間（ISO 8601） */
  createdAt: string
  /** 最後更新時間（ISO 8601） */
  updatedAt: string | null
  /** 版本號（樂觀鎖） */
  version: number
}

/**
 * 用戶管理模組權限常數
 */
export const USER_PERMISSIONS = {
  /** 查看用戶列表（路由權限） */
  VIEW: "user:view",
  /** 新增用戶（功能權限） */
  CREATE: "user:create",
  /** 修改用戶（功能權限） */
  UPDATE: "user:update",
  /** 刪除用戶（功能權限） */
  DELETE: "user:delete",
  /** 匯出報表（功能權限） */
  EXPORT: "user:export"
} as const
```

---

## 3. API Response（API 回應格式）

### 描述

所有 API 回應都遵循統一的 `ApiResponseModel<T>` 格式。

### TypeScript 型別定義

```typescript
/**
 * API 統一回應格式
 * 對應後端 ApiResponse
 */
export interface ApiResponse<T = any> {
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

/**
 * API 業務邏輯代碼
 */
export enum ApiCode {
  SUCCESS = "SUCCESS",
  CREATED = "CREATED",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  USERNAME_EXISTS = "USERNAME_EXISTS",
  CANNOT_DELETE_SELF = "CANNOT_DELETE_SELF",
  LAST_ACCOUNT_CANNOT_DELETE = "LAST_ACCOUNT_CANNOT_DELETE",
  CONCURRENT_UPDATE_CONFLICT = "CONCURRENT_UPDATE_CONFLICT",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  PASSWORD_SAME_AS_OLD = "PASSWORD_SAME_AS_OLD",
  INTERNAL_ERROR = "INTERNAL_ERROR"
}
```

---

## 4. 狀態轉換

### User Status 狀態轉換圖

```
[新增用戶]
    ↓
┌─────────┐
│ active  │ ←→ [修改資訊]
│ (啟用)  │
└─────────┘
    ↓ [刪除操作]
┌──────────┐
│ inactive │ (不可逆)
│ (已停用) │
└──────────┘
```

### 說明

- **active（啟用）**：用戶正常狀態，可登入系統，可執行所有操作
- **inactive（已停用）**：用戶被刪除（軟刪除），無法登入，但資料保留用於稽核
- **狀態轉換規則**：
  - 新增用戶預設為 `active`
  - 修改用戶資訊不改變狀態
  - 刪除操作將狀態改為 `inactive`（不可逆，無法再次啟用）

---

## 5. 驗證規則摘要

### 前端驗證（即時反饋）

| 欄位          | 規則                                    |
| ------------- | --------------------------------------- |
| `username`    | 必填、3-20 字元、僅允許英數字與底線     |
| `password`    | 必填、最少 8 字元、包含大小寫字母與數字 |
| `displayName` | 必填、1-100 字元                        |

### 後端驗證（最終檢查）

| 規則         | 說明                                       |
| ------------ | ------------------------------------------ |
| 用戶名唯一性 | 不可重複創建相同用戶名                     |
| 密碼複雜度   | 符合安全策略（8 字元 + 大小寫字母 + 數字） |
| 刪除權限檢查 | 不可刪除當前登入帳號與最後一個帳號         |
| 並發更新檢查 | 樂觀鎖機制，防止並發衝突                   |

---

## 6. Excel 匯出資料結構

### 描述

匯出的 Excel 檔案包含當前查詢的用戶資料。

### 欄位對應

| Excel 欄位名稱 | 資料來源      | 格式化規則                                          |
| -------------- | ------------- | --------------------------------------------------- |
| 用戶名         | `username`    | 原始值                                              |
| 顯示名稱       | `displayName` | 原始值                                              |
| 狀態           | `status`      | `active` → "啟用", `inactive` → "已停用"            |
| 建立時間       | `createdAt`   | ISO 8601 → "YYYY-MM-DD HH:mm:ss"                    |
| 最後更新時間   | `updatedAt`   | ISO 8601 → "YYYY-MM-DD HH:mm:ss"（null 顯示為 "-"） |

### TypeScript 型別定義

```typescript
/**
 * Excel 匯出資料結構
 */
export interface UserExportData {
  /** 用戶名 */
  用戶名: string
  /** 顯示名稱 */
  顯示名稱: string
  /** 狀態 */
  狀態: "啟用" | "已停用"
  /** 建立時間 */
  建立時間: string
  /** 最後更新時間 */
  最後更新時間: string
}
```

---

## 總結

資料模型設計完成，主要成果包括：

1. **User 實體**：完整的用戶資料結構與驗證規則
2. **Permission 實體**：權限定義與常數
3. **API Response**：統一回應格式與業務邏輯代碼
4. **狀態轉換**：清晰的用戶狀態流轉規則
5. **驗證規則**：前端與後端驗證分工明確
6. **Excel 匯出**：結構化的匯出資料格式

所有型別定義均符合後端 API 契約（V3.Admin.Backend.API.yaml），可進入 contracts 與 quickstart 生成階段。
