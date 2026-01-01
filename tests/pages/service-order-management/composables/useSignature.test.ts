/**
 * useSignature 組合式函式測試
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useSignature } from "@/pages/service-order-management/composables/useSignature"

// Mock signature API
vi.mock("@/pages/service-order-management/apis/signature")

describe("useSignature", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("應該儲存簽名成功", async () => {
    // Arrange
    const mockResponseData = {
      id: "sig-123",
      serviceOrderId: "order-123",
      signatureRecordId: "sig-record-123",
      attachmentId: "attachment-123"
    }

    const signatureApi = await import("@/pages/service-order-management/apis/signature")
    vi.mocked(signatureApi.saveOfflineSignature).mockResolvedValue({
      success: true,
      code: "SUCCESS",
      message: "儲存成功",
      data: mockResponseData,
      timestamp: "2025-01-01T00:00:00Z",
      traceId: "test-trace-id"
    })

    // Act
    const { saveSignature } = useSignature()
    const result = await saveSignature("order-123", "sig-record-123", "data:image/png;base64,abc", "客戶")

    // Assert
    expect(result).toBe(true)
    expect(signatureApi.saveOfflineSignature).toHaveBeenCalledWith("order-123", {
      signatureRecordId: "sig-record-123",
      signatureData: "data:image/png;base64,abc",
      signerName: "客戶"
    })
  })

  it("應該處理儲存簽名失敗", async () => {
    // Arrange
    const signatureApi = await import("@/pages/service-order-management/apis/signature")
    vi.mocked(signatureApi.saveOfflineSignature).mockResolvedValue({
      success: false,
      code: "ERROR",
      message: "儲存失敗",
      data: null,
      timestamp: "2025-01-01T00:00:00Z",
      traceId: "test-trace-id"
    })

    // Act
    const { saveSignature } = useSignature()
    const result = await saveSignature("order-123", "sig-record-123", "data:image/png;base64,abc", "客戶")

    // Assert
    expect(result).toBe(false)
  })

  it("應該清除簽名記錄", () => {
    // Arrange
    const { signatureRecord, clearSignature } = useSignature()
    signatureRecord.value = {
      id: "sig-123",
      serviceOrderId: "order-123",
      documentType: "BUYBACK_CONTRACT" as any,
      signatureMethod: "OFFLINE" as any,
      signerName: "客戶",
      signedAt: "2025-01-01T00:00:00Z"
    }

    // Act
    clearSignature()

    // Assert
    expect(signatureRecord.value).toBeUndefined()
  })

  it("應該在 loading 時顯示載入狀態", async () => {
    // Arrange
    const signatureApi = await import("@/pages/service-order-management/apis/signature")
    vi.mocked(signatureApi.saveOfflineSignature).mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                success: true,
                code: "SUCCESS",
                message: "儲存成功",
                data: {} as any,
                timestamp: "2025-01-01T00:00:00Z",
                traceId: "test-trace-id"
              }),
            100
          )
        )
    )

    // Act
    const { saveSignature, loading } = useSignature()
    const promise = saveSignature("order-123", "sig-record-123", "data:image/png;base64,abc", "客戶")

    // Assert - loading 應該為 true
    expect(loading.value).toBe(true)

    await promise

    // Assert - 完成後 loading 應該為 false
    expect(loading.value).toBe(false)
  })
})
