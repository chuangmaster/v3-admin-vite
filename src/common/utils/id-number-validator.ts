/**
 * 台灣身分證字號驗證工具
 *
 * @module common/utils/id-number-validator
 * @description 實作台灣身分證檢查碼演算法
 */

/**
 * 驗證台灣身分證字號格式與檢查碼
 *
 * @param idNumber - 身分證字號（格式: 2碼英文 + 8碼數字，共10碼）
 * @returns 驗證結果（true: 格式正確且檢查碼通過，false: 不合法）
 *
 * @example
 * ```ts
 * validateTaiwanIdNumber('A123456789') // true
 * validateTaiwanIdNumber('A123456788') // false (檢查碼錯誤)
 * validateTaiwanIdNumber('123456789') // false (格式錯誤)
 * ```
 */
export function validateTaiwanIdNumber(idNumber: string): boolean {
  // 統一轉換為大寫以支援小寫字母
  const normalizedId = idNumber.toUpperCase()

  // 1. 格式驗證：2碼英文 + 8碼數字，共10碼
  const format = /^[A-Z]{2}\d{8}$/
  if (!format.test(normalizedId)) {
    return false
  }

  // 2. 英文字母對應數字表
  const letterMap: Record<string, number> = {
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
    G: 16,
    H: 17,
    I: 34,
    J: 18,
    K: 19,
    L: 20,
    M: 21,
    N: 22,
    O: 35,
    P: 23,
    Q: 24,
    R: 25,
    S: 26,
    T: 27,
    U: 28,
    V: 29,
    W: 32,
    X: 30,
    Y: 31,
    Z: 33
  }

  // 3. 將第一碼英文轉換為數字
  const firstLetter = normalizedId[0]
  const firstNumber = letterMap[firstLetter]
  if (!firstNumber) {
    return false
  }

  // 4. 將第二碼英文轉換為數字（僅取個位數）
  const secondLetter = normalizedId[1]
  const secondNumber = letterMap[secondLetter] % 10

  // 5. 建立完整數字陣列
  const digits = [
    Math.floor(firstNumber / 10), // 第一碼英文的十位數
    firstNumber % 10, // 第一碼英文的個位數
    secondNumber, // 第二碼英文的個位數
    ...normalizedId.slice(2).split("").map(Number) // 後8碼數字
  ]

  // 6. 權重陣列
  const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1]

  // 7. 計算加權總和
  const sum = digits.reduce((acc, digit, index) => {
    return acc + digit * weights[index]
  }, 0)

  // 8. 檢查碼驗證：加權總和必須為 10 的倍數
  return sum % 10 === 0
}

/**
 * 格式化身分證字號（顯示部分隱碼）
 *
 * @param idNumber - 身分證字號
 * @returns 格式化後的字號（前3碼 + **** + 後3碼），短字串直接返回
 *
 * @example
 * ```ts
 * maskIdNumber('A123456789') // 'A12****789'
 * maskIdNumber('ABC') // 'ABC'
 * maskIdNumber('') // ''
 * ```
 */
export function maskIdNumber(idNumber: string): string {
  // 處理 null、undefined 或空字串
  if (!idNumber) {
    return ""
  }

  // 短字串直接返回
  if (idNumber.length <= 6) {
    return idNumber
  }

  // 前3碼 + 4個星號 + 後3碼
  return `${idNumber.slice(0, 3)}****${idNumber.slice(-3)}`
}
