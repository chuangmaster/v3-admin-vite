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
 * 系統所有權限常數集合
 */
export const SYSTEM_PERMISSIONS = {
  ...USER_PERMISSIONS
} as const
