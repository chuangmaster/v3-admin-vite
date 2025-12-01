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

import { ref } from "vue"

import { assignPermissions, createRole, getPermissions, getRoleDetail, updateRole } from "../apis/role"
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

  const { buildPermissionTree } = usePermissionTree()

  /**
   * 預載所有權限清單，供 index 頁面在進入時呼叫
   */
  const preloadPermissions = async () => {
    debugger
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
      await preloadPermissions()
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
    // 只載入單一角色的權限資訊（全部權限應已 preload）
    formLoading.value = true
    try {
      const roleResponse = await getRoleDetail(role.id)
      if (roleResponse.success && roleResponse.data) {
        formData.value.roleName = roleResponse.data.roleName
        formData.value.description = roleResponse.data.description || ""
        formData.value.version = roleResponse.data.version
        formData.value.selectedPermissionIds = roleResponse.data.permissions.map(p => p.id)
      } else {
        ElMessage.error(roleResponse.message || "載入角色資訊失敗")
        return
      }
      // 若尚未 preload 全部權限，嘗試載入（fallback）
      if (permissions.value.length === 0) {
        await preloadPermissions()
      }
    } finally {
      formLoading.value = false
    }

    dialogVisible.value = true
  }

  /**
   * 提交表單
   */
  const submitForm = async () => {
    if (!formRef.value) return

    try {
      // 使用 Promise 方式進行表單驗證
      await formRef.value.validate()

      formLoading.value = true

      if (isEditMode.value && currentRoleId.value) {
        // 更新角色
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

        // 更新權限
        if (formData.value.selectedPermissionIds?.length) {
          const permResponse = await assignPermissions(currentRoleId.value, {
            permissionIds: formData.value.selectedPermissionIds
          } as AssignRolePermissionsRequest)
          if (!permResponse.success) {
            ElMessage.error(permResponse.message || "權限分配失敗")
            formLoading.value = false
            return
          }
        }

        ElMessage.success("角色更新成功")
      } else {
        // 新增角色
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

        // 分配權限
        if (response.data && formData.value.selectedPermissionIds?.length) {
          const permResponse = await assignPermissions(response.data.id, {
            permissionIds: formData.value.selectedPermissionIds
          } as AssignRolePermissionsRequest)
          if (!permResponse.success) {
            ElMessage.warning("角色已建立，但權限分配失敗")
          }
        }

        ElMessage.success("角色建立成功")
      }

      dialogVisible.value = false
      onSuccess?.()
    } catch (error) {
      // 驗證失敗，不進行任何操作（Element Plus 會顯示驗證錯誤）
      console.error("表單驗證失敗:", error)
    } finally {
      formLoading.value = false
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
    preloadPermissions,
    openCreate,
    openEdit,
    submitForm,
    handleClose
  }
}
