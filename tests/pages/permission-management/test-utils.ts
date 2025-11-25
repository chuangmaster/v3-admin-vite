import type { PagedApiResponse } from "types/api-paged-response"
import type { Permission, PermissionUsage } from "@/pages/permission-management/types"
import { vi } from "vitest"

/**
 * 建立 mock 權限資料
 *
 * @param overrides - 覆蓋預設值
 * @returns mock 權限物件
 */
export function createMockPermission(overrides?: Partial<Permission>): Permission {
  return {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "新增權限",
    permissionCode: "permission:create",
    description: "允許建立新的權限",
    permissionType: "function",
    isSystem: false,
    version: 1,
    createdAt: "2025-11-19T10:00:00Z",
    updatedAt: "2025-11-19T10:00:00Z",
    createdBy: "user-001",
    updatedBy: undefined,
    ...overrides
  }
}

/**
 * 建立 mock 權限使用情況資料
 *
 * @param overrides - 覆蓋預設值
 * @returns mock 權限使用情況物件
 */
export function createMockPermissionUsage(
  overrides?: Partial<PermissionUsage>
): PermissionUsage {
  return {
    permissionId: "550e8400-e29b-41d4-a716-446655440001",
    roleCount: 2,
    roles: [
      { id: "role-001", name: "系統管理員" },
      { id: "role-002", name: "部門主管" }
    ],
    ...overrides
  }
}

/**
 * 建立 mock 分頁結果
 *
 * @param items - 分頁項目
 * @param overrides - 覆蓋預設值
 * @returns mock 分頁結果物件
 */
export function createMockPagedResult<T>(
  items: T[],
  overrides?: Partial<PagedApiResponse<T>>
): PagedApiResponse<T> {
  const totalCount = items.length
  const pageSize = overrides?.pageSize || 20
  const totalPages = Math.ceil(totalCount / pageSize)

  return {
    items,
    pageNumber: 1,
    pageSize,
    totalCount,
    totalPages,
    hasPreviousPage: false,
    hasNextPage: totalPages > 1,
    ...overrides
  }
}

/**
 * 建立 mock API 成功回應
 *
 * @param data - 回應資料
 * @param overrides - 覆蓋預設值
 * @returns API 回應物件
 */
export function createMockApiResponse<T>(
  data: T,
  overrides?: Partial<{ success: boolean, code: string, message: string }>
) {
  return {
    success: true,
    code: "SUCCESS",
    message: "操作成功",
    data,
    timestamp: new Date().toISOString(),
    traceId: `trace-${Math.random().toString(36).substring(7)}`,
    ...overrides
  }
}

/**
 * 建立 mock API 錯誤回應
 *
 * @param code - 錯誤代碼
 * @param message - 錯誤訊息
 * @param overrides - 覆蓋預設值
 * @returns API 錯誤回應物件
 */
export function createMockApiErrorResponse(
  code: string,
  message: string,
  overrides?: Partial<{ success: boolean, data: any }>
) {
  return {
    success: false,
    code,
    message,
    data: null,
    timestamp: new Date().toISOString(),
    traceId: `trace-${Math.random().toString(36).substring(7)}`,
    ...overrides
  }
}

/**
 * 建立 mock Element Plus MessageBox
 */
export function mockElMessageBox() {
  return {
    confirm: vi.fn().mockResolvedValue(true),
    alert: vi.fn().mockResolvedValue(true),
    prompt: vi.fn().mockResolvedValue({ value: "" })
  }
}

/**
 * 建立 mock Element Plus Message
 */
export function mockElMessage() {
  return {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }
}
