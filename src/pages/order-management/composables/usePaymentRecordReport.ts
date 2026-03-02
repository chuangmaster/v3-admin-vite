/**
 * 付款紀錄報表 Composable
 *
 * @module order-management/composables/usePaymentRecordReport
 * @description 提供付款紀錄報表的資料查詢、日期區間篩選、付款方式篩選、列印功能
 */

import type { PaymentMethod, PaymentRecordReportItem, PaymentRecordReportParams } from "@/pages/order-management/types"
import { ElMessage } from "element-plus"
import { computed, ref } from "vue"
import { orderApi } from "@/pages/order-management/apis/order"
import { PAYMENT_METHOD_LABELS } from "@/pages/order-management/types"

export function usePaymentRecordReport() {
  /** 付款紀錄列表 */
  const records = ref<PaymentRecordReportItem[]>([])

  /** 載入中狀態 */
  const loading = ref(false)

  /** 匯出中狀態 */
  const exporting = ref(false)

  /** 日期區間篩選（[起始日, 結束日]，YYYY-MM-DD） */
  const dateRange = ref<[string, string] | null>(null)

  /** 付款方式篩選 */
  const paymentMethodFilter = ref<PaymentMethod | "">("")

  /** 付款金額合計 */
  const totalAmount = computed(() =>
    records.value.reduce((sum, r) => sum + r.paymentAmount, 0)
  )

  /** 是否已有搜尋結果可供列印 */
  const hasRecords = computed(() => records.value.length > 0)

  /**
   * 查詢付款紀錄
   */
  async function fetchRecords() {
    if (!dateRange.value || !dateRange.value[0] || !dateRange.value[1]) {
      ElMessage.warning("請選擇查詢日期區間")
      return
    }

    loading.value = true
    try {
      const params: PaymentRecordReportParams = {
        createdAtStart: dateRange.value[0],
        createdAtEnd: dateRange.value[1]
      }

      if (paymentMethodFilter.value) {
        params.paymentMethod = paymentMethodFilter.value
      }

      const response = await orderApi.getPaymentRecords(params)

      if (response.success && response.data) {
        records.value = response.data
      } else {
        ElMessage.error(response.message || "取得付款紀錄失敗")
      }
    } catch (error) {
      console.error("fetchRecords error:", error)
      ElMessage.error("取得付款紀錄失敗")
    } finally {
      loading.value = false
    }
  }

  /**
   * 執行搜尋（驗證日期必填後呼叫 fetchRecords）
   */
  function handleSearch() {
    fetchRecords()
  }

  /**
   * 重設搜尋條件與結果
   */
  function handleReset() {
    dateRange.value = null
    paymentMethodFilter.value = ""
    records.value = []
  }

  /**
   * 觸發瀏覽器列印
   */
  function handlePrint() {
    window.print()
  }

  /**
   * 匯出付款紀錄為 Excel
   */
  async function handleExport() {
    if (records.value.length === 0) {
      ElMessage.warning("無資料可匯出，請先搜尋付款紀錄")
      return
    }

    exporting.value = true
    try {
      const XLSX = await import("xlsx")

      const formattedData = records.value.map(r => ({
        訂單編號: r.orderNumber,
        付款方式: PAYMENT_METHOD_LABELS[r.paymentMethod as PaymentMethod] ?? r.paymentMethod,
        付款金額: r.paymentAmount,
        銀行末五碼: r.bankAccountLastFive ?? "",
        建立時間: r.createdAt
          ? new Date(r.createdAt).toLocaleString("zh-TW", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
            })
          : ""
      }))

      // 新增合計列
      formattedData.push({
        訂單編號: "合計",
        付款方式: "",
        付款金額: totalAmount.value,
        銀行末五碼: "",
        建立時間: ""
      })

      const worksheet = XLSX.utils.json_to_sheet(formattedData)

      worksheet["!cols"] = [
        { wch: 20 }, // 訂單編號
        { wch: 14 }, // 付款方式
        { wch: 14 }, // 付款金額
        { wch: 14 }, // 銀行末五碼
        { wch: 20 } // 建立時間
      ]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "付款紀錄")

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
      XLSX.writeFile(workbook, `付款紀錄_${timestamp}.xlsx`)

      ElMessage.success(`已匯出 ${records.value.length} 筆付款紀錄`)
    } catch (error) {
      console.error("handleExport error:", error)
      ElMessage.error("匯出失敗，請稍後再試")
    } finally {
      exporting.value = false
    }
  }

  return {
    records,
    loading,
    exporting,
    dateRange,
    paymentMethodFilter,
    totalAmount,
    hasRecords,
    handleSearch,
    handleReset,
    handlePrint,
    handleExport
  }
}
