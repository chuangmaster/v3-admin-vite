/** 推播模式 */
export enum PushMode {
  /** 指定用戶 */
  Targeted = 0,
  /** 廣播 */
  Broadcast = 1
}

/** 通知嚴重程度 */
export enum NotificationSeverity {
  Info = 0,
  Warning = 1,
  Error = 2
}

/** 主動推播通知請求 */
export interface PushNotificationRequest {
  mode: PushMode
  targetUserId?: string | null
  title: string
  message: string
  severity: NotificationSeverity
}
