/**
 * 變更密碼表單組合式函式
 * 處理用戶密碼修改表單、驗證規則
 * @module @/pages/user-management/composables/useChangePasswordForm
 */

import type { FormInstance, FormRules } from "element-plus"
import type { ChangePasswordRequest } from "../types"
import { API_CODE_CONCURRENT_UPDATE_CONFLICT } from "@@/constants/api-code"
import { ElMessage } from "element-plus"
import { reactive, ref } from "vue"
import { changePassword } from "../apis/user"

/** 表單數據類型 */
interface PasswordFormData extends ChangePasswordRequest {
  /** 確認新密碼 */
  confirmPassword: string
  /** 待修改的用戶 ID */
  userId?: string
}

/**
 * 變更密碼表單組合式函式
 * @returns 表單狀態、規則、操作方法
 * @example
 * ```typescript
 * const { formRef, formData, formLoading, rules, submitForm, resetForm, setUserId }
 *   = useChangePasswordForm()
 * ```
 */
export function useChangePasswordForm() {
  /** 表單 ref */
  const formRef = ref<FormInstance>()

  /** 表單提交載入狀態 */
  const formLoading = ref(false)

  /** 表單資料 */
  const formData = reactive<PasswordFormData>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    userId: undefined,
    version: 0
  })

  /**
   * 密碼驗證函式
   * 驗證密碼必須至少 8 字元，包含大小寫字母與數字
   */
  const passwordValidator = (_rule: any, value: string, callback: any) => {
    if (!value) {
      callback(new Error("請輸入密碼"))
    } else if (value.length < 8) {
      callback(new Error("密碼至少需要 8 字元"))
    } else if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
      callback(new Error("密碼必須包含大小寫字母和數字"))
    } else {
      callback()
    }
  }

  /**
   * 確認密碼驗證函式
   */
  const confirmPasswordValidator = (_rule: any, value: string, callback: any) => {
    if (!value) {
      callback(new Error("請確認新密碼"))
    } else if (value !== formData.newPassword) {
      callback(new Error("兩次輸入的密碼不一致"))
    } else {
      callback()
    }
  }

  /** 表單驗證規則 */
  const rules: FormRules = {
    oldPassword: [
      { required: true, message: "請輸入舊密碼", trigger: "blur" },
      { min: 8, message: "密碼至少需要 8 字元", trigger: "blur" }
    ],
    newPassword: [
      { required: true, message: "請輸入新密碼", trigger: "blur" },
      { validator: passwordValidator, trigger: "blur" }
    ],
    confirmPassword: [
      { required: true, message: "請確認新密碼", trigger: "blur" },
      { validator: confirmPasswordValidator, trigger: "blur" }
    ]
  }

  /**
   * 提交表單（變更密碼）
   * @returns 成功返回 true，失敗返回 false
   */
  async function submitForm(): Promise<boolean> {
    if (!formRef.value) return false

    try {
      await formRef.value.validate()

      if (!formData.userId) {
        ElMessage.error("用戶 ID 未設定")
        return false
      }

      formLoading.value = true

      const response = await changePassword(formData.userId, {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
        version: formData.version
      } as ChangePasswordRequest)

      if (response.success) {
        ElMessage.success("密碼修改成功")
        return true
      }

      // 檢查是否為並發更新衝突 (409)
      if (response.code === API_CODE_CONCURRENT_UPDATE_CONFLICT) {
        ElMessage.error("資料已被其他使用者更新，請重新載入後再試")
        return false
      }

      return false
    } catch (error) {
      // 捕獲任何異常（包括 409 衝突等其他 HTTP 錯誤）
      const errorMessage = error instanceof Error ? error.message : "提交失敗"
      if (!errorMessage.includes("資料已被其他使用者更新")) {
        ElMessage.error(errorMessage)
      }
      return false
    } finally {
      formLoading.value = false
    }
  }

  /**
   * 重置表單
   */
  function resetForm(): void {
    formRef.value?.resetFields()
    formData.userId = undefined
  }

  /**
   * 設定要修改密碼的用戶 ID 與版本號
   * @param userId - 用戶 ID
   * @param version - 資料版本號（用於併發控制）
   */
  function setUserId(userId: string, version: number): void {
    formData.userId = userId
    formData.version = version
  }

  return {
    formRef,
    formData,
    formLoading,
    rules,
    submitForm,
    resetForm,
    setUserId
  }
}
