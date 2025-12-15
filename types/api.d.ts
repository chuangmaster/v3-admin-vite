/**
 * API 統一回應介面
 * 所有 API 回應都應遵循此格式
 */
export interface ApiResponse<T = any> {
  /** 操作是否成功 */
  success: boolean
  /** 業務邏輯代碼 */
  code: string
  /** 訊息 */
  message: string
  /** 回應資料（可為 null） */
  data: T | null
  /** 回應時間戳記（ISO 8601, UTC） */
  timestamp: string
  /** 分散式追蹤 ID */
  traceId: string
}

/**
 * 分頁 API 回應介面
 * 繼承 ApiResponse，額外包含分頁資訊
 */
export interface PagedApiResponse<T> extends ApiResponse<T> {
  /** 當前頁碼 */
  pageNumber: number
  /** 每頁筆數 */
  pageSize: number
  /** 總筆數 */
  totalCount: number
}

// 保留全域型別宣告以向後兼容
declare global {
  interface ApiResponse<T = any> {
    success: boolean
    code: string
    message: string
    data: T | null
    timestamp: string
    traceId: string
  }

  interface PagedApiResponse<T> extends ApiResponse<T> {
    pageNumber: number
    pageSize: number
    totalCount: number
  }
}
