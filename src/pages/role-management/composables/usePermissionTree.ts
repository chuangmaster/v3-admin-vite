/**
 * 權限樹狀結構轉換邏輯組合式函式
 * @module @/pages/role-management/composables/usePermissionTree
 */

import type { Permission, PermissionTreeNode } from "../types"

/**
 * 權限樹狀結構轉換邏輯
 * 將扁平化的權限列表轉換為樹狀結構，基於 API 返回的數據進行分類
 */
export function usePermissionTree() {
  /**
   * 構建權限樹狀結構
   * 根據權限代碼的格式 (resource.action)，動態提取資源名並進行分組
   * @param permissions 權限陣列（來自 API）
   * @returns 樹狀結構
   */
  const buildPermissionTree = (permissions: Permission[]): PermissionTreeNode[] => {
    // 1. 按資源進行分組
    const grouped = permissions.reduce(
      (acc, perm) => {
        const [resource] = perm.permissionCode.split(".")
        if (!acc[resource]) {
          acc[resource] = []
        }
        acc[resource].push(perm)
        return acc
      },
      {} as Record<string, Permission[]>
    )

    // 2. 建立資源節點（按照在 API 數據中出現的順序）
    const resourceNodes = Object.entries(grouped).map(([resource, perms]) => ({
      id: `${resource}-group`,
      label: resource,
      permissionCode: resource,
      isGroup: true,
      children: perms.map(p => ({
        id: p.id,
        label: `${p.name} (${p.permissionCode})`,
        permissionCode: p.permissionCode
      }))
    }))

    // 3. 建立頂層節點
    return [
      {
        id: "access-control",
        label: "存取控制 (Access Control)",
        permissionCode: "access_control",
        isGroup: true,
        children: resourceNodes
      }
    ]
  }

  /**
   * 將樹狀結構中的葉子節點 ID 提取為平面陣列
   * @param checkedNodeIds 選中的節點 ID（包含分組節點）
   * @returns 葉子節點 ID 陣列
   */
  const extractLeafPermissionIds = (checkedNodeIds: string[]): string[] => {
    // 過濾出非分組節點的 ID（分組節點 ID 包含 '-group'）
    return checkedNodeIds.filter(
      id => !id.includes("-group") && id !== "access-control"
    )
  }

  return {
    buildPermissionTree,
    extractLeafPermissionIds
  }
}
