/**
 * 可包含 API 回傳的頂層欄位（某些後端直接把分頁資料放在回傳頂層）
 * 作為基底型別獨立存在，供不同回傳結構使用。
 */
export interface ApiPagedResponse<T = any> {
  /** 是否成功 */
  success?: boolean
  /** 業務代碼（字串或數字） */
  code?: string | number
  /** 訊息 */
  message?: string
  /** 時間戳 */
  timestamp?: string
  /** 追蹤 ID */
  traceId?: string
  // 允許包含任意其它頂層欄位（例如 items, pageNumber 等）
  [key: string]: any
}

/**
 * 命名為 `PagedApiResponse` 的分頁回應型別，繼承 `ApiPagedResponse`。
 * 代表 API 回傳同時包含頂層欄位與分頁資料的情況。
 */
export interface PagedApiResponse<T> extends ApiPagedResponse<T> {
  /** 資料列表 */
  items: T[]
  /** 當前頁碼 */
  pageNumber: number
  /** 每頁筆數 */
  pageSize: number
  /** 總筆數 */
  totalCount: number
}
