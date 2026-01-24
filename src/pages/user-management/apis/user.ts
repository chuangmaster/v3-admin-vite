/**
 * 帳號/用戶管理 API 服務（採用後端 API 規格的 /api/account 路徑）
 * @module @/pages/user-management/apis/account
 */

import type {
  ChangePasswordRequest,
  CreateUserRequest,
  DeleteUserRequest,
  ResetPasswordRequest,
  UpdateUserRequest,
  User,
  UserListParams,
  UserListResponse
} from "../types"
import { request } from "@/http/axios"

/**
 * 查詢用戶列表
 * @param params - 查詢參數（頁碼、每頁筆數、搜尋關鍵字）
 * @returns 用戶列表回應
 */
export async function getUserList(
  params: UserListParams
): Promise<ApiResponse<UserListResponse>> {
  return request({ url: "/account", method: "GET", params })
}

/**
 * 查詢單一用戶
 * @param id - 用戶 ID（UUID）
 * @returns 用戶資料
 */
export async function getUserById(id: string): Promise<ApiResponse<User>> {
  return request({ url: `/account/${id}`, method: "GET" })
}

/**
 * 新增用戶
 * @param data - 新增用戶請求資料
 * @returns 建立的用戶資料
 */
export async function createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
  return request({ url: "/account", method: "POST", data })
}

/**
 * 更新用戶資訊
 * @param id - 用戶 ID（UUID）
 * @param data - 更新用戶請求資料
 * @returns 更新後的用戶資料
 */
export async function updateUser(
  id: string,
  data: UpdateUserRequest
): Promise<ApiResponse<User>> {
  return request({ url: `/account/${id}`, method: "PUT", data })
}

/**
 * 刪除用戶（軟刪除）
 * @param id - 用戶 ID（UUID）
 * @returns 刪除結果（data 為 null）
 */
export async function deleteUser(id: string): Promise<ApiResponse<null>> {
  return request({
    url: `/account/${id}`,
    method: "DELETE",
    data: { confirmation: "CONFIRM" } as DeleteUserRequest
  })
}

/**
 * 用戶自行修改密碼（後端規格：PUT /api/Account/me/password）
 *
 * 此 API 用於用戶修改自己的密碼，必須提供舊密碼驗證。
 * 實際使用時，傳入的 id 應為當前登入用戶的 ID。
 *
 * @param id - 用戶 ID（UUID，應為當前用戶 ID）
 * @param data - 變更密碼請求資料
 * @returns 變更結果（data 為 null）
 * @throws {409} API_CODE_CONCURRENT_UPDATE_CONFLICT - 版本衝突
 * @throws {401} INVALID_OLD_PASSWORD - 舊密碼錯誤
 * @throws {400} VALIDATION_ERROR - 新密碼不符合規則
 */
export async function changePassword(
  id: string,
  data: ChangePasswordRequest
): Promise<ApiResponse<null>> {
  return request({ url: "/account/me/password", method: "PUT", data })
}

/**
 * 管理者重設用戶密碼（後端規格：PUT /api/Account/{id}/reset-password）
 *
 * 此 API 僅供管理者使用，無需提供用戶的舊密碼。
 *
 * @param id - 目標用戶 ID（UUID）
 * @param data - 重設密碼請求資料
 * @returns 重設結果（data 為 null）
 * @throws {409} API_CODE_CONCURRENT_UPDATE_CONFLICT - 版本衝突
 * @throws {400} VALIDATION_ERROR - 新密碼不符合規則
 * @throws {403} FORBIDDEN - 非管理者權限
 * @throws {404} NOT_FOUND - 用戶不存在
 */
export async function resetPassword(
  id: string,
  data: ResetPasswordRequest
): Promise<ApiResponse<null>> {
  return request({ url: `/account/${id}/reset-password`, method: "PUT", data })
}
