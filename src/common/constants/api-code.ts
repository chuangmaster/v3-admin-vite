/**
 * 後端 API 響應狀態碼
 * 對應後端 C# ApiCode 常數定義
 */

// ===== 成功狀態 (2xx) =====

/** 操作成功 */
export const API_CODE_SUCCESS = "SUCCESS"

/** 資源建立成功 */
export const API_CODE_CREATED = "CREATED"

// ===== 客戶端錯誤 (4xx) =====

/** 輸入驗證錯誤 */
export const API_CODE_VALIDATION_ERROR = "VALIDATION_ERROR"

/** 登入憑證錯誤 (帳號或密碼錯誤) */
export const API_CODE_INVALID_CREDENTIALS = "INVALID_CREDENTIALS"

/** 未授權 (缺少或無效的 JWT Token) */
export const API_CODE_UNAUTHORIZED = "UNAUTHORIZED"

/** 禁止操作 (權限不足) */
export const API_CODE_FORBIDDEN = "FORBIDDEN"

/** 資源不存在 */
export const API_CODE_NOT_FOUND = "NOT_FOUND"

// ===== 業務邏輯錯誤 (422) =====

/** 帳號已存在 (新增帳號時重複) */
export const API_CODE_USERNAME_EXISTS = "USERNAME_EXISTS"

/** 新密碼與舊密碼相同 */
export const API_CODE_PASSWORD_SAME_AS_OLD = "PASSWORD_SAME_AS_OLD"

/** 無法刪除當前登入的帳號 */
export const API_CODE_CANNOT_DELETE_SELF = "CANNOT_DELETE_SELF"

/** 無法刪除最後一個有效帳號 */
export const API_CODE_LAST_ACCOUNT_CANNOT_DELETE = "LAST_ACCOUNT_CANNOT_DELETE"

// ===== 權限管理相關錯誤 (404/422) =====

/** 權限不存在 */
export const API_CODE_PERMISSION_NOT_FOUND = "PERMISSION_NOT_FOUND"

/** 角色不存在 */
export const API_CODE_ROLE_NOT_FOUND = "ROLE_NOT_FOUND"

/** 用戶不存在 */
export const API_CODE_USER_NOT_FOUND = "USER_NOT_FOUND"

/** 稽核日誌不存在 */
export const API_CODE_AUDIT_LOG_NOT_FOUND = "AUDIT_LOG_NOT_FOUND"

/** 權限正被角色使用，無法刪除 */
export const API_CODE_PERMISSION_IN_USE = "PERMISSION_IN_USE"

/** 角色正被用戶使用，無法刪除 */
export const API_CODE_ROLE_IN_USE = "ROLE_IN_USE"

/** 權限代碼已存在 */
export const API_CODE_DUPLICATE_PERMISSION_CODE = "DUPLICATE_PERMISSION_CODE"

/** 角色名稱已存在 */
export const API_CODE_DUPLICATE_ROLE_NAME = "DUPLICATE_ROLE_NAME"

// ===== 並發控制 (409) =====

/** 並發更新衝突 (資料已被其他使用者修改) */
export const API_CODE_CONCURRENT_UPDATE_CONFLICT = "CONCURRENT_UPDATE_CONFLICT"

// ===== 伺服器錯誤 (5xx) =====

/** 系統內部錯誤 */
export const API_CODE_INTERNAL_ERROR = "INTERNAL_ERROR"

/**
 * 成功的 API 狀態碼集合
 */
export const SUCCESS_API_CODES = new Set([API_CODE_SUCCESS, API_CODE_CREATED])

/**
 * 需要重新登入的 API 狀態碼集合
 */
export const RELOGIN_API_CODES = new Set([
  API_CODE_UNAUTHORIZED,
  API_CODE_INVALID_CREDENTIALS
])

/**
 * API 狀態碼至 i18n 鍵名的對應表
 * 用於在 axios 攔截器中取得多語系錯誤訊息
 */
export const API_CODE_I18N_KEY_MAP: Record<string, string> = {
  [API_CODE_VALIDATION_ERROR]: "api.validationError",
  [API_CODE_INVALID_CREDENTIALS]: "api.invalidCredentials",
  [API_CODE_UNAUTHORIZED]: "api.unauthorized",
  [API_CODE_FORBIDDEN]: "api.forbidden",
  [API_CODE_NOT_FOUND]: "api.notFound",
  [API_CODE_USERNAME_EXISTS]: "api.usernameExists",
  [API_CODE_PASSWORD_SAME_AS_OLD]: "api.passwordSameAsOld",
  [API_CODE_CANNOT_DELETE_SELF]: "api.cannotDeleteSelf",
  [API_CODE_LAST_ACCOUNT_CANNOT_DELETE]: "api.lastAccountCannotDelete",
  [API_CODE_PERMISSION_NOT_FOUND]: "api.permissionNotFound",
  [API_CODE_ROLE_NOT_FOUND]: "api.roleNotFound",
  [API_CODE_USER_NOT_FOUND]: "api.userNotFound",
  [API_CODE_AUDIT_LOG_NOT_FOUND]: "api.auditLogNotFound",
  [API_CODE_PERMISSION_IN_USE]: "api.permissionInUse",
  [API_CODE_ROLE_IN_USE]: "api.roleInUse",
  [API_CODE_DUPLICATE_PERMISSION_CODE]: "api.duplicatePermissionCode",
  [API_CODE_DUPLICATE_ROLE_NAME]: "api.duplicateRoleName",
  [API_CODE_CONCURRENT_UPDATE_CONFLICT]: "api.concurrentUpdateConflict",
  [API_CODE_INTERNAL_ERROR]: "api.internalError"
}
