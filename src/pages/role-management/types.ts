/**
 * 角色管理系統 TypeScript 型別定義
 * @module @/pages/role-management/types
 */

/** 角色 */
export interface Role {
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

/** 角色詳細資訊（包含權限） */
export interface RoleDetail extends Role {
  /** 角色擁有的權限清單 */
  permissions: Permission[]
}

/** 權限 */
export interface Permission {
  /** 權限唯一識別碼 (UUID) */
  id: string

  /** 權限代碼（格式：resource.action，如 user.create） */
  permissionCode: string

  /** 權限名稱 */
  name: string

  /** 權限描述 */
  description: string | null

  /** 權限類型 */
  permissionType: "function" | "view"

  /** 建立時間（ISO 8601, UTC） */
  createdAt: string

  /** 最後更新時間（ISO 8601, UTC） */
  updatedAt: string | null

  /** 樂觀鎖版本號 */
  version: number
}

/** 使用者角色關聯 */
export interface UserRole {
  /** 使用者 ID */
  userId: string

  /** 角色 ID */
  roleId: string

  /** 角色名稱（冗餘欄位，方便顯示） */
  roleName: string

  /** 指派時間（ISO 8601, UTC） */
  assignedAt: string
}

/** 權限樹節點 */
export interface PermissionTreeNode {
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

/** 新增角色請求 */
export interface CreateRoleRequest {
  /** 角色名稱（必填） */
  roleName: string

  /** 角色描述（選填） */
  description?: string
}

/** 更新角色請求 */
export interface UpdateRoleRequest extends CreateRoleRequest {
  /** 樂觀鎖版本號（必填） */
  version: number
}

/** 刪除角色請求 */
export interface DeleteRoleRequest {
  /** 樂觀鎖版本號（必填） */
  version: number
}

/** 角色權限分配請求 */
export interface AssignRolePermissionsRequest {
  /** 權限 ID 陣列 */
  permissionIds: string[]
}

/** 使用者角色分配請求 */
export interface AssignUserRoleRequest {
  /** 角色 ID 陣列 */
  roleIds: string[]
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
