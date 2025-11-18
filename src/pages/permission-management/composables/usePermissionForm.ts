/**
 * 權限表單組合式函式
 * 處理表單狀態、驗證與提交邏輯
 * @module @/pages/permission-management/composables/usePermissionForm
 */

import type {
  CreatePermissionDto,
  Permission,
  UpdatePermissionDto
} from "../types"
import { ElMessage } from "element-plus"
import { ref } from "vue"
import * as permissionApi from "../apis/permission"

type UsePermissionFormEmit = ((evt: "success") => void)
  & ((evt: "close") => void)
  & ((evt: "conflict") => void)

/**
 * 權限表單組合式函式
 * @param emit - Vue 元件的 emit 函式
 * @returns 表單狀態與操作方法
 */
export function usePermissionForm(emit: UsePermissionFormEmit) {
  /** 表單資料 */
  const formData = ref<CreatePermissionDto>({
    name: "",
    code: "",
    description: ""
  })

  /** 當前權限 ID（編輯模式使用） */
  const currentPermissionId = ref<string>("")

  /** 當前版本號（編輯模式用於樂觀鎖定） */
  const currentVersion = ref(1)

  /** 是否為編輯模式 */
  const isEditMode = ref(false)

  /** 表單載入狀態 */
  const loading = ref(false)

  /**
   * 重置表單
   */
  function resetForm(): void {
    formData.value = {
      name: "",
      code: "",
      description: ""
    }
    currentPermissionId.value = ""
    currentVersion.value = 1
    isEditMode.value = false
  }

  /**
   * 載入權限資料到表單（編輯模式）
   */
  function loadPermission(permission: Permission): void {
    isEditMode.value = true
    currentPermissionId.value = permission.id
    currentVersion.value = permission.version
    formData.value = {
      name: permission.name,
      code: permission.code,
      description: permission.description || ""
    }
  }

  /**
   * 提交表單
   */
  async function handleSubmit(): Promise<void> {
    // 驗證表單資料
    if (!formData.value.name.trim()) {
      ElMessage.error("請輸入權限名稱")
      return
    }

    if (!formData.value.code.trim()) {
      ElMessage.error("請輸入權限代碼")
      return
    }

    // 驗證權限代碼格式
    const codePattern = /^\w+:\w+(?::\w+)?$/
    if (!codePattern.test(formData.value.code)) {
      ElMessage.error("權限代碼格式不正確（格式：module:action，最多三層）")
      return
    }

    loading.value = true
    try {
      if (isEditMode.value) {
        // 編輯模式
        const updateData: UpdatePermissionDto = {
          ...formData.value,
          version: currentVersion.value
        }
        const response = await permissionApi.updatePermission(
          currentPermissionId.value,
          updateData
        )

        if (response.success) {
          ElMessage.success("權限更新成功")
          emit("success")
        } else if (response.code === "CONCURRENT_UPDATE_CONFLICT") {
          ElMessage.error("資料已被其他使用者修改，請重新載入")
          emit("conflict")
        } else if (response.code === "SYSTEM_PERMISSION_PROTECTED") {
          ElMessage.error("系統內建權限無法修改")
        } else if (response.code === "DUPLICATE_CODE") {
          ElMessage.error(response.message || "權限代碼已存在")
        } else {
          ElMessage.error(response.message || "更新失敗")
        }
      } else {
        // 新增模式
        const createData: CreatePermissionDto = formData.value
        const response = await permissionApi.createPermission(createData)

        if (response.success) {
          ElMessage.success("權限建立成功")
          resetForm()
          emit("success")
        } else if (response.code === "DUPLICATE_CODE") {
          ElMessage.error(response.message || "權限代碼已存在")
        } else {
          ElMessage.error(response.message || "建立失敗")
        }
      }
    } catch {
      ElMessage.error(isEditMode.value ? "更新權限失敗" : "建立權限失敗")
    } finally {
      loading.value = false
    }
  }

  /**
   * 處理取消
   */
  function handleCancel(): void {
    resetForm()
    emit("close")
  }

  return {
    formData,
    isEditMode,
    loading,
    resetForm,
    loadPermission,
    handleSubmit,
    handleCancel
  }
}
