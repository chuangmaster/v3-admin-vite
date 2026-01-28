/**
 * 台灣身分證字號驗證器 單元測試
 */
import { describe, expect, it } from "vitest"
import { maskIdNumber, validateTaiwanIdNumber } from "@/common/utils/id-number-validator"

describe("id-number-validator", () => {
  describe("validateTaiwanIdNumber", () => {
    it("應該驗證有效的台灣身分證字號", () => {
      // 有效的身分證字號範例
      expect(validateTaiwanIdNumber("A123456789")).toBe(true)
      expect(validateTaiwanIdNumber("B234567890")).toBe(true)
      expect(validateTaiwanIdNumber("Z199999990")).toBe(true)
    })

    it("應該拒絕無效的身分證字號格式", () => {
      // 長度不對
      expect(validateTaiwanIdNumber("A12345678")).toBe(false)
      expect(validateTaiwanIdNumber("A12345678901")).toBe(false)

      // 格式錯誤
      expect(validateTaiwanIdNumber("1123456789")).toBe(false)
      expect(validateTaiwanIdNumber("ABCDEFGHIJ")).toBe(false)

      // 空字串
      expect(validateTaiwanIdNumber("")).toBe(false)
    })

    it("應該拒絕檢查碼錯誤的身分證字號", () => {
      // 檢查碼錯誤
      expect(validateTaiwanIdNumber("A123456788")).toBe(false)
      expect(validateTaiwanIdNumber("B234567891")).toBe(false)
    })

    it("應該支援小寫字母", () => {
      expect(validateTaiwanIdNumber("a123456789")).toBe(true)
      expect(validateTaiwanIdNumber("b234567890")).toBe(true)
    })
  })

  describe("maskIdNumber", () => {
    it("應該遮罩身分證字號中間6碼", () => {
      expect(maskIdNumber("A123456789")).toBe("A12****789")
      expect(maskIdNumber("B234567890")).toBe("B23****890")
    })

    it("應該處理短字串", () => {
      expect(maskIdNumber("A12")).toBe("A12")
      expect(maskIdNumber("ABC")).toBe("ABC")
    })

    it("應該處理空字串", () => {
      expect(maskIdNumber("")).toBe("")
    })

    it("應該處理 null 和 undefined", () => {
      expect(maskIdNumber(null as any)).toBe("")
      expect(maskIdNumber(undefined as any)).toBe("")
    })
  })
})
