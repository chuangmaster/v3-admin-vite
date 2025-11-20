/**
 * 角色管理核心邏輯組合式函式
 * @module @/pages/role-management/composables/useRoleManagement
 */

import type { RoleDto } from "../types"

import { ElMessage, ElMessageBox } from "element-plus"
import { ref } from "vue"

import { deleteRole, getRoles } from "../apis/role"

/**
 * 角色管理核心邏輯
 * 負責角色列表載入、刪除、分頁等操作
 */
export function useRoleManagement() {
  const roles = ref<RoleDto[]>([])
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  /**
   * 載入角色列表
   */
  const loadRoles = async () => {
    loading.value = true
    try {
      const response = await getRoles(currentPage.value, pageSize.value)
      if (response.success && response.data) {
        roles.value = response.data.items
        total.value = response.data.totalCount
      } else {
        ElMessage.error(response.message || "載入角色列表失敗")
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 刪除角色
   * @param role 要刪除的角色
   */
  const handleDeleteRole = async (role: RoleDto) => {
    try {
      await ElMessageBox.confirm(
        `確定要刪除角色「${role.roleName}」嗎？此操作無法撤銷。`,
        "刪除確認",
        { type: "warning", confirmButtonText: "確定", cancelButtonText: "取消" }
      )

      await deleteRole(role.id, { version: role.version })
      ElMessage.success("角色刪除成功")
      // 重新載入列表
      await loadRoles()
    } catch (error: any) {
      // 如果不是用戶取消，其他錯誤已由全域攔截器處理
      if (error !== "cancel") {
        // 這裡處理其他錯誤（全域已處理）
      }
    }
  }

  /**
   * 刷新列表
   */
  const refresh = async () => {
    await loadRoles()
  }

  /**
   * 處理頁碼變更
   * @param page 新頁碼
   */
  const handlePageChange = async (page: number) => {
    currentPage.value = page
    await loadRoles()
  }

  /**
   * 處理每頁筆數變更
   * @param size 新每頁筆數
   */
  const handleSizeChange = async (size: number) => {
    pageSize.value = size
    currentPage.value = 1
    await loadRoles()
  }

  return {
    roles,
    loading,
    total,
    currentPage,
    pageSize,
    loadRoles,
    handleDeleteRole,
    refresh,
    handlePageChange,
    handleSizeChange
  }
}
