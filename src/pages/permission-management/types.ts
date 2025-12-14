import type { FormRules } from "element-plus"

/** 權限實體 */
export interface Permission {
  /** 權限 ID（UUID） */
  id: string
  /** 權限名稱（顯示名稱） */
  name: string
  /** 權限代碼（唯一識別碼，格式：module.action 或 module.submodule.action） */
  permissionCode: string
  /** 權限描述（可選） */
  description?: string
  /** 權限類型（function 或 view） */
  permissionType: string
  /** 是否為系統內建權限（內建權限不可刪除） */
  isSystem: boolean
  /** 版本號（用於樂觀鎖定） */
  version: number
  /** 建立時間（ISO 8601 格式） */
  createdAt: string
  /** 更新時間（ISO 8601 格式） */
  updatedAt: string
  /** 建立者 ID */
  createdBy?: string
  /** 最後更新者 ID */
  updatedBy?: string
}

/** 新增權限 DTO */
export interface CreatePermissionDto {
  /** 權限名稱 */
  name: string
  /** 權限代碼 */
  permissionCode: string
  /** 權限描述（可選） */
  description?: string
  /** 權限類型（function 或 view） */
  permissionType: string
}

/** 更新權限 DTO */
export interface UpdatePermissionDto {
  /** 權限名稱 */
  name: string
  /** 權限代碼 */
  permissionCode: string
  /** 權限描述（可選） */
  description?: string
  /** 權限類型（function 或 view） */
  permissionType: string
  /** 當前版本號（用於樂觀鎖定） */
  version: number
}

/** 權限查詢參數 */
export interface PermissionQuery {
  /** 搜尋關鍵字（搜尋 name 或 code） */
  searchKeyword?: string
  /** 頁碼（從 1 開始） */
  pageNumber: number
  /** 每頁筆數（1-100） */
  pageSize: number
  /** 排序欄位（可選） */
  sortBy?: "name" | "code" | "createdAt" | "updatedAt"
  /** 排序方向（可選） */
  sortOrder?: "asc" | "desc"
}

/** 權限使用情況 */
export interface PermissionUsage {
  /** 權限 ID */
  permissionId: string
  /** 使用該權限的角色數量 */
  roleCount: number
  /** 使用該權限的角色列表（簡化資訊） */
  roles: Array<{
    id: string
    name: string
  }>
}

/** 權限-角色關聯（唯讀，僅供查詢） */
export interface PermissionRole {
  /** 權限 ID */
  permissionId: string
  /** 角色 ID */
  roleId: string
  /** 關聯建立時間 */
  createdAt: string
}

/** 驗證權限代碼格式（格式：module:action 或 module:submodule:action，最多三層） */
export function validatePermissionCode(code: string): boolean {
  const pattern = /^\w+:\w+(:\w+)?$/
  return pattern.test(code)
}

/** Element Plus 表單驗證規則 */
export const permissionFormRules: FormRules = {
  name: [
    { required: true, message: "請輸入權限名稱", trigger: "blur" },
    {
      min: 1,
      max: 100,
      message: "權限名稱長度為 1-100 字元",
      trigger: "blur"
    }
  ],
  code: [
    { required: true, message: "請輸入權限代碼", trigger: "blur" },
    {
      validator: (_rule, value, callback) => {
        if (!validatePermissionCode(value)) {
          callback(
            new Error("權限代碼格式不正確（格式：module:action，最多三層）")
          )
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ],
  description: [{ max: 500, message: "描述最多 500 字元", trigger: "blur" }]
}
