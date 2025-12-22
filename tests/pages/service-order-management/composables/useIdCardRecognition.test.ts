import type { OCRIDCardResponse } from "@/pages/service-order-management/types"
/**
 * useIdCardRecognition 組合式函式測試
 */
import { flushPromises } from "@vue/test-utils"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import * as ocrApi from "@/pages/service-order-management/apis/ocr"
import { useIdCardRecognition } from "@/pages/service-order-management/composables/useIdCardRecognition"

// Mock API
vi.mock("@/pages/service-order-management/apis/ocr")

// Mock Element Plus globals
vi.stubGlobal("ElMessage", {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
})

vi.stubGlobal("ElMessageBox", {
  confirm: vi.fn()
})

describe("useIdCardRecognition", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset ElMessageBox mock for each test
    vi.mocked(ElMessageBox.confirm).mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("應該成功辨識身分證", async () => {
    // Arrange
    const mockFile = new File(["test"], "id-card.jpg", { type: "image/jpeg" })
    const mockResult: OCRIDCardResponse = {
      name: "王小明",
      idCardNumber: "A123456789",
      confidence: 0.95
    }

    vi.mocked(ocrApi.recognizeIDCard).mockResolvedValue({
      success: true,
      code: "SUCCESS",
      message: "辨識成功",
      data: mockResult,
      timestamp: "2025-01-01T00:00:00Z",
      traceId: "test-trace-id"
    })

    // Act
    const { recognize, recognitionResult, recognizing } = useIdCardRecognition()
    await recognize(mockFile)
    await flushPromises()

    // Assert
    expect(recognizing.value).toBe(false)
    expect(recognitionResult.value).toEqual(mockResult)
    expect(ocrApi.recognizeIDCard).toHaveBeenCalled()
  })

  it("應該在辨識失敗時重試（最多 3 次）", async () => {
    // Arrange
    const mockFile = new File(["test"], "id-card.jpg", { type: "image/jpeg" })

    // Mock confirm 返回 true 以重試
    vi.mocked(ElMessageBox.confirm).mockResolvedValue("confirm" as any)

    // 前兩次失敗，第三次成功
    vi.mocked(ocrApi.recognizeIDCard)
      .mockRejectedValueOnce(new Error("Network error"))
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({
        success: true,
        code: "SUCCESS",
        message: "辨識成功",
        data: {
          name: "王小明",
          idCardNumber: "A123456789",
          confidence: 0.9
        },
        timestamp: "2025-01-01T00:00:00Z",
        traceId: "test-trace-id"
      })

    // Act
    const { recognize, recognitionResult } = useIdCardRecognition()
    await recognize(mockFile)
    await flushPromises()

    // Assert
    expect(ocrApi.recognizeIDCard).toHaveBeenCalledTimes(3)
    expect(recognitionResult.value).toBeTruthy()
    expect(recognitionResult.value?.name).toBe("王小明")
  })

  it("應該在重試 3 次後仍失敗時顯示錯誤", async () => {
    // Arrange
    const mockFile = new File(["test"], "id-card.jpg", { type: "image/jpeg" })

    // Mock confirm 返回 true 以重試
    vi.mocked(ElMessageBox.confirm).mockResolvedValue("confirm" as any)

    vi.mocked(ocrApi.recognizeIDCard).mockRejectedValue(new Error("Network error"))

    // Act
    const { recognize, recognitionResult } = useIdCardRecognition()
    await recognize(mockFile)
    await flushPromises()

    // Assert
    expect(ocrApi.recognizeIDCard).toHaveBeenCalledTimes(3)
    expect(recognitionResult.value).toBeUndefined()
  })

  it("應該清除辨識結果", () => {
    // Arrange
    const { recognitionResult, clearResult } = useIdCardRecognition()
    recognitionResult.value = {
      name: "王小明",
      idCardNumber: "A123456789"
    }

    // Act
    clearResult()

    // Assert
    expect(recognitionResult.value).toBeUndefined()
  })
})
