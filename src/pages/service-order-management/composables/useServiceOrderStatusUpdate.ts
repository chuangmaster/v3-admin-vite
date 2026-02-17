/**
 * 服務單狀態更新 Composable
 *
 * @module service-order-management/composables/useServiceOrderStatusUpdate
 * @description 封裝列表頁的「完成」與「取消」操作（PENDING → COMPLETED / TERMINATED）
 */

import type { ServiceOrderListItem } from "../types"
import { ElMessage, ElMessageBox } from "element-plus"
import { ref } from "vue"
import { updateServiceOrderStatus } from "../apis/service-order"

export function useServiceOrderStatusUpdate(onSuccess: () => void) {
  /** 更新中狀態 */
  const updating = ref(false)

  /**
   * 將服務單標記為已完成
   * @param row - 服務單列表項目
   */
  async function handleComplete(row: ServiceOrderListItem) {
    try {
      await ElMessageBox.confirm("確定將此服務單標記為已完成？", "確認完成", {
        confirmButtonText: "確定",
        cancelButtonText: "取消",
        type: "warning"
      })
    } catch {
      // 使用者按下取消
      return
    }

    updating.value = true
    try {
      const response = await updateServiceOrderStatus(row.id, {
        status: "COMPLETED",
        expectedVersion: row.version
      })
      if (response.success) {
        ElMessage.success("服務單已標記為完成")
        onSuccess()
      } else {
        ElMessage.error(response.message || "狀態更新失敗")
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } }
      if (axiosError?.response?.status === 409) {
        ElMessage.error("資料已被他人修改，請重新整理後再試")
      } else {
        ElMessage.error("狀態更新失敗，請稍後再試")
      }
    } finally {
      updating.value = false
    }
  }

  /**
   * 取消服務單（終止）
   * @param row - 服務單列表項目
   */
  async function handleCancel(row: ServiceOrderListItem) {
    let remarks = ""
    try {
      const result = await ElMessageBox.prompt("請輸入取消原因", "確認取消", {
        confirmButtonText: "確定取消",
        cancelButtonText: "返回",
        type: "warning",
        inputPlaceholder: "請說明取消原因...",
        inputValidator: (value: string) => {
          if (!value || !value.trim()) return "請輸入取消原因"
          return true
        }
      })
      remarks = result.value?.trim() || ""
    } catch {
      // 使用者按下返回
      return
    }

    updating.value = true
    try {
      const response = await updateServiceOrderStatus(row.id, {
        status: "TERMINATED",
        expectedVersion: row.version,
        remarks
      })
      if (response.success) {
        ElMessage.success("服務單已取消")
        onSuccess()
      } else {
        ElMessage.error(response.message || "狀態更新失敗")
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } }
      if (axiosError?.response?.status === 409) {
        ElMessage.error("資料已被他人修改，請重新整理後再試")
      } else {
        ElMessage.error("狀態更新失敗，請稍後再試")
      }
    } finally {
      updating.value = false
    }
  }

  return {
    updating,
    handleComplete,
    handleCancel
  }
}
