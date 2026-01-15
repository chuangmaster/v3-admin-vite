# Research: 用戶個人資料與選單權限管理

**Date**: 2026-01-16  
**Feature**: 004-user-profile  
**Purpose**: 解決 Technical Context 中的技術決策，研究最佳實踐

---

## 研究任務清單

### 1. 用戶個人資料 API 整合方案
### 2. 密碼修改流程與安全性最佳實踐
### 3. Session 失效機制前端處理策略
### 4. 選單權限動態顯示實作方案
### 5. 錯誤處理與用戶回饋設計

---

## 1. 用戶個人資料 API 整合方案

### Decision
使用 `/api/Account/me` API 取得當前登入用戶資料，並在前端快取於 Pinia store。

### Rationale
- **API 規格明確**: Swagger 定義清楚 `GET /api/Account/me` 端點，回傳 `UserProfileResponse` 包含 account, displayName, roles, permissions
- **最小化請求**: 登入後僅需呼叫一次，資料存放於 Pinia store `user.ts`，避免重複請求
- **權限整合**: API 已回傳 permissions 陣列，前端可直接用於選單過濾與按鈕權限控制
- **符合既有架構**: 專案已有 `@/pinia/stores/user.ts`，可擴充 `profile` state

### Alternatives Considered
1. **每次存取時重新取得**: 不快取，每次需要時呼叫 API
   - **Rejected**: 效能差，增加伺服器負擔，不符合 SPA 最佳實踐
2. **使用 LocalStorage 儲存**: 將 profile 資料存於 LocalStorage
   - **Rejected**: 違反安全原則 (Constitution VII)，敏感資料不應存於前端儲存

### Implementation Notes
```typescript
// @/common/apis/account/profile.ts
export async function getUserProfile(): Promise<ApiResponse<UserProfileResponse>> {
  return request({
    url: "/api/Account/me",
    method: "GET"
  })
}

// @/pinia/stores/user.ts
interface UserState {
  profile: UserProfileResponse | null
  // ... 其他 state
}

async function fetchProfile() {
  const response = await getUserProfile()
  if (response.success && response.data) {
    profile.value = response.data
  }
}
```

---

## 2. 密碼修改流程與安全性最佳實踐

### Decision
採用獨立頁面 (`/profile/change-password`) 或對話框元件，整合 `/api/Account/{id}/password` API，前端執行基本驗證後提交至後端。

### Rationale
- **API 規格支援**: `PUT /api/Account/{id}/password` 需要 `oldPassword` 與 `newPassword`，後端負責驗證舊密碼正確性
- **前端驗證減少無效請求**: 
  - 檢查新密碼與確認密碼一致性
  - 檢查密碼強度 (長度、複雜度)
  - 檢查新密碼不得與舊密碼相同 (可選，後端也會檢查)
- **錯誤碼處理**: 
  - `401`: 舊密碼錯誤 → 顯示「舊密碼不正確」
  - `422`: 新密碼與舊密碼相同 → 顯示警告訊息
  - `409`: 並發衝突 → 提示重新載入
- **樂觀鎖定**: API 需要 `version` 參數，前端需在提交時帶上 (從 user profile 取得)

### Alternatives Considered
1. **僅前端驗證**: 不呼叫後端，僅檢查格式
   - **Rejected**: 無法確認舊密碼正確性，違反安全性原則
2. **簡化驗證**: 不檢查新舊密碼相同
   - **Accepted with Warning**: 根據 spec clarification，允許相同密碼但需顯示警告

### Implementation Notes
```typescript
// @/common/apis/account/profile.ts
export async function changePassword(
  id: string,
  data: ChangePasswordRequest,
  version: number
): Promise<ApiResponse<null>> {
  return request({
    url: `/api/Account/${id}/password?version=${version}`,
    method: "PUT",
    data
  })
}

// 前端驗證規則
const rules: FormRules = {
  oldPassword: [
    { required: true, message: "請輸入舊密碼", trigger: "blur" }
  ],
  newPassword: [
    { required: true, message: "請輸入新密碼", trigger: "blur" },
    { min: 8, message: "密碼至少 8 個字元", trigger: "blur" },
    { 
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
      message: "密碼需包含大小寫字母與數字",
      trigger: "blur"
    }
  ],
  confirmPassword: [
    { required: true, message: "請確認新密碼", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value !== formData.newPassword) {
          callback(new Error("兩次密碼輸入不一致"))
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ]
}
```

---

## 3. Session 失效機制前端處理策略

### Decision
密碼修改成功後，前端保持當前 session (不登出)，顯示成功訊息。其他裝置 session 由後端處理 (invalidate tokens)，前端 401 錯誤攔截器會自動導向登入頁。

### Rationale
- **符合需求 FR-006-1**: 密碼修改後，其他裝置 session 失效，當前 session 保留
- **後端負責**: Token invalidation 由後端執行，前端無需主動處理
- **既有機制**: 專案已有 Axios 攔截器處理 401，自動清除 token 並導向登入頁
- **用戶體驗**: 當前操作者不需重新登入，體驗流暢

### Alternatives Considered
1. **前端主動登出所有 session**: 密碼修改後登出當前用戶
   - **Rejected**: 違反需求，當前 session 應保留
2. **前端輪詢檢查 token 有效性**: 定期檢查 token
   - **Rejected**: 不必要的複雜性，後端 401 機制已足夠

### Implementation Notes
```typescript
// 密碼修改成功處理
async function handlePasswordChange() {
  const response = await changePassword(userId, formData, version)
  
  if (response.success) {
    ElMessage.success("密碼修改成功")
    // 不執行登出，保持當前 session
    // 其他裝置會在下次請求時收到 401 並自動登出
  } else if (response.code === "OLD_PASSWORD_INCORRECT") {
    ElMessage.error("舊密碼不正確")
  } else if (response.code === "SAME_AS_OLD_PASSWORD") {
    ElMessage.warning("新密碼與舊密碼相同")
  }
}
```

---

## 4. 選單權限動態顯示實作方案

### Decision
使用 router helper 函式過濾選單項目，根據用戶 permissions 陣列決定是否顯示。路由定義中加入 `meta.permission` 欄位，選單渲染時檢查用戶是否擁有該權限。

### Rationale
- **集中管理**: 權限邏輯集中在 router 層級，易於維護
- **既有機制**: 專案已有 `v-permission` 指令處理按鈕權限，選單採用類似邏輯
- **權限資料來源**: Pinia store 中的 `profile.permissions` 陣列
- **效能**: 選單僅在登入時或權限變更時重新計算，無需頻繁檢查

### Alternatives Considered
1. **元件層級檢查**: 每個選單項目自行檢查權限
   - **Rejected**: 分散邏輯，難以維護
2. **後端回傳選單結構**: API 直接回傳用戶可見選單
   - **Rejected**: 增加後端負擔，前端失去彈性

### Implementation Notes
```typescript
// @/router/helper.ts
export function filterMenusByPermission(
  routes: RouteRecordRaw[],
  userPermissions: string[]
): RouteRecordRaw[] {
  return routes.filter(route => {
    const permission = route.meta?.permission
    if (!permission) return true // 無權限要求則顯示
    return userPermissions.includes(permission)
  })
}

// @/layouts/components/Sidebar.vue
const visibleRoutes = computed(() => {
  const permissions = userStore.profile?.permissions || []
  return filterMenusByPermission(routes, permissions)
})
```

---

## 5. 錯誤處理與用戶回饋設計

### Decision
使用 Element Plus Message 元件顯示操作結果，錯誤訊息根據後端回應碼 (`code`) 對應顯示繁體中文訊息。

### Rationale
- **一致性**: 專案既有使用 `ElMessage` 作為通知元件
- **業務錯誤碼對應**: 後端 API 回傳標準 `ApiResponseModel` 包含 `code` 與 `message`，前端對應顯示友善訊息
- **用戶體驗**: 明確告知操作結果與失敗原因

### Error Code Mapping

| Backend Code | Frontend Message | Message Type |
|--------------|------------------|--------------|
| `SUCCESS` / `success: true` | 「操作成功」或功能特定訊息 | success |
| `VALIDATION_ERROR` | 「輸入資料驗證失敗」 | error |
| `UNAUTHORIZED` | 「未授權，請重新登入」 | error |
| `OLD_PASSWORD_INCORRECT` | 「舊密碼不正確」 | error |
| `SAME_AS_OLD_PASSWORD` | 「新密碼與舊密碼相同」 | warning |
| `CONCURRENT_UPDATE_CONFLICT` | 「資料已被修改，請重新整理」 | error |
| `NOT_FOUND` | 「找不到用戶資料」 | error |
| Network Error | 「網路連線錯誤，請稍後再試」 | error |

### Implementation Notes
```typescript
// 統一錯誤處理函式
function handleApiError(response: ApiResponse<any>) {
  const codeMessageMap: Record<string, string> = {
    VALIDATION_ERROR: "輸入資料驗證失敗",
    UNAUTHORIZED: "未授權，請重新登入",
    OLD_PASSWORD_INCORRECT: "舊密碼不正確",
    SAME_AS_OLD_PASSWORD: "新密碼與舊密碼相同",
    CONCURRENT_UPDATE_CONFLICT: "資料已被修改，請重新整理",
    NOT_FOUND: "找不到用戶資料"
  }
  
  const message = codeMessageMap[response.code] || response.message || "操作失敗"
  const type = response.code === "SAME_AS_OLD_PASSWORD" ? "warning" : "error"
  
  ElMessage({ message, type })
}
```

---

## 總結

### 關鍵技術決策
1. **API 整合**: 使用 `/api/Account/me` 與 `/api/Account/{id}/password`，資料快取於 Pinia
2. **密碼修改**: 獨立頁面或對話框，前端基本驗證 + 後端安全驗證
3. **Session 管理**: 後端處理 token invalidation，前端既有 401 攔截器處理
4. **選單權限**: Router helper 過濾，根據 `profile.permissions` 動態顯示
5. **錯誤處理**: 標準 `ElMessage`，業務錯誤碼對應繁體中文訊息

### 無需進一步研究項目
- 既有架構已完整支援所需功能
- Vue 3 + Element Plus 生態系穩定成熟
- Pinia 狀態管理符合需求
- 專案規範明確，無技術不確定性

### 下一步
進入 Phase 1：設計資料模型與 API 契約
