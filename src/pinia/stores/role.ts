import type { Role } from "@/pages/role-management/types"

import { defineStore } from "pinia"
import { ref } from "vue"

import { getRoles } from "@/pages/role-management/apis/role"

export const useRoleStore = defineStore("role", () => {
  /** 角色列表 */
  const roles = ref<Role[]>([])

  /** 角色列表載入狀態 */
  const loading = ref(false)

  /** 角色列表最後更新時間 */
  const lastFetchTime = ref<number>(0)

  /** 快取時長（毫秒）：5 分鐘 */
  const CACHE_DURATION = 5 * 60 * 1000

  /**
   * 載入角色列表
   * 支援快取機制：5 分鐘內不重複載入
   * @param force - 是否強制重新載入（忽略快取）
   */
  async function fetchRoles(force = false): Promise<void> {
    // 檢查快取是否仍有效
    if (!force && roles.value.length > 0) {
      const now = Date.now()
      if (now - lastFetchTime.value < CACHE_DURATION) {
        return
      }
    }

    try {
      loading.value = true
      // 獲取所有角色（無分頁限制）
      const response = await getRoles(1, 1000)

      if (response.success && response.data) {
        roles.value = response.data
        lastFetchTime.value = Date.now()
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 根據 ID 取得單一角色
   * @param id - 角色 ID
   * @returns 角色物件或 undefined
   */
  function getRoleById(id: string): Role | undefined {
    return roles.value.find(role => role.id === id)
  }

  /**
   * 根據角色名稱取得角色
   * @param name - 角色名稱
   * @returns 角色物件或 undefined
   */
  function getRoleByName(name: string): Role | undefined {
    return roles.value.find(role => role.roleName === name)
  }

  /**
   * 清空快取
   */
  function clearCache(): void {
    roles.value = []
    lastFetchTime.value = 0
  }

  return {
    roles,
    loading,
    fetchRoles,
    getRoleById,
    getRoleByName,
    clearCache
  }
})
