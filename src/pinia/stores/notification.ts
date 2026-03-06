import type { NotifyItem } from "@@/components/Notify/type"
import { formatDateTime } from "@@/utils/datetime"

/** 嚴重程度對應標籤文字 */
const SEVERITY_LABEL: Record<number, string> = {
  0: "資訊",
  1: "警告",
  2: "錯誤"
}

/** 嚴重程度對應 tag 類型 */
const SEVERITY_STATUS: Record<number, NotifyItem["status"]> = {
  0: "info",
  1: "warning",
  2: "danger"
}

export const useNotificationStore = defineStore("notification", () => {
  /** 推播通知列表（新的在前） */
  const notifications = ref<NotifyItem[]>([])

  /** 新增一筆推播通知 */
  function addNotification(title: string, message: string, severity: number) {
    notifications.value.unshift({
      id: crypto.randomUUID(),
      title,
      description: message,
      datetime: formatDateTime(new Date(), "MM-DD HH:mm"),
      extra: SEVERITY_LABEL[severity] ?? "資訊",
      status: SEVERITY_STATUS[severity] ?? "info"
    })
  }

  /** 移除單筆通知 */
  function removeNotification(id: string) {
    const idx = notifications.value.findIndex(n => n.id === id)
    if (idx !== -1) notifications.value.splice(idx, 1)
  }

  /** 清空所有通知 */
  function clearNotifications() {
    notifications.value = []
  }

  return { notifications, addNotification, removeNotification, clearNotifications }
})
