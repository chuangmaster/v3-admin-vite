/**
 * 收件方式驗證 Composable
 *
 * @module order-management/composables/useDeliveryValidation
 * @description 提供依收件方式動態切換驗證規則、自動載入預設運費
 */

import type { FormRules } from "element-plus"
import { computed, ref, watch } from "vue"
import { DeliveryMethod, SHIPPING_FEE_CONFIG } from "@/pages/order-management/types"

export function useDeliveryValidation() {
  /** 當前選擇的收件方式 */
  const deliveryMethod = ref<DeliveryMethod>(DeliveryMethod.PICKUP)

  /** 運費 */
  const shippingFee = ref<number>(0)

  /**
   * 依收件方式動態產生收件資訊驗證規則
   */
  const deliveryInfoRules = computed<FormRules>(() => {
    switch (deliveryMethod.value) {
      case DeliveryMethod.PICKUP:
        return {
          "deliveryInfo.pickupLocation": [
            { required: true, message: "請輸入自取地點", trigger: "blur" },
            { min: 1, max: 200, message: "自取地點長度為 1-200 字元", trigger: "blur" }
          ],
          "deliveryInfo.pickupTime": [
            { required: true, message: "請選擇自取時間", trigger: "change" }
          ]
        }

      case DeliveryMethod.HOME_DELIVERY:
        return {
          "deliveryInfo.recipientName": [
            { required: true, message: "請輸入收件人姓名", trigger: "blur" },
            { min: 1, max: 50, message: "收件人姓名長度為 1-50 字元", trigger: "blur" }
          ],
          "deliveryInfo.recipientPhone": [
            { required: true, message: "請輸入收件人電話", trigger: "blur" },
            { pattern: /^09\d{8}$/, message: "請輸入正確的台灣手機號碼（09 開頭,共 10 碼）", trigger: "blur" }
          ],
          "deliveryInfo.recipientAddress": [
            { required: true, message: "請輸入收件地址", trigger: "blur" },
            { min: 10, max: 200, message: "收件地址長度為 10-200 字元", trigger: "blur" }
          ]
        }

      case DeliveryMethod.STORE_PICKUP:
        return {
          "deliveryInfo.storeInfo": [
            { required: true, message: "請輸入超商門市資訊", trigger: "blur" },
            { min: 1, max: 200, message: "超商門市資訊長度為 1-200 字元", trigger: "blur" }
          ],
          "deliveryInfo.recipientName": [
            { required: true, message: "請輸入取貨人姓名", trigger: "blur" },
            { min: 1, max: 50, message: "取貨人姓名長度為 1-50 字元", trigger: "blur" }
          ],
          "deliveryInfo.recipientPhone": [
            { required: true, message: "請輸入取貨人電話", trigger: "blur" },
            { pattern: /^09\d{8}$/, message: "請輸入正確的台灣手機號碼（09 開頭,共 10 碼）", trigger: "blur" }
          ]
        }

      case DeliveryMethod.PLATFORM:
        return {}

      default:
        return {}
    }
  })

  /**
   * 收件方式變更時自動設定預設運費
   */
  watch(deliveryMethod, (newMethod) => {
    shippingFee.value = SHIPPING_FEE_CONFIG[newMethod] ?? 0
  })

  /**
   * 取得指定收件方式的預設收件資訊物件
   * @param method - 收件方式
   */
  function getDefaultDeliveryInfo(method: DeliveryMethod): Record<string, string> {
    switch (method) {
      case DeliveryMethod.PICKUP:
        return {
          type: "PICKUP",
          pickupLocation: "",
          pickupTime: ""
        }

      case DeliveryMethod.HOME_DELIVERY:
        return {
          type: "HOME_DELIVERY",
          recipientName: "",
          recipientPhone: "",
          recipientAddress: ""
        }

      case DeliveryMethod.STORE_PICKUP:
        return {
          type: "STORE_PICKUP",
          storeInfo: "",
          recipientName: "",
          recipientPhone: ""
        }

      case DeliveryMethod.PLATFORM:
        return {
          type: "PLATFORM"
        }

      default:
        return { type: "PICKUP" }
    }
  }

  /**
   * 是否需要填寫收件資訊（平台物流不需要額外欄位）
   */
  const requiresDeliveryFields = computed(() => {
    return deliveryMethod.value !== DeliveryMethod.PLATFORM
  })

  /**
   * 重置收件方式狀態
   */
  function resetDeliveryValidation() {
    deliveryMethod.value = DeliveryMethod.PICKUP
    shippingFee.value = 0
  }

  return {
    deliveryMethod,
    shippingFee,
    deliveryInfoRules,
    requiresDeliveryFields,
    getDefaultDeliveryInfo,
    resetDeliveryValidation
  }
}
