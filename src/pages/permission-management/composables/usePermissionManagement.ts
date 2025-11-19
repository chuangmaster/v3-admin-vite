/**
 * 權限管理組合式函式
 * 處理權限列表查詢、刪除、分頁邏輯
 * @module @/pages/permission-management/composables/usePermissionManagement
 */

import type { Permission, PermissionQuery } from "../types"
import { ElMessage, ElMessageBox } from "element-plus"
import { debounce } from "lodash-es"
import { ref, watch } from "vue"
import * as permissionApi from "../apis/permission"

/**
 * 權限管理組合式函式
 * @returns 權限列表狀態與操作方法
 * @example
 * ```typescript
 * const { permissions, loading, pagination, fetchPermissions, handleDelete } = usePermissionManagement()
 * onMounted(() => fetchPermissions())
 * ```
 */
export function usePermissionManagement() {
  /** 權限列表 */
  const permissions = ref<Permission[]>([])

  /** 載入狀態 */
  const loading = ref(false)

  /** 分頁資訊 */
  const pagination = ref({
    pageNumber: 1,
    pageSize: 20,
    total: 0
  })

  /** 搜尋關鍵字 */
  const searchKeyword = ref("")

  /**
   * 載入權限列表
   */
  async function fetchPermissions(): Promise<void> {
    loading.value = true
    try {
      const query: PermissionQuery = {
        keyword: searchKeyword.value || undefined,
        pageNumber: pagination.value.pageNumber,
        pageSize: pagination.value.pageSize
      }
      const response = await permissionApi.getPermissions(query)
      if (response.success && response.data) {
        permissions.value = response.data.items
        pagination.value.total = response.data.totalCount
      } else {
        ElMessage.error(response.message || "載入失敗")
      }
    } catch {
      ElMessage.error("載入權限列表失敗")
    } finally {
      loading.value = false
    }
  }

  /**
   * 刪除權限
   * @param permission - 待刪除的權限物件
   */
  async function handleDelete(permission: Permission): Promise<void> {
    // 檢查是否為系統權限
    if (permission.isSystem) {
      ElMessage.warning("系統內建權限無法刪除")
      return
    }

    try {
      await ElMessageBox.confirm(
        `確定要刪除權限「${permission.name}」嗎？`,
        "刪除確認",
        {
          confirmButtonText: "確定",
          cancelButtonText: "取消",
          type: "warning"
        }
      )
    } catch {
      return
    }

    loading.value = true
    try {
      const response = await permissionApi.deletePermission(permission.id, permission.version)
      if (response.success) {
        ElMessage.success("刪除成功")
        await fetchPermissions()
      } else if (response.code === "PERMISSION_IN_USE") {
        const roleCount = (response.data as any)?.roleCount || 0
        ElMessage.error(
          `該權限已被 ${roleCount} 個角色使用，無法刪除`
        )
      } else if (response.code === "SYSTEM_PERMISSION_PROTECTED") {
        ElMessage.error("系統內建權限無法刪除")
      } else if (response.code === "CONCURRENT_UPDATE_CONFLICT") {
        ElMessage.error("該權限已被其他使用者修改，請重新載入")
        await fetchPermissions()
      } else {
        ElMessage.error(response.message || "刪除失敗")
      }
    } catch {
      ElMessage.error("刪除權限失敗")
    } finally {
      loading.value = false
    }
  }

  /**
   * 批次刪除權限
   * @param permissions - 待刪除的權限物件列表
   */
  async function handleBatchDelete(permissions: Permission[]): Promise<void> {
    if (permissions.length === 0) {
      ElMessage.warning("請選擇要刪除的權限")
      return
    }

    try {
      await ElMessageBox.confirm(
        `確定要刪除選中的 ${permissions.length} 個權限嗎？`,
        "批次刪除確認",
        {
          confirmButtonText: "確定",
          cancelButtonText: "取消",
          type: "warning"
        }
      )
    } catch {
      return
    }

    loading.value = true
    let successCount = 0
    let failureCount = 0

    for (const permission of permissions) {
      try {
        const response = await permissionApi.deletePermission(permission.id, permission.version)
        if (response.success) {
          successCount++
        } else {
          failureCount++
        }
      } catch {
        failureCount++
      }
    }

    loading.value = false

    if (successCount > 0) {
      ElMessage.success(`成功刪除 ${successCount} 個權限`)
      await fetchPermissions()
    }

    if (failureCount > 0) {
      ElMessage.warning(`有 ${failureCount} 個權限刪除失敗，可能是因為被使用中或並行更新衝突`)
    }
  }

  /**
   * 重置搜尋條件並重新載入列表
   */
  function resetSearch(): void {
    searchKeyword.value = ""
    pagination.value.pageNumber = 1
    fetchPermissions()
  }

  /**
   * 當搜尋關鍵字變更時，重置分頁並重新載入
   */
  const debouncedSearch = debounce(() => {
    pagination.value.pageNumber = 1
    fetchPermissions()
  }, 500)

  watch(searchKeyword, () => {
    debouncedSearch()
  })

  return {
    permissions,
    loading,
    pagination,
    searchKeyword,
    fetchPermissions,
    handleDelete,
    handleBatchDelete,
    resetSearch
  }
}
