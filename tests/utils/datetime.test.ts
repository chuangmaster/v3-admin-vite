import { toUTC0ISOString } from "@@/utils/datetime"
import { describe, expect, it } from "vitest"

describe("toUTC0ISOString", () => {
  it("should convert date string to UTC+0 ISO string with start of day", () => {
    const dateString = "2024-01-15"
    const result = toUTC0ISOString(dateString, false)

    // 應該是 UTC+0 的開始時間 (00:00:00)
    expect(result).toBe("2024-01-15T00:00:00.000Z")
  })

  it("should convert date string to UTC+0 ISO string with end of day", () => {
    const dateString = "2024-01-15"
    const result = toUTC0ISOString(dateString, true)

    // 應該是 UTC+0 的結束時間 (23:59:59)
    expect(result).toBe("2024-01-15T23:59:59.000Z")
  })

  it("should handle different date formats correctly", () => {
    const dateString = "2024-12-31"

    const startResult = toUTC0ISOString(dateString, false)
    const endResult = toUTC0ISOString(dateString, true)

    expect(startResult).toBe("2024-12-31T00:00:00.000Z")
    expect(endResult).toBe("2024-12-31T23:59:59.000Z")
  })

  it("should maintain UTC+0 timezone regardless of local timezone", () => {
    // 測試在不同時區下,輸出都應該是 UTC+0
    const dateString = "2024-06-15"
    const result = toUTC0ISOString(dateString, false)

    // 檢查結果是否以 Z 結尾 (表示 UTC+0)
    expect(result).toMatch(/Z$/)
    expect(result).toBe("2024-06-15T00:00:00.000Z")
  })
})
