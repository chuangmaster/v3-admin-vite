import type { PagedApiResponse } from "types/api-paged-response"
import type {
  CreatePermissionDto,
  Permission,
  PermissionQuery,
  PermissionUsage,
  UpdatePermissionDto
} from "../types"
import { request } from "@/http/axios"

/**
 * 查詢權限列表
 *
 * @param query - 查詢參數
 * @returns 分頁結果
 */
export async function getPermissions(
  query: PermissionQuery
): Promise<PagedApiResponse<Permission[]>> {
  return request({
    url: "/permission",
    method: "GET",
    params: query
  })
}

/**
 * 查詢單一權限
 *
 * @param id - 權限 ID
 * @returns 權限詳細資訊
 */
export async function getPermission(
  id: string
): Promise<ApiResponse<Permission>> {
  return request({
    url: `/permission/${id}`,
    method: "GET"
  })
}

/**
 * 新增權限
 *
 * @param data - 新增權限資料
 * @returns 新建的權限
 */
export async function createPermission(
  data: CreatePermissionDto
): Promise<ApiResponse<Permission>> {
  return request({
    url: "/permission",
    method: "POST",
    data
  })
}

/**
 * 更新權限
 *
 * @param id - 權限 ID
 * @param data - 更新資料
 * @returns 更新後的權限
 */
export async function updatePermission(
  id: string,
  data: UpdatePermissionDto
): Promise<ApiResponse<Permission>> {
  return request({
    url: `/permission/${id}`,
    method: "PUT",
    data
  })
}

/**
 * 刪除權限
 *
 * @param id - 權限 ID
 * @param version - 版本號（用於樂觀鎖定）
 * @returns 刪除結果
 */
export async function deletePermission(
  id: string,
  version: number
): Promise<ApiResponse<null>> {
  return request({
    url: `/permission/${id}`,
    method: "DELETE",
    data: { version }
  })
}

/**
 * 查詢權限使用情況
 *
 * @param id - 權限 ID
 * @returns 權限使用情況
 */
export async function getPermissionUsage(
  id: string
): Promise<ApiResponse<PermissionUsage>> {
  return request({
    url: `/permission/${id}/usage`,
    method: "GET"
  })
}
