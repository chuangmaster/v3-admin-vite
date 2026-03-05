import type { PushNotificationRequest } from "../types"
import { request } from "@/http/axios"

/**
 * 主動推播通知
 * @param data - 推播通知請求資料
 */
export function pushNotificationApi(data: PushNotificationRequest): Promise<ApiResponse> {
  return request({ url: "/notification/push", method: "POST", data })
}
