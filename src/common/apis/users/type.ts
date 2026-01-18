/** 用戶資料（對應 /api/Account/me 回應） */
export interface CurrentUserData {
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

export type CurrentUserResponseData = ApiResponse<CurrentUserData>
