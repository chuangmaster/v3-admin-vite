/**
 * 可包含 API 回傳的頂層欄位（某些後端直接把分頁資料放在回傳頂層）
 * 作為基底型別獨立存在，供不同回傳結構使用。
 */
export interface ApiResponse<T = any> {
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
  /** 資料列表 */
  data: T
}

/**
 * 命名為 `PagedApiResponse` 的分頁回應型別，繼承 `ApiResponse`。
 * 代表 API 回傳同時包含頂層欄位與分頁資料的情況。
 */
export interface PagedApiResponse<T> extends ApiResponse<T> {

  /** 當前頁碼 */
  pageNumber: number
  /** 每頁筆數 */
  pageSize: number
  /** 總筆數 */
  totalCount: number
}
