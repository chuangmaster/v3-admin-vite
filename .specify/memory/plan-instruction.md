# V3 Admin Vite 開發規範與樣板

本文件說明專案的開發規範、程式碼風格、命名規則與 UI 元件使用準則，確保團隊開發一致性。

## 目錄

- [專案架構](#專案架構)
- [程式碼風格](#程式碼風格)
- [命名規範](#命名規範)
- [型別定義規範](#型別定義規範)
- [組合式函式規範](#組合式函式規範)
- [頁面元件規範](#頁面元件規範)
- [表單元件規範](#表單元件規範)
- [表格元件規範](#表格元件規範)
- [權限控制規範](#權限控制規範)
- [API 呼叫規範](#api-呼叫規範)
- [完整範例](#完整範例)

---

## 專案架構

### 功能模組目錄結構

每個功能模組應遵循以下目錄結構：

```
src/pages/[module-name]/
├── index.vue              # 主頁面
├── types.ts               # 型別定義
├── apis/                  # API 服務
│   └── [module].ts        # 模組 API
├── components/            # 私有元件
│   ├── [Module]Form.vue   # 表單元件
│   └── [Module]Table.vue  # 表格元件
└── composables/           # 組合式函式
    ├── use[Module]Management.ts  # 列表管理邏輯
    ├── use[Module]Form.ts        # 表單邏輯
    └── useExportExcel.ts         # Excel 匯出邏輯
```

**範例**：用戶管理模組 `user-management`

```
src/pages/user-management/
├── index.vue
├── types.ts
├── apis/
│   └── user.ts
├── components/
│   ├── UserForm.vue
│   └── UserTable.vue
└── composables/
    ├── useUserManagement.ts
    ├── useUserForm.ts
    ├── useChangePasswordForm.ts
    └── useExportExcel.ts
```

---

## 程式碼風格

### TypeScript

- **嚴格模式**：啟用 TypeScript 嚴格模式
- **型別優先**：避免使用 `any`，未知型別使用 `unknown`
- **明確回傳型別**：公共函式必須明確定義回傳型別
- **介面定義**：物件型別優先使用 `interface`，聯集/交叉型別使用 `type`

### Vue 3

- **語法**：使用 Composition API 搭配 `<script setup lang="ts">`
- **響應式**：優先使用 `ref` 而非 `reactive`
- **模板**：複雜表達式重構為計算屬性或方法
- **樣式**：使用 Scoped CSS `<style scoped lang="scss">`

### ESLint

- 使用專案設定的 ESLint 規則
- 禁用 Prettier（已整合至 ESLint）
- 提交前確保無 lint 錯誤

---

## 命名規範

### 檔案命名

| 類型 | 規則 | 範例 |
|------|------|------|
| 頁面 | kebab-case | `user-management/index.vue` |
| 元件 | PascalCase | `UserForm.vue`, `UserTable.vue` |
| 組合式函式 | camelCase + `use` 前綴 | `useUserManagement.ts` |
| API 檔案 | kebab-case | `user.ts`, `role.ts` |
| 型別檔案 | kebab-case | `types.ts` |
| 工具函式 | kebab-case | `format-date.ts` |

### 變數與函式命名

| 類型 | 規則 | 範例 |
|------|------|------|
| 變數 | camelCase | `userName`, `isLoading` |
| 常數 | UPPER_CASE | `API_BASE_URL`, `MAX_PAGE_SIZE` |
| 函式 | camelCase | `fetchUsers()`, `handleDelete()` |
| 型別/介面 | PascalCase | `User`, `UserListParams` |
| 私有變數 | `_` 前綴 | `_internalState` |

### 特殊命名規範

**布林值**：使用 `is`、`has`、`can`、`should` 前綴
```typescript
const isLoading = ref(false)
const hasPermission = ref(true)
const canEdit = computed(() => ...)
```

**事件處理器**：使用 `handle` 前綴
```typescript
function handleCreate() { ... }
function handleEdit(user: User) { ... }
function handleDelete(user: User) { ... }
```

**API 函式**：使用動詞 + 名詞
```typescript
async function getUsers() { ... }
async function createUser() { ... }
async function updateUser() { ... }
async function deleteUser() { ... }
```

---

## 型別定義規範

### 註解風格

**統一使用 JSDoc 單行註解**：

```typescript
/** 用戶實體 */
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
  /** 版本號，用於並發控制 */
  version: number
}
```

❌ **避免使用區塊註解**：
```typescript
/**
 * 用戶實體
 * 這是一個多行註解
 */
export interface User {
  /**
   * 用戶唯一識別碼
   * UUID 格式
   */
  id: string
}
```

### 標準型別定義

#### 實體型別（Entity）
```typescript
/** [模組]實體 */
export interface User {
  /** 唯一識別碼（UUID） */
  id: string
  /** 其他欄位... */
  // ...
  /** 版本號（用於樂觀鎖定） */
  version: number
  /** 建立時間（ISO 8601） */
  createdAt: string
  /** 更新時間（ISO 8601） */
  updatedAt: string
}
```

#### 請求型別（Request DTO）
```typescript
/** 新增[模組]請求 */
export interface CreateUserRequest {
  /** 必填欄位 */
  username: string
  /** 選填欄位 */
  email?: string
}

/** 更新[模組]請求 */
export interface UpdateUserRequest {
  /** 欄位... */
  displayName: string
  /** 版本號（用於樂觀鎖定） */
  version: number
}
```

#### 查詢參數型別
```typescript
/** [模組]列表查詢參數 */
export interface UserListParams {
  /** 頁碼（從 1 開始） */
  pageNumber: number
  /** 每頁筆數（1-100） */
  pageSize: number
  /** 搜尋關鍵字（可選） */
  searchKeyword?: string
  /** 狀態篩選（可選） */
  status?: "active" | "inactive"
}
```

#### 回應型別
```typescript
/** API 統一回應格式 */
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
```

---

## 組合式函式規範

### 列表管理組合式函式

**檔案命名**：`use[Module]Management.ts`

**標準結構**：

```typescript
/**
 * [模組]管理組合式函式
 * 處理列表查詢、刪除、分頁邏輯
 */
export function useUserManagement() {
  /** [模組]列表 */
  const users = ref<User[]>([])
  
  /** 載入狀態 */
  const loading = ref(false)
  
  /** 分頁資訊 */
  const pagination = ref({
    pageNumber: 1,
    pageSize: 20,
    total: 0
  })
  
  /** 搜尋關鍵字 */
  const searchKeyword = ref("")
  
  /**
   * 載入列表
   */
  async function fetchUsers(): Promise<void> {
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
  
  /**
   * 刪除項目
   */
  async function handleDelete(user: User): Promise<void> {
    try {
      await ElMessageBox.confirm(
        `確定要刪除「${user.displayName}」嗎？此操作無法復原。`,
        "刪除確認",
        {
          confirmButtonText: "確定刪除",
          cancelButtonText: "取消",
          type: "warning"
        }
      )
      const response = await deleteUser(user.id)
      if (response.success) {
        ElMessage.success("刪除成功")
        await fetchUsers()
      }
    } catch (error) {
      if (error !== "cancel") {
        console.error("刪除失敗:", error)
      }
    }
  }
  
  /**
   * 重置搜尋
   */
  function resetSearch(): void {
    searchKeyword.value = ""
    pagination.value.pageNumber = 1
    fetchUsers()
  }
  
  /**
   * Debounce 搜尋（當 API 支持搜尋時）
   */
  const debouncedSearch = debounce(() => {
    pagination.value.pageNumber = 1
    fetchUsers()
  }, 500)
  
  watch(searchKeyword, () => {
    debouncedSearch()
  })
  
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

### 表單管理組合式函式

**檔案命名**：`use[Module]Form.ts`

**標準結構**：

```typescript
/**
 * [模組]表單組合式函式
 */
export function useUserForm() {
  const formRef = ref<FormInstance>()
  const formLoading = ref(false)
  const isEditMode = ref(false)
  
  const formData = ref<CreateUserRequest | UpdateUserRequest>({
    username: "",
    displayName: "",
    password: ""
  })
  
  /** 表單驗證規則 */
  const rules: FormRules = {
    username: [
      { required: true, message: "請輸入帳號", trigger: "blur" },
      { min: 3, max: 20, message: "長度 3-20 字元", trigger: "blur" }
    ],
    displayName: [
      { required: true, message: "請輸入顯示名稱", trigger: "blur" }
    ]
  }
  
  /**
   * 提交表單
   */
  async function submitForm(): Promise<boolean> {
    if (!formRef.value) return false
    
    try {
      await formRef.value.validate()
      formLoading.value = true
      
      const response = isEditMode.value
        ? await updateUser(formData.value.id, formData.value)
        : await createUser(formData.value)
      
      if (response.success) {
        ElMessage.success(isEditMode.value ? "更新成功" : "新增成功")
        return true
      }
      return false
    } catch (error) {
      console.error("表單提交失敗:", error)
      return false
    } finally {
      formLoading.value = false
    }
  }
  
  /**
   * 重置表單
   */
  function resetForm(): void {
    formRef.value?.resetFields()
    isEditMode.value = false
  }
  
  /**
   * 設置編輯模式
   */
  function setEditMode(user: User): void {
    isEditMode.value = true
    Object.assign(formData.value, user)
  }
  
  return {
    formRef,
    formData,
    formLoading,
    isEditMode,
    rules,
    submitForm,
    resetForm,
    setEditMode
  }
}
```

---

## 頁面元件規範

### 標準頁面結構

**檔案位置**：`src/pages/[module-name]/index.vue`

```vue
<script setup lang="ts">
import type { User } from "./types"
import { USER_PERMISSIONS } from "@@/constants/permissions"
import { Download, Plus, Search } from "@element-plus/icons-vue"
import { onMounted, ref } from "vue"
import UserForm from "./components/UserForm.vue"
import UserTable from "./components/UserTable.vue"
import { useExportExcel } from "./composables/useExportExcel"
import { useUserManagement } from "./composables/useUserManagement"

// ========== 組合式函式 ==========
const { users, loading, pagination, searchKeyword, fetchUsers, handleDelete, resetSearch }
  = useUserManagement()
const { exportUsers } = useExportExcel()

// ========== 對話框狀態 ==========
const dialogVisible = ref(false)
const dialogTitle = ref("新增用戶")
const userFormRef = ref<InstanceType<typeof UserForm>>()

// ========== 事件處理 ==========
function handleCreate(): void {
  dialogTitle.value = "新增用戶"
  userFormRef.value?.resetForm()
  dialogVisible.value = true
}

function handleEdit(user: User): void {
  dialogTitle.value = "編輯用戶"
  userFormRef.value?.setupEdit(user)
  dialogVisible.value = true
}

function handleFormSuccess(): void {
  dialogVisible.value = false
  fetchUsers()
}

function handleFormCancel(): void {
  dialogVisible.value = false
}

function handleExport(): void {
  exportUsers(users.value)
}

function handlePageChange(): void {
  fetchUsers()
}

function handleSearchClear(): void {
  resetSearch()
}

// ========== 生命週期 ==========
onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="user-management-page">
    <!-- 工具列 -->
    <div class="toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="請輸入搜尋關鍵字"
        clearable
        style="width: 250px"
        @clear="handleSearchClear"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <div class="toolbar-buttons">
        <el-button
          v-permission="[USER_PERMISSIONS.CREATE]"
          type="primary"
          :icon="Plus"
          @click="handleCreate"
        >
          新增用戶
        </el-button>
        <el-button
          :icon="Download"
          @click="handleExport"
        >
          匯出報表
        </el-button>
      </div>
    </div>

    <!-- 表格卡片 -->
    <el-card class="table-card">
      <template #header>
        <span class="card-title">用戶列表</span>
      </template>

      <UserTable :data="users" :loading="loading" @edit="handleEdit" @delete="handleDelete" />

      <!-- 分頁 -->
      <div class="pagination-container">
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
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <UserForm ref="userFormRef" @success="handleFormSuccess" @cancel="handleFormCancel" />
      <template #footer>
        <el-button @click="handleFormCancel">
          取消
        </el-button>
        <el-button type="primary" @click="userFormRef?.handleSubmit?.()">
          確認
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.user-management-page {
  padding: 20px;

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 16px;

    .toolbar-buttons {
      display: flex;
      gap: 8px;
    }
  }

  .table-card {
    :deep(.el-card__header) {
      padding: 16px 20px;
      border-bottom: 1px solid var(--el-border-color-light);
      background-color: var(--el-fill-color-blank);
    }

    :deep(.el-card__body) {
      padding: 0;
    }

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    padding: 16px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-fill-color-blank);
  }
}
</style>
```

### 頁面元件使用規範

#### 工具列（Toolbar）

**必須包含**：
- 搜尋框（如 API 支持搜尋）
- 新增按鈕（帶權限控制）
- 其他操作按鈕（匯出、重置等）

**佈局**：
```vue
<div class="toolbar">
  <!-- 左側：搜尋框 -->
  <el-input v-model="searchKeyword" ... />
  
  <!-- 右側：操作按鈕 -->
  <div class="toolbar-buttons">
    <el-button v-permission="[...]" type="primary">新增</el-button>
    <el-button>匯出</el-button>
  </div>
</div>
```

#### 表格卡片（Table Card）

**結構**：
```vue
<el-card class="table-card">
  <template #header>
    <span class="card-title">列表標題</span>
  </template>
  
  <!-- 表格 -->
  <ModuleTable :data="items" :loading="loading" @edit="..." @delete="..." />
  
  <!-- 分頁 -->
  <div class="pagination-container">
    <el-pagination ... />
  </div>
</el-card>
```

#### 分頁元件

**標準設定**：
```vue
<el-pagination
  v-model:current-page="pagination.pageNumber"
  v-model:page-size="pagination.pageSize"
  :total="pagination.total"
  :page-sizes="[10, 20, 50, 100]"
  layout="total, sizes, prev, pager, next, jumper"
  @size-change="handlePageChange"
  @current-change="handlePageChange"
/>
```

**重要**：
- 必須使用 `@size-change` 和 `@current-change`（不使用 `@change`）
- 綁定 `pagination` 物件的屬性
- 頁碼從 1 開始

#### 對話框（Dialog）

**標準設定**：
```vue
<el-dialog
  v-model="dialogVisible"
  :title="dialogTitle"
  width="600px"
  :close-on-click-modal="false"
>
  <FormComponent ref="formRef" @success="..." @cancel="..." />
  
  <template #footer>
    <el-button @click="handleCancel">取消</el-button>
    <el-button type="primary" @click="formRef?.handleSubmit?.()">
      確認
    </el-button>
  </template>
</el-dialog>
```

**注意事項**：
- Dialog 在頁面中定義，不在表單元件內
- 表單元件通過 `emit` 事件與頁面溝通
- 設置 `:close-on-click-modal="false"` 防止誤關閉

---

## 表單元件規範

### 標準表單元件結構

**檔案命名**：`[Module]Form.vue`（如 `UserForm.vue`）

```vue
<script setup lang="ts">
import type { Ref } from "vue"
import type { User } from "../types"
import { ref } from "vue"
import { useUserForm } from "../composables/useUserForm"

const emit = defineEmits<{
  /** 表單提交成功事件 */
  success: []
  /** 取消事件 */
  cancel: []
}>()

const { formRef, formData, formLoading, isEditMode, rules, submitForm, resetForm, setEditMode }
  = useUserForm()

/**
 * 處理表單提交
 */
async function handleSubmit(): Promise<void> {
  const success = await submitForm()
  if (success) {
    emit("success")
    resetForm()
  }
}

/**
 * 處理取消
 */
function handleCancel(): void {
  resetForm()
  emit("cancel")
}

/**
 * 設置編輯模式（公開方法供父元件呼叫）
 */
function setupEdit(user: User): void {
  setEditMode(user)
}

// 暴露給父元件的方法
defineExpose({
  setupEdit,
  resetForm,
  handleSubmit
})
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="100px"
    :disabled="formLoading"
  >
    <el-form-item label="帳號" prop="username">
      <el-input
        v-model="formData.username"
        placeholder="請輸入帳號"
        :disabled="isEditMode"
        clearable
      />
    </el-form-item>
    
    <el-form-item label="顯示名稱" prop="displayName">
      <el-input
        v-model="formData.displayName"
        placeholder="請輸入顯示名稱"
        clearable
      />
    </el-form-item>
    
    <el-form-item v-if="!isEditMode" label="密碼" prop="password">
      <el-input
        v-model="formData.password"
        type="password"
        placeholder="請輸入密碼"
        show-password
        clearable
      />
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">
// 表單樣式
</style>
```

### 表單驗證規則

**定義位置**：在 `use[Module]Form.ts` 中定義

```typescript
import type { FormRules } from "element-plus"

const rules: FormRules = {
  username: [
    { required: true, message: "請輸入帳號", trigger: "blur" },
    { min: 3, max: 20, message: "長度 3-20 字元", trigger: "blur" },
    { pattern: /^[a-zA-Z0-9_]+$/, message: "僅限英數字與底線", trigger: "blur" }
  ],
  displayName: [
    { required: true, message: "請輸入顯示名稱", trigger: "blur" },
    { min: 1, max: 100, message: "長度 1-100 字元", trigger: "blur" }
  ],
  email: [
    { type: "email", message: "請輸入正確的電子郵件", trigger: "blur" }
  ]
}
```

### 自訂驗證器

```typescript
const validatePassword: FormItemRule["validator"] = (_rule, value, callback) => {
  if (!value) {
    callback()
    return
  }
  // 密碼必須包含大小寫字母與數字，至少 8 字元
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  if (!pattern.test(value)) {
    callback(new Error("密碼必須包含大小寫字母與數字，至少 8 字元"))
  } else {
    callback()
  }
}

const rules: FormRules = {
  password: [
    { required: true, message: "請輸入密碼", trigger: "blur" },
    { validator: validatePassword, trigger: "blur" }
  ]
}
```

---

## 表格元件規範

### 標準表格元件結構

**檔案命名**：`[Module]Table.vue`（如 `UserTable.vue`）

```vue
<script setup lang="ts">
import type { User } from "../types"
import { USER_PERMISSIONS } from "@@/constants/permissions"
import { Delete, Edit } from "@element-plus/icons-vue"

interface Props {
  /** 表格資料 */
  data: User[]
  /** 載入狀態 */
  loading: boolean
}

interface Emits {
  /** 編輯事件 */
  (e: "edit", user: User): void
  /** 刪除事件 */
  (e: "delete", user: User): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

function handleEdit(user: User): void {
  emit("edit", user)
}

function handleDelete(user: User): void {
  emit("delete", user)
}

/**
 * 格式化狀態顯示
 */
function formatStatus(status: string): string {
  return status === "active" ? "啟用" : "已停用"
}

/**
 * 格式化日期顯示
 */
function formatDate(date: string | null): string {
  if (!date) return "-"
  return new Date(date).toLocaleString("zh-TW")
}
</script>

<template>
  <el-table
    :data="data"
    :loading="loading"
    stripe
    border
    style="width: 100%"
  >
    <el-table-column prop="username" label="帳號" width="150" />
    <el-table-column prop="displayName" label="顯示名稱" width="150" />
    <el-table-column prop="status" label="狀態" width="100">
      <template #default="{ row }">
        <el-tag :type="row.status === 'active' ? 'success' : 'info'">
          {{ formatStatus(row.status) }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="createdAt" label="建立時間" width="180">
      <template #default="{ row }">
        {{ formatDate(row.createdAt) }}
      </template>
    </el-table-column>
    <el-table-column prop="updatedAt" label="更新時間" width="180">
      <template #default="{ row }">
        {{ formatDate(row.updatedAt) }}
      </template>
    </el-table-column>
    <el-table-column label="操作" width="150" fixed="right">
      <template #default="{ row }">
        <el-button
          v-permission="[USER_PERMISSIONS.UPDATE]"
          type="primary"
          size="small"
          :icon="Edit"
          @click="handleEdit(row)"
        >
          編輯
        </el-button>
        <el-button
          v-permission="[USER_PERMISSIONS.DELETE]"
          type="danger"
          size="small"
          :icon="Delete"
          @click="handleDelete(row)"
        >
          刪除
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped lang="scss">
// 表格樣式
</style>
```

### 表格元件使用規範

#### Props 定義

```typescript
interface Props {
  /** 表格資料 */
  data: Item[]
  /** 載入狀態 */
  loading: boolean
}
```

#### Emits 定義

```typescript
interface Emits {
  /** 編輯事件 */
  (e: "edit", item: Item): void
  /** 刪除事件 */
  (e: "delete", item: Item): void
  /** 選擇變更事件（支持批次操作時） */
  (e: "selection-change", items: Item[]): void
}
```

#### 表格設定

```vue
<el-table
  :data="data"
  :loading="loading"
  stripe              <!-- 斑馬紋 -->
  border              <!-- 邊框 -->
  style="width: 100%"
>
  <!-- 批次操作時加入選擇欄 -->
  <el-table-column type="selection" width="55" />
  
  <!-- 資料欄位 -->
  <el-table-column prop="name" label="名稱" />
  
  <!-- 操作欄固定在右側 -->
  <el-table-column label="操作" fixed="right" width="150">
    <!-- 操作按鈕 -->
  </el-table-column>
</el-table>
```

---

## 權限控制規範

### 權限常數定義

**檔案位置**：`src/common/constants/permissions.ts`

```typescript
/**
 * [模組]權限常數
 */
export const USER_PERMISSIONS = {
  /** 查看列表（路由權限） */
  READ: "user.read",
  /** 新增（功能權限） */
  CREATE: "user.create",
  /** 修改（功能權限） */
  UPDATE: "user.update",
  /** 刪除（功能權限） */
  DELETE: "user.delete"
} as const
```

### v-permission 指令使用

**按鈕權限控制**：

```vue
<el-button
  v-permission="[USER_PERMISSIONS.CREATE]"
  type="primary"
  @click="handleCreate"
>
  新增用戶
</el-button>
```

**多權限（滿足任一即可）**：

```vue
<el-button
  v-permission="[USER_PERMISSIONS.UPDATE, USER_PERMISSIONS.DELETE]"
>
  操作
</el-button>
```

**在表格中使用**：

```vue
<el-table-column label="操作">
  <template #default="{ row }">
    <el-button
      v-permission="[USER_PERMISSIONS.UPDATE]"
      @click="handleEdit(row)"
    >
      編輯
    </el-button>
    <el-button
      v-permission="[USER_PERMISSIONS.DELETE]"
      @click="handleDelete(row)"
    >
      刪除
    </el-button>
  </template>
</el-table-column>
```

### 權限檢查注意事項

1. **統一使用 `v-permission` 指令**，不在程式碼中手動檢查
2. **不要在 `onMounted` 中檢查頁面權限**，由路由守衛處理
3. **權限代碼格式**：`module.action`（如 `user.create`）
4. **按鈕無權限時自動隱藏**，不需額外處理

---

## API 呼叫規範

### API 檔案結構

**檔案位置**：`src/pages/[module-name]/apis/[module].ts`

```typescript
/**
 * [模組] API 服務
 * @module @/pages/[module-name]/apis/[module]
 */

import type { ApiResponse, User, UserListParams, CreateUserRequest } from "../types"
import { request } from "@/http/axios"

/**
 * 查詢列表
 * @param params - 查詢參數
 * @returns 列表回應
 */
export async function getUserList(
  params: UserListParams
): Promise<ApiResponse<UserListResponse>> {
  return request({
    url: "/user",
    method: "GET",
    params
  })
}

/**
 * 查詢單一項目
 * @param id - 項目 ID
 * @returns 項目資料
 */
export async function getUserById(id: string): Promise<ApiResponse<User>> {
  return request({
    url: `/user/${id}`,
    method: "GET"
  })
}

/**
 * 新增項目
 * @param data - 新增請求資料
 * @returns 建立的項目資料
 */
export async function createUser(
  data: CreateUserRequest
): Promise<ApiResponse<User>> {
  return request({
    url: "/user",
    method: "POST",
    data
  })
}

/**
 * 更新項目
 * @param id - 項目 ID
 * @param data - 更新請求資料
 * @returns 更新後的項目資料
 */
export async function updateUser(
  id: string,
  data: UpdateUserRequest
): Promise<ApiResponse<User>> {
  return request({
    url: `/user/${id}`,
    method: "PUT",
    data
  })
}

/**
 * 刪除項目
 * @param id - 項目 ID
 * @returns 刪除成功回應
 */
export async function deleteUser(id: string): Promise<ApiResponse<null>> {
  return request({
    url: `/user/${id}`,
    method: "DELETE"
  })
}
```

### API 呼叫規範

1. **統一使用 `request` 函式**（來自 `@/http/axios`）
2. **函式命名**：動詞 + 模組名（如 `getUserList`, `createUser`）
3. **必須提供 JSDoc 註解**：說明參數與回傳值
4. **明確型別定義**：參數與回傳值都要型別標註
5. **URL 規範**：
   - 列表：`GET /module`
   - 單項：`GET /module/:id`
   - 新增：`POST /module`
   - 更新：`PUT /module/:id`
   - 刪除：`DELETE /module/:id`

### 錯誤處理

**全域攔截器已處理**，組合式函式中僅需：

```typescript
async function fetchUsers(): Promise<void> {
  loading.value = true
  try {
    const response = await getUserList(params)
    if (response.success && response.data) {
      users.value = response.data.items
    }
  } finally {
    loading.value = false
  }
}
```

**特殊業務錯誤碼處理**：

```typescript
const response = await deleteUser(user.id)

// 檢查特定業務錯誤
if (response.code === "CANNOT_DELETE_SELF") {
  ElMessage.error("無法刪除自己的帳號")
  return
}

if (response.success) {
  ElMessage.success("刪除成功")
  await fetchUsers()
}
```

---

## 完整範例

### 完整功能模組範例

以下提供一個完整的產品管理模組範例，包含所有必要檔案。

#### 1. 型別定義（types.ts）

```typescript
/** 產品實體 */
export interface Product {
  /** 產品唯一識別碼（UUID） */
  id: string
  /** 產品名稱 */
  name: string
  /** 產品描述 */
  description: string | null
  /** 價格 */
  price: number
  /** 庫存數量 */
  stock: number
  /** 產品狀態 */
  status: "available" | "discontinued"
  /** 建立時間（ISO 8601） */
  createdAt: string
  /** 更新時間（ISO 8601） */
  updatedAt: string | null
  /** 版本號 */
  version: number
}

/** 新增產品請求 */
export interface CreateProductRequest {
  /** 產品名稱 */
  name: string
  /** 產品描述 */
  description?: string
  /** 價格 */
  price: number
  /** 庫存數量 */
  stock: number
}

/** 更新產品請求 */
export interface UpdateProductRequest extends CreateProductRequest {
  /** 版本號 */
  version: number
}

/** 產品列表查詢參數 */
export interface ProductListParams {
  /** 頁碼（從 1 開始） */
  pageNumber: number
  /** 每頁筆數（1-100） */
  pageSize: number
  /** 搜尋關鍵字（可選） */
  searchKeyword?: string
  /** 狀態篩選（可選） */
  status?: "available" | "discontinued"
}

/** 產品列表回應 */
export interface ProductListResponse {
  /** 產品清單 */
  items: Product[]
  /** 總筆數 */
  totalCount: number
  /** 當前頁碼 */
  pageNumber: number
  /** 每頁筆數 */
  pageSize: number
  /** 總頁數 */
  totalPages: number
}

/** API 統一回應格式 */
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
```

#### 2. API 服務（apis/product.ts）

```typescript
/**
 * 產品管理 API 服務
 * @module @/pages/product-management/apis/product
 */

import type {
  ApiResponse,
  CreateProductRequest,
  Product,
  ProductListParams,
  ProductListResponse,
  UpdateProductRequest
} from "../types"
import { request } from "@/http/axios"

/**
 * 查詢產品列表
 */
export async function getProductList(
  params: ProductListParams
): Promise<ApiResponse<ProductListResponse>> {
  return request({ url: "/product", method: "GET", params })
}

/**
 * 查詢單一產品
 */
export async function getProductById(id: string): Promise<ApiResponse<Product>> {
  return request({ url: `/product/${id}`, method: "GET" })
}

/**
 * 新增產品
 */
export async function createProduct(
  data: CreateProductRequest
): Promise<ApiResponse<Product>> {
  return request({ url: "/product", method: "POST", data })
}

/**
 * 更新產品
 */
export async function updateProduct(
  id: string,
  data: UpdateProductRequest
): Promise<ApiResponse<Product>> {
  return request({ url: `/product/${id}`, method: "PUT", data })
}

/**
 * 刪除產品
 */
export async function deleteProduct(id: string): Promise<ApiResponse<null>> {
  return request({ url: `/product/${id}`, method: "DELETE" })
}
```

#### 3. 列表管理組合式函式（composables/useProductManagement.ts）

```typescript
import type { Product, ProductListParams } from "../types"
import { ElMessage, ElMessageBox } from "element-plus"
import { debounce } from "lodash-es"
import { ref, watch } from "vue"
import * as productApi from "../apis/product"

export function useProductManagement() {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const pagination = ref({
    pageNumber: 1,
    pageSize: 20,
    total: 0
  })
  const searchKeyword = ref("")

  async function fetchProducts(): Promise<void> {
    loading.value = true
    try {
      const params: ProductListParams = {
        pageNumber: pagination.value.pageNumber,
        pageSize: pagination.value.pageSize,
        searchKeyword: searchKeyword.value || undefined
      }
      const response = await productApi.getProductList(params)
      if (response.success && response.data) {
        products.value = response.data.items
        pagination.value.total = response.data.totalCount
      }
    } finally {
      loading.value = false
    }
  }

  async function handleDelete(product: Product): Promise<void> {
    try {
      await ElMessageBox.confirm(
        `確定要刪除產品「${product.name}」嗎？此操作無法復原。`,
        "刪除確認",
        {
          confirmButtonText: "確定刪除",
          cancelButtonText: "取消",
          type: "warning"
        }
      )
      const response = await productApi.deleteProduct(product.id)
      if (response.success) {
        ElMessage.success("產品刪除成功")
        await fetchProducts()
      }
    } catch (error) {
      if (error !== "cancel") {
        console.error("刪除產品失敗:", error)
      }
    }
  }

  function resetSearch(): void {
    searchKeyword.value = ""
    pagination.value.pageNumber = 1
    fetchProducts()
  }

  const debouncedSearch = debounce(() => {
    pagination.value.pageNumber = 1
    fetchProducts()
  }, 500)

  watch(searchKeyword, () => {
    debouncedSearch()
  })

  return {
    products,
    loading,
    pagination,
    searchKeyword,
    fetchProducts,
    handleDelete,
    resetSearch
  }
}
```

---

## 樣式規範

### 統一樣式變數

使用 Element Plus 提供的 CSS 變數：

```scss
// 顏色
var(--el-color-primary)
var(--el-color-success)
var(--el-color-warning)
var(--el-color-danger)
var(--el-color-info)

// 文字顏色
var(--el-text-color-primary)
var(--el-text-color-regular)
var(--el-text-color-secondary)

// 邊框
var(--el-border-color)
var(--el-border-color-light)
var(--el-border-color-lighter)

// 背景
var(--el-fill-color-blank)
var(--el-fill-color-light)
```

### 通用樣式類別

```scss
// 頁面容器
.xxx-management-page {
  padding: 20px;
}

// 工具列
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;

  .toolbar-buttons {
    display: flex;
    gap: 8px;
  }
}

// 表格卡片
.table-card {
  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-light);
    background-color: var(--el-fill-color-blank);
  }

  :deep(.el-card__body) {
    padding: 0;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

// 分頁容器
.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-fill-color-blank);
}
```

---

## 檢查清單

開發新功能模組時，請確認以下項目：

### 📁 目錄結構
- [ ] 按照標準結構建立目錄
- [ ] 檔案命名符合規範（kebab-case / PascalCase）
- [ ] 私有元件與組合式函式放在模組內

### 📝 型別定義
- [ ] 使用 JSDoc 單行註解
- [ ] 定義完整的實體型別
- [ ] 定義請求與回應型別
- [ ] 定義查詢參數型別

### 🔧 組合式函式
- [ ] 回傳 `pagination` 物件（包含 pageNumber、pageSize、total）
- [ ] 提供 `searchKeyword` ref（如 API 支持搜尋）
- [ ] 使用 debounce 處理搜尋（500ms）
- [ ] 載入狀態管理（`loading` ref）

### 🎨 頁面元件
- [ ] 工具列包含搜尋框與操作按鈕
- [ ] 使用 `el-card` 包裹表格
- [ ] 分頁使用 `@current-change` 和 `@size-change`
- [ ] Dialog 在頁面中定義，設置 `:close-on-click-modal="false"`

### 📋 表格元件
- [ ] Props 包含 `data` 和 `loading`
- [ ] Emits 定義 `edit` 和 `delete` 事件
- [ ] 操作欄固定在右側（`fixed="right"`）
- [ ] 操作按鈕加上權限控制

### 📄 表單元件
- [ ] 邏輯抽離至組合式函式
- [ ] 使用 `emit` 通知父元件（`success` / `cancel`）
- [ ] 暴露公開方法（`setupEdit`, `resetForm`, `handleSubmit`）
- [ ] 表單驗證規則完整

### 🔐 權限控制
- [ ] 定義權限常數（`[MODULE]_PERMISSIONS`）
- [ ] 使用 `v-permission` 指令
- [ ] 不在程式碼中手動檢查權限

### 🌐 API 服務
- [ ] 函式命名：動詞 + 模組名
- [ ] 提供完整 JSDoc 註解
- [ ] 參數與回傳值型別明確
- [ ] 遵循 RESTful 命名

### 🎯 其他
- [ ] 無 TypeScript 編譯錯誤
- [ ] 無 ESLint 錯誤
- [ ] 測試所有功能正常運作
- [ ] 程式碼格式化

---

## 常見問題

### Q1: 何時使用 `ref` vs `reactive`？

**A**: 優先使用 `ref`。

```typescript
// ✅ 推薦
const user = ref<User | null>(null)
const loading = ref(false)

// ❌ 避免
const state = reactive({
  user: null as User | null,
  loading: false
})
```

### Q2: 分頁為什麼要用物件而不是分散的變數？

**A**: 
1. 便於傳遞與維護
2. 統一三個必要屬性（pageNumber、pageSize、total）
3. 方便重置：`pagination.value.pageNumber = 1`

### Q3: 為什麼 Dialog 要在頁面中而不是表單元件中？

**A**: 
1. 解耦：表單元件專注於表單邏輯
2. 彈性：同一表單可用於不同場景（Dialog、Drawer、獨立頁面）
3. 控制：頁面統一管理對話框狀態

### Q4: 搜尋功能何時使用 debounce？

**A**: 當 API 支持搜尋參數時，使用 debounce 自動搜尋。如 API 不支持，移除搜尋功能。

### Q5: 如何處理並發衝突（樂觀鎖）？

**A**: 
1. 實體型別包含 `version` 欄位
2. 更新請求帶上當前 version
3. 後端檢測版本衝突回傳錯誤
4. 前端提示用戶重新載入

```typescript
if (response.code === "CONCURRENT_UPDATE_CONFLICT") {
  ElMessage.error("資料已被其他使用者修改，請重新載入")
  await fetchUsers()
}
```

---

## 總結

遵循本規範可確保：

1. ✅ **一致性**：團隊成員撰寫的程式碼風格統一
2. ✅ **可維護性**：程式碼結構清晰，易於理解與修改
3. ✅ **可擴展性**：新功能可快速複製既有模式開發
4. ✅ **品質保證**：減少常見錯誤與不良實踐

**建議工作流程**：

1. 閱讀本規範
2. 參考現有模組（user-management、permission-management、role-management）
3. 複製最接近的模組作為起點
4. 根據需求調整，確保符合規範
5. 開發完成後對照檢查清單驗證

---

**文件版本**：1.0.0  
**最後更新**：2025-12-04  
**維護者**：開發團隊
