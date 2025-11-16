# Quick Start: 用戶管理系統

**Feature**: 用戶管理系統
**Date**: 2025-11-16
**Estimated Time**: 2-3 天

本文件提供用戶管理功能的快速開發指南。

---

## 概覽

### 功能摘要

實現用戶管理模組，包含：

- ✅ 用戶列表查詢（分頁、搜尋、篩選）
- ✅ 新增用戶（表單驗證、權限控制）
- ✅ 修改用戶資訊
- ✅ 刪除用戶（軟刪除、二次確認）
- ✅ Excel 報表匯出（前端實作）
- ✅ 路由級與按鈕級權限控制

### 技術棧

- **框架**: Vue 3.5 + TypeScript 5.9
- **UI 庫**: Element Plus 2.11
- **狀態管理**: Composables (Pinia 可選)
- **API**: Axios + JWT Bearer Token
- **Excel**: SheetJS (xlsx)
- **測試**: Vitest + @vue/test-utils

---

## 環境準備

### 1. 安裝依賴

```powershell
# 安裝 Excel 處理套件
pnpm add xlsx

# 安裝型別定義
pnpm add -D @types/xlsx
```

### 2. 確認現有設定

檢查以下檔案是否已正確設定：

- **Axios 配置** (`@/http/axios.ts`): JWT Token 攔截器已設定
- **權限指令** (`@/plugins/permission-directive.ts`): `v-permission` 指令已註冊
- **路由守衛** (`@/router/guard.ts`): 路由權限檢查已實作

---

## 開發步驟

### Step 1: 定義型別與常數（30 分鐘）

#### 1.1 建立型別定義檔案

**檔案**: `@/pages/user-management/types.ts`

```typescript
/**
 * 用戶管理模組型別定義
 */

/** 用戶實體 */
export interface User {
  id: string
  username: string
  displayName: string
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string | null
}

/** 新增用戶請求 */
export interface CreateUserRequest {
  username: string
  password: string
  displayName: string
}

/** 更新用戶請求 */
export interface UpdateUserRequest {
  displayName: string
}

/** 刪除用戶請求 */
export interface DeleteUserRequest {
  confirmation: "CONFIRM"
}

/** 用戶列表查詢參數 */
export interface UserListParams {
  pageNumber: number
  pageSize: number
  searchKeyword?: string
  status?: "active" | "inactive"
}

/** 用戶列表回應 */
export interface UserListResponse {
  items: User[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

/** API 統一回應格式 */
export interface ApiResponse<T = any> {
  success: boolean
  code: string
  message: string
  data: T | null
  timestamp: string
  traceId: string
}
```

#### 1.2 定義權限常數

**檔案**: `@/common/constants/permissions.ts`（新增或擴充）

```typescript
/**
 * 用戶管理模組權限常數
 */
export const USER_PERMISSIONS = {
  VIEW: "user:view", // 查看用戶列表
  CREATE: "user:create", // 新增用戶
  UPDATE: "user:update", // 修改用戶
  DELETE: "user:delete", // 刪除用戶
  EXPORT: "user:export" // 匯出報表
} as const
```

---

### Step 2: 實作 API 封裝（30 分鐘）

**檔案**: `@/pages/user-management/apis/user.ts`

```typescript
import type {
  ApiResponse,
  ChangePasswordRequest,
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserListParams,
  UserListResponse
} from "../types"
import axios from "@/http/axios"

/** 查詢用戶列表 */
export async function getUserList(params: UserListParams): Promise<ApiResponse<UserListResponse>> {
  return axios.get("/api/accounts", { params })
}

/** 查詢單一用戶 */
export async function getUserById(id: string): Promise<ApiResponse<User>> {
  return axios.get(`/api/accounts/${id}`)
}

/** 新增用戶 */
export async function createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
  return axios.post("/api/accounts", data)
}

/** 更新用戶資訊 */
export async function updateUser(id: string, data: UpdateUserRequest): Promise<ApiResponse<User>> {
  return axios.put(`/api/accounts/${id}`, data)
}

/** 刪除用戶（軟刪除） */
export async function deleteUser(id: string): Promise<ApiResponse<null>> {
  return axios.delete(`/api/accounts/${id}`, {
    data: { confirmation: "CONFIRM" }
  })
}
```

---

### Step 3: 實作組合式函式（1.5 小時）

#### 3.1 用戶管理邏輯

**檔案**: `@/pages/user-management/composables/useUserManagement.ts`

```typescript
import type { User, UserListParams } from "../types"
import { ElMessage, ElMessageBox } from "element-plus"
import { ref } from "vue"
import { deleteUser, getUserList } from "../apis/user"

export function useUserManagement() {
  const users = ref<User[]>([])
  const loading = ref(false)
  const pagination = ref({
    pageNumber: 1,
    pageSize: 20,
    total: 0
  })
  const searchKeyword = ref("")

  /** 載入用戶列表 */
  async function fetchUsers() {
    loading.value = true
    try {
      const params: UserListParams = {
        pageNumber: pagination.value.pageNumber,
        pageSize: pagination.value.pageSize,
        searchKeyword: searchKeyword.value || undefined
      }
      const response = await getUserList(params)
      if (response.success && response.data) {
        users.value = response.data.items
        pagination.value.total = response.data.totalCount
      }
    } finally {
      loading.value = false
    }
  }

  /** 刪除用戶 */
  async function handleDelete(user: User) {
    try {
      await ElMessageBox.confirm(
        `確定要刪除用戶「${user.displayName}」嗎？此操作無法復原。`,
        "刪除確認",
        {
          confirmButtonText: "確定刪除",
          cancelButtonText: "取消",
          type: "warning"
        }
      )
      await deleteUser(user.id)
      ElMessage.success("用戶刪除成功")
      fetchUsers()
    } catch (error) {
      if (error !== "cancel") {
        console.error("刪除用戶失敗:", error)
      }
    }
  }

  /** 重置搜尋 */
  function resetSearch() {
    searchKeyword.value = ""
    pagination.value.pageNumber = 1
    fetchUsers()
  }

  return {
    users,
    loading,
    pagination,
    searchKeyword,
    fetchUsers,
    handleDelete,
    resetSearch
  }
}
```

#### 3.2 表單驗證邏輯

**檔案**: `@/pages/user-management/composables/useUserForm.ts`

```typescript
import type { FormInstance, FormRules } from "element-plus"
import type { CreateUserRequest, UpdateUserRequest, User } from "../types"
import { reactive, ref } from "vue"
import { createUser, updateUser } from "../apis/user"

export function useUserForm() {
  const formRef = ref<FormInstance>()
  const formLoading = ref(false)
  const formData = reactive<CreateUserRequest>({
    username: "",
    password: "",
    displayName: ""
  })

  /** 密碼驗證規則 */
  const passwordValidator = (_rule: any, value: string, callback: any) => {
    if (!value) {
      callback(new Error("請輸入密碼"))
    } else if (value.length < 8) {
      callback(new Error("密碼至少需要 8 字元"))
    } else if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
      callback(new Error("密碼必須包含大小寫字母和數字"))
    } else {
      callback()
    }
  }

  const rules: FormRules = {
    username: [
      { required: true, message: "請輸入用戶名", trigger: "blur" },
      { min: 3, max: 20, message: "用戶名長度為 3-20 字元", trigger: "blur" },
      { pattern: /^\w+$/, message: "僅允許英數字與底線", trigger: "blur" }
    ],
    password: [{ validator: passwordValidator, trigger: "blur" }],
    displayName: [
      { required: true, message: "請輸入顯示名稱", trigger: "blur" },
      { max: 100, message: "顯示名稱最多 100 字元", trigger: "blur" }
    ]
  }

  /** 提交表單 */
  async function submitForm() {
    if (!formRef.value) return false

    await formRef.value.validate()
    formLoading.value = true
    try {
      const response = await createUser(formData)
      if (response.success) {
        return true
      }
      return false
    } finally {
      formLoading.value = false
    }
  }

  /** 重置表單 */
  function resetForm() {
    formRef.value?.resetFields()
  }

  return {
    formRef,
    formData,
    formLoading,
    rules,
    submitForm,
    resetForm
  }
}
```

#### 3.3 Excel 匯出邏輯

**檔案**: `@/pages/user-management/composables/useExportExcel.ts`

```typescript
import type { User } from "../types"
import dayjs from "dayjs"
import * as XLSX from "xlsx"

export function useExportExcel() {
  /** 匯出用戶資料為 Excel */
  function exportUsers(users: User[]) {
    // 轉換資料格式
    const exportData = users.map(user => ({
      用戶名: user.username,
      顯示名稱: user.displayName,
      狀態: user.status === "active" ? "啟用" : "已停用",
      建立時間: dayjs(user.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      最後更新時間: user.updatedAt ? dayjs(user.updatedAt).format("YYYY-MM-DD HH:mm:ss") : "-"
    }))

    // 建立工作表
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // 設定欄位寬度
    const columnWidths = [
      { wch: 20 }, // 用戶名
      { wch: 20 }, // 顯示名稱
      { wch: 10 }, // 狀態
      { wch: 20 }, // 建立時間
      { wch: 20 } // 最後更新時間
    ]
    worksheet["!cols"] = columnWidths

    // 建立工作簿
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "用戶列表")

    // 生成檔名（包含時間戳）
    const filename = `用戶列表_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`

    // 下載檔案
    XLSX.writeFile(workbook, filename)
  }

  return {
    exportUsers
  }
}
```

---

### Step 4: 實作元件（2 小時）

#### 4.1 用戶表格元件

**檔案**: `@/pages/user-management/components/UserTable.vue`

```vue
<script setup lang="ts">
import type { User } from "../types"
import { USER_PERMISSIONS } from "@@/constants/permissions"
import dayjs from "dayjs"
import { computed } from "vue"

interface Props {
  data: User[]
  loading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [user: User]
  delete: [user: User]
}>()

const statusOptions = [
  { label: "啟用", value: "active", type: "success" },
  { label: "已停用", value: "inactive", type: "info" }
]

function getStatusType(status: string) {
  return statusOptions.find(opt => opt.value === status)?.type || "info"
}

function getStatusLabel(status: string) {
  return statusOptions.find(opt => opt.value === status)?.label || status
}
</script>

<template>
  <el-table :data="props.data" v-loading="props.loading" border stripe>
    <el-table-column prop="username" label="用戶名" width="150" />
    <el-table-column prop="displayName" label="顯示名稱" width="150" />
    <el-table-column prop="status" label="狀態" width="100">
      <template #default="{ row }">
        <el-tag :type="getStatusType(row.status)">
          {{ getStatusLabel(row.status) }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="createdAt" label="建立時間" width="180">
      <template #default="{ row }">
        {{ dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') }}
      </template>
    </el-table-column>
    <el-table-column prop="updatedAt" label="最後更新時間" width="180">
      <template #default="{ row }">
        {{ row.updatedAt ? dayjs(row.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '-' }}
      </template>
    </el-table-column>
    <el-table-column label="操作" width="180" fixed="right">
      <template #default="{ row }">
        <el-button
          v-permission="[USER_PERMISSIONS.UPDATE]"
          type="primary"
          size="small"
          link
          @click="emit('edit', row)"
        >
          編輯
        </el-button>
        <el-button
          v-permission="[USER_PERMISSIONS.DELETE]"
          type="danger"
          size="small"
          link
          @click="emit('delete', row)"
        >
          刪除
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>
```

#### 4.2 用戶表單元件

**檔案**: `@/pages/user-management/components/UserForm.vue`

```vue
<script setup lang="ts">
import { useUserForm } from "../composables/useUserForm"

const emit = defineEmits<{
  success: []
}>()

const { formRef, formData, formLoading, rules, submitForm, resetForm } = useUserForm()

async function handleSubmit() {
  const success = await submitForm()
  if (success) {
    emit("success")
    resetForm()
  }
}

function handleCancel() {
  resetForm()
}

defineExpose({ resetForm })
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="120px"
    :disabled="formLoading"
  >
    <el-form-item label="用戶名" prop="username">
      <el-input
        v-model="formData.username"
        placeholder="請輸入用戶名（3-20 字元，僅英數字與底線）"
        maxlength="20"
        show-word-limit
      />
    </el-form-item>
    <el-form-item label="密碼" prop="password">
      <el-input
        v-model="formData.password"
        type="password"
        placeholder="請輸入密碼（最少 8 字元，包含大小寫字母與數字）"
        show-password
      />
    </el-form-item>
    <el-form-item label="顯示名稱" prop="displayName">
      <el-input
        v-model="formData.displayName"
        placeholder="請輸入顯示名稱"
        maxlength="100"
        show-word-limit
      />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" :loading="formLoading" @click="handleSubmit">
        提交
      </el-button>
      <el-button @click="handleCancel">
        取消
      </el-button>
    </el-form-item>
  </el-form>
</template>
```

---

### Step 5: 實作主頁面（1.5 小時）

**檔案**: `@/pages/user-management/index.vue`

```vue
<script setup lang="ts">
import { USER_PERMISSIONS } from "@@/constants/permissions"
import { onMounted, ref } from "vue"
import UserForm from "./components/UserForm.vue"
import UserTable from "./components/UserTable.vue"
import { useExportExcel } from "./composables/useExportExcel"
import { useUserManagement } from "./composables/useUserManagement"

const { users, loading, pagination, searchKeyword, fetchUsers, handleDelete, resetSearch } = useUserManagement()
const { exportUsers } = useExportExcel()

const dialogVisible = ref(false)
const userFormRef = ref<InstanceType<typeof UserForm>>()

/** 處理新增用戶 */
function handleCreate() {
  dialogVisible.value = true
}

/** 處理編輯用戶 */
function handleEdit(user: any) {
  // TODO: 實作編輯邏輯
  console.log("編輯用戶:", user)
}

/** 處理表單提交成功 */
function handleFormSuccess() {
  dialogVisible.value = false
  fetchUsers()
}

/** 處理匯出 */
function handleExport() {
  exportUsers(users.value)
}

/** 處理分頁變更 */
function handlePageChange() {
  fetchUsers()
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="user-management">
    <!-- 搜尋列 -->
    <el-card class="mb-4">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="請輸入用戶名或顯示名稱"
            clearable
            @clear="resetSearch"
          >
            <template #append>
              <el-button icon="Search" @click="fetchUsers" />
            </template>
          </el-input>
        </el-col>
        <el-col :span="16" class="text-right">
          <el-button
            v-permission="[USER_PERMISSIONS.CREATE]"
            type="primary"
            icon="Plus"
            @click="handleCreate"
          >
            新增用戶
          </el-button>
          <el-button
            v-permission="[USER_PERMISSIONS.EXPORT]"
            icon="Download"
            @click="handleExport"
          >
            匯出報表
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 用戶表格 -->
    <el-card>
      <UserTable
        :data="users"
        :loading="loading"
        @edit="handleEdit"
        @delete="handleDelete"
      />

      <!-- 分頁 -->
      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="pagination.pageNumber"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 新增/編輯對話框 -->
    <el-dialog
      v-model="dialogVisible"
      title="新增用戶"
      width="600px"
      :close-on-click-modal="false"
    >
      <UserForm ref="userFormRef" @success="handleFormSuccess" />
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.user-management {
  padding: 20px;
}
</style>
```

---

### Step 6: 設定路由（15 分鐘）

**檔案**: `@/router/index.ts`（新增路由設定）

```typescript
import { USER_PERMISSIONS } from '@@/constants/permissions'

{
  path: '/user-management',
  name: 'UserManagement',
  component: () => import('@/pages/user-management/index.vue'),
  meta: {
    title: '用戶管理',
    icon: 'User',
    permissions: [USER_PERMISSIONS.VIEW],
    hidden: false,
    alwaysShow: false
  }
}
```

---

### Step 7: 測試（1 小時）

#### 7.1 單元測試

**檔案**: `tests/pages/user-management/composables/useUserManagement.test.ts`

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest"
import * as userApi from "@/pages/user-management/apis/user"
import { useUserManagement } from "@/pages/user-management/composables/useUserManagement"

vi.mock("@/pages/user-management/apis/user")

describe("useUserManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should fetch users successfully", async () => {
    const mockData = {
      success: true,
      data: {
        items: [{ id: "1", username: "test", displayName: "Test User", status: "active", createdAt: "2025-11-16", updatedAt: null }],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 20,
        totalPages: 1
      }
    }

    vi.mocked(userApi.getUserList).mockResolvedValue(mockData as any)

    const { users, fetchUsers } = useUserManagement()
    await fetchUsers()

    expect(users.value).toHaveLength(1)
    expect(users.value[0].username).toBe("test")
  })
})
```

#### 7.2 手動測試檢查清單

- [ ] 用戶列表正確顯示
- [ ] 分頁功能正常
- [ ] 搜尋功能正常
- [ ] 新增用戶成功（表單驗證生效）
- [ ] 編輯用戶成功
- [ ] 刪除用戶成功（二次確認對話框顯示）
- [ ] 權限控制正確（無權限時按鈕隱藏）
- [ ] Excel 匯出成功（檔案包含正確資料）
- [ ] 錯誤提示正確顯示（如用戶名已存在）

---

## 常見問題

### Q1: 如何測試後端 API？

**A**: 使用 Postman 或 cURL 測試 `/api/accounts` 端點，確保後端正常運作後再整合前端。

### Q2: 如何模擬權限？

**A**: 修改 Pinia User Store 的 `permissions` 狀態，臨時加入或移除權限碼進行測試。

### Q3: Excel 匯出檔案過大怎麼辦？

**A**: 使用 `XLSX.write` 的 `compression: true` 選項，或限制匯出資料量（如當前頁資料）。

### Q4: 如何處理並發更新衝突？

**A**: Axios 攔截器會自動處理 409 錯誤，顯示「資料已被其他使用者更新」訊息，提示用戶重新載入。

---

## 下一步

完成本 Quick Start 後，建議：

1. ✅ 執行完整測試（單元測試 + 手動測試）
2. ✅ 提交程式碼至 Git（遵循 Conventional Commits）
3. ✅ 更新文件（如需要）
4. ✅ 部署至測試環境進行驗證

參考文件：

- [Data Model](./data-model.md)
- [API Contracts](./contracts/api-contracts.md)
- [Research](./research.md)

---

**預估總開發時間**: 2-3 天（包含測試與除錯）
