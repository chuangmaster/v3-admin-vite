/**
 * 密碼修改組合式函式
 * @module pages/profile/composables/useChangePassword
 * @description 管理密碼修改表單的狀態、驗證與提交邏輯
 */
import type { FormInstance, FormRules } from "element-plus"
import type { ChangePasswordFormData } from "../types"
import { API_CODE_CONCURRENT_UPDATE_CONFLICT } from "@@/constants/api-code"
import { ElMessage } from "element-plus"
import { reactive, ref } from "vue"
import { changePassword } from "@/pages/user-management/apis/user"

/** 密碼修改表單事件定義 */
interface ChangePasswordEmits {
  /** 密碼修改成功 */
  (e: "password-changed"): void
  /** 需要重新載入用戶資料（併發衝突時觸發） */
  (e: "refresh-required"): void
}

/**
 * 密碼修改表單組合式函式
 * @param emit - 事件發射器
 * @returns 表單狀態與操作方法
 */
export function useChangePasswordForm(emit: ChangePasswordEmits) {
  /** 表單實例引用 */
  const formRef = ref<FormInstance>()
  /** 提交中狀態 */
  const submitting = ref(false)

  /** 表單資料 */
  const formData = reactive<ChangePasswordFormData>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  /**
   * 驗證確認密碼是否與新密碼一致
   */
  const validateConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void): void => {
    if (!value) {
      callback(new Error("請再次輸入新密碼"))
    } else if (value !== formData.newPassword) {
      callback(new Error("兩次輸入的密碼不一致"))
    } else {
      callback()
    }
  }

  /**
   * 驗證密碼必須至少 8 字元，包含大小寫字母與數字
   */
  const passwordValidator = (_rule: unknown, value: string, callback: (error?: Error) => void): void => {
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

  /** 表單驗證規則 */
  const rules: FormRules<ChangePasswordFormData> = {
    oldPassword: [
      { required: true, message: "請輸入舊密碼", trigger: "blur" },
      { min: 8, message: "密碼至少需要 8 字元", trigger: "blur" }
    ],
    newPassword: [
      { required: true, message: "請輸入新密碼", trigger: "blur" },
      { validator: passwordValidator, trigger: "blur" }
    ],
    confirmPassword: [
      { required: true, message: "請再次輸入新密碼", trigger: "blur" },
      { validator: validateConfirmPassword, trigger: "blur" }
    ]
  }

  /**
   * 驗證表單
   * @returns 驗證結果
   */
  const validateForm = async (): Promise<boolean> => {
    if (!formRef.value) return false
    return formRef.value.validate().catch(() => false)
  }

  /**
   * 提交表單
   * @param userId - 用戶 ID
   * @param version - 資料版本號（用於併發控制）
   */
  const handleSubmit = async (userId: string, version: number): Promise<void> => {
    const isValid = await validateForm()
    if (!isValid) return

    submitting.value = true
    try {
      const response = await changePassword(userId, {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
        version
      })

      if (response.success) {
        ElMessage.success("密碼修改成功")
        handleReset()
        emit("password-changed")
      } else {
        ElMessage.error(response.message || "密碼修改失敗")
      }
    } catch (err: unknown) {
      handleApiError(err)
    } finally {
      submitting.value = false
    }
  }

  /**
   * 處理 API 錯誤
   * @param err - 錯誤物件
   * @remarks 對於 VALIDATION_ERROR 錯誤（如舊密碼錯誤），axios 攔截器不會顯示全局錯誤訊息，由此函式負責顯示友好的錯誤提示
   */
  const handleApiError = (err: unknown): void => {
    const error = err as { response?: { status?: number, data?: { code?: string, message?: string } } }
    const status = error.response?.status
    const code = error.response?.data?.code

    if (status === 409 && code === API_CODE_CONCURRENT_UPDATE_CONFLICT) {
      ElMessage.error("資料已被其他操作修改，請重新整理後再試")
      emit("refresh-required")
    } else if (status === 400 && code === "INVALID_OLD_PASSWORD") {
      ElMessage.error("舊密碼不正確，請重新輸入")
    } else if (status === 400 && code === "VALIDATION_ERROR") {
      // 顯示後端返回的驗證錯誤訊息（可能是舊密碼錯誤或密碼格式錯誤）
      const message = error.response?.data?.message || "輸入資料驗證錯誤"
      ElMessage.error(message)
    } else if (status === 400) {
      const message = error.response?.data?.message || "輸入資料格式錯誤"
      ElMessage.error(message)
    } else {
      console.error("密碼修改失敗:", err)
      ElMessage.error("密碼修改失敗，請稍後再試")
    }
  }

  /**
   * 重置表單
   */
  const handleReset = (): void => {
    formRef.value?.resetFields()
  }

  return {
    formRef,
    formData,
    rules,
    submitting,
    handleSubmit,
    handleReset
  }
}
