/**
 * 帳號/用戶管理 API 服務（採用後端 API 規格的 /api/account 路徑）
 * @module @/pages/user-management/apis/account
 */

import type {
  ChangePasswordRequest,
  CreateUserRequest,
  DeleteUserRequest,
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
 * 變更密碼
 * @param id - 用戶 ID（UUID）
 * @param data - 變更密碼請求資料
 * @returns 變更結果（data 為 null）
 */
export async function changePassword(
  id: string,
  data: ChangePasswordRequest
): Promise<ApiResponse<null>> {
  return request({ url: `/account/${id}/password`, method: "PUT", data })
}
