/**
 * 系統權限常數定義
 * @module @/common/constants/permissions
 */

/**
 * 用戶管理模組權限常數
 * 對應後端 AccountPermission
 */
export const USER_PERMISSIONS = {
  /** 查看用戶列表（路由權限） */
  READ: "account.read",
  /** 新增用戶（功能權限） */
  CREATE: "account.create",
  /** 修改用戶（功能權限） */
  UPDATE: "account.update",
  /** 刪除用戶（功能權限） */
  DELETE: "account.delete"
} as const

/**
 * 權限管理模組權限常數
 */
export const PERMISSION_PERMISSIONS = {
  /** 查看權限列表 */
  READ: "permission.read",
  /** 新增權限 */
  CREATE: "permission.create",
  /** 修改權限 */
  UPDATE: "permission.update",
  /** 刪除權限 */
  DELETE: "permission.delete",
  /** 指派權限 */
  ASSIGN: "permission.assign",
  /** 移除權限 */
  REMOVE: "permission.remove"
} as const

/**
 * 系統所有權限常數集合
 */
export const SYSTEM_PERMISSIONS = {
  ...USER_PERMISSIONS,
  ...PERMISSION_PERMISSIONS
} as const
