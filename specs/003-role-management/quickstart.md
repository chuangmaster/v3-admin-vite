# Quickstart: 角色管理系統開發指南

**Feature**: 角色管理系統 (Role Management)
**Date**: 2025-11-21
**Version**: 1.0

## Overview

本指南提供角色管理功能的快速開發指引，幫助開發者快速理解系統架構、關鍵元件與開發流程。

## Prerequisites

開始開發前，請確保：

1. ✅ 已閱讀 `spec.md`（功能規格）
2. ✅ 已閱讀 `plan.md`（實施計畫）
3. ✅ 已閱讀 `data-model.md`（資料模型）
4. ✅ 已閱讀 `contracts/api-contracts.md`（API 契約）
5. ✅ 本地開發環境已設定完成（Node.js, pnpm, VS Code）
6. ✅ 已 checkout 到 `003-role-management` 分支

## Architecture Overview

```
角色管理模組架構
├── 頁面層 (index.vue)
│   └── 職責：路由進入點、佈局管理
├── 元件層 (components/)
│   ├── RoleTable.vue         # 角色列表表格
│   ├── RoleForm.vue          # 角色新增/編輯表單
│   └── PermissionSelector.vue # 權限選擇器（樹狀結構）
├── 邏輯層 (composables/)
│   ├── useRoleManagement.ts  # 角色管理核心邏輯
│   ├── useRoleForm.ts        # 表單驗證與提交邏輯
│   ├── usePermissionTree.ts  # 權限樹狀結構轉換
│   └── useExportExcel.ts     # Excel 匯出邏輯
└── API 層 (apis/)
    └── role.ts               # 角色相關 API 封裝
```

**用戶管理模組擴展**（用戶角色分配功能）
```
src/pages/user-management/
├── components/
│   ├── UserForm.vue          # 【擴展】新增角色選擇器欄位
│   └── RoleSelector.vue      # 【新增】多選角色選擇器
├── composables/
│   └── useUserRoles.ts       # 【新增】用戶角色邏輯
└── apis/
    └── user-roles.ts         # 【新增】用戶角色 API
```

## Development Phases

### Phase 1: 基礎設施建立 (Day 1)

#### 1.1 建立目錄結構

```bash
# 在 src/pages/ 建立角色管理目錄
mkdir -p src/pages/role-management/{apis,components,composables}

# 建立核心檔案
touch src/pages/role-management/index.vue
touch src/pages/role-management/types.ts
touch src/pages/role-management/apis/role.ts
touch src/pages/role-management/components/{RoleTable,RoleForm,PermissionSelector}.vue
touch src/pages/role-management/composables/{useRoleManagement,useRoleForm,usePermissionTree,useExportExcel}.ts
```

#### 1.2 定義型別 (types.ts)

```typescript
// src/pages/role-management/types.ts
export interface RoleDto {
  id: string
  roleName: string
  description: string | null
  createdAt: string
  version: number
}

export interface RoleDetailDto extends RoleDto {
  permissions: PermissionDto[]
}

export interface PermissionDto {
  id: string
  permissionCode: string
  name: string
  description: string | null
  permissionType: 'function' | 'view'
  createdAt: string
  updatedAt: string | null
  version: number
}

export interface PermissionTreeNode {
  id: string
  label: string
  permissionCode: string
  children?: PermissionTreeNode[]
  isGroup?: boolean
}

export interface CreateRoleRequest {
  roleName: string
  description?: string
}

export interface UpdateRoleRequest extends CreateRoleRequest {
  version: number
}

export interface DeleteRoleRequest {
  version: number
}

export interface AssignRolePermissionsRequest {
  permissionIds: string[]
}
```

#### 1.3 建立 API Client (apis/role.ts)

參考 `contracts/api-contracts.md` 中的「Frontend Implementation Guidelines」章節。

```typescript
// src/pages/role-management/apis/role.ts
import axios from '@/http/axios'
import type { ApiResponse } from '@@/types/api'
import type { RoleDto, RoleDetailDto, CreateRoleRequest, UpdateRoleRequest, DeleteRoleRequest, AssignRolePermissionsRequest } from '../types'

export const roleApi = {
  getRoles(pageNumber = 1, pageSize = 10) {
    return axios.get<ApiResponse<{ items: RoleDto[]; totalCount: number; pageNumber: number; pageSize: number }>>('/api/role', {
      params: { pageNumber, pageSize }
    })
  },
  
  getRole(id: string) {
    return axios.get<ApiResponse<RoleDto>>(`/api/role/${id}`)
  },
  
  getRoleDetail(id: string) {
    return axios.get<ApiResponse<RoleDetailDto>>(`/api/role/${id}/permissions`)
  },
  
  createRole(data: CreateRoleRequest) {
    return axios.post<ApiResponse<RoleDto>>('/api/role', data)
  },
  
  updateRole(id: string, data: UpdateRoleRequest) {
    return axios.put<ApiResponse<RoleDto>>(`/api/role/${id}`, data)
  },
  
  deleteRole(id: string, data: DeleteRoleRequest) {
    return axios.delete<ApiResponse<null>>(`/api/role/${id}`, { data })
  },
  
  assignPermissions(id: string, data: AssignRolePermissionsRequest) {
    return axios.post<ApiResponse<null>>(`/api/role/${id}/permissions`, data)
  },
  
  removePermission(roleId: string, permissionId: string) {
    return axios.delete<ApiResponse<null>>(`/api/role/${roleId}/permissions/${permissionId}`)
  }
}
```

#### 1.4 新增路由

```typescript
// src/router/index.ts
{
  path: '/role-management',
  name: 'RoleManagement',
  component: () => import('@/pages/role-management/index.vue'),
  meta: {
    title: '角色管理',
    permissions: ['role.read']  // 需要 role.read 權限
  }
}
```

#### 1.5 更新權限常數

```typescript
// src/common/constants/permissions.ts
export const ROLE_PERMISSIONS = {
  CREATE: 'role.create',
  READ: 'role.read',
  UPDATE: 'role.update',
  DELETE: 'role.delete',
  ASSIGN: 'role.assign',
  REMOVE: 'role.remove',
  ASSIGN_PERMISSION: 'permission.assign',
  REMOVE_PERMISSION: 'permission.remove'
} as const
```

---

### Phase 2: 核心邏輯開發 (Day 2-3)

#### 2.1 開發角色管理組合式函式 (useRoleManagement.ts)

```typescript
// src/pages/role-management/composables/useRoleManagement.ts
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { roleApi } from '../apis/role'
import type { RoleDto } from '../types'

export function useRoleManagement() {
  const roles = ref<RoleDto[]>([])
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  
  /** 載入角色列表 */
  const loadRoles = async () => {
    loading.value = true
    try {
      const { data } = await roleApi.getRoles(currentPage.value, pageSize.value)
      if (data.success) {
        roles.value = data.data.items
        total.value = data.data.totalCount
      }
    } catch (error) {
      ElMessage.error('載入角色列表失敗')
    } finally {
      loading.value = false
    }
  }
  
  /** 刪除角色 */
  const deleteRole = async (role: RoleDto) => {
    try {
      await ElMessageBox.confirm(
        `確定要刪除角色「${role.roleName}」嗎？`,
        '刪除確認',
        { type: 'warning' }
      )
      
      await roleApi.deleteRole(role.id, { version: role.version })
      ElMessage.success('角色刪除成功')
      await loadRoles()
    } catch (error: any) {
      if (error !== 'cancel') {
        // 錯誤已由全域攔截器處理
      }
    }
  }
  
  /** 刷新列表 */
  const refresh = () => loadRoles()
  
  /** 處理分頁變更 */
  const handlePageChange = (page: number) => {
    currentPage.value = page
    loadRoles()
  }
  
  /** 處理每頁筆數變更 */
  const handleSizeChange = (size: number) => {
    pageSize.value = size
    currentPage.value = 1
    loadRoles()
  }
  
  return {
    roles,
    loading,
    total,
    currentPage,
    pageSize,
    loadRoles,
    deleteRole,
    refresh,
    handlePageChange,
    handleSizeChange
  }
}
```

#### 2.2 開發角色表單組合式函式 (useRoleForm.ts)

```typescript
// src/pages/role-management/composables/useRoleForm.ts
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { roleApi, permissionApi } from '../apis/role'
import type { RoleDto, CreateRoleRequest, UpdateRoleRequest } from '../types'

export function useRoleForm(onSuccess?: () => void) {
  const formRef = ref<FormInstance>()
  const dialogVisible = ref(false)
  const formLoading = ref(false)
  const isEditMode = ref(false)
  const currentRoleId = ref<string>()
  
  const formData = reactive<CreateRoleRequest & { version?: number; selectedPermissionIds?: string[] }>({
    roleName: '',
    description: '',
    selectedPermissionIds: []
  })
  
  const rules: FormRules = {
    roleName: [
      { required: true, message: '請輸入角色名稱', trigger: 'blur' },
      { min: 1, max: 100, message: '角色名稱長度需介於 1-100 字元', trigger: 'blur' }
    ],
    description: [
      { max: 500, message: '角色描述最多 500 字元', trigger: 'blur' }
    ]
  }
  
  /** 開啟新增對話框 */
  const openCreate = () => {
    isEditMode.value = false
    dialogVisible.value = true
    resetForm()
  }
  
  /** 開啟編輯對話框 */
  const openEdit = async (role: RoleDto) => {
    isEditMode.value = true
    currentRoleId.value = role.id
    dialogVisible.value = true
    
    // 載入角色詳細資訊（含權限）
    formLoading.value = true
    try {
      const { data } = await roleApi.getRoleDetail(role.id)
      if (data.success) {
        formData.roleName = data.data.roleName
        formData.description = data.data.description || ''
        formData.version = data.data.version
        formData.selectedPermissionIds = data.data.permissions.map(p => p.id)
      }
    } catch (error) {
      ElMessage.error('載入角色資訊失敗')
      dialogVisible.value = false
    } finally {
      formLoading.value = false
    }
  }
  
  /** 提交表單 */
  const submitForm = async () => {
    if (!formRef.value) return
    
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      
      formLoading.value = true
      try {
        if (isEditMode.value && currentRoleId.value) {
          // 更新角色
          await roleApi.updateRole(currentRoleId.value, {
            roleName: formData.roleName,
            description: formData.description,
            version: formData.version!
          })
          
          // 更新權限
          if (formData.selectedPermissionIds?.length) {
            await roleApi.assignPermissions(currentRoleId.value, {
              permissionIds: formData.selectedPermissionIds
            })
          }
          
          ElMessage.success('角色更新成功')
        } else {
          // 新增角色
          const { data } = await roleApi.createRole({
            roleName: formData.roleName,
            description: formData.description
          })
          
          // 分配權限
          if (data.success && formData.selectedPermissionIds?.length) {
            await roleApi.assignPermissions(data.data.id, {
              permissionIds: formData.selectedPermissionIds
            })
          }
          
          ElMessage.success('角色建立成功')
        }
        
        dialogVisible.value = false
        onSuccess?.()
      } catch (error) {
        // 錯誤已由全域攔截器處理
      } finally {
        formLoading.value = false
      }
    })
  }
  
  /** 重置表單 */
  const resetForm = () => {
    formData.roleName = ''
    formData.description = ''
    formData.selectedPermissionIds = []
    delete formData.version
    formRef.value?.resetFields()
  }
  
  /** 關閉對話框 */
  const handleClose = () => {
    dialogVisible.value = false
    resetForm()
  }
  
  return {
    formRef,
    dialogVisible,
    formLoading,
    isEditMode,
    formData,
    rules,
    openCreate,
    openEdit,
    submitForm,
    handleClose
  }
}
```

#### 2.3 開發權限樹組合式函式 (usePermissionTree.ts)

```typescript
// src/pages/role-management/composables/usePermissionTree.ts
import { ref } from 'vue'
import { permissionApi } from '@@/apis/permission'  // 假設權限 API 已存在
import type { PermissionDto, PermissionTreeNode } from '../types'

const MODULE_GROUPS: Record<string, { label: string; order: number }> = {
  user: { label: '使用者管理', order: 1 },
  role: { label: '角色管理', order: 2 },
  permission: { label: '權限管理', order: 3 }
}

export function usePermissionTree() {
  const permissionTree = ref<PermissionTreeNode[]>([])
  const loading = ref(false)
  
  /** 將扁平化權限列表轉換為樹狀結構 */
  const buildPermissionTree = (permissions: PermissionDto[]): PermissionTreeNode[] => {
    // 1. 按模組分組
    const grouped = permissions.reduce((acc, perm) => {
      const [module] = perm.permissionCode.split('.')
      if (!acc[module]) acc[module] = []
      acc[module].push(perm)
      return acc
    }, {} as Record<string, PermissionDto[]>)
    
    // 2. 建立模組節點
    const moduleNodes = Object.entries(grouped)
      .map(([module, perms]) => ({
        id: `${module}-group`,
        label: MODULE_GROUPS[module]?.label || module,
        permissionCode: module,
        isGroup: true,
        children: perms.map(p => ({
          id: p.id,
          label: `${p.name} (${p.permissionCode})`,
          permissionCode: p.permissionCode
        }))
      }))
      .sort((a, b) => {
        const orderA = MODULE_GROUPS[a.permissionCode]?.order ?? 999
        const orderB = MODULE_GROUPS[b.permissionCode]?.order ?? 999
        return orderA - orderB
      })
    
    // 3. 建立頂層節點
    return [{
      id: 'access-control',
      label: '存取控制 (Access Control)',
      permissionCode: 'access_control',
      isGroup: true,
      children: moduleNodes
    }]
  }
  
  /** 載入權限樹 */
  const loadPermissionTree = async () => {
    loading.value = true
    try {
      const { data } = await permissionApi.getPermissions()  // 假設此 API 已存在
      if (data.success) {
        permissionTree.value = buildPermissionTree(data.data.items)
      }
    } catch (error) {
      console.error('載入權限樹失敗', error)
    } finally {
      loading.value = false
    }
  }
  
  return {
    permissionTree,
    loading,
    loadPermissionTree,
    buildPermissionTree
  }
}
```

---

### Phase 3: UI 元件開發 (Day 4-5)

#### 3.1 RoleTable 元件

```vue
<!-- src/pages/role-management/components/RoleTable.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { RoleDto } from '../types'

interface Props {
  data: RoleDto[]
  loading: boolean
}

interface Emits {
  (e: 'edit', role: RoleDto): void
  (e: 'delete', role: RoleDto): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <el-table :data="props.data" v-loading="props.loading" stripe>
    <el-table-column prop="roleName" label="角色名稱" min-width="150" />
    <el-table-column prop="description" label="角色描述" min-width="200" show-overflow-tooltip />
    <el-table-column prop="createdAt" label="建立時間" min-width="180">
      <template #default="{ row }">
        {{ dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') }}
      </template>
    </el-table-column>
    <el-table-column label="操作" width="180" fixed="right">
      <template #default="{ row }">
        <el-button
          type="primary"
          size="small"
          @click="emit('edit', row)"
          v-permission="['role.update']"
        >
          編輯
        </el-button>
        <el-button
          type="danger"
          size="small"
          @click="emit('delete', row)"
          v-permission="['role.delete']"
        >
          刪除
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>
```

#### 3.2 RoleForm 元件

```vue
<!-- src/pages/role-management/components/RoleForm.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import type { FormInstance } from 'element-plus'
import PermissionSelector from './PermissionSelector.vue'

interface Props {
  modelValue: boolean
  title: string
  loading: boolean
  formData: any
  rules: any
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()

defineExpose({ formRef })
</script>

<template>
  <el-dialog
    :model-value="props.modelValue"
    :title="props.title"
    width="600px"
    @close="emit('update:modelValue', false)"
  >
    <el-form
      ref="formRef"
      :model="props.formData"
      :rules="props.rules"
      label-width="100px"
      v-loading="props.loading"
    >
      <el-form-item label="角色名稱" prop="roleName">
        <el-input v-model="props.formData.roleName" placeholder="請輸入角色名稱" />
      </el-form-item>
      
      <el-form-item label="角色描述" prop="description">
        <el-input
          v-model="props.formData.description"
          type="textarea"
          :rows="3"
          placeholder="請輸入角色描述（選填）"
        />
      </el-form-item>
      
      <!-- 權限設定區域 -->
      <el-collapse>
        <el-collapse-item title="權限設定" name="permissions">
          <PermissionSelector v-model="props.formData.selectedPermissionIds" />
        </el-collapse-item>
      </el-collapse>
    </el-form>
    
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="emit('submit')" :loading="props.loading">
        確定
      </el-button>
    </template>
  </el-dialog>
</template>
```

#### 3.3 PermissionSelector 元件

```vue
<!-- src/pages/role-management/components/PermissionSelector.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { ElTree } from 'element-plus'
import { usePermissionTree } from '../composables/usePermissionTree'

interface Props {
  modelValue: string[]
}

interface Emits {
  (e: 'update:modelValue', value: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { permissionTree, loading, loadPermissionTree } = usePermissionTree()

onMounted(() => {
  loadPermissionTree()
})

const handleCheck = (data: any, checkedData: any) => {
  // 只取葉子節點（實際權限節點）
  const checkedLeafKeys = checkedData.checkedKeys.filter((key: string) => {
    // 排除分組節點
    return !key.includes('-group') && key !== 'access-control'
  })
  emit('update:modelValue', checkedLeafKeys)
}
</script>

<template>
  <div v-loading="loading">
    <el-tree
      :data="permissionTree"
      show-checkbox
      node-key="id"
      :default-checked-keys="props.modelValue"
      :props="{ children: 'children', label: 'label' }"
      @check="handleCheck"
    />
  </div>
</template>
```

---

### Phase 4: 主頁面整合 (Day 6)

#### 4.1 index.vue

```vue
<!-- src/pages/role-management/index.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import RoleTable from './components/RoleTable.vue'
import RoleForm from './components/RoleForm.vue'
import { useRoleManagement } from './composables/useRoleManagement'
import { useRoleForm } from './composables/useRoleForm'
import { useExportExcel } from './composables/useExportExcel'

const {
  roles,
  loading,
  total,
  currentPage,
  pageSize,
  loadRoles,
  deleteRole,
  handlePageChange,
  handleSizeChange
} = useRoleManagement()

const roleForm = useRoleForm(() => {
  loadRoles()
})

const { exportRoles } = useExportExcel()

onMounted(() => {
  loadRoles()
})

const handleExport = () => {
  exportRoles(roles.value)
}
</script>

<template>
  <div class="role-management-page">
    <el-card>
      <!-- 工具列 -->
      <div class="toolbar">
        <el-button
          type="primary"
          @click="roleForm.openCreate()"
          v-permission="['role.create']"
        >
          新增角色
        </el-button>
        <el-button @click="handleExport">匯出報表</el-button>
      </div>
      
      <!-- 表格 -->
      <RoleTable
        :data="roles"
        :loading="loading"
        @edit="roleForm.openEdit"
        @delete="deleteRole"
      />
      
      <!-- 分頁 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>
    
    <!-- 表單對話框 -->
    <RoleForm
      v-model="roleForm.dialogVisible.value"
      :title="roleForm.isEditMode.value ? '編輯角色' : '新增角色'"
      :loading="roleForm.formLoading.value"
      :form-data="roleForm.formData"
      :rules="roleForm.rules"
      @submit="roleForm.submitForm"
    />
  </div>
</template>

<style scoped lang="scss">
.role-management-page {
  .toolbar {
    margin-bottom: 16px;
    display: flex;
    gap: 12px;
  }
}
</style>
```

---

### Phase 5: 用戶角色分配功能 (Day 7)

#### 5.1 建立 RoleSelector 元件

```vue
<!-- src/pages/user-management/components/RoleSelector.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { roleApi } from '@/pages/role-management/apis/role'

interface Props {
  modelValue: string[]
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const roleOptions = ref<Array<{ id: string; roleName: string }>>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await roleApi.getRoles(1, 100)  // 載入所有角色
    if (data.success) {
      roleOptions.value = data.data.items
    }
  } finally {
    loading.value = false
  }
})

const handleChange = (value: string[]) => {
  emit('update:modelValue', value)
}
</script>

<template>
  <el-select
    :model-value="props.modelValue"
    multiple
    filterable
    placeholder="請選擇角色"
    :disabled="props.disabled"
    :loading="loading"
    @change="handleChange"
  >
    <el-option
      v-for="role in roleOptions"
      :key="role.id"
      :label="role.roleName"
      :value="role.id"
    />
  </el-select>
</template>
```

#### 5.2 擴展 UserForm 元件

```vue
<!-- src/pages/user-management/components/UserForm.vue -->
<!-- 在表單中新增以下欄位 -->

<el-form-item label="角色" prop="roleIds">
  <RoleSelector v-model="formData.roleIds" :disabled="formLoading" />
</el-form-item>
```

---

### Phase 6: 測試 (Day 8-9)

#### 6.1 單元測試範例

```typescript
// tests/pages/role-management/composables/useRoleManagement.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRoleManagement } from '@/pages/role-management/composables/useRoleManagement'
import { roleApi } from '@/pages/role-management/apis/role'

vi.mock('@/pages/role-management/apis/role')

describe('useRoleManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('should load roles successfully', async () => {
    const mockRoles = [
      { id: '1', roleName: '管理員', description: null, createdAt: '2025-11-20T08:00:00Z', version: 1 }
    ]
    
    vi.mocked(roleApi.getRoles).mockResolvedValue({
      data: {
        success: true,
        data: {
          items: mockRoles,
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10
        }
      }
    } as any)
    
    const { loadRoles, roles, total } = useRoleManagement()
    await loadRoles()
    
    expect(roles.value).toEqual(mockRoles)
    expect(total.value).toBe(1)
  })
  
  it('should handle delete role with confirmation', async () => {
    // ... 測試刪除邏輯
  })
})
```

#### 6.2 元件測試範例

```typescript
// tests/pages/role-management/components/RoleTable.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RoleTable from '@/pages/role-management/components/RoleTable.vue'

describe('RoleTable', () => {
  it('should render roles correctly', () => {
    const roles = [
      { id: '1', roleName: '管理員', description: '系統管理員', createdAt: '2025-11-20T08:00:00Z', version: 1 }
    ]
    
    const wrapper = mount(RoleTable, {
      props: { data: roles, loading: false }
    })
    
    expect(wrapper.text()).toContain('管理員')
    expect(wrapper.text()).toContain('系統管理員')
  })
})
```

---

## Development Checklist

### 基礎設施
- [ ] 目錄結構建立完成
- [ ] 型別定義完成 (types.ts)
- [ ] API Client 封裝完成 (apis/role.ts)
- [ ] 路由設定完成
- [ ] 權限常數更新完成

### 核心邏輯
- [ ] useRoleManagement 組合式函式完成
- [ ] useRoleForm 組合式函式完成
- [ ] usePermissionTree 組合式函式完成
- [ ] useExportExcel 組合式函式完成

### UI 元件
- [ ] RoleTable 元件完成
- [ ] RoleForm 元件完成
- [ ] PermissionSelector 元件完成
- [ ] 主頁面 (index.vue) 完成

### 用戶角色分配
- [ ] RoleSelector 元件完成
- [ ] UserForm 擴展完成
- [ ] useUserRoles 組合式函式完成
- [ ] user-roles API 封裝完成

### 測試
- [ ] useRoleManagement 單元測試
- [ ] useRoleForm 單元測試
- [ ] usePermissionTree 單元測試
- [ ] RoleTable 元件測試
- [ ] RoleForm 元件測試
- [ ] PermissionSelector 元件測試

### 文件
- [ ] 程式碼註解完整
- [ ] README 更新（若需要）

---

## Common Issues & Solutions

### Issue 1: 樂觀鎖衝突處理

**問題**: 更新或刪除時遇到 409 CONCURRENT_UPDATE_CONFLICT 錯誤

**解決方案**:
```typescript
// 在全域錯誤處理器中加入
if (response.data.code === 'CONCURRENT_UPDATE_CONFLICT') {
  ElMessage.warning({
    message: '資料已被其他用戶更新，請重新載入後再試',
    duration: 5000,
    showClose: true
  })
  // 自動重新載入資料
  loadRoles()
}
```

### Issue 2: 權限樹未正確顯示

**問題**: 權限樹狀結構為空或顯示錯誤

**解決方案**:
- 檢查 `permissionApi.getPermissions()` 是否正確回傳資料
- 檢查權限代碼格式是否符合 `{module}.{action}` 格式
- 檢查 `MODULE_GROUPS` 是否包含所有模組

### Issue 3: Excel 匯出失敗

**問題**: 點擊匯出按鈕無反應或報錯

**解決方案**:
- 檢查 `xlsx` 套件是否已安裝: `pnpm add xlsx`
- 檢查資料格式是否正確
- 檢查瀏覽器是否允許下載

---

## Performance Optimization

### 1. 虛擬滾動（大量角色）

若角色數量超過 100 個，考慮使用虛擬滾動：

```bash
pnpm add vue-virtual-scroller
```

### 2. 防抖搜尋

```typescript
import { useDebounceFn } from '@vueuse/core'

const handleSearch = useDebounceFn((keyword: string) => {
  // 執行搜尋
}, 300)
```

### 3. 分批載入權限樹

若權限數量超過 200 個，考慮按需載入：

```typescript
// 僅在展開折疊面板時載入權限樹
<el-collapse @change="handleCollapseChange">
  <el-collapse-item>
    <PermissionSelector v-if="permissionsLoaded" />
  </el-collapse-item>
</el-collapse>
```

---

## Next Steps

完成開發後，請執行以下步驟：

1. **本地測試**: 執行 `pnpm test` 確保所有測試通過
2. **程式碼檢查**: 執行 `pnpm lint` 確保無 ESLint 錯誤
3. **功能測試**: 手動測試所有使用者情境（參考 spec.md）
4. **提交程式碼**: 
   ```bash
   git add .
   git commit -m "feat: 完成角色管理功能"
   git push origin 003-role-management
   ```
5. **建立 Pull Request**: 提交 PR 並請求程式碼審查
6. **更新文件**: 完成 tasks.md（使用 `/speckit.tasks` 指令）

---

## Resources

- [功能規格](./spec.md)
- [實施計畫](./plan.md)
- [資料模型](./data-model.md)
- [API 契約](./contracts/api-contracts.md)
- [研究文件](./research.md)
- [後端 API 規格](../.specify/memory/V3.Admin.Backend.API.yaml)
- [Element Plus 文件](https://element-plus.org/)
- [Vue 3 文件](https://vuejs.org/)
- [Pinia 文件](https://pinia.vuejs.org/)

---

**Happy Coding! 🚀**
