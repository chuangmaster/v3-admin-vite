/**
 * 客戶等級管理 Composable
 *
 * @module customer-management/composables/useCustomerLevel
 * @description 提供客戶等級的 CRUD 操作與狀態管理
 *
 * 功能:
 * - 等級歷程查詢
 * - 當前有效等級查詢
 * - 新增等級
 * - 更新等級（含樂觀鎖處理）
 * - 終止會籍
 * - 載入狀態與錯誤管理
 */

import type {
  CreateLevelRequest,
  CustomerLevelFormData,
  CustomerLevelPeriodResponse,
  UpdateLevelRequest
} from "../types"
import dayjs from "dayjs"
import { ElMessage } from "element-plus"
import { ref } from "vue"
import { customerLevelApi } from "../apis/customer-level"

export function useCustomerLevel() {
  /** 等級歷程記錄列表 */
  const levelList = ref<CustomerLevelPeriodResponse[]>([])

  /** 當前有效的等級 */
  const activeLevel = ref<CustomerLevelPeriodResponse | null>(null)

  /** 載入中狀態 */
  const loading = ref(false)

  /** 錯誤訊息 */
  const error = ref<string | null>(null)

  /** 當前操作的客戶 ID */
  const currentCustomerId = ref<string | null>(null)

  /**
   * 將本地日期轉換為 UTC ISO 8601 字串
   * @param date - 本地日期
   * @param endOfDay - 是否為當天結束時間（23:59:59）
   * @returns UTC ISO 8601 字串
   */
  function toUTCISOString(date: Date, endOfDay: boolean = false): string {
    const d = dayjs(date)
    if (endOfDay) {
      return d.endOf("day").utc().format("YYYY-MM-DDTHH:mm:ss[Z]")
    }
    return d.startOf("day").utc().format("YYYY-MM-DDTHH:mm:ss[Z]")
  }

  /**
   * 查詢等級歷程記錄
   * @param customerId - 客戶 ID
   * @param includeExpired - 是否包含已過期的記錄
   */
  async function fetchLevelHistory(customerId: string, includeExpired: boolean = true) {
    loading.value = true
    error.value = null
    currentCustomerId.value = customerId

    try {
      const response = await customerLevelApi.getLevelHistory(customerId, includeExpired)
      if (response.code === "0" && response.data) {
        levelList.value = response.data
      } else {
        throw new Error(response.message || "查詢等級歷程失敗")
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "查詢等級歷程失敗"
      error.value = message
      console.error("fetchLevelHistory error:", err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 查詢當前有效等級狀態
   * @param customerId - 客戶 ID
   */
  async function fetchActiveLevel(customerId: string) {
    loading.value = true
    error.value = null
    currentCustomerId.value = customerId

    try {
      const response = await customerLevelApi.getActiveLevel(customerId)
      if (response.code === "0") {
        activeLevel.value = response.data
      } else {
        throw new Error(response.message || "查詢當前等級狀態失敗")
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "查詢當前等級狀態失敗"
      error.value = message
      console.error("fetchActiveLevel error:", err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 新增等級
   * @param customerId - 客戶 ID
   * @param formData - 表單資料
   * @returns 是否成功
   */
  async function createLevel(customerId: string, formData: CustomerLevelFormData): Promise<boolean> {
    if (!formData.startDate || !formData.endDate) {
      ElMessage.error("請選擇開始日期與結束日期")
      return false
    }

    loading.value = true
    error.value = null

    try {
      const request: CreateLevelRequest = {
        level: formData.level,
        startDate: toUTCISOString(formData.startDate, false),
        endDate: toUTCISOString(formData.endDate, true)
      }

      const response = await customerLevelApi.createLevel(customerId, request)
      if (response.code === "0" && response.data) {
        ElMessage.success("等級設定成功")
        // 重新載入資料
        await Promise.all([
          fetchActiveLevel(customerId),
          fetchLevelHistory(customerId)
        ])
        return true
      } else {
        throw new Error(response.message || "新增等級失敗")
      }
    } catch (err: unknown) {
      handleApiError(err, "新增等級失敗")
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新等級
   * @param customerId - 客戶 ID
   * @param levelId - 等級效期記錄 ID
   * @param formData - 表單資料
   * @param version - 樂觀鎖版本號
   * @returns 是否成功
   */
  async function updateLevel(
    customerId: string,
    levelId: string,
    formData: CustomerLevelFormData,
    version: number
  ): Promise<boolean> {
    if (!formData.startDate || !formData.endDate) {
      ElMessage.error("請選擇開始日期與結束日期")
      return false
    }

    loading.value = true
    error.value = null

    try {
      const request: UpdateLevelRequest = {
        level: formData.level,
        startDate: toUTCISOString(formData.startDate, false),
        endDate: toUTCISOString(formData.endDate, true),
        version
      }

      const response = await customerLevelApi.updateLevel(customerId, levelId, request)
      if (response.code === "0" && response.data) {
        ElMessage.success("等級更新成功")
        // 重新載入資料
        await Promise.all([
          fetchActiveLevel(customerId),
          fetchLevelHistory(customerId)
        ])
        return true
      } else {
        throw new Error(response.message || "更新等級失敗")
      }
    } catch (err: unknown) {
      // 特別處理樂觀鎖衝突
      if (isConflictError(err)) {
        ElMessage.warning({
          message: "資料已被其他使用者更新，請重新載入後再試",
          duration: 5000,
          showClose: true
        })
        // 自動重新載入最新資料
        await fetchLevelHistory(customerId)
        return false
      }
      handleApiError(err, "更新等級失敗")
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 終止會籍
   * @param customerId - 客戶 ID
   * @returns 是否成功
   */
  async function terminateLevel(customerId: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await customerLevelApi.terminateLevel(customerId)
      if (response.code === "0" && response.data) {
        ElMessage.success("會籍已終止")
        // 重新載入資料
        await Promise.all([
          fetchActiveLevel(customerId),
          fetchLevelHistory(customerId)
        ])
        return true
      } else {
        throw new Error(response.message || "終止會籍失敗")
      }
    } catch (err: unknown) {
      handleApiError(err, "終止會籍失敗")
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 判斷是否為 409 Conflict 錯誤
   */
  function isConflictError(err: unknown): boolean {
    if (err && typeof err === "object" && "response" in err) {
      const e = err as { response?: { status?: number } }
      return e.response?.status === 409
    }
    return false
  }

  /**
   * 統一處理 API 錯誤
   */
  function handleApiError(err: unknown, defaultMessage: string) {
    let message = defaultMessage

    if (err instanceof Error) {
      message = err.message || defaultMessage
    }

    // 處理特定 HTTP 錯誤
    if (err && typeof err === "object" && "response" in err) {
      const e = err as { response?: { status?: number, data?: { message?: string } } }
      const status = e.response?.status
      const apiMessage = e.response?.data?.message

      switch (status) {
        case 400:
          message = apiMessage || "請求參數錯誤，請檢查日期範圍設定"
          break
        case 404:
          message = apiMessage || "查無資料"
          break
        case 409:
          message = apiMessage || "資料已被其他使用者更新，請重新載入後再試"
          break
        default:
          message = apiMessage || defaultMessage
      }
    }

    error.value = message
    ElMessage.error(message)
  }

  /**
   * 重設狀態
   */
  function reset() {
    levelList.value = []
    activeLevel.value = null
    loading.value = false
    error.value = null
    currentCustomerId.value = null
  }

  return {
    // 狀態
    levelList,
    activeLevel,
    loading,
    error,
    currentCustomerId,

    // 方法
    fetchLevelHistory,
    fetchActiveLevel,
    createLevel,
    updateLevel,
    terminateLevel,
    reset
  }
}
