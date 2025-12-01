# Data Model: 角色管理系統

**Feature**: 角色管理系統 (Role Management)
**Date**: 2025-11-21
**Version**: 1.0

## Overview

本文件定義角色管理系統的前端資料模型，包含實體定義、欄位規格、關聯關係與驗證規則。資料模型基於後端 API 規格（`V3.Admin.Backend.API.yaml`）並針對前端需求進行調整。

## Entities

### 1. Role（角色）

**描述**: 代表系統中的角色實體，用於群組化管理具有相同職責的用戶。

**來源**: 後端 API `/api/role` 回傳的 `RoleDto`

**TypeScript Interface**:

```typescript
interface RoleDto {
  /** 角色唯一識別碼 (UUID) */
  id: string
  
  /** 角色名稱（必填，唯一） */
  roleName: string
  
  /** 角色描述（選填，最大 500 字元） */
  description: string | null
  
  /** 建立時間（ISO 8601, UTC） */
  createdAt: string
  
  /** 樂觀鎖版本號（用於並發控制） */
  version: number
}
```

**欄位規格**:

| 欄位 | 型別 | 必填 | 驗證規則 | 說明 |
|------|------|------|----------|------|
| `id` | string (UUID) | ✅ | - | 後端生成，前端唯讀 |
| `roleName` | string | ✅ | 長度 1-100 字元、唯一性 | 角色名稱 |
| `description` | string \| null | ❌ | 最大 500 字元 | 角色描述 |
| `createdAt` | string (ISO 8601) | ✅ | - | 後端生成，前端唯讀 |
| `version` | number | ✅ | >= 1 | 後端生成與管理，前端需在更新/刪除時提供 |

**關聯關係**:
- **與 Permission（權限）**: 多對多關係，透過 `RolePermission` 關聯表連結
- **與 User（用戶）**: 多對多關係，透過 `UserRole` 關聯表連結

**業務規則**:
1. 角色名稱必須唯一（不區分大小寫）
2. 刪除角色前需檢查是否有用戶正在使用（後端驗證）
3. 更新或刪除時必須提供正確的 `version`（樂觀鎖）

---

### 2. RoleDetail（角色詳細資訊）

**描述**: 擴展的角色實體，包含該角色擁有的所有權限清單。

**來源**: 後端 API `/api/role/{id}/permissions` 回傳的 `RoleDetailDto`

**TypeScript Interface**:

```typescript
interface RoleDetailDto {
  /** 角色基本資訊 */
  id: string
  roleName: string
  description: string | null
  createdAt: string
  version: number
  
  /** 角色擁有的權限清單 */
  permissions: PermissionDto[]
}
```

**欄位規格**:
- 繼承 `RoleDto` 的所有欄位
- 新增 `permissions` 欄位（權限陣列）

**使用場景**:
- 角色編輯對話框（顯示已分配的權限）
- 角色詳情頁面

---

### 3. Permission（權限）

**描述**: 代表系統中的權限項目，定義可執行的操作或可訪問的資源。

**來源**: 後端 API `/api/permission` 回傳的 `PermissionDto`

**TypeScript Interface**:

```typescript
interface PermissionDto {
  /** 權限唯一識別碼 (UUID) */
  id: string
  
  /** 權限代碼（格式：resource.action，如 user.create） */
  permissionCode: string
  
  /** 權限名稱 */
  name: string
  
  /** 權限描述 */
  description: string | null
  
  /** 權限類型 */
  permissionType: 'function' | 'view'
  
  /** 建立時間（ISO 8601, UTC） */
  createdAt: string
  
  /** 最後更新時間（ISO 8601, UTC） */
  updatedAt: string | null
  
  /** 樂觀鎖版本號 */
  version: number
}
```

**欄位規格**:

| 欄位 | 型別 | 必填 | 驗證規則 | 說明 |
|------|------|------|----------|------|
| `id` | string (UUID) | ✅ | - | 後端生成 |
| `permissionCode` | string | ✅ | 格式：`resource.action`、最大 100 字元 | 權限代碼 |
| `name` | string | ✅ | 最大 200 字元 | 權限顯示名稱 |
| `description` | string \| null | ❌ | - | 權限描述 |
| `permissionType` | enum | ✅ | `function` 或 `view` | 權限類型 |
| `createdAt` | string | ✅ | - | 後端生成 |
| `updatedAt` | string \| null | ✅ | - | 後端管理 |
| `version` | number | ✅ | >= 1 | 樂觀鎖版本號 |

**權限類型**:
- `function`: 功能操作權限（如 `user.create`, `role.delete`）
- `view`: UI 區塊瀏覽權限（如 `dashboard.view`）

**關聯關係**:
- **與 Role（角色）**: 多對多關係

---

### 4. UserRole（用戶角色關聯）

**描述**: 記錄用戶與角色之間的關聯關係。

**來源**: 後端 API `/api/users/{userId}/roles` 回傳的 `UserRoleDto`

**TypeScript Interface**:

```typescript
interface UserRoleDto {
  /** 用戶 ID */
  userId: string
  
  /** 角色 ID */
  roleId: string
  
  /** 角色名稱（冗餘欄位，方便顯示） */
  roleName: string
  
  /** 指派時間（ISO 8601, UTC） */
  assignedAt: string
}
```

**欄位規格**:

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `userId` | string (UUID) | ✅ | 用戶唯一識別碼 |
| `roleId` | string (UUID) | ✅ | 角色唯一識別碼 |
| `roleName` | string | ✅ | 角色名稱（冗餘，避免額外查詢） |
| `assignedAt` | string (ISO 8601) | ✅ | 指派時間 |

**使用場景**:
- 用戶管理頁面（顯示用戶的角色清單）
- 用戶角色分配功能

---

### 5. PermissionTreeNode（權限樹節點）

**描述**: 前端專用的樹狀結構節點，用於權限選擇器（`el-tree` 元件）。

**來源**: 前端轉換自 `PermissionDto[]`

**TypeScript Interface**:

```typescript
interface PermissionTreeNode {
  /** 節點唯一識別碼（權限 ID 或分組 ID） */
  id: string
  
  /** 節點顯示標籤 */
  label: string
  
  /** 權限代碼（僅葉子節點有值） */
  permissionCode: string
  
  /** 子節點（分組節點才有） */
  children?: PermissionTreeNode[]
  
  /** 是否為分組節點 */
  isGroup?: boolean
}
```

**範例資料**:

```typescript
const permissionTree: PermissionTreeNode[] = [
  {
    id: 'access-control',
    label: '存取控制 (Access Control)',
    permissionCode: 'access_control',
    isGroup: true,
    children: [
      {
        id: 'user-management-group',
        label: '使用者管理',
        permissionCode: 'user_management',
        isGroup: true,
        children: [
          { id: 'uuid-1', label: '查看用戶 (user.read)', permissionCode: 'user.read' },
          { id: 'uuid-2', label: '建立用戶 (user.create)', permissionCode: 'user.create' },
          { id: 'uuid-3', label: '更新用戶 (user.update)', permissionCode: 'user.update' },
          { id: 'uuid-4', label: '刪除用戶 (user.delete)', permissionCode: 'user.delete' }
        ]
      },
      {
        id: 'role-management-group',
        label: '角色管理',
        permissionCode: 'role_management',
        isGroup: true,
        children: [
          { id: 'uuid-5', label: '查看角色 (role.read)', permissionCode: 'role.read' },
          { id: 'uuid-6', label: '建立角色 (role.create)', permissionCode: 'role.create' },
          { id: 'uuid-7', label: '更新角色 (role.update)', permissionCode: 'role.update' },
          { id: 'uuid-8', label: '刪除角色 (role.delete)', permissionCode: 'role.delete' },
          { id: 'uuid-9', label: '指派角色 (role.assign)', permissionCode: 'role.assign' },
          { id: 'uuid-10', label: '移除角色 (role.remove)', permissionCode: 'role.remove' }
        ]
      },
      {
        id: 'permission-management-group',
        label: '權限管理',
        permissionCode: 'permission_management',
        isGroup: true,
        children: [
          { id: 'uuid-11', label: '分配權限 (permission.assign)', permissionCode: 'permission.assign' },
          { id: 'uuid-12', label: '移除權限 (permission.remove)', permissionCode: 'permission.remove' }
        ]
      }
    ]
  }
]
```

---

## Request/Response Models

### CreateRoleRequest

**用途**: 建立新角色

```typescript
interface CreateRoleRequest {
  /** 角色名稱（必填） */
  roleName: string
  
  /** 角色描述（選填） */
  description?: string
}
```

**驗證規則**:
- `roleName`: 長度 1-100 字元、必填
- `description`: 最大 500 字元、選填

**API 端點**: `POST /api/role`

---

### UpdateRoleRequest

**用途**: 更新現有角色

```typescript
interface UpdateRoleRequest {
  /** 角色名稱（必填） */
  roleName: string
  
  /** 角色描述（選填） */
  description?: string
  
  /** 樂觀鎖版本號（必填） */
  version: number
}
```

**驗證規則**:
- `roleName`: 長度 1-100 字元、必填
- `description`: 最大 500 字元、選填
- `version`: >= 1、必填

**API 端點**: `PUT /api/role/{id}`

---

### DeleteRoleRequest

**用途**: 刪除角色

```typescript
interface DeleteRoleRequest {
  /** 樂觀鎖版本號（必填） */
  version: number
}
```

**API 端點**: `DELETE /api/role/{id}`

---

### AssignRolePermissionsRequest

**用途**: 為角色分配權限

```typescript
interface AssignRolePermissionsRequest {
  /** 權限 ID 陣列 */
  permissionIds: string[]  // UUID[]
}
```

**驗證規則**:
- `permissionIds`: 至少包含 1 個權限 ID、每個 ID 必須為有效的 UUID

**API 端點**: `POST /api/role/{id}/permissions`

---

### AssignUserRoleRequest

**用途**: 為用戶指派角色

```typescript
interface AssignUserRoleRequest {
  /** 角色 ID 陣列 */
  roleIds: string[]  // UUID[]
}
```

**驗證規則**:
- `roleIds`: 至少包含 1 個角色 ID、每個 ID 必須為有效的 UUID

**API 端點**: `POST /api/users/{userId}/roles`

---

### RoleListResponse

**用途**: 角色列表分頁回應

```typescript
interface RoleListResponse {
  /** 角色清單 */
  items: RoleDto[]
  
  /** 總筆數 */
  totalCount: number
  
  /** 當前頁碼（從 1 開始） */
  pageNumber: number
  
  /** 每頁筆數 */
  pageSize: number
  
  /** 業務代碼 */
  code: string
  
  /** 訊息 */
  message: string
  
  /** 追蹤 ID */
  traceId: string
}
```

**API 端點**: `GET /api/role?pageNumber={n}&pageSize={m}`

---

## Validation Rules

### 角色名稱驗證

```typescript
const roleNameRules = [
  {
    required: true,
    message: '請輸入角色名稱',
    trigger: 'blur'
  },
  {
    min: 1,
    max: 100,
    message: '角色名稱長度需介於 1-100 字元',
    trigger: 'blur'
  }
]
```

### 角色描述驗證

```typescript
const descriptionRules = [
  {
    max: 500,
    message: '角色描述最多 500 字元',
    trigger: 'blur'
  }
]
```

### 版本號驗證

```typescript
const versionRules = [
  {
    required: true,
    message: '版本號為必填欄位',
    trigger: 'blur'
  },
  {
    type: 'number',
    min: 1,
    message: '版本號必須為正整數',
    trigger: 'blur'
  }
]
```

---

## Entity Relationships Diagram

```
┌─────────────────┐            ┌─────────────────┐
│     User        │            │      Role       │
│  (用戶)         │◄──────────►│    (角色)       │
│                 │   多對多    │                 │
│ - id: string    │            │ - id: string    │
│ - username      │            │ - roleName      │
│ - displayName   │            │ - description   │
└─────────────────┘            │ - version       │
                               │ - createdAt     │
                               └────────┬────────┘
                                        │
                                        │ 多對多
                                        ▼
                               ┌─────────────────┐
                               │   Permission    │
                               │    (權限)       │
                               │                 │
                               │ - id: string    │
                               │ - permissionCode│
                               │ - name          │
                               │ - type          │
                               └─────────────────┘

關聯表：
- UserRole (用戶角色關聯): userId + roleId
- RolePermission (角色權限關聯): roleId + permissionId
```

---

## State Management (Pinia Store)

### RoleStore

**用途**: 管理角色列表的全域狀態（選用，視需求而定）

```typescript
import { defineStore } from 'pinia'

interface RoleState {
  /** 角色列表 */
  roles: RoleDto[]
  
  /** 載入狀態 */
  loading: boolean
  
  /** 總筆數 */
  total: number
}

export const useRoleStore = defineStore('role', {
  state: (): RoleState => ({
    roles: [],
    loading: false,
    total: 0
  }),
  
  actions: {
    /** 設定角色列表 */
    setRoles(roles: RoleDto[], total: number) {
      this.roles = roles
      this.total = total
    },
    
    /** 新增角色 */
    addRole(role: RoleDto) {
      this.roles.unshift(role)
      this.total++
    },
    
    /** 更新角色 */
    updateRole(id: string, updates: Partial<RoleDto>) {
      const index = this.roles.findIndex(r => r.id === id)
      if (index !== -1) {
        this.roles[index] = { ...this.roles[index], ...updates }
      }
    },
    
    /** 刪除角色 */
    deleteRole(id: string) {
      const index = this.roles.findIndex(r => r.id === id)
      if (index !== -1) {
        this.roles.splice(index, 1)
        this.total--
      }
    }
  }
})
```

**注意**: 根據專案慣例，優先使用組合式函式（Composables）而非 Pinia Store，除非需要跨元件共享狀態。

---

## Type Exports

所有型別定義應匯出至獨立檔案：

```typescript
// src/pages/role-management/types.ts

export type {
  RoleDto,
  RoleDetailDto,
  PermissionDto,
  UserRoleDto,
  PermissionTreeNode,
  CreateRoleRequest,
  UpdateRoleRequest,
  DeleteRoleRequest,
  AssignRolePermissionsRequest,
  AssignUserRoleRequest,
  RoleListResponse
}
```

---

## Summary

本資料模型定義涵蓋：
- ✅ 5 個核心實體（Role, RoleDetail, Permission, UserRole, PermissionTreeNode）
- ✅ 6 個請求模型（Create, Update, Delete, Assign Permissions, Assign Roles）
- ✅ 1 個回應模型（RoleListResponse）
- ✅ 完整的驗證規則
- ✅ 實體關聯圖
- ✅ 可選的 Pinia Store 設計

所有模型嚴格遵循後端 API 規格（`V3.Admin.Backend.API.yaml`），確保前後端契約一致性。
