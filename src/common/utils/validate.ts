/** 判断是否为数组 */
export function isArray<T>(arg: T) {
  return Array.isArray ? Array.isArray(arg) : Object.prototype.toString.call(arg) === "[object Array]"
}

/** 判断是否为字符串 */
export function isString(str: unknown) {
  return typeof str === "string" || str instanceof String
}

/** 判断是否为外链 */
export function isExternal(path: string) {
  const reg = /^(https?:|mailto:|tel:)/
  return reg.test(path)
}
/**
 * 驗證權限代碼格式
 * 格式：module:action 或 module:submodule:action（最多三層）
 * 範例：permission:read, user:profile:edit
 *
 * @param code - 權限代碼
 * @returns 是否符合格式
 */
export function validatePermissionCode(code: string): boolean {
  const pattern = /^\w+:\w+(:\w+)?$/
  return pattern.test(code)
}
