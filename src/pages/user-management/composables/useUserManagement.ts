/**
 * 用戶管理組合式函式
 * 處理用戶列表查詢、刪除、分頁邏輯
 * @module @/pages/user-management/composables/useUserManagement
 */

import type { User, UserListParams } from "../types"
import { ElMessage, ElMessageBox } from "element-plus"
import { ref } from "vue"
import { deleteUser, getUserList } from "../apis/user"

/**
 * 用戶管理組合式函式
 * @returns 用戶列表狀態與操作方法
 * @example
 * ```typescript
 * const { users, loading, pagination, fetchUsers, handleDelete } = useUserManagement()
 * onMounted(() => fetchUsers())
 * ```
 */
export function useUserManagement() {
  /** 用戶列表 */
  const users = ref<User[]>([])

  /** 載入狀態 */
  const loading = ref(false)

  /** 分頁資訊 */
  const pagination = ref({
    pageNumber: 1,
    pageSize: 20,
    total: 0
  })

  /** 搜尋關鍵字 */
  const searchKeyword = ref("")

  /**
   * 載入用戶列表
   */
  async function fetchUsers(): Promise<void> {
    loading.value = true
    try {
      const params: UserListParams = {
        pageNumber: pagination.value.pageNumber,
        pageSize: pagination.value.pageSize,
        searchKeyword: searchKeyword.value || undefined
      }
      const response = await getUserList(params)
      if (response.success && response.data) {
        users.value = response.data.items
        pagination.value.total = response.data.totalCount
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 刪除用戶（軟刪除）
   * 顯示二次確認對話框，用戶確認後執行刪除
   * @param user - 待刪除的用戶物件
   */
  async function handleDelete(user: User): Promise<void> {
    try {
      await ElMessageBox.confirm(
        `確定要刪除用戶「${user.displayName}」嗎？此操作無法復原。`,
        "刪除確認",
        {
          confirmButtonText: "確定刪除",
          cancelButtonText: "取消",
          type: "warning"
        }
      )
      await deleteUser(user.id)
      ElMessage.success("用戶刪除成功")
      // 重新載入列表
      await fetchUsers()
    } catch (error) {
      // 用戶取消操作時會拋出 "cancel"，忽略此錯誤
      if (error !== "cancel") {
        console.error("刪除用戶失敗:", error)
      }
    }
  }

  /**
   * 重置搜尋條件並重新載入列表
   */
  function resetSearch(): void {
    searchKeyword.value = ""
    pagination.value.pageNumber = 1
    fetchUsers()
  }

  return {
    users,
    loading,
    pagination,
    searchKeyword,
    fetchUsers,
    handleDelete,
    resetSearch
  }
}
