/** 用戶實體 */
export interface User {
  /** 用戶唯一識別碼（UUID） */
  id: string
  /** 帳號名稱（登入用） */
  account: string
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

/** 新增用戶請求 */
export interface CreateUserRequest {
  /** 帳號名稱（3-20 字元，僅英數字與底線） */
  account: string
  /** 密碼（最少 8 字元，包含大小寫字母與數字） */
  password: string
  /** 顯示名稱（1-100 字元） */
  displayName: string
}

/** 更新用戶請求 */
export interface UpdateUserRequest {
  /** 顯示名稱（1-100 字元） */
  displayName: string
  /** 版本號，用於並發控制 */
  version: number
}

/** 變更密碼請求 */
export interface ChangePasswordRequest {
  /** 舊密碼 */
  oldPassword: string
  /** 新密碼（最少 8 字元，包含大小寫字母與數字） */
  newPassword: string
  /** 資料版本號（用於併發控制） */
  version: number
}

/** 刪除用戶請求 */
export interface DeleteUserRequest {
  /** 確認訊息（必須為 "CONFIRM"） */
  confirmation: "CONFIRM"
}

/** 用戶列表查詢參數 */
export interface UserListParams {
  /** 頁碼（從 1 開始） */
  pageNumber: number
  /** 每頁筆數（1-100） */
  pageSize: number
  /** 搜尋關鍵字（可選，搜尋用戶名或顯示名稱） */
  searchKeyword?: string
  /** 狀態篩選（可選） */
  status?: "active" | "inactive"
}

/** 用戶列表回應 */
export interface UserListResponse {
  /** 用戶清單 */
  items: User[]
  /** 總筆數 */
  totalCount: number
  /** 當前頁碼 */
  pageNumber: number
  /** 每頁筆數 */
  pageSize: number
  /** 總頁數 */
  totalPages: number
}

/** Excel 匯出資料結構 */
export interface UserExportData {
  /** 用戶名 */
  用戶名: string
  /** 顯示名稱 */
  顯示名稱: string
  /** 狀態 */
  狀態: "啟用" | "已停用"
  /** 建立時間 */
  建立時間: string
  /** 最後更新時間 */
  最後更新時間: string
}
