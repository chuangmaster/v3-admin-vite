/**
 * 變更密碼表單組合式函式
 * 處理用戶密碼修改表單、驗證規則
 * @module @/pages/user-management/composables/useChangePasswordForm
 */

import type { FormInstance, FormRules } from "element-plus"
import type { ResetPasswordRequest } from "../types"
import { API_CODE_CONCURRENT_UPDATE_CONFLICT } from "@@/constants/api-code"
import { ElMessage } from "element-plus"
import { reactive, ref } from "vue"
import { resetPassword } from "../apis/user"

/** 表單數據類型 */
interface PasswordFormData {
  /** 新密碼 */
  newPassword: string
  /** 確認新密碼 */
  confirmPassword: string
  /** 待修改的用戶 ID */
  userId?: string
  /** 資料版本號 */
  version: number
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
   * 提交表單（管理者重設密碼）
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

      const response = await resetPassword(formData.userId, {
        newPassword: formData.newPassword,
        version: formData.version
      } as ResetPasswordRequest)

      if (response.success) {
        ElMessage.success("密碼重設成功")
        return true
      }

      // 檢查是否為並發更新衝突 (409)
      if (response.code === API_CODE_CONCURRENT_UPDATE_CONFLICT) {
        ElMessage.error("資料已被其他使用者更新，請重新載入後再試")
        return false
      }

      return false
    } catch (error: any) {
      // 捕獲任何異常
      const status = error?.response?.status
      const code = error?.response?.data?.code

      if (status === 409 && code === API_CODE_CONCURRENT_UPDATE_CONFLICT) {
        ElMessage.error("資料已被其他操作修改，請重新整理後再試")
      } else if (status === 403) {
        ElMessage.error("您沒有權限執行此操作")
      } else if (status === 404) {
        ElMessage.error("找不到指定的用戶")
      } else if (status === 400) {
        const message = error?.response?.data?.message || "輸入資料格式錯誤"
        ElMessage.error(message)
      } else {
        console.error("密碼重設失敗:", error)
        ElMessage.error("密碼重設失敗，請稍後再試")
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
