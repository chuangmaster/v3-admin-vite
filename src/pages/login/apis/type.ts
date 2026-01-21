export interface LoginRequestData {
  /** 用户名 */
  account: string
  /** 密码 */
  password: string
  /** 验证码 */
  code: string
}

export type CaptchaResponseData = ApiResponse<string>

export type LoginResponseData = ApiResponse<{ token: string }>
