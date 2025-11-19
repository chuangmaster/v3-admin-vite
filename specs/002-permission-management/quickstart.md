# Quickstart: 權限管理系統

**Date**: 2025-11-19
**Feature**: 權限管理系統
**目標受眾**: 開發者

## 概述

本指南提供權限管理系統的快速入門說明，幫助開發者快速理解功能結構、關鍵概念和實作方式。

## 快速理解

### 5 分鐘了解權限管理

**核心概念**：
- 權限（Permission）：定義系統中可執行的操作（如 `user:create`）
- 權限代碼（Code）：唯一識別碼，格式為 `module:action`（最多三層）
- 樂觀鎖定：使用版本號防止並行編輯衝突
- 使用檢查：刪除前檢查是否被角色使用

**關鍵功能**：
1. ✅ 查詢權限列表（含搜尋、分頁、排序）
2. ✅ 新增權限（含代碼格式驗證）
3. ✅ 編輯權限（含並行衝突檢測）
4. ✅ 刪除權限（含使用情況檢查）
5. ✅ 查看權限使用情況（被哪些角色使用）

**技術棧**：
- Vue 3.5 + Composition API + `<script setup>`
- TypeScript 5.9
- Element Plus 2.11 (UI 元件)
- Pinia 3.0 (狀態管理)
- Axios 1.12 (HTTP 請求)
- Vitest 3.2 (單元測試)

## 專案結構

```
src/pages/permission-management/
├── index.vue                         # 主頁面（容器元件）
├── types.ts                          # TypeScript 型別定義
├── apis/
│   └── permission.ts                 # 權限 API 請求封裝
├── components/
│   ├── PermissionTable.vue           # 權限表格元件
│   └── PermissionForm.vue            # 權限表單元件（新增/編輯）
└── composables/
    ├── usePermissionManagement.ts    # 主要業務邏輯
    ├── usePermissionForm.ts          # 表單邏輯
    └── useExportExcel.ts             # Excel 匯出功能
```

## 關鍵檔案說明

### 1. 主頁面 (`index.vue`)

**職責**：
- 渲染搜尋列、表格、分頁、對話框
- 協調各元件與組合式函式
- 處理使用者互動（新增、編輯、刪除）

**關鍵程式碼片段**：

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePermissionManagement } from './composables/usePermissionManagement'
import PermissionTable from './components/PermissionTable.vue'
import PermissionForm from './components/PermissionForm.vue'

const { 
  permissions, 
  loading, 
  pagination, 
  searchKeyword, 
  fetchPermissions, 
  handleDelete 
} = usePermissionManagement()

const dialogVisible = ref(false)
const permissionFormRef = ref<InstanceType<typeof PermissionForm>>()

function handleCreate() {
  permissionFormRef.value?.resetForm()
  dialogVisible.value = true
}

onMounted(() => {
  fetchPermissions()
})
</script>
```

### 2. 業務邏輯 (`usePermissionManagement.ts`)

**職責**：
- 管理權限列表狀態
- 處理 API 呼叫（查詢、刪除）
- 處理錯誤與成功訊息
- 管理分頁與搜尋

**關鍵方法**：

```typescript
export function usePermissionManagement() {
  const permissions = ref<Permission[]>([])
  const loading = ref(false)
  const pagination = ref({ pageNumber: 1, pageSize: 20, total: 0 })
  const searchKeyword = ref('')

  async function fetchPermissions() {
    loading.value = true
    try {
      const response = await getPermissions({
        keyword: searchKeyword.value,
        pageNumber: pagination.value.pageNumber,
        pageSize: pagination.value.pageSize
      })
      if (response.success) {
        permissions.value = response.data.items
        pagination.value.total = response.data.totalCount
      }
    } catch (error) {
      ElMessage.error('載入失敗')
    } finally {
      loading.value = false
    }
  }

  async function handleDelete(id: string) {
    const confirm = await ElMessageBox.confirm('確定要刪除此權限嗎？', '警告', {
      type: 'warning'
    })
    if (confirm) {
      const response = await deletePermission(id)
      if (response.success) {
        ElMessage.success('刪除成功')
        fetchPermissions()
      } else if (response.code === 'PERMISSION_IN_USE') {
        ElMessage.error(response.message)
      }
    }
  }

  return { permissions, loading, pagination, searchKeyword, fetchPermissions, handleDelete }
}
```

### 3. 表單邏輯 (`usePermissionForm.ts`)

**職責**：
- 管理表單狀態（新增/編輯模式）
- 處理表單驗證
- 處理表單提交（新增或更新 API 呼叫）
- 處理樂觀鎖定衝突

**關鍵方法**：

```typescript
export function usePermissionForm(emit: any) {
  const formData = ref<CreatePermissionDto>({
    name: '',
    code: '',
    description: ''
  })
  const isEditMode = ref(false)
  const currentVersion = ref(1)

  async function handleSubmit() {
    try {
      if (isEditMode.value) {
        const response = await updatePermission(currentId, {
          ...formData.value,
          version: currentVersion.value
        })
        if (response.code === 'CONCURRENT_UPDATE_CONFLICT') {
          ElMessage.error('資料已被其他使用者修改，請重新載入')
          return
        }
      } else {
        await createPermission(formData.value)
      }
      ElMessage.success(isEditMode.value ? '更新成功' : '新增成功')
      emit('success')
    } catch (error) {
      ElMessage.error('操作失敗')
    }
  }

  return { formData, isEditMode, handleSubmit }
}
```

### 4. API 封裝 (`apis/permission.ts`)

**職責**：
- 封裝所有權限相關 API 請求
- 統一處理認證 Token
- 統一錯誤處理

**關鍵函式**：

```typescript
import axios from 'axios'
import type { ApiResponse, Permission, PagedResult } from '../types'

const api = axios.create({ baseURL: '/api' })

// 加入 JWT Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export async function getPermissions(query: PermissionQuery): Promise<ApiResponse<PagedResult<Permission>>> {
  const response = await api.get('/permissions', { params: query })
  return response.data
}

export async function createPermission(data: CreatePermissionDto): Promise<ApiResponse<Permission>> {
  const response = await api.post('/permissions', data)
  return response.data
}

export async function updatePermission(id: string, data: UpdatePermissionDto): Promise<ApiResponse<Permission>> {
  const response = await api.put(`/permissions/${id}`, data)
  return response.data
}

export async function deletePermission(id: string): Promise<ApiResponse<null>> {
  const response = await api.delete(`/permissions/${id}`)
  return response.data
}
```

## 開發工作流程

### Step 1: 環境準備

```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev

# 瀏覽器開啟 http://localhost:3333
```

### Step 2: 建立檔案結構

```bash
# 建立目錄
mkdir -p src/pages/permission-management/{apis,components,composables}

# 建立檔案
touch src/pages/permission-management/index.vue
touch src/pages/permission-management/types.ts
touch src/pages/permission-management/apis/permission.ts
touch src/pages/permission-management/components/PermissionTable.vue
touch src/pages/permission-management/components/PermissionForm.vue
touch src/pages/permission-management/composables/usePermissionManagement.ts
touch src/pages/permission-management/composables/usePermissionForm.ts
touch src/pages/permission-management/composables/useExportExcel.ts
```

### Step 3: 定義型別 (`types.ts`)

參考 `data-model.md` 定義所有 TypeScript 型別。

### Step 4: 實作 API 層 (`apis/permission.ts`)

參考 `api-contracts.md` 實作所有 API 請求函式。

### Step 5: 實作組合式函式

1. `usePermissionManagement.ts` - 列表管理邏輯
2. `usePermissionForm.ts` - 表單邏輯
3. `useExportExcel.ts` - Excel 匯出

### Step 6: 實作 UI 元件

1. `PermissionTable.vue` - 參考 `user-management/components/UserTable.vue`
2. `PermissionForm.vue` - 參考 `user-management/components/UserForm.vue`

### Step 7: 實作主頁面 (`index.vue`)

整合所有元件與組合式函式。

### Step 8: 設定路由

在 `src/router/index.ts` 中新增權限管理路由：

```typescript
{
  path: '/permission-management',
  name: 'PermissionManagement',
  component: () => import('@/pages/permission-management/index.vue'),
  meta: {
    title: '權限管理',
    permissions: ['permission.read']
  }
}
```

### Step 9: 更新權限常數

在 `@@/constants/permissions.ts` 中新增：

```typescript
export const PERMISSION_PERMISSIONS = {
  READ: "permission.read",
  CREATE: "permission.create",
  UPDATE: "permission.update",
  DELETE: "permission.delete",
  ASSIGN: "permission.assign",
  REMOVE: "permission.remove"
} as const
```

### Step 10: 編寫測試

```bash
# 執行測試
pnpm test

# 執行特定測試檔案
pnpm test permission-management
```

## 關鍵實作要點

### 1. 權限代碼驗證

```typescript
export function validatePermissionCode(code: string): boolean {
  const pattern = /^[a-zA-Z0-9_]+:[a-zA-Z0-9_]+(:[a-zA-Z0-9_]+)?$/
  return pattern.test(code)
}
```

### 2. 樂觀鎖定處理

```typescript
// 編輯時儲存版本號
function setupEdit(permission: Permission) {
  formData.value = { ...permission }
  currentVersion.value = permission.version
}

// 提交時包含版本號
await updatePermission(id, {
  ...formData.value,
  version: currentVersion.value
})

// 處理衝突
if (response.code === 'CONCURRENT_UPDATE_CONFLICT') {
  ElMessage.error('資料已被其他使用者修改，請重新載入')
  emit('conflict')
}
```

### 3. 刪除前檢查

```typescript
async function handleDelete(id: string, permission: Permission) {
  // 檢查是否為系統權限
  if (permission.isSystem) {
    ElMessage.warning('系統內建權限無法刪除')
    return
  }

  // 確認刪除
  await ElMessageBox.confirm('確定要刪除此權限嗎？', '警告', { type: 'warning' })

  // 執行刪除
  const response = await deletePermission(id)
  
  // 處理使用中錯誤
  if (response.code === 'PERMISSION_IN_USE') {
    ElMessage.error(`該權限已被 ${response.data.roleCount} 個角色使用，無法刪除`)
    return
  }

  ElMessage.success('刪除成功')
  fetchPermissions()
}
```

### 4. 搜尋與分頁

```typescript
// 監聽搜尋關鍵字變化
watch(searchKeyword, () => {
  pagination.value.pageNumber = 1  // 重置到第一頁
  fetchPermissions()
})

// 處理分頁變更
function handlePageChange() {
  fetchPermissions()
}
```

## 常見問題 (FAQ)

### Q1: 如何測試並行編輯衝突？

**A**: 開啟兩個瀏覽器分頁，同時編輯同一個權限，其中一個先提交，另一個後提交時會收到 `CONCURRENT_UPDATE_CONFLICT` 錯誤。

### Q2: 權限代碼格式有哪些限制？

**A**: 
- 格式：`module:action` 或 `module:submodule:action`（最多三層）
- 允許字元：英數字、底線、冒號
- 範例：`user:create`、`user:profile:edit`
- 錯誤範例：`user.create`（使用點號）、`a:b:c:d`（超過三層）

### Q3: 如何判斷權限是否可以刪除？

**A**: 需要同時滿足兩個條件：
1. `isSystem === false`（非系統內建權限）
2. `roleCount === 0`（未被任何角色使用）

### Q4: 為什麼要使用樂觀鎖定而非悲觀鎖定？

**A**: 
- Web 應用適合樂觀鎖定，無需長時間鎖定資源
- 效能更好，不會影響其他使用者
- 衝突機率低，即使發生也能友善提示

### Q5: 如何在表格中顯示權限使用情況？

**A**: 呼叫 `GET /api/permissions/{id}/usage` API，取得 `roleCount` 和 `roles` 列表，在表格中顯示：

```vue
<el-table-column label="使用情況">
  <template #default="{ row }">
    <el-tag v-if="row.roleCount > 0" type="warning">
      {{ row.roleCount }} 個角色使用中
    </el-tag>
    <el-tag v-else type="info">
      未使用
    </el-tag>
  </template>
</el-table-column>
```

## 參考資源

### 內部文件
- [功能規格](./spec.md) - 完整功能需求與驗收標準
- [資料模型](./data-model.md) - TypeScript 型別定義與驗證規則
- [API 契約](./contracts/api-contracts.md) - RESTful API 端點與請求/回應格式
- [研究文件](./research.md) - 技術決策與替代方案分析

### 專案參考
- `src/pages/user-management/` - 使用者管理模組（架構參考）
- `@@/composables/usePagination.ts` - 分頁組合式函式
- `@@/constants/permissions.ts` - 權限常數定義

### 外部資源
- [Vue 3 文件](https://vuejs.org/)
- [Element Plus 文件](https://element-plus.org/)
- [Pinia 文件](https://pinia.vuejs.org/)
- [Vitest 文件](https://vitest.dev/)

## 下一步

完成權限管理功能後，建議執行以下檢查：

1. ✅ 執行所有單元測試 (`pnpm test`)
2. ✅ 執行 ESLint 檢查 (`pnpm lint`)
3. ✅ 手動測試所有使用者場景（參考 `spec.md`）
4. ✅ 檢查效能指標（載入時間、回應時間）
5. ✅ 撰寫使用者文件（如有需要）
6. ✅ 提交程式碼審查（PR）

## 聯絡資訊

如有問題，請聯絡專案維護者或參考專案 README.md 中的聯絡資訊。

---

**最後更新**: 2025-11-19
**版本**: 1.0.0
