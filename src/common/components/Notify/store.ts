import type { TabPaneName } from "element-plus"
import type { NotifyItem } from "./type"
/**
 * Notify 通知元件 - Pinia Store
 *
 * 提供全域通知管理,支援從任何模組動態新增通知
 */
import { defineStore } from "pinia"
import { messageData, notifyData, todoData } from "./data"

interface DataItem {
  name: TabPaneName
  type: "primary" | "success" | "warning" | "danger" | "info"
  list: NotifyItem[]
}

export const useNotifyStore = defineStore("notify", () => {
  /** 通知資料 */
  const data = ref<DataItem[]>([
    { name: "notification", type: "primary", list: [...notifyData] },
    { name: "message", type: "danger", list: [...messageData] },
    { name: "todo", type: "warning", list: [...todoData] }
  ])

  /** 總通知數量 */
  const badgeValue = computed(() => data.value.reduce((sum, item) => sum + item.list.length, 0))

  /**
   * 新增通知
   * @param item 通知項目
   */
  function addNotification(item: NotifyItem): void {
    const notificationTab = data.value.find(d => d.name === "notification")
    if (notificationTab) {
      notificationTab.list.unshift({
        ...item,
        datetime: item.datetime || new Date().toLocaleString("zh-TW")
      })
    }
  }

  /**
   * 新增訊息
   * @param item 訊息項目
   */
  function addMessage(item: NotifyItem): void {
    const messageTab = data.value.find(d => d.name === "message")
    if (messageTab) {
      messageTab.list.unshift({
        ...item,
        datetime: item.datetime || new Date().toLocaleString("zh-TW")
      })
    }
  }

  /**
   * 新增待辦
   * @param item 待辦項目
   */
  function addTodo(item: NotifyItem): void {
    const todoTab = data.value.find(d => d.name === "todo")
    if (todoTab) {
      todoTab.list.unshift({
        ...item,
        datetime: item.datetime || new Date().toLocaleString("zh-TW")
      })
    }
  }

  /**
   * 移除通知
   * @param type 通知類型
   * @param index 通知索引
   */
  function removeNotification(type: TabPaneName, index: number): void {
    const tab = data.value.find(d => d.name === type)
    if (tab && tab.list[index]) {
      tab.list.splice(index, 1)
    }
  }

  /**
   * 清空指定類型的通知
   * @param type 通知類型
   */
  function clearNotifications(type: TabPaneName): void {
    const tab = data.value.find(d => d.name === type)
    if (tab) {
      tab.list = []
    }
  }

  return {
    data,
    badgeValue,
    addNotification,
    addMessage,
    addTodo,
    removeNotification,
    clearNotifications
  }
})
