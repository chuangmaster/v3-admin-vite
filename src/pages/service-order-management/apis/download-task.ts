import type { CreateDownloadTaskRequest, DownloadTask } from "../types"
import { request } from "@/http/axios"

/**
 * 提交服務單批次下載任務
 */
export async function createDownloadTask(
  data: CreateDownloadTaskRequest
): Promise<ApiResponse<DownloadTask>> {
  return request({
    url: "download-tasks",
    method: "POST",
    data
  })
}

/**
 * 查詢批次下載任務狀態
 */
export async function getDownloadTask(taskId: string): Promise<ApiResponse<DownloadTask>> {
  return request({
    url: `download-tasks/${taskId}`,
    method: "GET"
  })
}
