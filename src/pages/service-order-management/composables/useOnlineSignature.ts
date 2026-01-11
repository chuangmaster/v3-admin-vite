/**
 * 線上簽章管理組合式函式
 * @module @/pages/service-order-management/composables/useOnlineSignature
 */

import type { OnlineSignatureStatus, SignatureRecord } from "../types"
import { ElMessage } from "element-plus"
import { ref } from "vue"
import * as onlineSignatureApi from "../apis/online-signature"

/**
 * 線上簽章管理組合式函式
 */
export function useOnlineSignature() {
  /** 載入狀態 */
  const loading = ref(false)

  /**
   * 發送線上簽章請求
   * @param serviceOrderId - 服務單 ID
   * @param customMessage - 自訂訊息（選填）
   * @returns 是否成功
   */
  async function sendSignatureRequest(
    serviceOrderId: string,
    customMessage?: string
  ): Promise<boolean> {
    loading.value = true
    try {
      const response = await onlineSignatureApi.sendOnlineSignature(
        serviceOrderId,
        customMessage ? { customMessage } : undefined
      )

      if (response.success) {
        ElMessage.success("簽章請求已成功發送")
        return true
      }
      return false
    } catch (error) {
      console.error("發送簽章請求失敗:", error)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 重新發送線上簽章請求
   * @param serviceOrderId - 服務單 ID
   * @returns 是否成功
   */
  async function resendSignatureRequest(
    serviceOrderId: string
  ): Promise<boolean> {
    loading.value = true
    try {
      const response = await onlineSignatureApi.resendOnlineSignature(
        serviceOrderId
      )

      if (response.success) {
        ElMessage.success("簽章請求已重新發送")
        return true
      }

      return false
    } catch (error) {
      console.error("重新發送簽章請求失敗:", error)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 複製簽章連結
   * @param signatureUrl - 簽章 URL
   */
  async function copySignatureUrl(signatureUrl: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(signatureUrl)
      ElMessage.success("連結已複製")
    } catch (error) {
      console.error("複製失敗:", error)
      ElMessage.error("複製失敗，請手動複製")
    }
  }

  /**
   * 取得簽章狀態文字
   * @param status - 簽章狀態
   * @returns 狀態文字
   */
  function getStatusText(status?: OnlineSignatureStatus | string): string {
    const statusMap: Record<string, string> = {
      NOT_SENT: "未發送",
      PENDING: "待簽名",
      SIGNED: "已簽署",
      TERMINATED: "已中止"
    }
    return status ? statusMap[status] || status : "-"
  }

  /**
   * 取得簽章狀態標籤類型
   * @param status - 簽章狀態
   * @returns Element Plus 標籤類型
   */
  function getStatusType(status?: OnlineSignatureStatus | string): "success" | "warning" | "info" {
    const typeMap: Record<string, "success" | "warning" | "info"> = {
      NOT_SENT: "info",
      PENDING: "warning",
      SIGNED: "success",
      TERMINATED: "info"
    }
    return status ? (typeMap[status] || "info") : "info"
  }

  /**
   * 檢查是否可以發送簽章請求
   * @param record - 簽章紀錄
   * @returns 是否可以發送簽章請求
   */
  function canSend(record: SignatureRecord): boolean {
    return record.statusKey === "NOT_SENT"
  }

  /**
   * 檢查是否可以重新發送
   * @param record - 簽章紀錄
   * @returns 是否可以重新發送
   * @remarks 僅檢查狀態，頻率限制由後端處理
   */
  function canResend(record: SignatureRecord): boolean {
    // 僅 PENDING 狀態可以重新發送
    const status = record.statusKey
    return status === "PENDING"
  }

  /**
   * 檢查是否可以複製連結
   * @param record - 簽章紀錄
   * @returns 是否可以複製連結
   */
  function canCopyUrl(record: SignatureRecord): boolean {
    // 有簽章 URL 且狀態為 PENDING
    const status = record.statusKey
    const signatureUrl = record.dropboxSignUrl || record.signatureUrl
    return !!(
      signatureUrl
      && status === "PENDING"
    )
  }

  return {
    loading,
    sendSignatureRequest,
    resendSignatureRequest,
    copySignatureUrl,
    getStatusText,
    getStatusType,
    canSend,
    canResend,
    canCopyUrl
  }
}
