/**
 * 角色表單邏輯組合式函式
 * @module @/pages/role-management/composables/useRoleForm
 */

import type { FormInstance, FormRules } from "element-plus"
import type {
  AssignRolePermissionsRequest,
  CreateRoleRequest,
  PermissionTreeNode,
  Role,
  UpdateRoleRequest
} from "../types"
import { ElMessage } from "element-plus"

import { nextTick, ref } from "vue"

import { assignPermissions, createRole, getPermissions, getRoleDetail, removePermission, updateRole } from "../apis/role"
import { usePermissionTree } from "./usePermissionTree"

/**
 * 角色表單邏輯
 * 負責表單驗證、提交、以及權限分配
 * @param onSuccess 表單提交成功的回調函式
 */
export function useRoleForm(onSuccess?: () => void) {
  const formRef = ref<FormInstance>()
  const dialogVisible = ref(false)
  const formLoading = ref(false)
  const isEditMode = ref(false)
  const currentRoleId = ref<string>()
  const permissions = ref<PermissionTreeNode[]>([])
  /** 保存編輯模式下的原始權限 ID，用於計算差異 */
  const originalPermissionIds = ref<string[]>([])

  const { buildPermissionTree } = usePermissionTree()

  /**
   * 設置 formRef - 在 RoleForm 元件掛載後由父層呼叫
   */
  const setFormRef = (ref: FormInstance) => {
    formRef.value = ref
  }

  /**
   * 預載所有權限清單，供 index 頁面在進入時呼叫
   */
  const preloadPermissions = async () => {
    if (permissions.value.length > 0) return
    formLoading.value = true
    try {
      const resp = await getPermissions()
      if (resp.success && resp.data) {
        permissions.value = buildPermissionTree(resp.data)
        console.log("[useRoleForm] permissions preloaded:", permissions.value)
      }
    } catch (e) {
      console.warn("[useRoleForm] preload permissions failed:", e)
    } finally {
      formLoading.value = false
    }
  }

  // 使用 ref 而非 reactive，確保能夠正確追蹤完整對象
  const formData = ref<
    CreateRoleRequest & { version?: number, selectedPermissionIds?: string[] }
  >({
    roleName: "",
    description: "",
    selectedPermissionIds: []
  })

  const rules: FormRules = {
    roleName: [
      { required: true, message: "請輸入角色名稱", trigger: "blur" },
      {
        min: 1,
        max: 100,
        message: "角色名稱長度需介於 1-100 字元",
        trigger: "blur"
      }
    ],
    description: [
      {
        max: 500,
        message: "角色描述最多 500 字元",
        trigger: "blur"
      }
    ]
  }

  /**
   * 開啟新增對話框
   */
  const openCreate = async () => {
    isEditMode.value = false
    resetForm()
    // 若尚未 preload，嘗試載入（fallback）
    if (permissions.value.length === 0) {
      try {
        console.log("[useRoleForm] openCreate - preloading permissions")
        await preloadPermissions()
      } catch (error) {
        console.error("[useRoleForm] openCreate - preload permissions failed:", error)
        ElMessage.warning("無法載入權限清單，請重試")
        return
      }
    }
    dialogVisible.value = true
  }

  /**
   * 開啟編輯對話框
   * @param role 要編輯的角色
   */
  const openEdit = async (role: Role) => {
    isEditMode.value = true
    currentRoleId.value = role.id

    // 重置表單資料，避免殘留舊資料
    resetForm()

    formLoading.value = true
    try {
      console.log("[useRoleForm] openEdit - fetching role details for:", role.id)

      // 若尚未 preload 全部權限，先載入權限清單
      if (permissions.value.length === 0) {
        await preloadPermissions()
      }

      // 獲取角色詳細資訊
      const roleResponse = await getRoleDetail(role.id)
      console.log("[useRoleForm] openEdit - response:", roleResponse)

      if (roleResponse.success && roleResponse.data) {
        formData.value.roleName = roleResponse.data.roleName
        formData.value.description = roleResponse.data.description || ""
        formData.value.version = roleResponse.data.version

        // 提取權限 ID
        const permissionIds = roleResponse.data.permissions.map(p => p.id)
        console.log("[useRoleForm] openEdit - permission ids:", permissionIds)

        // 保存原始權限 ID 用於後續差異比對
        originalPermissionIds.value = [...permissionIds]

        // 先打開對話框
        dialogVisible.value = true
        formLoading.value = false

        // 等待 DOM 更新後再設置選中的權限
        await nextTick()
        formData.value.selectedPermissionIds = permissionIds
        console.log("[useRoleForm] openEdit - selectedPermissionIds set to:", formData.value.selectedPermissionIds)
      } else {
        console.error("[useRoleForm] openEdit - failed:", roleResponse.message)
        ElMessage.error(roleResponse.message || "載入角色資訊失敗")
        formLoading.value = false
      }
    } catch (error) {
      console.error("[useRoleForm] openEdit - error:", error)
      formLoading.value = false
      ElMessage.error("載入角色資訊時發生錯誤")
    }
  }

  /**
   * 提交角色基本資訊
   */
  const submitRole = async () => {
    if (!formRef.value) {
      console.error("[useRoleForm] formRef is not set!")
      ElMessage.error("表單實例未初始化")
      return
    }

    try {
      // 使用 Promise 方式進行表單驗證（僅驗證角色名稱）
      await formRef.value.validateField("roleName")

      formLoading.value = true

      if (isEditMode.value && currentRoleId.value) {
        // 編輯模式：更新角色基本資訊
        const updateData: UpdateRoleRequest = {
          roleName: formData.value.roleName,
          description: formData.value.description,
          version: formData.value.version!
        }
        const response = await updateRole(currentRoleId.value, updateData)
        if (!response.success) {
          ElMessage.error(response.message || "角色更新失敗")
          formLoading.value = false
          return
        }
        // 更新 version
        if (response.data) {
          formData.value.version = response.data.version
        }
        ElMessage.success("角色更新成功")
        onSuccess?.()
      } else {
        // 新增模式：建立新角色
        const createData: CreateRoleRequest = {
          roleName: formData.value.roleName,
          description: formData.value.description
        }
        const response = await createRole(createData)
        if (!response.success) {
          ElMessage.error(response.message || "角色建立失敗")
          formLoading.value = false
          return
        }
        // 保存新建的角色 ID
        currentRoleId.value = response.data!.id
        isEditMode.value = true
        ElMessage.success("角色建立成功")
        onSuccess?.()
      }
    } catch (error) {
      // 驗證失敗，不進行任何操作（Element Plus 會顯示驗證錯誤）
      console.error("[useRoleForm] form validation failed:", error)
    } finally {
      formLoading.value = false
    }
  }

  /**
   * 提交權限
   */
  const submitPermission = async () => {
    if (!currentRoleId.value) {
      ElMessage.error("請先保存角色")
      return
    }

    try {
      formLoading.value = true

      // 計算權限差異
      const currentIds = formData.value.selectedPermissionIds || []
      const addedIds = currentIds.filter(id => !originalPermissionIds.value.includes(id))
      const removedIds = originalPermissionIds.value.filter(id => !currentIds.includes(id))

      console.log("[useRoleForm] submitPermission - permission changes:", {
        original: originalPermissionIds.value,
        current: currentIds,
        added: addedIds,
        removed: removedIds
      })

      // 新增權限（批次）
      if (addedIds.length > 0) {
        const addResponse = await assignPermissions(currentRoleId.value, {
          permissionIds: addedIds
        } as AssignRolePermissionsRequest)
        if (!addResponse.success) {
          ElMessage.error(addResponse.message || "權限新增失敗")
          formLoading.value = false
          return
        }
      }

      // 刪除權限（逐一呼叫）
      if (removedIds.length > 0) {
        for (const permId of removedIds) {
          const removeResponse = await removePermission(currentRoleId.value, permId)
          if (!removeResponse.success) {
            ElMessage.error(removeResponse.message || `權限刪除失敗：${permId}`)
            formLoading.value = false
            return
          }
        }
      }

      // 更新原始權限 ID
      originalPermissionIds.value = [...currentIds]
      ElMessage.success("權限更新成功")
      onSuccess?.()
    } catch (error) {
      console.error("[useRoleForm] submitPermission failed:", error)
      ElMessage.error("權限更新失敗")
    } finally {
      formLoading.value = false
    }
  }

  /**
   * 提交表單（呼叫 submitRole 和 submitPermission）
   */
  const submitForm = async () => {
    if (!formRef.value) {
      console.error("[useRoleForm] formRef is not set!")
      ElMessage.error("表單實例未初始化")
      return
    }

    try {
      // 先驗證表單
      await formRef.value.validate()

      // 先提交角色
      await submitRole()

      // 如果提交角色成功，再提交權限
      if (currentRoleId.value) {
        await submitPermission()
        dialogVisible.value = false
        onSuccess?.()
      }
    } catch (error) {
      console.error("[useRoleForm] submitForm failed:", error)
    }
  }

  /**
   * 重置表單
   */
  const resetForm = () => {
    formData.value.roleName = ""
    formData.value.description = ""
    formData.value.selectedPermissionIds = []
    delete formData.value.version
    originalPermissionIds.value = []
    formRef.value?.resetFields()
  }

  /**
   * 關閉對話框
   */
  const handleClose = () => {
    dialogVisible.value = false
    resetForm()
  }

  return {
    formRef,
    dialogVisible,
    formLoading,
    isEditMode,
    formData,
    permissions,
    rules,
    setFormRef,
    preloadPermissions,
    openCreate,
    openEdit,
    submitForm,
    submitRole,
    submitPermission,
    handleClose
  }
}
