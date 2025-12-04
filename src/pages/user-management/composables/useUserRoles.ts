/**
 * 使用者角色分配組合式函式
 * 處理角色載入、選擇、差異比對和提交邏輯
 * @module @/pages/user-management/composables/useUserRoles
 */

import type { ApiResponse } from "../types"

import type { Role, UserRole } from "@/pages/role-management/types"
import { ElMessage } from "element-plus"
import { computed, reactive, ref } from "vue"

import { useRoleStore } from "@/pinia/stores/role"
import { assignUserRoles, getUserRoles, removeUserRole } from "../apis/user-roles"

/** 角色表單數據類型 */
interface RoleFormData {
  /** 使用者 ID */
  userId?: string
  /** 當前選擇的角色 ID 陣列 */
  selectedRoleIds: string[]
  /** 原始角色 ID 陣列（用於比對變更） */
  originalRoleIds: string[]
}

/**
 * 使用者角色分配組合式函式
 * @returns 表單狀態、規則、操作方法
 * @example
 * ```typescript
 * const { formLoading, selectedRoleIds, availableRoles, submitForm, resetForm, setUserId }
 *   = useUserRoles()
 * ```
 */
export function useUserRoles() {
  /** 表單提交載入狀態 */
  const formLoading = ref(false)

  /** 角色 Store */
  const roleStore = useRoleStore()

  /** 表單資料 */
  const formData = reactive<RoleFormData>({
    userId: undefined,
    selectedRoleIds: [],
    originalRoleIds: []
  })

  /**
   * 可用角色清單（來自 Pinia Store）
   */
  const availableRoles = computed<Role[]>(() => roleStore.roles)

  /**
   * 新增的角色 ID（差異比對）
   */
  const addedRoleIds = computed<string[]>(() => {
    return formData.selectedRoleIds.filter(id => !formData.originalRoleIds.includes(id))
  })

  /**
   * 移除的角色 ID（差異比對）
   */
  const removedRoleIds = computed<string[]>(() => {
    return formData.originalRoleIds.filter(id => !formData.selectedRoleIds.includes(id))
  })

  /**
   * 是否有變更
   */
  const hasChanges = computed<boolean>(() => {
    return addedRoleIds.value.length > 0 || removedRoleIds.value.length > 0
  })

  /**
   * 載入角色列表（從 Store 快取）
   */
  async function fetchRoles(): Promise<void> {
    await roleStore.fetchRoles()
  }

  /**
   * 載入使用者的角色
   */
  async function fetchUserRoles(): Promise<void> {
    if (!formData.userId) return

    try {
      formLoading.value = true
      const response: ApiResponse<UserRole[]> = await getUserRoles(formData.userId)

      if (response.success && response.data) {
        const roleIds = response.data.map(ur => ur.roleId)
        formData.selectedRoleIds = roleIds
        formData.originalRoleIds = roleIds
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "載入使用者角色失敗"
      ElMessage.error(errorMessage)
    } finally {
      formLoading.value = false
    }
  }

  /**
   * 提交表單（分配角色）
   * 只有當有變更時才提交
   * @returns 成功返回 true，失敗返回 false
   */
  async function submitForm(): Promise<boolean> {
    if (!formData.userId) {
      ElMessage.error("使用者 ID 未設定")
      return false
    }

    if (!hasChanges.value) {
      ElMessage.info("沒有角色變更")
      return true
    }

    try {
      formLoading.value = true

      // 先刪除要移除的角色
      if (removedRoleIds.value.length > 0) {
        for (const roleId of removedRoleIds.value) {
          try {
            await removeUserRole(formData.userId, roleId)
          } catch (error) {
            console.error(`Failed to remove role ${roleId}:`, error)
          }
        }
      }

      // 再新增要新增的角色（如果有新增的角色）
      if (addedRoleIds.value.length > 0) {
        const response: ApiResponse<null> = await assignUserRoles(formData.userId, {
          roleIds: addedRoleIds.value
        })

        if (!response.success) {
          ElMessage.error(response.message || "角色分配失敗")
          return false
        }
      }

      // 更新原始角色列表
      formData.originalRoleIds = [...formData.selectedRoleIds]
      ElMessage.success("角色分配成功")
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "角色分配失敗"
      ElMessage.error(errorMessage)
      return false
    } finally {
      formLoading.value = false
    }
  }

  /**
   * 重置表單
   */
  function resetForm(): void {
    formData.userId = undefined
    formData.selectedRoleIds = []
    formData.originalRoleIds = []
  }

  /**
   * 設定使用者 ID
   * @param userId - 使用者 ID
   */
  function setUserId(userId: string): void {
    formData.userId = userId
  }

  return {
    formLoading,
    formData,
    availableRoles,
    addedRoleIds,
    removedRoleIds,
    hasChanges,
    fetchRoles,
    fetchUserRoles,
    submitForm,
    resetForm,
    setUserId
  }
}
