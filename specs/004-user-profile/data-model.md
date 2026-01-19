# Data Model: 用戶個人資料與密碼管理

**Date**: 2026-01-19  
**Feature**: 004-user-profile  
**Status**: ✅ Complete

## Overview

本文件定義「用戶個人資料與密碼管理」功能的資料實體、欄位定義、關聯關係與狀態轉換規則。

---

## Entities

### 1. UserProfile（用戶資料實體）

**描述**: 代表當前登入用戶的個人資料，用於頁面顯示。

**來源**: API `/api/Account/me`

#### Fields

| 欄位名稱 | 型別 | 必填 | 描述 | 驗證規則 |
|---------|------|------|------|---------|
| `id` | `string` (UUID) | ✅ | 用戶唯一識別碼 | UUID v4 格式 |
| `account` | `string` | ✅ | 用戶帳號（登入名稱） | 1-50 字元，英數字與底線 |
| `displayName` | `string` | ✅ | 用戶顯示名稱 | 1-100 字元 |
| `roles` | `string[]` | ✅ | 用戶角色列表 | 至少一個角色 |
| `permissions` | `string[]` | ✅ | 用戶權限列表 | 可為空陣列 |
| `version` | `number` | ✅ | 資料版本號（併發控制） | 整數，≥ 0 |

#### Relationships

- **無直接關聯** - 此實體為視圖模型，不包含其他實體引用
- **間接關聯** - `roles` 與 `permissions` 為字串陣列，對應後端角色與權限系統

#### State Transitions

```
[初始狀態] → [載入中] → [已載入] → [更新中] → [已更新]
                ↓            ↓           ↓
              [載入失敗]  [顯示資料]  [更新失敗]
```

**狀態說明**:
- **初始狀態**: 頁面進入前，無資料
- **載入中**: 呼叫 API `/api/Account/me`
- **已載入**: API 回應成功，資料填充至 UI
- **更新中**: 用戶修改資料（如密碼）時觸發
- **已更新**: 修改成功，可選重新載入資料

---

### 2. ChangePasswordRequest（密碼修改請求實體）

**描述**: 用戶修改密碼時提交的表單資料。

**目標**: API `PUT /api/Account/{id}/password`

#### Fields

| 欄位名稱 | 型別 | 必填 | 描述 | 驗證規則 |
|---------|------|------|------|---------|
| `id` | `string` (UUID) | ✅ | 用戶 ID | 來自 `UserProfile.id` |
| `oldPassword` | `string` | ✅ | 當前密碼 | 必填，前端不驗證格式（後端驗證） |
| `newPassword` | `string` | ✅ | 新密碼 | 必填，最小長度 6 字元（可配置） |
| `confirmPassword` | `string` | ✅ (前端) | 確認新密碼 | 必須與 `newPassword` 一致 |
| `version` | `number` | ✅ | 資料版本號 | 來自 `UserProfile.version` |

**注意事項**:
- `confirmPassword` 僅用於前端驗證，不傳送至後端
- `version` 用於併發控制，從 `UserProfile` 取得

#### Validation Rules

**前端驗證**:
```typescript
{
  oldPassword: [
    { required: true, message: '請輸入舊密碼', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '請輸入新密碼', trigger: 'blur' },
    { min: 6, message: '密碼長度至少 6 字元', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: '密碼必須包含字母與數字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '請再次輸入新密碼', trigger: 'blur' },
    { validator: validatePasswordMatch, trigger: 'blur' }
  ]
}
```

**後端驗證**（預期）:
- 舊密碼正確性（與資料庫比對）
- 新密碼強度規則（由後端定義）
- 版本號一致性（併發控制）

#### State Transitions

```
[表單初始] → [輸入中] → [驗證中] → [提交中] → [提交成功]
                ↓          ↓          ↓
            [未填寫]  [驗證失敗]  [提交失敗]
                                      ↓
                                [顯示錯誤訊息]
```

**錯誤處理**:
- **400 Bad Request**: 輸入格式錯誤（如密碼太短）
- **401 Unauthorized**: 舊密碼不正確
- **409 Conflict**: 版本號不匹配（併發衝突）
- **500 Internal Server Error**: 伺服器錯誤

---

## Frontend State Management

### Pinia Store: `useUserStore`

**現有狀態**（需擴展）:
```typescript
// 位置：@/pinia/stores/user.ts
{
  token: string           // JWT Token
  roles: string[]         // 用戶角色
  permissions: string[]   // 用戶權限
  username: string        // 用戶名稱（待改為 account）
}
```

**擴展需求**:
```typescript
{
  // 新增欄位
  userId: string          // 用戶 ID（來自 API）
  displayName: string     // 顯示名稱
  version: number         // 資料版本號
  
  // 現有欄位（語義調整）
  account: string         // 重新命名 username → account
}
```

**新增 Actions**:
```typescript
// 更新用戶資料（密碼修改後重新載入）
async refreshUserInfo(): Promise<void>

// 設定用戶完整資訊（從 API 回應）
setUserInfo(data: UserProfile): void
```

---

### Component State: `useUserProfile`

**組合式函式** (`@/pages/profile/composables/useUserProfile.ts`)

**狀態定義**:
```typescript
interface UserProfileState {
  // 資料狀態
  userInfo: Ref<UserProfile | null>
  
  // UI 狀態
  loading: Ref<boolean>
  error: Ref<string | null>
  
  // 方法
  fetchUserProfile: () => Promise<void>
  refreshProfile: () => Promise<void>
}
```

**資料流**:
```
[頁面載入] → fetchUserProfile() 
    ↓
[呼叫 API] → getCurrentUserApi() 
    ↓
[更新狀態] → userInfo.value = response.data
    ↓
[渲染 UI] → UserInfoCard 顯示資料
```

---

### Component State: `useChangePasswordForm`

**組合式函式** (`@/pages/profile/composables/useChangePassword.ts`)

**狀態定義**:
```typescript
interface ChangePasswordState {
  // 表單資料
  formData: {
    oldPassword: string
    newPassword: string
    confirmPassword: string
  }
  
  // 表單引用
  formRef: Ref<FormInstance | undefined>
  
  // UI 狀態
  submitting: Ref<boolean>
  
  // 驗證規則
  rules: FormRules
  
  // 方法
  handleSubmit: (userId: string, version: number) => Promise<void>
  handleReset: () => void
  validateForm: () => Promise<boolean>
}
```

**資料流**:
```
[用戶輸入] → formData.newPassword 
    ↓
[表單驗證] → validateForm() 
    ↓
[提交表單] → handleSubmit()
    ↓
[呼叫 API] → changePassword({ id: userId, oldPassword, newPassword, version })
    ↓
[成功回應] → ElMessage.success() + 重置表單
    ↓
[失敗回應] → 顯示錯誤訊息
    ├─ 409 Conflict → 提示重新載入資料
    └─ 其他錯誤 → 顯示具體錯誤訊息
```

---

## Type Definitions

### Frontend Types (TypeScript)

```typescript
// 位置：@/pages/profile/types.ts

/** 用戶資料實體 */
export interface UserProfile {
  id: string
  account: string
  displayName: string
  roles: string[]
  permissions: string[]
  version: number
}

/** 密碼修改表單資料 */
export interface ChangePasswordFormData {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

/** 密碼修改 API 請求 */
export interface ChangePasswordRequest {
  id: string              // 用戶 ID
  oldPassword: string
  newPassword: string
  version: number
}

/** API 回應包裝 */
export interface ApiResponse<T> {
  success: boolean
  code: string
  message: string
  data: T
  timestamp: string
  traceId: string
}
```

### API Type Updates

```typescript
// 位置：@/common/apis/users/type.ts

// 修改現有型別
export type CurrentUserResponseData = ApiResponse<UserProfile>

// 或保持相容性（別名）
export type CurrentUserResponseData = ApiResponse<{
  id: string
  account: string
  displayName: string
  roles: string[]
  permissions: string[]
  version: number
}>
```

---

## Data Validation Matrix

| 欄位 | 前端驗證 | 後端驗證 | 錯誤訊息 |
|------|---------|---------|---------|
| `oldPassword` | 必填 | 正確性 | "舊密碼不正確" |
| `newPassword` | 必填 + 長度 + 格式 | 強度 + 與舊密碼比較 | "密碼不符合安全規範" |
| `confirmPassword` | 必填 + 一致性 | 無（前端驗證） | "兩次輸入的密碼不一致" |
| `version` | 無（自動填充） | 一致性 | "資料已被修改，請重新整理" |

---

## Concurrency Control

**機制**: 樂觀鎖（Optimistic Locking）

**流程**:
1. 用戶載入個人資料頁面，取得 `version` 值（例如：`version: 5`）
2. 用戶填寫密碼修改表單
3. 提交時帶上 `version: 5`
4. 後端檢查資料庫版本號：
   - **一致** → 更新成功，版本號 +1 → `version: 6`
   - **不一致** → 回傳 `409 Conflict`
5. 前端處理衝突：
   - 顯示錯誤訊息：「資料已被修改，請重新整理頁面」
   - 重新載入用戶資料（取得新的 `version`）
   - 提示用戶重新填寫表單

**範例場景**:
```
時間軸：
T0: 用戶 A 在裝置 1 載入頁面 (version: 5)
T1: 用戶 A 在裝置 2 載入頁面 (version: 5)
T2: 用戶 A 在裝置 1 修改密碼 → 成功 (version: 6)
T3: 用戶 A 在裝置 2 修改密碼 → 失敗 (409 Conflict)
    ↳ 提示：「資料已被修改，請重新整理」
T4: 裝置 2 重新載入資料 (version: 6)
T5: 用戶 A 在裝置 2 重新提交 → 成功 (version: 7)
```

---

## Summary

**核心實體**: 
- `UserProfile`（用戶資料）
- `ChangePasswordRequest`（密碼修改請求）

**狀態管理**:
- **全域狀態**：Pinia `useUserStore`（擴展 `userId`, `displayName`, `version`）
- **頁面狀態**：組合式函式 `useUserProfile`（用戶資料載入）
- **表單狀態**：組合式函式 `useChangePasswordForm`（密碼修改）

**併發控制**:
- 樂觀鎖（`version` 欄位）
- 409 Conflict 錯誤處理
- 用戶友善的錯誤提示與重新載入機制

**資料驗證**:
- 前端：表單格式驗證（Element Plus）
- 後端：業務邏輯驗證（密碼強度、舊密碼正確性）
- 兩層驗證確保資料完整性

---

**Phase 1.1 Complete** ✅  
**Next**: 建立 `contracts/api-contracts.md`
