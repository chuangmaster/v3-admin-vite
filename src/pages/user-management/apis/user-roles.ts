/**
 * 使用者角色管理 API 服務
 * @module @/pages/user-management/apis/user-roles
 */

import type { ApiResponse } from "../types"

import type { AssignUserRoleRequest, UserRole } from "@/pages/role-management/types"

import { request } from "@/http/axios"

/**
 * 查詢使用者的所有角色
 * @param userId - 使用者 ID
 * @returns 使用者的角色列表
 */
export async function getUserRoles(userId: string): Promise<ApiResponse<UserRole[]>> {
  return request({
    url: `/users/${userId}/roles`,
    method: "GET"
  })
}

/**
 * 為使用者指派角色
 * @param userId - 使用者 ID
 * @param data - 角色 ID 陣列
 * @returns 指派結果
 */
export async function assignUserRoles(
  userId: string,
  data: AssignUserRoleRequest
): Promise<ApiResponse<null>> {
  return request({
    url: `/users/${userId}/roles`,
    method: "POST",
    data
  })
}

/**
 * 從使用者移除單一角色
 * @param userId - 使用者 ID
 * @param roleId - 角色 ID
 * @returns 移除結果
 */
export async function removeUserRole(
  userId: string,
  roleId: string
): Promise<ApiResponse<null>> {
  return request({
    url: `/users/${userId}/roles/${roleId}`,
    method: "DELETE"
  })
}
