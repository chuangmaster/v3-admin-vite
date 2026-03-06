import { getToken } from "@@/utils/cache/cookies"
import * as signalR from "@microsoft/signalr"
import { ElNotification } from "element-plus"
import { useNotificationStore } from "@/pinia/stores/notification"

let connection: signalR.HubConnection | null = null

/** 嚴重程度對應 ElNotification 類型 */
const SEVERITY_TYPE_MAP: Record<number, "info" | "warning" | "error"> = {
  0: "info",
  1: "warning",
  2: "error"
}

/** 取得 SignalR Hub 的完整 URL */
function getHubUrl() {
  return "/hubs/notification"
}

/** 註冊 SignalR 事件監聽 */
function registerListeners(conn: signalR.HubConnection) {
  conn.on("ReceivePushNotification", (...args: any[]) => {
    // 相容兩種格式：單一物件 or 多個獨立參數
    let title: string
    let message: string
    let severity: number

    if (args.length === 1 && typeof args[0] === "object") {
      ({ title, message, severity } = args[0])
    } else {
      [title, message, severity] = args
    }

    // 寫入 Pinia Store（通知面板顯示）
    const notificationStore = useNotificationStore()
    notificationStore.addNotification(title, message, severity)

    // 同時彈出 ElNotification
    ElNotification({
      title,
      message,
      type: SEVERITY_TYPE_MAP[severity] ?? "info",
      duration: 5000
    })
  })
}

/** 建立並啟動 SignalR 連線 */
async function startConnection() {
  if (connection) return

  connection = new signalR.HubConnectionBuilder()
    .withUrl(getHubUrl(), {
      accessTokenFactory: () => getToken() || ""
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build()

  try {
    await connection.start()
    registerListeners(connection)
    console.log("SignalR 已連線")
  } catch (error) {
    console.error("SignalR 連線失敗:", error)
    connection = null
  }
}

/** 停止 SignalR 連線 */
async function stopConnection() {
  if (!connection) return

  try {
    await connection.stop()
    console.log("SignalR 已斷線")
  } catch (error) {
    console.error("SignalR 斷線失敗:", error)
  } finally {
    connection = null
  }
}

/** 取得目前的 SignalR 連線實例 */
function getConnection() {
  return connection
}

export function useSignalR() {
  return { startConnection, stopConnection, getConnection }
}
