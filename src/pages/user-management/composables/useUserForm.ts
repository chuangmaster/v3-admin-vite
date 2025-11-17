/**
 * 用戶表單組合式函式
 * 處理新增/編輯用戶表單、驗證規則
 * @module @/pages/user-management/composables/useUserForm
 */

import type { FormInstance, FormRules } from "element-plus"
import type { CreateUserRequest, UpdateUserRequest, User } from "../types"
import { API_CODE_CONCURRENT_UPDATE_CONFLICT } from "@@/constants/api-code"
import { ElMessage } from "element-plus"
import { reactive, ref } from "vue"
import { createUser, updateUser } from "../apis/user"

/** 表單數據類型 */
type FormData = CreateUserRequest & {
  /** 編輯模式下用於追蹤原用戶 ID */
  editUserId?: string
  /** 版本號，用於並發控制 */
  version?: number
}

/**
 * 用戶表單組合式函式
 * @returns 表單狀態、規則、操作方法
 * @example
 * ```typescript
 * const { formRef, formData, formLoading, rules, submitForm, resetForm } = useUserForm()
 * ```
 */
export function useUserForm() {
  /** 表單 ref */
  const formRef = ref<FormInstance>()

  /** 表單提交載入狀態 */
  const formLoading = ref(false)

  /** 編輯模式標誌 */
  const isEditMode = ref(false)

  /** 表單資料 */
  const formData = reactive<FormData>({
    username: "",
    password: "",
    displayName: "",
    editUserId: undefined
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

  /** 表單驗證規則 */
  const rules: FormRules = {
    username: [
      { required: true, message: "請輸入用戶名", trigger: "blur" },
      { min: 3, max: 20, message: "用戶名長度為 3-20 字元", trigger: "blur" },
      {
        pattern: /^\w+$/,
        message: "僅允許英數字與底線",
        trigger: "blur"
      }
    ],
    password: [
      {
        validator: (_rule: any, value: string, callback: any) => {
          // 編輯模式下，密碼非必填
          if (isEditMode.value) {
            callback()
            return
          }
          // 新增模式下，執行完整驗證
          passwordValidator(_rule, value, callback)
        },
        trigger: "blur"
      }
    ],
    displayName: [
      { required: true, message: "請輸入顯示名稱", trigger: "blur" },
      { max: 100, message: "顯示名稱最多 100 字元", trigger: "blur" }
    ]
  }

  /**
   * 提交表單（新增或編輯）
   * @returns 成功返回 true，失敗返回 false
   */
  async function submitForm(): Promise<boolean> {
    if (!formRef.value) return false

    try {
      await formRef.value.validate()

      formLoading.value = true

      let response
      if (isEditMode.value && formData.editUserId) {
        // 編輯模式：只提交 displayName
        response = await updateUser(formData.editUserId, {
          displayName: formData.displayName,
          version: formData.version
        } as UpdateUserRequest)
      } else {
        // 新增模式：提交完整表單資料
        response = await createUser(formData as CreateUserRequest)
      }

      if (response.success) {
        return true
      }

      // 檢查是否為並發更新衝突 (409)
      if (response.code === API_CODE_CONCURRENT_UPDATE_CONFLICT) {
        ElMessage.error("資料已被其他使用者更新，請重新載入後再試")
        return false
      }

      return false
    } catch {
      // 捕獲任何異常（包括 409 衝突等其他 HTTP 錯誤）
      // 註：全域的 axios 攔截器已負責顯示錯誤訊息，避免在此重複顯示。
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
    isEditMode.value = false
    formData.editUserId = undefined
  }

  /**
   * 設定編輯模式並預填表單資料
   * @param user - 待編輯的用戶物件
   */
  function setEditMode(user: User): void {
    isEditMode.value = true
    formData.editUserId = user.id
    formData.username = user.username
    formData.displayName = user.displayName
    // 編輯模式下密碼不需要填寫（可選）
    formData.password = ""
    formData.version = user.version
  }

  return {
    formRef,
    formData,
    formLoading,
    isEditMode,
    rules,
    submitForm,
    resetForm,
    setEditMode
  }
}
