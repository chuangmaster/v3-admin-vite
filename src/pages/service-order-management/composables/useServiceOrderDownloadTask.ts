import type { SignalRNotificationPayload } from "@@/composables/useSignalR"
import type { CreateDownloadTaskRequest, DownloadDocumentType, DownloadTask } from "../types"
import { useSignalR } from "@@/composables/useSignalR"
import { toUTC0ISOString } from "@@/utils/datetime"
import { ElMessage } from "element-plus"
import { createDownloadTask, getDownloadTask } from "../apis/download-task"
import { DownloadDocumentType as DownloadDocumentTypeEnum, ServiceOrderType } from "../types"

const STORAGE_KEY = "service-order-download-task-id"

/** UI 勾選項（收購單專用虛擬 key） */
type BuybackCheckboxKey = "ID_CARD_FRONT" | "ID_CARD_BACK" | "BUYBACK_CONTRACT" | "ONE_TIME_TRADE"

interface DownloadTaskForm {
  dateRange: [string, string] | []
  orderType: ServiceOrderType | ""
  documentTypes: DownloadDocumentType[]
}

/** 收購單：UI 勾選項 → 實際 API documentTypes 映射 */
const BUYBACK_CHECKBOX_MAP: Record<BuybackCheckboxKey, DownloadDocumentType[]> = {
  ID_CARD_FRONT: [DownloadDocumentTypeEnum.ID_CARD_FRONT],
  ID_CARD_BACK: [DownloadDocumentTypeEnum.ID_CARD_BACK],
  BUYBACK_CONTRACT: [DownloadDocumentTypeEnum.BUYBACK_CONTRACT, DownloadDocumentTypeEnum.BUYBACK_CONTRACT_WITH_ONE_TIME_TRADE],
  ONE_TIME_TRADE: [DownloadDocumentTypeEnum.ONE_TIME_TRADE, DownloadDocumentTypeEnum.BUYBACK_CONTRACT_WITH_ONE_TIME_TRADE]
}

/** 各服務單類型的全部 UI 勾選項 */
const ALL_BUYBACK_KEYS: BuybackCheckboxKey[] = ["ID_CARD_FRONT", "ID_CARD_BACK", "BUYBACK_CONTRACT", "ONE_TIME_TRADE"]
const ALL_CONSIGNMENT_TYPES: DownloadDocumentType[] = [DownloadDocumentTypeEnum.CONSIGNMENT_CONTRACT]

function getDefaultDocumentTypes(orderType: ServiceOrderType | ""): DownloadDocumentType[] {
  if (orderType === ServiceOrderType.BUYBACK)
    return [...ALL_BUYBACK_KEYS] as unknown as DownloadDocumentType[]
  if (orderType === ServiceOrderType.CONSIGNMENT)
    return [...ALL_CONSIGNMENT_TYPES]
  return []
}

function isAllSelected(orderType: ServiceOrderType | "", selected: DownloadDocumentType[]): boolean {
  const defaults = getDefaultDocumentTypes(orderType)
  return defaults.length > 0 && defaults.length === selected.length
}

/** 將 UI 勾選項展開為實際 API documentTypes（去重） */
function expandBuybackDocumentTypes(selected: DownloadDocumentType[]): DownloadDocumentType[] {
  const result = new Set<DownloadDocumentType>()
  for (const key of selected) {
    const mapped = BUYBACK_CHECKBOX_MAP[key as BuybackCheckboxKey]
    if (mapped) {
      mapped.forEach(t => result.add(t))
    } else {
      result.add(key)
    }
  }
  return [...result]
}

function normalizeStatus(status?: string): string {
  return status?.trim().toLowerCase().replace(/[\s-]+/g, "_") ?? ""
}

function isTerminalStatus(task: DownloadTask | null): boolean {
  if (!task)
    return true

  if (task.downloadUrl || task.errorMessage)
    return true

  const status = normalizeStatus(task.status)
  if (!status)
    return false

  return [
    "completed",
    "complete",
    "done",
    "success",
    "succeeded",
    "failed",
    "error",
    "expired",
    "cancelled",
    "canceled",
    "partial_failed"
  ].includes(status)
}

export function useServiceOrderDownloadTask() {
  const { onNotification } = useSignalR()

  const submitting = ref(false)
  const loading = ref(false)
  const currentTask = ref<DownloadTask | null>(null)
  const form = ref<DownloadTaskForm>({
    dateRange: [],
    orderType: "",
    documentTypes: []
  })

  let pollingTimer: ReturnType<typeof setInterval> | null = null
  let unsubscribeNotification: (() => void) | null = null

  const hasTask = computed(() => !!currentTask.value)
  const canDownload = computed(() => !!currentTask.value?.downloadUrl)
  const failedOrderNumbers = computed(() => currentTask.value?.failedOrderNumbers ?? [])

  function persistTaskId(taskId?: string) {
    if (!taskId) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, taskId)
  }

  function clearPollingTimer() {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
  }

  async function fetchTaskStatus(taskId?: string, silent = false) {
    const targetTaskId = taskId ?? currentTask.value?.taskId
    if (!targetTaskId)
      return

    if (!silent)
      loading.value = true

    try {
      const response = await getDownloadTask(targetTaskId)
      if (!response.success || !response.data) {
        ElMessage.error(response.message || "查詢批次下載任務失敗")
        return
      }

      currentTask.value = response.data
      persistTaskId(response.data.taskId)

      if (isTerminalStatus(response.data))
        clearPollingTimer()
    } catch {
      if (!silent)
        ElMessage.error("查詢批次下載任務失敗，請稍後再試")
    } finally {
      if (!silent)
        loading.value = false
    }
  }

  function startPolling() {
    clearPollingTimer()

    if (!currentTask.value || isTerminalStatus(currentTask.value))
      return

    pollingTimer = setInterval(() => {
      fetchTaskStatus(undefined, true)
    }, 15000)
  }

  async function submitTask() {
    const { dateRange, orderType, documentTypes } = form.value

    if (!Array.isArray(dateRange) || dateRange.length !== 2) {
      ElMessage.warning("請先選擇下載日期區間")
      return
    }

    if (!orderType) {
      ElMessage.warning("請先選擇服務單類型")
      return
    }

    if (documentTypes.length === 0) {
      ElMessage.warning("請至少勾選一種文件類型")
      return
    }

    const allSelected = isAllSelected(orderType, documentTypes)

    let resolvedDocTypes: DownloadDocumentType[] | undefined
    if (!allSelected) {
      resolvedDocTypes = orderType === ServiceOrderType.BUYBACK
        ? expandBuybackDocumentTypes(documentTypes)
        : [...documentTypes]
    }

    const payload: CreateDownloadTaskRequest = {
      startDate: toUTC0ISOString(dateRange[0]),
      endDate: toUTC0ISOString(dateRange[1], true),
      orderType,
      ...(resolvedDocTypes ? { documentTypes: resolvedDocTypes } : {})
    }

    submitting.value = true
    try {
      const response = await createDownloadTask(payload)
      if (!response.success || !response.data) {
        ElMessage.error(response.message || "提交批次下載任務失敗")
        return
      }

      currentTask.value = response.data
      persistTaskId(response.data.taskId)
      startPolling()
      ElMessage.success("批次下載任務已提交，完成後將透過通知提醒")
    } catch {
      ElMessage.error("提交批次下載任務失敗，請稍後再試")
    } finally {
      submitting.value = false
    }
  }

  function resetForm() {
    form.value = {
      dateRange: [],
      orderType: "",
      documentTypes: []
    }
  }

  function openDownloadUrl() {
    const downloadUrl = currentTask.value?.downloadUrl
    if (!downloadUrl) {
      ElMessage.warning("下載連結尚未產生")
      return
    }

    window.open(downloadUrl, "_blank", "noopener,noreferrer")
  }

  function clearTask() {
    currentTask.value = null
    persistTaskId()
    clearPollingTimer()
  }

  function handleNotification(_payload: SignalRNotificationPayload) {
    if (!currentTask.value || isTerminalStatus(currentTask.value))
      return

    fetchTaskStatus(undefined, true)
  }

  async function restoreLastTask() {
    const taskId = localStorage.getItem(STORAGE_KEY)
    if (!taskId)
      return

    await fetchTaskStatus(taskId, true)
    startPolling()
  }

  onMounted(() => {
    unsubscribeNotification = onNotification(handleNotification)
    restoreLastTask()
  })

  onUnmounted(() => {
    clearPollingTimer()
    unsubscribeNotification?.()
    unsubscribeNotification = null
  })

  return {
    form,
    submitting,
    loading,
    currentTask,
    hasTask,
    canDownload,
    failedOrderNumbers,
    submitTask,
    fetchTaskStatus,
    resetForm,
    openDownloadUrl,
    clearTask,
    normalizeStatus,
    isTerminalStatus,
    getDefaultDocumentTypes
  }
}
