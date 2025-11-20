/**
 * 角色管理 API 服務
 * 基於後端 OpenAPI 規格 V3.Admin.Backend.API.yaml
 * @module @/pages/role-managements/role
 */

import type {
  ApiResponse,
  AssignRolePermissionsRequest,
  CreateRoleRequest,
  DeleteRoleRequest,
  PermissionDto,
  RoleDetailDto,
  RoleDto,
  RoleListResponse,
  UpdateRoleRequest
} from "../types"

import { request } from "@/http/axios"

/**
 * 查詢角色列表（分頁）
 * @param pageNumber 頁碼（從 1 開始，預設 1）
 * @param pageSize 每頁筆數（預設 10）
 * @returns 角色列表回應
 */
export async function getRoles(
  pageNumber = 1,
  pageSize = 10
): Promise<ApiResponse<RoleListResponse>> {
  return request({
    url: "/role",
    method: "GET",
    params: { pageNumber, pageSize }
  })
}

/**
 * 查詢單一角色
 * @param id 角色 ID
 * @returns 角色資料
 */
export async function getRole(id: string): Promise<ApiResponse<RoleDto>> {
  return request({
    url: `/role/${id}`,
    method: "GET"
  })
}

/**
 * 查詢角色詳細資訊（含權限）
 * @param id 角色 ID
 * @returns 角色詳細資訊
 */
export async function getRoleDetail(id: string): Promise<ApiResponse<RoleDetailDto>> {
  return request({
    url: `/role/${id}/permissions`,
    method: "GET"
  })
}

/**
 * 新增角色
 * @param data 新增角色請求
 * @returns 建立的角色資料
 */
export async function createRole(data: CreateRoleRequest): Promise<ApiResponse<RoleDto>> {
  return request({
    url: "/role",
    method: "POST",
    data
  })
}

/**
 * 更新角色
 * @param id 角色 ID
 * @param data 更新角色請求
 * @returns 更新後的角色資料
 */
export async function updateRole(
  id: string,
  data: UpdateRoleRequest
): Promise<ApiResponse<RoleDto>> {
  return request({
    url: `/role/${id}`,
    method: "PUT",
    data
  })
}

/**
 * 刪除角色
 * @param id 角色 ID
 * @param data 刪除請求（含版本號）
 * @returns 刪除成功回應
 */
export async function deleteRole(
  id: string,
  data: DeleteRoleRequest
): Promise<ApiResponse<null>> {
  return request({
    url: `/role/${id}`,
    method: "DELETE",
    data
  })
}

/**
 * 為角色分配權限
 * @param id 角色 ID
 * @param data 權限分配請求
 * @returns 分配成功回應
 */
export async function assignPermissions(
  id: string,
  data: AssignRolePermissionsRequest
): Promise<ApiResponse<null>> {
  return request({
    url: `/role/${id}/permissions`,
    method: "POST",
    data
  })
}

/**
 * 從角色移除單一權限
 * @param roleId 角色 ID
 * @param permissionId 權限 ID
 * @returns 移除成功回應
 */
export async function removePermission(
  roleId: string,
  permissionId: string
): Promise<ApiResponse<null>> {
  return request({
    url: `/role/${roleId}/permissions/${permissionId}`,
    method: "DELETE"
  })
}

/**
 * 查詢所有權限清單
 * @returns 權限清單
 */
export async function getPermissions(): Promise<
  ApiResponse<{ items: PermissionDto[] }>
> {
  return request({
    url: "/permission",
    method: "GET",
    params: { pageSize: 1000 } // 獲取所有權限
  })
}
