/**
 * 用戶資料組合式函式
 * @module pages/profile/composables/useUserProfile
 * @description 管理用戶個人資料的載入與狀態
 */
import type { UserProfile } from "../types"
import { getCurrentUserApi } from "@@/apis/users"
import { ref } from "vue"

/**
 * 用戶資料管理組合式函式
 * @returns 用戶資料狀態與操作方法
 */
export function useUserProfile() {
  /** 用戶資料 */
  const userInfo = ref<UserProfile | null>(null)
  /** 載入中狀態 */
  const loading = ref(false)
  /** 錯誤訊息 */
  const error = ref<string | null>(null)

  /**
   * 載入用戶資料
   * @description 呼叫 API 取得當前登入用戶的完整資料
   */
  const fetchUserProfile = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const response = await getCurrentUserApi()
      if (response.success && response.data) {
        userInfo.value = response.data
      } else {
        error.value = response.message || "載入用戶資料失敗"
      }
    } catch (err: unknown) {
      console.error("載入用戶資料失敗:", err)
      error.value = "載入用戶資料失敗，請稍後再試"
    } finally {
      loading.value = false
    }
  }

  /**
   * 重新載入用戶資料
   * @description 用於密碼修改後或併發衝突時重新取得最新資料
   */
  const refreshProfile = async (): Promise<void> => {
    await fetchUserProfile()
  }

  return {
    userInfo,
    loading,
    error,
    fetchUserProfile,
    refreshProfile
  }
}
