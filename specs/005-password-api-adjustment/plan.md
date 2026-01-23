# Implementation Plan: 密碼修改 API 調整

**Feature Branch**: `005-password-api-adjustment`  
**Created**: 2026-01-22  
**Status**: Draft  
**Related Spec**: [spec.md](./spec.md)

## 目錄

1. [技術概述](#技術概述)
2. [架構設計](#架構設計)
3. [實作步驟](#實作步驟)
4. [測試策略](#測試策略)
5. [風險評估](#風險評估)

---

## 技術概述

### 現況分析

目前系統中密碼修改功能的實作狀況：

**現有檔案與實作**：

- **API 層** (`src/pages/user-management/apis/user.ts`):
  - `changePassword(id: string, data: ChangePasswordRequest)` 
  - 端點：`PUT /account/{id}/password`
  - 要求提供 oldPassword、newPassword、version

- **型別定義** (`src/pages/user-management/types.ts`):
  ```typescript
  interface ChangePasswordRequest {
    oldPassword: string
    newPassword: string
    version: number
  }
  ```

- **用戶端組合式函式** (`src/pages/profile/composables/useChangePassword.ts`):
  - 用於用戶自行修改密碼
  - 包含舊密碼驗證邏輯
  - 使用 `changePassword` API

- **管理端組合式函式** (`src/pages/user-management/composables/useChangePasswordForm.ts`):
  - 用於管理者修改用戶密碼
  - 目前也使用 `changePassword` API（要求 oldPassword）
  - 需要調整為使用新的 `resetPassword` API

### 變更需求

根據 [spec.md](./spec.md) 的需求，需要實現：

1. **新增管理者重設密碼 API**：
   - 端點：`PUT /account/{id}/reset-password`
   - 不需要提供 oldPassword
   - 僅管理者可呼叫
   - Request: `{ newPassword: string, version: number }`

2. **調整用戶自行修改密碼 API**：
   - 端點：`PUT /account/me/password`
   - 必須提供 oldPassword
   - 用戶操作自己的帳號
   - Request: `{ oldPassword: string, newPassword: string, version: number }`

3. **維持現有功能與錯誤處理**：
   - 樂觀鎖（version）處理
   - 密碼強度驗證
   - 舊密碼錯誤處理
   - 併發衝突處理

### 技術決策

#### 決策 1: API 端點設計

**選項 A（推薦）**：新增獨立的 `resetPassword` API 函式

- ✅ 符合規格要求的兩個不同端點
- ✅ 清楚區分管理者重設與用戶修改的語義
- ✅ 型別安全（ResetPasswordRequest 不包含 oldPassword）
- ✅ 最小化對現有程式碼的影響

**選項 B**：修改現有 `changePassword` 使 oldPassword 為選填

- ❌ 型別定義不明確（oldPassword?: string）
- ❌ 需要在前端判斷呼叫者身份
- ❌ 違反單一職責原則

**決定**：採用選項 A，新增 `resetPassword` API 函式

#### 決策 2: 前端 API 路徑與後端規格的對應

**現況**：
- 前端實作使用小寫路徑：`/account/{id}/password`
- 後端規格書使用大寫：`/api/Account/{id}/password`
- 實際後端可能處理兩者（路由不區分大小寫）

**決定**：
- 新 API 保持與現有程式碼一致，使用小寫路徑 `/account/...`
- 在 API 函式的 JSDoc 註解中標註後端規格路徑 `/api/Account/...`
- 範例：
  ```typescript
  /**
   * 管理者重設用戶密碼（後端規格：PUT /api/Account/{id}/reset-password）
   * @param id - 用戶 ID
   * @param data - 重設密碼請求資料
   */
  export async function resetPassword(
    id: string, 
    data: ResetPasswordRequest
  ): Promise<ApiResponse<null>> {
    return request({ url: `/account/${id}/reset-password`, method: "PUT", data })
  }
  ```

#### 決策 3: 型別定義位置

**決定**：
- 在 `src/pages/user-management/types.ts` 新增 `ResetPasswordRequest` 介面
- 保持 `ChangePasswordRequest` 不變（用於用戶自行修改）
- 這樣兩個型別都集中管理，且與相關 API 在同一模組

#### 決策 4: 權限驗證與審計日誌

**決定**：
- 管理者權限驗證（`account.password.reset`）由後端 API 負責
- 審計日誌記錄由後端自動處理
- 前端僅需正確處理 403 Forbidden 錯誤回應
- 前端不需要實作權限檢查或日誌記錄邏輯

---

## 架構設計

### 系統架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                        │
├─────────────────────────────┬───────────────────────────────────┤
│  User Profile Page          │  User Management Page             │
│  (用戶個人設定)              │  (管理者介面)                      │
│                             │                                   │
│  ┌─────────────────────┐    │  ┌────────────────────────────┐  │
│  │ ChangePasswordForm  │    │  │ ChangePasswordModal        │  │
│  │ Component           │    │  │ Component                  │  │
│  └──────────┬──────────┘    │  └──────────┬─────────────────┘  │
│             │                │             │                    │
│             v                │             v                    │
│  ┌─────────────────────┐    │  ┌────────────────────────────┐  │
│  │ useChangePassword   │    │  │ useChangePasswordForm      │  │
│  │ composable          │    │  │ composable                 │  │
│  │ (用戶自行修改)        │    │  │ (管理者重設)                │  │
│  └──────────┬──────────┘    │  └──────────┬─────────────────┘  │
└─────────────┼────────────────┴─────────────┼────────────────────┘
              │                              │
              │ 呼叫                          │ 呼叫
              v                              v
┌─────────────────────────────────────────────────────────────────┐
│                          API Layer                               │
│  (@/pages/user-management/apis/user.ts)                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ changePassword(id, ChangePasswordRequest)                │   │
│  │ → PUT /account/me/password                               │   │
│  │   需要: oldPassword, newPassword, version                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ resetPassword(id, ResetPasswordRequest)    [NEW]         │   │
│  │ → PUT /account/{id}/reset-password                       │   │
│  │   需要: newPassword, version                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                v
┌─────────────────────────────────────────────────────────────────┐
│                         Backend API                              │
│                                                                   │
│  PUT /api/Account/me/password        (用戶自行修改)               │
│  PUT /api/Account/{id}/reset-password (管理者重設)               │
└─────────────────────────────────────────────────────────────────┘
```

### 資料流程

#### Flow 1: 用戶自行修改密碼

```
User Input (Profile Page)
  → useChangePasswordForm (profile)
    → Validate form (oldPassword + newPassword + confirmPassword)
    → changePassword(currentUserId, { oldPassword, newPassword, version })
      → PUT /account/me/password
        → Backend validates oldPassword
        → Backend updates password & increments version
        → JWT version becomes invalid
      ← Response { success: true }
    ← Show success message
  ← Emit 'password-changed' event
```

#### Flow 2: 管理者重設用戶密碼

```
Admin Input (User Management Page)
  → useChangePasswordForm (user-management)
    → Validate form (newPassword + confirmPassword only)
    → resetPassword(targetUserId, { newPassword, version })  [UPDATED]
      → PUT /account/{id}/reset-password
        → Backend checks admin permission
        → Backend updates password & increments version (NO oldPassword check)
        → User's JWT version becomes invalid
      ← Response { success: true }
    ← Show success message
  ← Emit 'password-changed' event
```

### API 規格對照表

| API 函式 | HTTP 方法 | 前端路徑 | 後端規格路徑 | Request Body | 使用情境 |
|---------|----------|---------|-------------|--------------|----------|
| `changePassword` | PUT | `/account/me/password` | `/api/Account/me/password` | `{ oldPassword, newPassword, version }` | 用戶自行修改密碼 |
| `resetPassword` ✨ | PUT | `/account/{id}/reset-password` | `/api/Account/{id}/reset-password` | `{ newPassword, version }` | 管理者重設用戶密碼 |

✨ = 新增項目

---

## 實作步驟

### Phase 1: 型別定義與 API 層（估時：30 分鐘）

#### Step 1.1: 新增 ResetPasswordRequest 型別

**檔案**: `src/pages/user-management/types.ts`

**動作**: 在檔案中新增以下型別定義

```typescript
/** 管理者重設密碼請求（管理者無需提供舊密碼） */
export interface ResetPasswordRequest {
  /** 新密碼（最少 8 字元，包含大小寫字母與數字） */
  newPassword: string
  /** 資料版本號（用於併發控制） */
  version: number
}
```

**位置**: 在現有 `ChangePasswordRequest` 定義之後

**驗證**: TypeScript 編譯無錯誤

---

#### Step 1.2: 新增 resetPassword API 函式

**檔案**: `src/pages/user-management/apis/user.ts`

**動作**: 在現有 `changePassword` 函式之後新增

```typescript
/**
 * 管理者重設用戶密碼（後端規格：PUT /api/Account/{id}/reset-password）
 * 
 * 此 API 僅供管理者使用，無需提供用戶的舊密碼。
 * 
 * @param id - 目標用戶 ID（UUID）
 * @param data - 重設密碼請求資料
 * @returns 重設結果（data 為 null）
 * @throws {409} API_CODE_CONCURRENT_UPDATE_CONFLICT - 版本衝突
 * @throws {400} VALIDATION_ERROR - 新密碼不符合規則
 * @throws {403} FORBIDDEN - 非管理者權限
 * @throws {404} NOT_FOUND - 用戶不存在
 */
export async function resetPassword(
  id: string,
  data: ResetPasswordRequest
): Promise<ApiResponse<null>> {
  return request({ url: `/account/${id}/reset-password`, method: "PUT", data })
}
```

**匯入更新**: 在檔案頂部的 import 中加入 `ResetPasswordRequest`

```typescript
import type {
  ChangePasswordRequest,
  CreateUserRequest,
  DeleteUserRequest,
  ResetPasswordRequest,  // 新增
  UpdateUserRequest,
  User,
  UserListParams,
  UserListResponse
} from "../types"
```

**驗證**: 
- TypeScript 編譯無錯誤
- ESLint 無警告

---

#### Step 1.3: 更新 changePassword API 端點

**檔案**: `src/pages/user-management/apis/user.ts`

**動作**: 修改現有 `changePassword` 函式的端點路徑

**Before**:
```typescript
export async function changePassword(
  id: string,
  data: ChangePasswordRequest
): Promise<ApiResponse<null>> {
  return request({ url: `/account/${id}/password`, method: "PUT", data })
}
```

**After**:
```typescript
/**
 * 用戶自行修改密碼（後端規格：PUT /api/Account/me/password）
 * 
 * 此 API 用於用戶修改自己的密碼，必須提供舊密碼驗證。
 * 實際使用時，傳入的 id 應為當前登入用戶的 ID。
 * 
 * @param id - 用戶 ID（UUID，應為當前用戶 ID）
 * @param data - 變更密碼請求資料
 * @returns 變更結果（data 為 null）
 * @throws {409} API_CODE_CONCURRENT_UPDATE_CONFLICT - 版本衝突
 * @throws {401} INVALID_OLD_PASSWORD - 舊密碼錯誤
 * @throws {400} VALIDATION_ERROR - 新密碼不符合規則
 */
export async function changePassword(
  id: string,
  data: ChangePasswordRequest
): Promise<ApiResponse<null>> {
  return request({ url: `/account/me/password`, method: "PUT", data })
}
```

**重要變更**: 
- 端點路徑從 `/account/{id}/password` 改為 `/account/me/password`
- 更新 JSDoc 註解，說明此 API 用於用戶自行修改密碼
- 實際傳入的 `id` 參數會在後端被忽略，後端會從 JWT 取得當前用戶 ID

**驗證**: 
- TypeScript 編譯無錯誤
- 現有呼叫此函式的地方不受影響（API 簽名未變）

---

### Phase 2: 更新管理者端組合式函式（估時：20 分鐘）

#### Step 2.1: 更新 useChangePasswordForm 使用 resetPassword API

**檔案**: `src/pages/user-management/composables/useChangePasswordForm.ts`

**動作**: 修改 API 呼叫從 `changePassword` 改為 `resetPassword`

**Before**:
```typescript
import { changePassword } from "../apis/user"

// ... 在 submitForm 函式中
const response = await changePassword(formData.userId!, {
  oldPassword: formData.oldPassword,
  newPassword: formData.newPassword,
  version: formData.version!
})
```

**After**:
```typescript
import { resetPassword } from "../apis/user"  // 修改匯入

// ... 在 submitForm 函式中
const response = await resetPassword(formData.userId!, {
  newPassword: formData.newPassword,
  version: formData.version!
})
```

**說明**:
- 管理者重設密碼不需要舊密碼，因此移除 `oldPassword` 欄位
- 使用新的 `resetPassword` API

**驗證**:
- TypeScript 編譯無錯誤
- 組合式函式中不再使用 `oldPassword` 欄位

---

#### Step 2.2: 移除管理者表單的舊密碼欄位

**檔案**: `src/pages/user-management/composables/useChangePasswordForm.ts`

**動作**: 更新 `FormData` 型別與驗證規則

**Before**:
```typescript
interface FormData {
  userId?: string
  oldPassword: string
  newPassword: string
  confirmPassword: string
  version?: number
}

const formData = reactive<FormData>({
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
})

const rules: FormRules<FormData> = {
  oldPassword: [
    { required: true, message: "請輸入舊密碼", trigger: "blur" },
    { min: 8, message: "密碼至少需要 8 字元", trigger: "blur" }
  ],
  newPassword: [
    { required: true, message: "請輸入新密碼", trigger: "blur" },
    { validator: passwordValidator, trigger: "blur" }
  ],
  confirmPassword: [
    { required: true, message: "請再次輸入新密碼", trigger: "blur" },
    { validator: validateConfirmPassword, trigger: "blur" }
  ]
}
```

**After**:
```typescript
interface FormData {
  userId?: string
  newPassword: string
  confirmPassword: string
  version?: number
}

const formData = reactive<FormData>({
  newPassword: "",
  confirmPassword: ""
})

const rules: FormRules<FormData> = {
  newPassword: [
    { required: true, message: "請輸入新密碼", trigger: "blur" },
    { validator: passwordValidator, trigger: "blur" }
  ],
  confirmPassword: [
    { required: true, message: "請再次輸入新密碼", trigger: "blur" },
    { validator: validateConfirmPassword, trigger: "blur" }
  ]
}
```

**說明**:
- 移除 `oldPassword` 欄位及其驗證規則
- 管理者重設密碼時無需知道用戶的舊密碼

**驗證**:
- TypeScript 編譯無錯誤
- 表單驗證邏輯正常運作

---

#### Step 2.3: 更新錯誤處理邏輯

**檔案**: `src/pages/user-management/composables/useChangePasswordForm.ts`

**動作**: 移除舊密碼錯誤的處理邏輯

**Before**:
```typescript
const handleApiError = (err: unknown): void => {
  const error = err as { response?: { status?: number, data?: { code?: string, message?: string } } }
  const status = error.response?.status
  const code = error.response?.data?.code

  if (status === 409 && code === API_CODE_CONCURRENT_UPDATE_CONFLICT) {
    ElMessage.error("資料已被其他操作修改，請重新整理後再試")
    emit("refresh-required")
  } else if (status === 401 && code === "INVALID_OLD_PASSWORD") {
    ElMessage.error("舊密碼不正確，請重新輸入")
  } else if (status === 400) {
    const message = error.response?.data?.message || "輸入資料格式錯誤"
    ElMessage.error(message)
  } else {
    console.error("密碼重設失敗:", err)
    ElMessage.error("密碼重設失敗，請稍後再試")
  }
}
```

**After**:
```typescript
const handleApiError = (err: unknown): void => {
  const error = err as { response?: { status?: number, data?: { code?: string, message?: string } } }
  const status = error.response?.status
  const code = error.response?.data?.code

  if (status === 409 && code === API_CODE_CONCURRENT_UPDATE_CONFLICT) {
    ElMessage.error("資料已被其他操作修改，請重新整理後再試")
    emit("refresh-required")
  } else if (status === 403) {
    ElMessage.error("您沒有權限執行此操作")
  } else if (status === 404) {
    ElMessage.error("找不到指定的用戶")
  } else if (status === 400) {
    const message = error.response?.data?.message || "輸入資料格式錯誤"
    ElMessage.error(message)
  } else {
    console.error("密碼重設失敗:", err)
    ElMessage.error("密碼重設失敗，請稍後再試")
  }
}
```

**說明**:
- 移除 `INVALID_OLD_PASSWORD` 錯誤處理（管理者重設不需要舊密碼）
- 新增 403 (權限不足) 和 404 (用戶不存在) 錯誤處理
- 這些是管理者重設密碼可能遇到的錯誤

**驗證**:
- 錯誤處理邏輯清晰且完整

---

### Phase 3: 元件層更新（估時：15 分鐘）

#### Step 3.1: 更新管理者密碼修改 Modal 元件

**檔案**: `src/pages/user-management/components/ChangePasswordModal.vue`

**動作**: 移除舊密碼輸入欄位（如果存在）

**查找**: 檢查元件中是否有 `oldPassword` 相關的表單欄位

**範例變更** (如果元件中有以下程式碼):

**Before**:
```vue
<template>
  <el-form :model="formData" :rules="rules" ref="formRef">
    <el-form-item label="舊密碼" prop="oldPassword">
      <el-input 
        v-model="formData.oldPassword" 
        type="password" 
        placeholder="請輸入舊密碼" 
      />
    </el-form-item>
    <el-form-item label="新密碼" prop="newPassword">
      <el-input 
        v-model="formData.newPassword" 
        type="password" 
        placeholder="請輸入新密碼" 
      />
    </el-form-item>
    <!-- ... -->
  </el-form>
</template>
```

**After**:
```vue
<template>
  <el-form :model="formData" :rules="rules" ref="formRef">
    <!-- 移除舊密碼欄位 -->
    <el-form-item label="新密碼" prop="newPassword">
      <el-input 
        v-model="formData.newPassword" 
        type="password" 
        placeholder="請輸入新密碼" 
      />
    </el-form-item>
    <!-- ... -->
  </el-form>
</template>
```

**注意**: 
- 如果元件已經沒有 `oldPassword` 欄位，則無需修改
- 需要實際查看元件原始碼確認是否需要修改

**驗證**:
- 元件渲染正常
- 表單驗證正常運作
- 無舊密碼輸入欄位

---

#### Step 3.2: 確認用戶端密碼修改元件保持不變

**檔案**: `src/pages/profile/components/ChangePasswordForm.vue`

**動作**: 確認此元件仍包含舊密碼欄位

**預期**: 
- 用戶自行修改密碼需要提供舊密碼
- 此元件應保持三個欄位：oldPassword、newPassword、confirmPassword
- 無需修改

**驗證**:
- 用戶密碼修改功能正常運作
- 舊密碼驗證機制正常

---

### Phase 4: 測試更新（估時：45 分鐘）

#### Step 4.1: 更新管理者端密碼修改測試

**檔案**: `tests/composables/useChangePasswordForm.test.ts`

**動作**: 更新測試以反映新的 API 與行為

**變更項目**:

1. **更新 mock 函式**:
```typescript
// Before
vi.mock("@/pages/user-management/apis/user", () => ({
  changePassword: vi.fn()
}))

// After
vi.mock("@/pages/user-management/apis/user", () => ({
  resetPassword: vi.fn()  // 改為 mock resetPassword
}))
```

2. **更新測試案例**:

**Before**:
```typescript
it("should call changePassword API with correct parameters", async () => {
  mockChangePassword.mockResolvedValue({ success: true })
  
  const { formData, submitForm } = useChangePasswordForm(mockEmit)
  formData.userId = "user-123"
  formData.oldPassword = "OldPass123"
  formData.newPassword = "NewPass456"
  formData.version = 1

  await submitForm()

  expect(mockChangePassword).toHaveBeenCalledWith("user-123", {
    oldPassword: "OldPass123",
    newPassword: "NewPass456",
    version: 1
  })
})
```

**After**:
```typescript
it("should call resetPassword API without oldPassword", async () => {
  mockResetPassword.mockResolvedValue({ success: true })
  
  const { formData, setUserId, submitForm } = useChangePasswordForm(mockEmit)
  setUserId("user-123", 1)
  formData.newPassword = "NewPass456"
  formData.confirmPassword = "NewPass456"

  await submitForm()

  expect(mockResetPassword).toHaveBeenCalledWith("user-123", {
    newPassword: "NewPass456",
    version: 1
  })
  // 確認沒有傳遞 oldPassword
  expect(mockResetPassword).not.toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ oldPassword: expect.anything() })
  )
})
```

3. **移除舊密碼相關測試**:
- 移除測試舊密碼錯誤處理的案例
- 移除測試舊密碼驗證規則的案例

4. **新增管理者權限錯誤測試**:
```typescript
it("should handle 403 forbidden error", async () => {
  mockResetPassword.mockRejectedValue({
    response: { status: 403, data: { code: "FORBIDDEN" } }
  })

  const { setUserId, submitForm } = useChangePasswordForm(mockEmit)
  setUserId("user-123", 1)

  await submitForm()

  expect(ElMessage.error).toHaveBeenCalledWith("您沒有權限執行此操作")
})

it("should handle 404 user not found error", async () => {
  mockResetPassword.mockRejectedValue({
    response: { status: 404, data: { code: "NOT_FOUND" } }
  })

  const { setUserId, submitForm } = useChangePasswordForm(mockEmit)
  setUserId("user-123", 1)

  await submitForm()

  expect(ElMessage.error).toHaveBeenCalledWith("找不到指定的用戶")
})
```

**驗證**:
- 執行測試：`pnpm test useChangePasswordForm`
- 所有測試通過

---

#### Step 4.2: 確認用戶端密碼修改測試保持不變

**檔案**: `tests/composables/useChangePassword.test.ts`

**動作**: 確認測試仍使用 `changePassword` API 且包含 `oldPassword`

**預期**:
- 測試應驗證 `oldPassword` 欄位的存在
- 測試應驗證舊密碼錯誤的處理
- 無需修改

**驗證**:
- 執行測試：`pnpm test useChangePassword`
- 所有測試通過

---

#### Step 4.3: 新增 API 層測試

**檔案**: `tests/apis/user.test.ts`

**動作**: 新增 `resetPassword` API 的單元測試

**測試案例**:

```typescript
describe("resetPassword", () => {
  it("should call PUT /account/{id}/reset-password with correct data", async () => {
    const mockAxios = vi.mocked(request)
    mockAxios.mockResolvedValue({ success: true, data: null })

    const resetData: ResetPasswordRequest = {
      newPassword: "NewPass456",
      version: 1
    }

    await resetPassword("user-123", resetData)

    expect(mockAxios).toHaveBeenCalledWith({
      url: "/account/user-123/reset-password",
      method: "PUT",
      data: resetData
    })
  })

  it("should handle API errors correctly", async () => {
    const mockAxios = vi.mocked(request)
    mockAxios.mockRejectedValue({
      response: { status: 403, data: { code: "FORBIDDEN" } }
    })

    await expect(resetPassword("user-123", {
      newPassword: "NewPass456",
      version: 1
    })).rejects.toThrow()
  })
})
```

**驗證**:
- 執行測試：`pnpm test`
- 新增測試通過

---

#### Step 4.4: E2E 測試建議

**手動測試流程**:

**測試 1: 管理者重設用戶密碼**
1. 以管理者身份登入
2. 進入用戶管理頁面
3. 選擇一個用戶，點擊「修改密碼」
4. 輸入新密碼（注意：不應有舊密碼欄位）
5. 點擊確認
6. 驗證：
   - 顯示成功訊息
   - Modal 關閉
   - 用戶能使用新密碼登入

**測試 2: 用戶自行修改密碼**
1. 以一般用戶身份登入
2. 進入個人設定頁面
3. 點擊「修改密碼」
4. 輸入舊密碼、新密碼、確認新密碼
5. 點擊確認
6. 驗證：
   - 顯示成功訊息
   - 表單重置
   - 用戶能使用新密碼重新登入

**測試 3: 錯誤處理**
- 輸入不符合規則的新密碼（短於 8 字元、無大寫等）
- 輸入錯誤的舊密碼（僅用戶修改時）
- 版本衝突（同時修改）
- 權限不足（非管理者嘗試重設他人密碼）

**驗證**:
- 所有錯誤都正確顯示相應的錯誤訊息
- 系統行為符合規格要求

---

### Phase 5: 文件更新（估時：20 分鐘）

#### Step 5.1: 建立 API Contracts 文件

**檔案**: `specs/005-password-api-adjustment/contracts/api-contracts.md`

**動作**: 建立完整的 API 規格文件

**內容大綱**:

```markdown
# API Contracts: 密碼修改 API 調整

## 概述

本文件定義了密碼修改功能的兩個 API 端點的詳細規格。

## API Endpoints

### 1. 管理者重設用戶密碼

**Endpoint**: `PUT /api/Account/{id}/reset-password`

**描述**: 管理者無需知道用戶的舊密碼即可重設密碼。

**Authorization**: ✅ Required (管理者權限)

#### Request

**Path Parameters**:
| 參數 | 型別 | 描述 | 範例 |
|-----|------|------|------|
| `id` | `string` (UUID) | 目標用戶 ID | `3fa85f64-5717-4562-b3fc-2c963f66afa6` |

**Request Body**:
```json
{
  "newPassword": "NewSecureP@ss123",
  "version": 5
}
```

#### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "密碼重設成功",
  "data": null,
  "timestamp": "2026-01-22T10:30:00.000Z"
}
```

**Error Responses**:
- 400 Bad Request: 密碼不符合規則
- 403 Forbidden: 無管理者權限
- 404 Not Found: 用戶不存在
- 409 Conflict: 版本衝突

---

### 2. 用戶自行修改密碼

**Endpoint**: `PUT /api/Account/me/password`

**描述**: 用戶修改自己的密碼，需提供舊密碼驗證。

**Authorization**: ✅ Required (JWT Bearer Token)

#### Request

**Request Body**:
```json
{
  "oldPassword": "CurrentP@ssw0rd",
  "newPassword": "NewSecureP@ss123",
  "version": 5
}
```

#### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "密碼修改成功",
  "data": null,
  "timestamp": "2026-01-22T10:30:00.000Z"
}
```

**Error Responses**:
- 400 Bad Request: 密碼不符合規則
- 401 Unauthorized: 舊密碼錯誤
- 409 Conflict: 版本衝突

---

## TypeScript 型別定義

```typescript
/** 管理者重設密碼請求 */
export interface ResetPasswordRequest {
  newPassword: string
  version: number
}

/** 用戶修改密碼請求 */
export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
  version: number
}
```

## 前端 API 封裝

參見 `src/pages/user-management/apis/user.ts`:

- `resetPassword(id: string, data: ResetPasswordRequest)`
- `changePassword(id: string, data: ChangePasswordRequest)`
```

**驗證**:
- 文件完整且準確
- 包含所有必要的 API 細節

---

#### Step 5.2: 建立 Data Model 文件

**檔案**: `specs/005-password-api-adjustment/data-model.md`

**動作**: 定義資料模型與狀態流轉

**內容範例**:

```markdown
# Data Model: 密碼修改 API 調整

## 核心實體

### Account Entity (既有)

密碼修改操作會影響 Account 實體的以下欄位：

| 欄位 | 型別 | 描述 | 變更時機 |
|-----|------|------|---------|
| `passwordHash` | `string` | 密碼雜湊值 | 密碼修改/重設成功時更新 |
| `version` | `number` | 資料版本號 | 密碼修改/重設成功時遞增 |
| `updatedAt` | `datetime` | 最後更新時間 | 密碼修改/重設成功時更新 |

## 請求/回應模型

### ResetPasswordRequest (新增)

管理者重設用戶密碼的請求模型。

| 欄位 | 型別 | 必填 | 驗證規則 | 描述 |
|-----|------|------|---------|------|
| `newPassword` | `string` | ✅ | 長度 ≥ 8, 包含大小寫字母與數字 | 新密碼 |
| `version` | `number` | ✅ | 整數, ≥ 0 | 樂觀鎖版本號 |

### ChangePasswordRequest (既有，無變更)

用戶自行修改密碼的請求模型。

| 欄位 | 型別 | 必填 | 驗證規則 | 描述 |
|-----|------|------|---------|------|
| `oldPassword` | `string` | ✅ | - | 當前密碼 |
| `newPassword` | `string` | ✅ | 長度 ≥ 8, 包含大小寫字母與數字 | 新密碼 |
| `version` | `number` | ✅ | 整數, ≥ 0 | 樂觀鎖版本號 |

## 狀態流轉

### 管理者重設密碼流程

```
[開始] 
  → 驗證管理者權限
  → 檢查用戶存在性
  → 驗證版本號（樂觀鎖）
  → 驗證新密碼規則
  → 雜湊新密碼
  → 更新 passwordHash
  → 遞增 version
  → 更新 updatedAt
  → [成功]
```

### 用戶修改密碼流程

```
[開始]
  → 驗證用戶身份（JWT）
  → 檢查用戶存在性
  → 驗證版本號（樂觀鎖）
  → 驗證舊密碼正確性 ⚠️
  → 驗證新密碼規則
  → 檢查新密碼 ≠ 舊密碼
  → 雜湊新密碼
  → 更新 passwordHash
  → 遞增 version
  → 更新 updatedAt
  → [成功]
```

⚠️ = 與管理者重設的主要差異點

## 版本控制機制

密碼修改操作使用樂觀鎖（Optimistic Locking）防止並發衝突：

1. 前端從用戶資料中取得當前 `version`
2. 提交請求時帶上此 `version`
3. 後端比對資料庫中的 `version`：
   - 相符 → 執行更新，`version += 1`
   - 不符 → 拒絕請求，回傳 409 錯誤
4. 前端收到 409 錯誤時，提示用戶重新整理資料
```

**驗證**:
- 資料模型清晰完整
- 狀態流轉圖正確

---

#### Step 5.3: 建立 Quickstart 文件

**檔案**: `specs/005-password-api-adjustment/quickstart.md`

**動作**: 提供開發者快速上手指南

**內容大綱**:

```markdown
# Quickstart: 密碼修改 API 調整

## 開發時間估算

- **Phase 1**: 型別定義與 API 層 (30 分鐘)
- **Phase 2**: 更新管理者端組合式函式 (20 分鐘)
- **Phase 3**: 元件層更新 (15 分鐘)
- **Phase 4**: 測試更新 (45 分鐘)
- **Phase 5**: 文件更新 (20 分鐘)

**總計**: 約 2.5 小時

---

## 快速開始

### 1. 切換到功能分支

```bash
git checkout 005-password-api-adjustment
```

### 2. 新增型別定義

編輯 `src/pages/user-management/types.ts`，新增：

```typescript
export interface ResetPasswordRequest {
  newPassword: string
  version: number
}
```

### 3. 新增 API 函式

編輯 `src/pages/user-management/apis/user.ts`，新增：

```typescript
export async function resetPassword(
  id: string,
  data: ResetPasswordRequest
): Promise<ApiResponse<null>> {
  return request({ url: `/account/${id}/reset-password`, method: "PUT", data })
}
```

同時修改現有的 `changePassword` 端點為 `/account/me/password`。

### 4. 更新管理者組合式函式

編輯 `src/pages/user-management/composables/useChangePasswordForm.ts`：

- 匯入改為 `import { resetPassword } from "../apis/user"`
- 移除 `FormData` 中的 `oldPassword` 欄位
- 移除 `oldPassword` 驗證規則
- 在 `submitForm` 中呼叫 `resetPassword` 而非 `changePassword`

### 5. 更新測試

編輯 `tests/composables/useChangePasswordForm.test.ts`：

- Mock `resetPassword` 而非 `changePassword`
- 移除舊密碼相關測試
- 新增管理者權限錯誤測試

### 6. 執行測試

```bash
pnpm test
```

### 7. 手動測試

1. 啟動開發伺服器：`pnpm dev`
2. 測試管理者重設密碼功能
3. 測試用戶自行修改密碼功能

---

## 關鍵變更摘要

| 項目 | 變更內容 | 影響範圍 |
|-----|---------|---------|
| API 端點 | 新增 `PUT /account/{id}/reset-password` | 管理者功能 |
| API 端點 | 修改 `PUT /account/me/password` (原 `/account/{id}/password`) | 用戶功能 |
| 型別 | 新增 `ResetPasswordRequest` | 管理者功能 |
| 組合式函式 | 移除 `oldPassword` 欄位與驗證 | 管理者功能 |
| 錯誤處理 | 新增 403, 404 處理；移除 401 INVALID_OLD_PASSWORD | 管理者功能 |

---

## 常見問題

**Q: 為什麼要分成兩個不同的 API 端點？**

A: 因為管理者重設密碼和用戶自行修改密碼的業務邏輯不同：
- 管理者無需知道舊密碼，這是支援場景的需求
- 用戶必須提供舊密碼，這是安全性的需求
- 分開端點讓 API 語義更清晰，型別也更安全

**Q: 現有的用戶修改密碼功能會受影響嗎？**

A: 不會。用戶端的組合式函式 (`src/pages/profile/composables/useChangePassword.ts`) 和元件保持不變，只是後端 API 端點路徑調整為 `/account/me/password`。

**Q: 樂觀鎖機制如何運作？**

A: 前端傳遞當前的 `version` 給後端，後端檢查版本是否一致。如果不一致，回傳 409 錯誤，前端提示用戶重新整理資料後再試。
```

**驗證**:
- 文件清晰易懂
- 包含所有關鍵步驟

---

### Phase 6: 最終檢查與部署準備（估時：15 分鐘）

#### Step 6.1: 執行完整測試套件

```bash
# 執行所有單元測試
pnpm test

# 檢查 TypeScript 編譯
pnpm type-check

# 執行 ESLint 檢查
pnpm lint
```

**預期結果**:
- ✅ 所有測試通過
- ✅ 無 TypeScript 錯誤
- ✅ 無 ESLint 錯誤

---

#### Step 6.2: 手動測試檢查清單

- [ ] 管理者能重設用戶密碼（無需舊密碼）
- [ ] 用戶能自行修改密碼（需提供舊密碼）
- [ ] 新密碼驗證規則正常運作
- [ ] 舊密碼錯誤時顯示正確提示（僅用戶修改）
- [ ] 版本衝突時顯示正確提示
- [ ] 密碼修改成功後，舊 JWT 失效
- [ ] 所有錯誤情境都有適當的錯誤訊息

---

#### Step 6.3: 程式碼審查準備

**建立 Pull Request 時包含**:

1. **標題**: `feat: 密碼修改 API 調整 - 區分管理者重設與用戶修改`

2. **描述**:
```markdown
## 功能概述

實作 #005 密碼修改 API 調整，區分管理者重設用戶密碼與用戶自行修改密碼的場景。

## 主要變更

### API 層
- ✨ 新增 `resetPassword` API 函式 (PUT /account/{id}/reset-password)
- ♻️ 修改 `changePassword` 端點路徑為 /account/me/password
- ✨ 新增 `ResetPasswordRequest` 型別

### 組合式函式
- ♻️ 更新 `useChangePasswordForm` (user-management) 使用 `resetPassword` API
- 🔥 移除管理者表單的 `oldPassword` 欄位與驗證
- ♻️ 調整錯誤處理邏輯（新增 403, 404；移除 401 INVALID_OLD_PASSWORD）

### 測試
- ✅ 更新管理者端組合式函式測試
- ✅ 新增 API 層測試
- ✅ 確認用戶端測試保持不變

### 文件
- 📝 建立 API Contracts 文件
- 📝 建立 Data Model 文件
- 📝 建立 Quickstart 文件

## 測試結果

- ✅ 單元測試全數通過 (139/139)
- ✅ TypeScript 編譯無錯誤
- ✅ ESLint 檢查通過
- ✅ 手動測試通過

## 影響範圍

- 管理者重設密碼功能：⚠️ 行為變更（不再需要舊密碼）
- 用戶自行修改密碼功能：✅ 無影響（僅後端端點路徑調整）

## Breaking Changes

無。API 簽名保持向後相容。

## 相關文件

- Feature Spec: `specs/005-password-api-adjustment/spec.md`
- Implementation Plan: `specs/005-password-api-adjustment/plan.md`
- API Contracts: `specs/005-password-api-adjustment/contracts/api-contracts.md`
```

3. **Checklist**:
```markdown
- [ ] 程式碼遵循專案規範
- [ ] 已新增/更新相關測試
- [ ] 所有測試通過
- [ ] 已更新相關文件
- [ ] 已進行手動測試
- [ ] 無 TypeScript/ESLint 錯誤
```

---

## 測試策略

### 測試範圍

| 測試層級 | 測試項目 | 測試檔案 | 預期結果 |
|---------|---------|---------|---------|
| **單元測試** | `resetPassword` API 呼叫 | `tests/apis/user.test.ts` | ✅ 正確呼叫端點 |
| **單元測試** | `useChangePasswordForm` (管理者) | `tests/composables/useChangePasswordForm.test.ts` | ✅ 使用 resetPassword, 無 oldPassword |
| **單元測試** | `useChangePasswordForm` (用戶) | `tests/composables/useChangePassword.test.ts` | ✅ 使用 changePassword, 包含 oldPassword |
| **整合測試** | 管理者重設密碼完整流程 | 手動測試 | ✅ 功能正常 |
| **整合測試** | 用戶自行修改密碼完整流程 | 手動測試 | ✅ 功能正常 |
| **錯誤測試** | 各類錯誤情境 | 單元測試 + 手動測試 | ✅ 正確處理 |

### 測試案例清單

#### 單元測試案例

**resetPassword API 測試**:
- ✅ 正確呼叫 PUT /account/{id}/reset-password
- ✅ 傳遞正確的 request body (newPassword, version)
- ✅ 處理 API 成功回應
- ✅ 處理 API 錯誤回應 (403, 404, 409)

**useChangePasswordForm (管理者) 測試**:
- ✅ formData 不包含 oldPassword 欄位
- ✅ 驗證規則不包含 oldPassword
- ✅ submitForm 呼叫 resetPassword 而非 changePassword
- ✅ 處理 403 Forbidden 錯誤
- ✅ 處理 404 Not Found 錯誤
- ✅ 處理 409 版本衝突錯誤
- ✅ 成功後發射 password-changed 事件

**useChangePasswordForm (用戶) 測試**:
- ✅ formData 包含 oldPassword 欄位
- ✅ 驗證規則包含 oldPassword
- ✅ submitForm 呼叫 changePassword
- ✅ 處理 401 INVALID_OLD_PASSWORD 錯誤
- ✅ 處理 409 版本衝突錯誤
- ✅ 成功後發射 password-changed 事件

#### 整合測試案例（手動）

**管理者重設密碼流程**:
1. ✅ 管理者登入系統
2. ✅ 進入用戶管理頁面
3. ✅ 選擇用戶，開啟修改密碼 Modal
4. ✅ 確認 Modal 不顯示舊密碼欄位
5. ✅ 輸入新密碼與確認密碼
6. ✅ 提交表單，顯示成功訊息
7. ✅ 目標用戶使用新密碼能成功登入
8. ✅ 目標用戶的舊 JWT 失效

**用戶自行修改密碼流程**:
1. ✅ 用戶登入系統
2. ✅ 進入個人設定頁面
3. ✅ 開啟修改密碼表單
4. ✅ 確認表單包含舊密碼欄位
5. ✅ 輸入舊密碼、新密碼、確認密碼
6. ✅ 提交表單，顯示成功訊息
7. ✅ 用戶使用新密碼能重新登入
8. ✅ 用戶的舊 JWT 失效

**錯誤處理測試**:
- ✅ 新密碼不符合規則（短於 8 字元）
- ✅ 新密碼不符合規則（無大寫字母）
- ✅ 新密碼不符合規則（無小寫字母）
- ✅ 新密碼不符合規則（無數字）
- ✅ 舊密碼錯誤（僅用戶修改）
- ✅ 版本衝突（同時修改）
- ✅ 權限不足（非管理者嘗試重設）
- ✅ 用戶不存在

### 測試執行

```bash
# 執行所有測試
pnpm test

# 執行特定測試檔案
pnpm test useChangePasswordForm
pnpm test useChangePassword

# 查看測試覆蓋率
pnpm test:coverage
```

### 測試覆蓋率目標

- **Statement Coverage**: ≥ 80%
- **Branch Coverage**: ≥ 75%
- **Function Coverage**: ≥ 80%
- **Line Coverage**: ≥ 80%

---

## 風險評估

### 高風險項目

#### 風險 1: API 端點變更導致後端不相容

**描述**: 
- 前端修改了 API 端點路徑（`/account/{id}/password` → `/account/me/password` 和新增 `/account/{id}/reset-password`）
- 如果後端尚未實作這些端點，會導致 404 錯誤

**影響**: 🔴 高

**緩解策略**:
1. 在開發環境先與後端確認 API 已實作
2. 在前端實作前，先查看後端 API 文件或與後端團隊溝通
3. 使用 Mock Server 進行前端獨立開發與測試
4. 部署前進行整合測試，確認 API 連通性

**應變方案**:
- 如後端尚未實作，暫時回退前端變更
- 或使用 API Gateway/Proxy 轉發請求到舊端點

---

#### 風險 2: 現有管理者修改密碼功能中斷

**描述**:
- 管理者組合式函式從 `changePassword` 改為 `resetPassword`
- 如果有其他未發現的地方也使用此組合式函式，可能受影響

**影響**: 🟡 中

**緩解策略**:
1. 在實作前使用 `grep_search` 或 IDE 查找所有使用 `useChangePasswordForm` 的地方
2. 確認變更範圍僅限於管理者功能
3. 進行完整的手動測試
4. 更新所有相關測試

**應變方案**:
- 如發現有多處使用，考慮建立兩個不同的組合式函式：
  - `useResetPasswordForm` (管理者重設)
  - `useChangePasswordForm` (原有功能保持不變)

---

### 中風險項目

#### 風險 3: JWT 版本機制未正確實作

**描述**:
- 規格要求密碼修改後 JWT 版本失效
- 如果後端未正確實作版本檢查，可能導致舊 token 仍可使用

**影響**: 🟡 中（安全性問題）

**緩解策略**:
1. 與後端確認 JWT 版本機制已實作
2. 手動測試：修改密碼後，使用舊 token 呼叫 API 應被拒絕
3. 在測試案例中驗證此行為

**應變方案**:
- 如後端未實作，提交 bug report 並追蹤修復
- 前端增加額外的安全措施（如修改密碼後強制重新登入）

---

#### 風險 4: 樂觀鎖併發衝突處理不當

**描述**:
- 當多人同時修改同一用戶的密碼時，version 衝突
- 錯誤訊息或後續流程處理不當可能導致用戶困惑

**影響**: 🟡 中

**緩解策略**:
1. 提供清晰的錯誤訊息：「資料已被其他操作修改，請重新整理後再試」
2. 發射 `refresh-required` 事件，讓父元件重新載入用戶資料
3. 在測試中驗證此流程

**應變方案**:
- 增加自動重試機制（最多 3 次）
- 或提供「強制覆蓋」選項（需額外確認）

---

### 低風險項目

#### 風險 5: 測試覆蓋率不足

**描述**:
- 新增的程式碼可能缺少完整的測試覆蓋

**影響**: 🟢 低

**緩解策略**:
1. 遵循測試策略，確保每個新函式都有對應測試
2. 執行 `pnpm test:coverage` 查看覆蓋率報告
3. 目標覆蓋率 ≥ 80%

---

#### 風險 6: 文件更新不完整

**描述**:
- API 變更後相關文件未同步更新

**影響**: 🟢 低

**緩解策略**:
1. 在 Phase 5 中建立/更新所有相關文件
2. 在 PR 中包含文件變更
3. Code Review 時檢查文件完整性

---

## 附錄

### 相關檔案清單

**需要修改的檔案**:

| 檔案路徑 | 變更類型 | 說明 |
|---------|---------|------|
| `src/pages/user-management/types.ts` | 新增 | 新增 ResetPasswordRequest 型別 |
| `src/pages/user-management/apis/user.ts` | 新增 + 修改 | 新增 resetPassword 函式，修改 changePassword 端點 |
| `src/pages/user-management/composables/useChangePasswordForm.ts` | 修改 | 使用 resetPassword API，移除 oldPassword |
| `src/pages/user-management/components/ChangePasswordModal.vue` | 修改（可能） | 移除舊密碼欄位（如果存在） |
| `tests/composables/useChangePasswordForm.test.ts` | 修改 | 更新測試以反映新行為 |
| `tests/apis/user.test.ts` | 新增 | 新增 resetPassword API 測試 |

**需要新增的文件**:

| 檔案路徑 | 說明 |
|---------|------|
| `specs/005-password-api-adjustment/contracts/api-contracts.md` | API 規格文件 |
| `specs/005-password-api-adjustment/data-model.md` | 資料模型文件 |
| `specs/005-password-api-adjustment/quickstart.md` | 快速開始指南 |

**保持不變的檔案**:

| 檔案路徑 | 說明 |
|---------|------|
| `src/pages/profile/composables/useChangePassword.ts` | 用戶端密碼修改邏輯（無變更） |
| `src/pages/profile/components/ChangePasswordForm.vue` | 用戶端密碼修改元件（無變更） |
| `tests/composables/useChangePassword.test.ts` | 用戶端測試（無變更） |

---

### 程式碼規範檢查清單

實作時請確保遵循以下規範：

#### TypeScript 規範
- [ ] 使用 `interface` 定義物件型別
- [ ] 避免使用 `any`，優先使用 `unknown`
- [ ] 公共函式包含明確回傳型別
- [ ] 啟用 TypeScript 嚴格模式
- [ ] 適當使用 JSDoc 註解

#### Vue 規範
- [ ] 使用 `<script setup lang="ts">` 語法
- [ ] 優先使用 `ref` 而非 `reactive`
- [ ] Props 定義使用「型別宣告」+ 響應式解構
- [ ] 使用 Scoped CSS (`<style scoped lang="scss">`)
- [ ] 避免直接操作 DOM

#### API 規範
- [ ] 使用 `request` 函式封裝 API 呼叫
- [ ] 函式名稱使用動詞 + 名詞 (如 resetPassword)
- [ ] 包含完整的 JSDoc 註解（參數、回傳值、錯誤）
- [ ] 使用路徑別名 `@` 指向 `src`

#### 命名規範
- [ ] 元件命名：PascalCase
- [ ] 檔案命名：kebab-case
- [ ] 組合式函式：camelCase (以 use 開頭)
- [ ] 型別/介面：PascalCase
- [ ] 變數/函式：camelCase
- [ ] 常數：UPPER_CASE

#### 測試規範
- [ ] 每個測試有清晰的 describe 和 it 描述
- [ ] 使用 Given-When-Then 或 Arrange-Act-Assert 模式
- [ ] Mock 外部依賴
- [ ] 測試涵蓋正常流程和錯誤流程

---

### 參考資源

- [Feature Specification](./spec.md)
- [Requirements Checklist](./checklists/requirements.md)
- [Project Copilot Instructions](../../.github/instructions/copilot-instructions.md)
- [Element Plus Form Documentation](https://element-plus.org/en-US/component/form.html)
- [Pinia Setup Store Documentation](https://pinia.vuejs.org/core-concepts/)
- [Vitest API Documentation](https://vitest.dev/api/)

---

### 變更歷史

| 日期 | 版本 | 變更內容 | 作者 |
|-----|------|---------|------|
| 2026-01-22 | 1.0.0 | 初版建立 | GitHub Copilot |

---

## 總結

本實作計劃提供了完整的技術設計與實作步驟，將密碼修改功能調整為兩個獨立的 API 端點：

1. **管理者重設密碼** (`resetPassword`): 不需要舊密碼，適用於支援場景
2. **用戶自行修改密碼** (`changePassword`): 需要舊密碼驗證，確保安全性

實作過程中將：
- 新增 `ResetPasswordRequest` 型別與 `resetPassword` API
- 更新管理者端組合式函式移除 oldPassword 欄位
- 保持用戶端功能不變（僅調整 API 端點路徑）
- 更新所有相關測試確保功能正確
- 建立完整的 API 文件與開發指南

預計開發時間約 **2.5 小時**，涵蓋實作、測試、文件更新。

---

**下一步行動**: 

1. 與後端團隊確認 API 端點已實作
2. 按照 Phase 1-5 依序執行實作步驟
3. 完成後進行完整測試
4. 建立 Pull Request 進行 Code Review
