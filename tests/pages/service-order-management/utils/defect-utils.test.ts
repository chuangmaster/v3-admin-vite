/**
 * 瑕疵欄位工具函式單元測試
 * 測試瑕疵代碼轉換與格式化功能
 */
import { describe, expect, it } from "vitest"
import { DEFECT_OPTIONS } from "@/pages/service-order-management/types"

/**
 * 取得瑕疵標籤（從 detail.vue / create.vue 擷取的邏輯）
 */
function getDefectLabel(value: string): string {
  return DEFECT_OPTIONS.find(opt => opt.value === value)?.label || value
}

/**
 * 格式化瑕疵資訊為 Excel 顯示文字
 */
function formatDefectsForExcel(defects?: string[]): string {
  if (!defects || defects.length === 0) return "無"
  return defects.map(code => getDefectLabel(code)).join("、")
}

describe("瑕疵欄位工具函式", () => {
  describe("getDefectLabel", () => {
    it("應正確轉換 hardwareRustScratchLoss 為「五金生鏽/刮痕/掉」", () => {
      expect(getDefectLabel("hardwareRustScratchLoss")).toBe("五金生鏽/刮痕/掉")
    })

    it("應正確轉換 leatherWearScratchDent 為「皮質磨損/刮痕/壓痕」", () => {
      expect(getDefectLabel("leatherWearScratchDent")).toBe("皮質磨損/刮痕/壓痕")
    })

    it("應正確轉換 liningDirty 為「內裡髒污」", () => {
      expect(getDefectLabel("liningDirty")).toBe("內裡髒污")
    })

    it("應正確轉換 cornerWear 為「四角磨損」", () => {
      expect(getDefectLabel("cornerWear")).toBe("四角磨損")
    })

    it("應處理無效代碼，回傳原始代碼", () => {
      expect(getDefectLabel("invalidCode")).toBe("invalidCode")
    })

    it("應處理空字串", () => {
      expect(getDefectLabel("")).toBe("")
    })
  })

  describe("formatDefectsForExcel", () => {
    it("應正確格式化單一瑕疵", () => {
      expect(formatDefectsForExcel(["hardwareRustScratchLoss"])).toBe("五金生鏽/刮痕/掉")
    })

    it("應正確格式化多個瑕疵（頓號分隔）", () => {
      expect(formatDefectsForExcel(["hardwareRustScratchLoss", "liningDirty"]))
        .toBe("五金生鏽/刮痕/掉、內裡髒污")
    })

    it("應正確格式化所有四種瑕疵", () => {
      const allDefects = [
        "hardwareRustScratchLoss",
        "leatherWearScratchDent",
        "liningDirty",
        "cornerWear"
      ]
      expect(formatDefectsForExcel(allDefects))
        .toBe("五金生鏽/刮痕/掉、皮質磨損/刮痕/壓痕、內裡髒污、四角磨損")
    })

    it("應處理空陣列，回傳「無」", () => {
      expect(formatDefectsForExcel([])).toBe("無")
    })

    it("應處理 undefined，回傳「無」", () => {
      expect(formatDefectsForExcel(undefined)).toBe("無")
    })

    it("應處理混合有效與無效代碼", () => {
      expect(formatDefectsForExcel(["hardwareRustScratchLoss", "unknownCode"]))
        .toBe("五金生鏽/刮痕/掉、unknownCode")
    })
  })

  describe("dEFECT_OPTIONS 常數", () => {
    it("應包含正確數量的選項（4 個）", () => {
      expect(DEFECT_OPTIONS.length).toBe(4)
    })

    it("每個選項應包含 label 和 value 屬性", () => {
      DEFECT_OPTIONS.forEach((option) => {
        expect(option).toHaveProperty("label")
        expect(option).toHaveProperty("value")
        expect(typeof option.label).toBe("string")
        expect(typeof option.value).toBe("string")
      })
    })

    it("應包含所有預期的瑕疵代碼", () => {
      const expectedCodes = [
        "hardwareRustScratchLoss",
        "leatherWearScratchDent",
        "liningDirty",
        "cornerWear"
      ]
      const actualCodes = DEFECT_OPTIONS.map(opt => opt.value)
      expect(actualCodes).toEqual(expectedCodes)
    })
  })
})
