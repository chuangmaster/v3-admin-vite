# Research: 用戶個人資料與密碼管理

**Date**: 2026-01-19  
**Feature**: 004-user-profile  
**Status**: ✅ Complete

## Overview

本文件記錄實作「用戶個人資料與密碼管理」功能前的技術研究與決策過程，解決 Technical Context 中的所有 NEEDS CLARIFICATION 項目。

## Research Tasks

### 1. API 整合策略

**研究問題**: 如何整合現有 `/api/Account/me` API 並處理併發控制？

**調查結果**:
- 專案已有 `getCurrentUserApi()` 位於 `@/common/apis/users/index.ts`
- 目前回應型別為 `{ username: string, roles: string[], permissions: string[] }`
- 用戶需求新增欄位：`id`, `displayName`, `version`
- 密碼修改 API 已存在於 `@/pages/user-management/apis/user.ts` 中的 `changePassword()`

**決策**: 
- **擴展現有 API 型別定義**，在 `@/common/apis/users/type.ts` 新增：
  ```typescript
  export type CurrentUserResponseData = ApiResponse<{
    id: string
    account: string          // 對應 username
    displayName: string
    roles: string[]
    permissions: string[]
    version: number
  }>
  ```
- **重用 changePassword API**，從 user-management 模組匯入
- **處理併發衝突**：捕捉 409 Conflict 錯誤碼，提示用戶重新載入資料

**替代方案**:
- ❌ 建立新的 API 函式：會產生重複程式碼
- ❌ 不處理併發控制：可能導致資料覆蓋問題

**技術細節**:
```typescript
// 錯誤處理範例
try {
  await changePassword({ id: userId, oldPassword, newPassword, version })
} catch (error) {
  if (error.response?.status === 409) {
    ElMessage.error('資料已被其他使用者修改，請重新整理後再試')
    // 重新載入用戶資料
    await refreshUserData()
  }
}
```

---

### 2. Session 管理策略

**研究問題**: 密碼修改後如何實作「僅保留當前 session，其他裝置 session 失效」？

**調查結果**:
- 專案使用 Cookie 儲存 JWT Token（`@/common/utils/cache/cookies.ts`）
- Pinia store (`useUserStore`) 管理登入狀態
- 後端應負責 session 失效邏輯（JWT token 管理）

**決策**: 
- **前端不實作 session 失效邏輯**（後端負責）
- **前端責任**：密碼修改成功後顯示提示訊息，告知用戶其他裝置需重新登入
- **當前裝置**：保持 token 不變，無需重新登入

**Rationale**: 
- JWT token 失效應由後端控制（如：修改 token secret、記錄 token 黑名單）
- 前端無法可靠地使其他裝置登出（分散式架構）
- 保持職責分離，前端專注於 UI/UX

**替代方案**:
- ❌ 前端強制登出：無法影響其他裝置，且體驗不佳
- ❌ 使用 WebSocket 廣播登出：過度工程化，需額外基礎設施

---

### 3. 表單驗證策略

**研究問題**: 如何實作密碼修改表單驗證（舊密碼、新密碼、確認密碼）？

**調查結果**:
- Element Plus 提供 `el-form` 與驗證規則（`rules`）
- 專案已有類似實作：`@/pages/user-management` 的 UserForm
- 專案使用組合式函式模式管理表單邏輯

**決策**: 
- **使用 Element Plus 原生驗證**（`el-form` + `rules`）
- **建立組合式函式** `useChangePasswordForm.ts`：
  - 表單資料響應式管理
  - 驗證規則定義
  - 提交邏輯處理
- **驗證規則**：
  - 舊密碼：必填
  - 新密碼：必填 + 最小長度（依後端規則，預設 6 字元）
  - 確認密碼：必填 + 與新密碼一致

**Best Practices**:
```typescript
// 組合式函式範例
export function useChangePasswordForm() {
  const formRef = ref<FormInstance>()
  const formData = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const rules: FormRules = {
    oldPassword: [{ required: true, message: '請輸入舊密碼', trigger: 'blur' }],
    newPassword: [
      { required: true, message: '請輸入新密碼', trigger: 'blur' },
      { min: 6, message: '密碼長度至少 6 字元', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '請再次輸入新密碼', trigger: 'blur' },
      { validator: validateConfirmPassword, trigger: 'blur' }
    ]
  }
  
  const validateConfirmPassword = (rule: any, value: string, callback: any) => {
    if (value !== formData.newPassword) {
      callback(new Error('兩次輸入的密碼不一致'))
    } else {
      callback()
    }
  }
  
  return { formRef, formData, rules }
}
```

**替代方案**:
- ❌ 手動驗證邏輯：重複造輪子，維護成本高
- ❌ 第三方驗證庫（如 Vuelidate）：引入額外依賴，Element Plus 已足夠

---

### 4. 選單權限控制實作

**研究問題**: 如何實作「根據權限顯示/隱藏選單項目」？

**調查結果**:
- 專案已有權限管理機制（`useUserStore` 的 `permissions`）
- 動態路由配置支援 `permissions` 與 `roles` 屬性
- 側邊欄選單（Sidebar）已實作權限過濾

**決策**: 
- **個人資料頁面無需權限檢查**（所有登入用戶可存取）
- **NavigationBar 下拉選單項目**：不需特殊權限判斷
- **既有選單權限過濾**：檢查 Sidebar 元件邏輯，確保已正確實作

**技術實作**:
```typescript
// 路由配置（個人資料頁面）
{
  path: "/profile",
  component: Layouts,
  meta: { hidden: true },  // 不顯示在側邊欄
  children: [{
    path: "",
    component: () => import("@/pages/profile/index.vue"),
    name: "UserProfile",
    meta: { 
      title: { zhTW: "個人資訊", en: "Profile" },
      titleKey: "userProfile"
      // 無 permissions 屬性 = 所有人可存取
    }
  }]
}
```

**Best Practices**:
- 個人資料頁面使用 `hidden: true`，不在側邊欄顯示
- 透過 NavigationBar 下拉選單進入（類似「登出」按鈕位置）
- 若未來需要權限控制，可新增 `permissions: ["profile.read"]`

**替代方案**:
- ❌ 為個人資料頁面設定權限：不必要，所有用戶都應能查看自己的資料
- ❌ 手動檢查權限：路由守衛已處理，重複實作

---

### 5. UI/UX 設計決策

**研究問題**: 個人資料頁面與密碼修改功能的 UI 佈局？

**調查結果**:
- Element Plus 提供 `el-card`、`el-descriptions`、`el-form` 等元件
- 專案已有類似佈局：用戶管理頁面（表格 + 表單對話框）
- 需求強調「單頁設計，無需跳轉」

**決策**: 
- **雙卡片佈局**：
  1. **用戶資訊卡片**（`UserInfoCard.vue`）：
     - 使用 `el-descriptions` 顯示帳號、顯示名稱、角色
     - 唯讀展示，無編輯功能
  2. **密碼修改卡片**（`ChangePasswordForm.vue`）：
     - 使用 `el-form` 包含三個密碼輸入欄位
     - 提交按鈕與重置按鈕

- **響應式設計**：
  - 桌面：左右並排（60% + 40%）
  - 平板/手機：上下堆疊

**視覺設計**:
```vue
<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="14">
        <UserInfoCard />
      </el-col>
      <el-col :xs="24" :sm="24" :md="10">
        <ChangePasswordForm />
      </el-col>
    </el-row>
  </div>
</template>
```

**Best Practices**:
- 使用 Element Plus 柵格系統（`el-row` + `el-col`）
- 遵循專案現有樣式變數（`--v3-*`）
- 提供 loading 狀態與錯誤提示

**替代方案**:
- ❌ 單卡片 + 選項卡：增加操作步驟
- ❌ 密碼修改使用對話框：與「單頁設計」需求不符

---

## Technology Choices Summary

| 決策項目 | 選擇 | 原因 |
|---------|------|------|
| API 整合 | 擴展現有 API 型別 | 避免重複，遵循 DRY 原則 |
| 併發控制 | version 欄位 + 409 錯誤處理 | 遵循後端 API 規格 |
| Session 管理 | 後端負責，前端僅提示 | 職責分離，架構合理 |
| 表單驗證 | Element Plus 原生驗證 | 充分利用現有工具，避免過度工程化 |
| 狀態管理 | 組合式函式 + Pinia | 遵循 Vue 3 最佳實踐 |
| UI 佈局 | 雙卡片響應式設計 | 平衡桌面與移動端體驗 |
| 權限控制 | 無特殊權限（所有用戶可存取） | 個人資料屬於基本功能 |
| 路由配置 | `hidden: true` 不顯示在側邊欄 | 透過 NavigationBar 進入 |

---

## Resolved Clarifications

所有 Technical Context 中的 NEEDS CLARIFICATION 已解決：

✅ **Primary Dependencies**: Vue 3.5, Element Plus, Pinia, Axios - 所有依賴已確認  
✅ **Testing Strategy**: Vitest 單元測試 + 元件測試 - 測試策略已定義  
✅ **Performance Goals**: 頁面載入 < 3 秒，互動回應 < 500ms - 目標已確認  
✅ **Constraints**: 併發控制透過 version 欄位實作 - 實作策略已確定  
✅ **Scope**: 單一功能頁面，3-5 個元件，500-800 行程式碼 - 範圍已明確

---

## Next Steps (Phase 1)

1. 建立 `data-model.md`：定義資料實體與狀態管理結構
2. 建立 `contracts/api-contracts.md`：定義前端 API 介面合約
3. 建立 `quickstart.md`：提供開發者快速上手指南
4. 更新 AI Agent Context（Copilot 指示）

**Phase 0 Complete** ✅
