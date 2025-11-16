# Research: 用戶管理系統

**Feature**: 用戶管理系統
**Date**: 2025-11-16
**Status**: Complete

本文件記錄用戶管理功能的技術研究與決策。

---

## 研究任務概覽

基於 Technical Context 中的需求，以下為需要研究的技術決策點：

1. **前端 Excel 匯出方案**：選擇合適的 JavaScript 套件實現前端報表匯出
2. **權限控制實作方式**：路由級與按鈕級權限的最佳實踐
3. **表單驗證策略**：密碼複雜度驗證與即時反饋
4. **狀態管理設計**：是否需要 Pinia Store 或使用組合式函式
5. **分頁與效能優化**：大量資料的高效渲染方案

---

## 1. 前端 Excel 匯出方案

### Decision

選擇 **SheetJS (xlsx)** 套件實現前端 Excel 匯出功能。

### Rationale

- **成熟穩定**：SheetJS 是業界標準的 JavaScript Excel 處理庫，超過 10 年歷史，社群活躍
- **功能完整**：支援 .xlsx/.xls 格式，支援多工作表、儲存格格式化、公式、圖表等進階功能
- **純前端實作**：完全在瀏覽器端運作，無需後端參與，符合需求
- **效能優良**：能夠處理數千至數萬筆資料，符合 500 筆 < 5 秒的效能目標
- **TypeScript 支援**：提供完整的型別定義（@types/xlsx）
- **相容性佳**：支援所有現代瀏覽器與 IE10+

### Alternatives Considered

- **exceljs**：功能更強大但體積較大（~600KB vs xlsx ~400KB），對本專案而言過於複雜
- **papaparse**：僅支援 CSV 格式，無法滿足 .xlsx 需求
- **自行實作**：開發成本高且難以達到 SheetJS 的功能完整性與穩定性

### Implementation Plan

```typescript
// 安裝套件
// pnpm add xlsx

// 使用範例
import * as XLSX from "xlsx"

export function exportToExcel(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Users")
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}
```

---

## 2. 權限控制實作方式

### Decision

採用 **自訂 v-permission 指令** + **路由守衛** 的混合方案。

### Rationale

- **路由級權限**：使用 Vue Router 的 `beforeEach` 導航守衛，檢查 `meta.permissions`
- **按鈕級權限**：使用自訂指令 `v-permission`，根據用戶權限動態顯示/隱藏按鈕
- **現有架構整合**：專案已有 `@/common/utils/permission.ts` 與 `@/plugins/permission-directive.ts`，可直接擴充使用
- **聲明式語法**：在模板中使用 `v-permission="['user:create']"` 簡潔易讀
- **集中管理**：權限碼統一定義在常數檔案中，便於維護

### Alternatives Considered

- **v-if 手動判斷**：程式碼冗餘，難以維護，容易遺漏
- **HOC/Wrapper 元件**：過度設計，增加元件層級，不符合簡化架構原則
- **權限服務注入**：需要在每個元件手動注入，不如指令簡潔

### Implementation Plan

```typescript
// 1. 定義權限碼常數 (@/common/constants/permissions.ts)
export const USER_PERMISSIONS = {
  READ: 'account.read',      // 查看用戶列表（路由權限）
  CREATE: 'account.create',  // 新增用戶（按鈕權限）
  UPDATE: 'account.update',  // 修改用戶（按鈕權限）
  DELETE: 'account.delete'   // 刪除用戶（按鈕權限）
}

// 2. 路由設定 (@/router/index.ts)
{
  path: '/user-management',
  name: 'UserManagement',
  component: () => import('@/pages/user-management/index.vue'),
  meta: {
    title: '用戶管理',
    permissions: [USER_PERMISSIONS.READ]
  }
}

// 3. 按鈕權限使用 (模板中)
<el-button v-permission="[USER_PERMISSIONS.CREATE]" @click="handleCreate">
  新增用戶
</el-button>
```

---

## 3. 表單驗證策略

### Decision

使用 **Element Plus Form Validation** + **自訂規則** 實現密碼複雜度驗證。

### Rationale

- **原生整合**：Element Plus 提供完整的表單驗證框架，無需額外套件
- **即時反饋**：支援 `blur`、`change` 等觸發時機，提供即時驗證反饋
- **自訂規則**：可輕鬆擴充自訂驗證邏輯（如密碼複雜度）
- **繁體中文訊息**：錯誤訊息完全自訂，符合 UX First 原則
- **非同步驗證**：支援遠端驗證（如檢查用戶名是否已存在）

### Alternatives Considered

- **VeeValidate**：功能強大但引入額外依賴，不符合簡化架構原則
- **Zod/Yup**：偏向 schema 驗證，與 Element Plus 整合需額外轉接層
- **手動驗證**：程式碼冗餘，難以維護，使用者體驗差

### Implementation Plan

```typescript
// 密碼驗證規則 (@/pages/user-management/composables/useUserForm.ts)
const passwordRule = {
  validator: (_rule: any, value: string, callback: any) => {
    if (!value) {
      callback(new Error("請輸入密碼"))
    } else if (value.length < 8) {
      callback(new Error("密碼至少需要 8 字元"))
    } else if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
      callback(new Error("密碼必須包含大小寫字母和數字"))
    } else {
      callback()
    }
  },
  trigger: "blur"
}

const rules = {
  username: [
    { required: true, message: "請輸入用戶名", trigger: "blur" },
    { min: 3, max: 20, message: "用戶名長度為 3-20 字元", trigger: "blur" },
    { pattern: /^\w+$/, message: "僅允許英數字與底線", trigger: "blur" }
  ],
  password: [passwordRule],
  displayName: [
    { required: true, message: "請輸入顯示名稱", trigger: "blur" },
    { max: 100, message: "顯示名稱最多 100 字元", trigger: "blur" }
  ]
}
```

---

## 4. 狀態管理設計

### Decision

優先使用 **組合式函式（Composables）**，僅在需要跨頁面共享狀態時才引入 Pinia Store。

### Rationale

- **簡化架構**：組合式函式足以處理單一頁面的狀態管理，避免過度設計
- **高內聚性**：狀態與邏輯封裝在 `@/pages/user-management/composables/` 內，易於維護
- **效能優良**：組合式函式開銷極小，且支援響應式與生命週期
- **靈活性**：未來若需要跨頁面共享（如用戶資訊快取），可輕鬆遷移至 Pinia Store
- **符合 Vue3 最佳實踐**：官方推薦優先使用 Composables

### Alternatives Considered

- **直接使用 Pinia Store**：對於單一頁面功能而言過於複雜，違反簡化架構原則
- **Provide/Inject**：適合元件樹傳遞，但不如 Composables 靈活
- **全域變數**：不具備響應式，難以追蹤狀態變化

### Implementation Plan

```typescript
// @/pages/user-management/composables/useUserManagement.ts
export function useUserManagement() {
  const users = ref<User[]>([])
  const loading = ref(false)
  const pagination = ref({ pageNumber: 1, pageSize: 20, total: 0 })

  async function fetchUsers() {
    loading.value = true
    try {
      const response = await getUserList(pagination.value)
      users.value = response.data.items
      pagination.value.total = response.data.totalCount
    } finally {
      loading.value = false
    }
  }

  function deleteUser(id: string) {
    // 刪除邏輯
  }

  return { users, loading, pagination, fetchUsers, deleteUser }
}
```

---

## 5. 分頁與效能優化

### Decision

使用 **Element Plus Table** + **後端分頁** + **虛擬滾動（VXE Table，可選）**。

### Rationale

- **後端分頁**：符合 API 契約（pageNumber, pageSize），避免前端處理大量資料
- **Element Plus Table**：與專案 UI 庫一致，提供內建分頁元件與排序功能
- **VXE Table（進階場景）**：若資料量極大（10,000+ 筆），可使用專案已安裝的 VXE Table 實現虛擬滾動
- **按需載入**：僅載入當前頁資料（預設 20 筆），減少記憶體佔用與渲染時間
- **快取策略**：已載入的頁面資料可暫存在記憶體中，減少重複請求

### Alternatives Considered

- **前端全量分頁**：一次載入所有資料再前端分頁，不適合大量資料（10,000+ 筆）
- **無限滾動**：使用者體驗不如傳統分頁，且難以跳轉至指定頁碼
- **手動實作虛擬滾動**：開發成本高，VXE Table 已提供完整方案

### Implementation Plan

```vue
<!-- 使用 Element Plus Table + Pagination -->
<template>
  <el-table :data="users" v-loading="loading">
    <el-table-column prop="username" label="用戶名" />
    <el-table-column prop="displayName" label="顯示名稱" />
    <!-- 其他欄位 -->
  </el-table>

  <el-pagination
    v-model:current-page="pagination.pageNumber"
    v-model:page-size="pagination.pageSize"
    :total="pagination.total"
    :page-sizes="[10, 20, 50, 100]"
    layout="total, sizes, prev, pager, next, jumper"
    @size-change="fetchUsers"
    @current-change="fetchUsers"
  />
</template>
```

---

## 6. 錯誤處理與使用者反饋

### Decision

使用 **Axios 攔截器** + **Element Plus Message/Notification** 統一處理錯誤。

### Rationale

- **集中管理**：在 `@/http/axios.ts` 中配置響應攔截器，自動處理 API 錯誤
- **業務邏輯碼映射**：根據 `ApiResponseModel.code` 顯示對應的繁體中文錯誤訊息
- **使用者友善**：使用 Element Plus Message 顯示簡短提示，Notification 顯示詳細錯誤
- **追蹤支援**：記錄 `traceId` 至 console，便於除錯與問題追蹤

### Implementation Plan

```typescript
// @/http/axios.ts 響應攔截器
axios.interceptors.response.use(
  (response) => {
    const { success, code, message } = response.data
    if (!success) {
      // 根據業務邏輯碼顯示錯誤
      const errorMessages: Record<string, string> = {
        VALIDATION_ERROR: "輸入資料格式不正確",
        UNAUTHORIZED: "未授權，請重新登入",
        USERNAME_EXISTS: "用戶名已存在",
        CONCURRENT_UPDATE_CONFLICT: "資料已被其他使用者更新，請重新載入後再試"
        // ...其他錯誤碼
      }
      ElMessage.error(errorMessages[code] || message || "操作失敗")
      return Promise.reject(response.data)
    }
    return response.data
  },
  (error) => {
    ElMessage.error("網路錯誤，請稍後再試")
    return Promise.reject(error)
  }
)
```

---

## 7. 測試策略

### Decision

採用 **單元測試（Vitest）** + **元件測試（@vue/test-utils）** 的混合策略。

### Rationale

- **組合式函式測試**：對 `useUserManagement`、`useExportExcel` 等邏輯進行單元測試
- **元件測試**：對 `UserForm`、`UserTable` 等關鍵元件進行掛載測試，驗證表單驗證與事件觸發
- **模擬 API**：使用 Vitest 的 `vi.mock` 模擬 Axios 請求，避免依賴後端
- **快照測試**：對穩定元件（如表格欄位結構）使用快照測試

### Implementation Plan

```typescript
// tests/pages/user-management/composables/useUserManagement.test.ts
import { describe, expect, it, vi } from "vitest"
import { useUserManagement } from "@/pages/user-management/composables/useUserManagement"

vi.mock("@/pages/user-management/apis/account", () => ({
  getUserList: vi.fn(() => Promise.resolve({
    data: { items: [], totalCount: 0 }
  }))
}))

describe("useUserManagement", () => {
  it("should fetch users successfully", async () => {
    const { users, fetchUsers } = useUserManagement()
    await fetchUsers()
    expect(users.value).toBeDefined()
  })
})
```

---

## 總結

所有技術決策點均已完成研究，主要結論如下：

1. **Excel 匯出**：使用 SheetJS (xlsx) 實現純前端匯出
2. **權限控制**：自訂 `v-permission` 指令 + 路由守衛
3. **表單驗證**：Element Plus Form Validation + 自訂密碼規則
4. **狀態管理**：優先使用 Composables，按需引入 Pinia
5. **分頁優化**：後端分頁 + Element Plus Table，進階場景使用 VXE Table
6. **錯誤處理**：Axios 攔截器 + Element Plus Message
7. **測試**：Vitest 單元測試 + @vue/test-utils 元件測試

所有方案均符合專案憲章（簡化架構、最新技術棧、使用者體驗優先），可進入 Phase 1 設計階段。
