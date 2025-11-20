/**
 * 角色表單邏輯組合式函式
 * @module @/pages/role-management/composables/useRoleForm
 */

import type { FormInstance, FormRules } from "element-plus"
import type {
  AssignRolePermissionsRequest,
  CreateRoleRequest,
  RoleDto,
  UpdateRoleRequest
} from "../types"
import { ElMessage } from "element-plus"

import { reactive, ref } from "vue"

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
  const permissions = ref<any[]>([])

  const { buildPermissionTree } = usePermissionTree()

  const formData = reactive<
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
    dialogVisible.value = true
    resetForm()

    // 載入權限列表
    if (permissions.value.length === 0) {
      formLoading.value = true
      try {
        const response = await getPermissions()
        if (response.success && response.data?.items) {
          permissions.value = buildPermissionTree(response.data.items)
        }
      } finally {
        formLoading.value = false
      }
    }
  }

  /**
   * 開啟編輯對話框
   * @param role 要編輯的角色
   */
  const openEdit = async (role: RoleDto) => {
    isEditMode.value = true
    currentRoleId.value = role.id
    dialogVisible.value = true

    // 載入角色詳細資訊（含權限）和權限列表
    formLoading.value = true
    try {
      // 並行載入角色詳細資訊和權限列表
      const [roleResponse, permResponse] = await Promise.all([
        getRoleDetail(role.id),
        getPermissions()
      ])

      if (roleResponse.success && roleResponse.data) {
        formData.roleName = roleResponse.data.roleName
        formData.description = roleResponse.data.description || ""
        formData.version = roleResponse.data.version
        formData.selectedPermissionIds = roleResponse.data.permissions.map(p => p.id)
      } else {
        ElMessage.error(roleResponse.message || "載入角色資訊失敗")
        dialogVisible.value = false
      }

      if (permResponse.success && permResponse.data?.items) {
        permissions.value = buildPermissionTree(permResponse.data.items)
      }
    } finally {
      formLoading.value = false
    }
  }

  /**
   * 提交表單
   */
  const submitForm = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
      if (!valid) return

      formLoading.value = true
      try {
        if (isEditMode.value && currentRoleId.value) {
          // 更新角色
          const updateData: UpdateRoleRequest = {
            roleName: formData.roleName,
            description: formData.description,
            version: formData.version!
          }
          const response = await updateRole(currentRoleId.value, updateData)
          if (!response.success) {
            ElMessage.error(response.message || "角色更新失敗")
            return
          }

          // 更新權限
          if (formData.selectedPermissionIds?.length) {
            const permResponse = await assignPermissions(currentRoleId.value, {
              permissionIds: formData.selectedPermissionIds
            } as AssignRolePermissionsRequest)
            if (!permResponse.success) {
              ElMessage.error(permResponse.message || "權限分配失敗")
              return
            }
          }

          ElMessage.success("角色更新成功")
        } else {
          // 新增角色
          const createData: CreateRoleRequest = {
            roleName: formData.roleName,
            description: formData.description
          }
          const response = await createRole(createData)
          if (!response.success) {
            ElMessage.error(response.message || "角色建立失敗")
            return
          }

          // 分配權限
          if (response.data && formData.selectedPermissionIds?.length) {
            const permResponse = await assignPermissions(response.data.id, {
              permissionIds: formData.selectedPermissionIds
            } as AssignRolePermissionsRequest)
            if (!permResponse.success) {
              ElMessage.warning("角色已建立，但權限分配失敗")
            }
          }

          ElMessage.success("角色建立成功")
        }

        dialogVisible.value = false
        onSuccess?.()
      } finally {
        formLoading.value = false
      }
    })
  }

  /**
   * 重置表單
   */
  const resetForm = () => {
    formData.roleName = ""
    formData.description = ""
    formData.selectedPermissionIds = []
    delete formData.version
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
    openCreate,
    openEdit,
    submitForm,
    handleClose
  }
}
