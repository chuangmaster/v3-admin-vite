/**
 * 用戶個人資料模組 - 型別定義
 * @module pages/profile/types
 */

/** 用戶資料實體（對應 /api/Account/me 回應） */
export interface UserProfile {
  /** 用戶唯一識別碼 (UUID v4) */
  id: string
  /** 用戶帳號（登入名稱） */
  account: string
  /** 用戶顯示名稱 */
  displayName: string
  /** 用戶角色列表 */
  roles: string[]
  /** 用戶權限列表 */
  permissions: string[]
  /** 資料版本號（用於併發控制） */
  version: number
}

/** 密碼修改表單資料（包含前端驗證欄位） */
export interface ChangePasswordFormData {
  /** 當前密碼 */
  oldPassword: string
  /** 新密碼 */
  newPassword: string
  /** 確認新密碼（僅用於前端驗證，不傳送至後端） */
  confirmPassword: string
}

/** 密碼修改 API 請求（對應 PUT /api/Account/{id}/password） */
export interface ChangePasswordRequest {
  /** 用戶 ID（來自 UserProfile.id） */
  id: string
  /** 當前密碼 */
  oldPassword: string
  /** 新密碼 */
  newPassword: string
  /** 資料版本號（來自 UserProfile.version） */
  version: number
}
