/**
 * 權限樹狀結構轉換邏輯組合式函式
 * @module @/pages/role-management/composables/usePermissionTree
 */

import type { PermissionDto, PermissionTreeNode } from "../types"

/**
 * 模組分組配置
 */
const MODULE_GROUPS: Record<string, { label: string, order: number }> = {
  user: { label: "使用者管理", order: 1 },
  role: { label: "角色管理", order: 2 },
  permission: { label: "權限管理", order: 3 }
}

/**
 * 權限樹狀結構轉換邏輯
 * 將扁平化的權限列表轉換為樹狀結構
 */
export function usePermissionTree() {
  /**
   * 構建權限樹狀結構
   * @param permissions 權限陣列
   * @returns 樹狀結構
   */
  const buildPermissionTree = (permissions: PermissionDto[]): PermissionTreeNode[] => {
    // 1. 按模組分組
    const grouped = permissions.reduce(
      (acc, perm) => {
        const [module] = perm.permissionCode.split(".")
        if (!acc[module]) {
          acc[module] = []
        }
        acc[module].push(perm)
        return acc
      },
      {} as Record<string, PermissionDto[]>
    )

    // 2. 建立模組節點
    const moduleNodes = Object.entries(grouped)
      .map(([module, perms]) => ({
        id: `${module}-group`,
        label: MODULE_GROUPS[module]?.label || module,
        permissionCode: module,
        isGroup: true,
        children: perms.map(p => ({
          id: p.id,
          label: `${p.name} (${p.permissionCode})`,
          permissionCode: p.permissionCode
        }))
      }))
      .sort((a, b) => {
        const orderA = MODULE_GROUPS[a.permissionCode]?.order ?? 999
        const orderB = MODULE_GROUPS[b.permissionCode]?.order ?? 999
        return orderA - orderB
      })

    // 3. 建立頂層節點
    return [
      {
        id: "access-control",
        label: "存取控制 (Access Control)",
        permissionCode: "access_control",
        isGroup: true,
        children: moduleNodes
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
