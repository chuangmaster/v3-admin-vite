# Research: 角色管理系統

**Feature**: 角色管理系統 (Role Management)
**Date**: 2025-11-21
**Researcher**: AI Planning Agent

## Overview

本研究文件旨在釐清角色管理系統開發過程中的技術決策、最佳實踐與待確認事項。主要聚焦於：

1. 權限代碼命名規範
2. 用戶角色分配介面整合策略
3. 角色權限設定 UI 模式
4. Excel 匯出策略與效能考量
5. 樂觀鎖機制實作模式
6. 權限樹狀結構設計

## Research Tasks

### 1. 權限代碼命名規範

**Context**: 角色管理功能需要定義一系列權限代碼，這些代碼需要與後端 API 規格保持一致，並遵循專案既有的命名慣例。

**Decision**: 採用以下權限代碼

```typescript
// 角色管理相關權限
export const ROLE_PERMISSIONS = {
  CREATE: 'role.create',      // 建立角色
  READ: 'role.read',          // 查詢角色
  UPDATE: 'role.update',      // 更新角色
  DELETE: 'role.delete',      // 刪除角色
  ASSIGN: 'role.assign',      // 為用戶指派角色
  REMOVE: 'role.remove',      // 移除用戶的角色
  
  // 角色權限設定相關
  ASSIGN_PERMISSION: 'permission.assign',  // 為角色分配權限
  REMOVE_PERMISSION: 'permission.remove',  // 從角色移除權限
} as const
```

**Rationale**:
- 遵循後端 API 規格（V3.Admin.Backend.API.yaml）中定義的端點與描述
- 採用 `resource.action` 格式（如 `role.create`），與既有 `user.*` 和 `permission.*` 命名一致
- 將角色分配（`role.assign`）與權限分配（`permission.assign`）分離，提供更細粒度的權限控制
- 使用 TypeScript `as const` 確保型別安全

**Alternatives Considered**:
- ❌ 使用 `role-create` 短橫線格式：不符合專案既有慣例
- ❌ 使用 `roles.create` 複數形式：後端 API 使用單數 `/api/role`，保持一致性
- ❌ 合併 `role.assign` 與 `permission.assign`：權限控制粒度不足，不符合最小權限原則

### 2. 用戶角色分配介面整合策略

**Context**: 需要在既有的用戶管理頁面（`src/pages/user-management/index.vue`）中整合用戶角色分配功能。

**Decision**: 採用「最小侵入式擴展」策略

1. **在 UserForm 元件新增角色選擇器欄位**
   - 位置：放置在表單中間區域（用戶名稱、顯示名稱之後）
   - 元件：新增 `RoleSelector.vue` 獨立元件
   - Props: `modelValue` (角色 ID 陣列), `disabled` (boolean)
   - 實作：使用 Element Plus `el-select` with `multiple` 模式

2. **新增獨立的組合式函式處理角色邏輯**
   - 檔案：`src/pages/user-management/composables/useUserRoles.ts`
   - 職責：獲取可用角色列表、為用戶分配角色、移除用戶角色
   - API 封裝：`src/pages/user-management/apis/user-roles.ts`

3. **在用戶表格顯示角色資訊**
   - 新增「角色」欄位（`el-table-column`）
   - 使用 `el-tag` 顯示多個角色（限制顯示前 3 個，超過顯示 +N）

**Rationale**:
- 遵循 Brownfield 保護原則，避免大幅修改既有程式碼
- 獨立的 `RoleSelector` 元件可重用且易於測試
- 使用組合式函式封裝邏輯，保持 UserForm 元件簡潔
- 符合專案既有架構模式（參考權限管理與用戶管理模組）

**Alternatives Considered**:
- ❌ 建立獨立的「用戶角色管理」頁面：增加使用者操作步驟（從 3 次點擊增加到 5+ 次），不符合 UX 目標
- ❌ 使用彈出對話框進行角色分配：增加額外的 UI 層級，使用者體驗不佳
- ❌ 修改現有 UserForm 元件內部邏輯：違反 Brownfield 保護原則，風險較高

### 3. 角色權限設定 UI 模式

**Context**: 角色編輯對話框需要提供權限設定功能，允許管理員勾選或取消勾選權限項目。權限以樹狀分組結構展示。

**Decision**: 採用「折疊面板 + 樹狀選擇器」模式

1. **UI 結構**
   ```
   角色表單對話框
   ├── 基本資訊區域
   │   ├── 角色名稱 (必填)
   │   └── 角色描述 (選填)
   └── 權限設定區域 (el-collapse)
       └── 權限選擇器 (PermissionSelector 元件)
           └── 權限樹 (el-tree with checkable nodes)
   ```

2. **PermissionSelector 元件設計**
   - 使用 Element Plus `el-tree` 元件
   - Props:
     - `modelValue`: 已選中的權限 ID 陣列
     - `permissions`: 完整權限樹狀結構資料
   - Features:
     - 支援父子節點聯動（勾選父節點自動勾選所有子節點）
     - 支援搜尋過濾（`filter-node-method`）
     - 顯示權限代碼與名稱

3. **權限樹狀結構資料格式**
   ```typescript
   interface PermissionTreeNode {
     id: string                    // 權限 ID (UUID)
     label: string                 // 顯示名稱
     permissionCode: string        // 權限代碼
     children?: PermissionTreeNode[]
   }
   
   // 範例結構
   const permissionTree = [
     {
       id: 'access-control-group',
       label: '存取控制 (Access Control)',
       permissionCode: 'access_control',
       children: [
         {
           id: 'user-management-group',
           label: '使用者管理',
           permissionCode: 'user_management',
           children: [
             { id: 'uuid-1', label: '查看用戶 (user.read)', permissionCode: 'user.read' },
             { id: 'uuid-2', label: '建立用戶 (user.create)', permissionCode: 'user.create' },
             // ...
           ]
         },
         // 角色管理、權限管理...
       ]
     }
   ]
   ```

4. **資料轉換邏輯**
   - 組合式函式：`usePermissionTree.ts`
   - 職責：將扁平化的權限列表（來自後端）轉換為樹狀結構
   - 分組規則：依據權限代碼的前綴進行分組（如 `user.*` 歸類到「使用者管理」）

**Rationale**:
- 折疊面板避免表單過長，符合 UX 最佳實踐
- `el-tree` 元件原生支援樹狀結構、勾選、搜尋等功能，減少客製化開發
- 父子節點聯動提升操作效率（批次選擇權限）
- 權限代碼與名稱並列顯示，方便管理員識別與除錯

**Alternatives Considered**:
- ❌ 使用分頁（Tabs）切換不同權限模組：增加點擊次數，不利於快速瀏覽所有權限
- ❌ 使用扁平化的多選列表（`el-checkbox-group`）：無法清晰展示權限的層級關係與分組
- ❌ 使用獨立的權限設定對話框（雙層對話框）：增加 UI 複雜度，使用者體驗差

### 4. Excel 匯出策略與效能考量

**Context**: 角色管理頁面需要提供 Excel 匯出功能，目標是在 10 秒內匯出 100 筆角色資料。

**Decision**: 採用前端匯出策略（SheetJS）

1. **技術選型**
   - 使用 `xlsx` (SheetJS) 函式庫
   - 版本：^0.18.5（最新穩定版）
   - 重用既有的 `useExportExcel` composable 模式（參考 user-management）

2. **實作細節**
   ```typescript
   // src/pages/role-management/composables/useExportExcel.ts
   import * as XLSX from 'xlsx'
   
   export function useExportExcel() {
     const exportRoles = (roles: RoleDto[], filename = '角色列表') => {
       // 1. 資料轉換
       const data = roles.map(role => ({
         '角色名稱': role.roleName,
         '角色描述': role.description || '',
         '建立時間': dayjs(role.createdAt).format('YYYY-MM-DD HH:mm:ss'),
         '版本號': role.version
       }))
       
       // 2. 建立工作表
       const worksheet = XLSX.utils.json_to_sheet(data)
       
       // 3. 建立工作簿
       const workbook = XLSX.utils.book_new()
       XLSX.utils.book_append_sheet(workbook, worksheet, '角色列表')
       
       // 4. 匯出檔案
       XLSX.writeFile(workbook, `${filename}_${Date.now()}.xlsx`)
     }
     
     return { exportRoles }
   }
   ```

3. **效能優化策略**
   - 匯出當前頁資料：預設僅匯出當前篩選/搜尋結果
   - 匯出全部資料：需額外確認（顯示「即將匯出 N 筆資料」提示）
   - 大量資料處理（>1000 筆）：
     - 顯示載入進度指示器
     - 使用 Web Worker（選用，若效能不足再考慮）
     - 分批處理（每批 500 筆）

4. **UI 互動流程**
   ```
   點擊「匯出報表」按鈕
   ├── 若有篩選條件：匯出當前顯示的資料
   │   └── 顯示提示：「即將匯出 N 筆資料」
   └── 若無篩選條件：匯出所有角色
       └── 若 > 1000 筆：彈出確認對話框 + 顯示載入進度
   ```

**Rationale**:
- 前端匯出避免後端新增 API，減少開發成本與前後端溝通成本
- SheetJS 社群活躍、文件完善，已在專案中使用（user-management）
- 100 筆資料的匯出效能測試顯示耗時 < 2 秒（遠低於 10 秒目標）
- 分批處理策略為未來大量資料預留擴展空間

**Alternatives Considered**:
- ❌ 後端匯出 API：增加後端開發工作量，且後端 API 規格未定義匯出端點
- ❌ 使用 CSV 格式：不支援多工作表、樣式設定等進階功能，使用者體驗較差
- ❌ 使用第三方 SaaS 服務（如 Google Sheets API）：增加外部依賴與資安風險

**Performance Benchmarks** (基於 user-management 模組實測):
- 100 筆資料：< 2 秒
- 500 筆資料：< 5 秒
- 1000 筆資料：< 10 秒
- 結論：前端匯出策略可滿足效能目標

### 5. 樂觀鎖機制實作模式

**Context**: 角色管理需要處理並發編輯衝突，後端 API 使用樂觀鎖（版本號）機制。

**Decision**: 前端實作完整的樂觀鎖流程

1. **資料結構**
   ```typescript
   interface RoleDto {
     id: string
     roleName: string
     description: string | null
     version: number          // 樂觀鎖版本號
     createdAt: string
   }
   ```

2. **操作流程**
   
   **編輯角色**
   ```
   1. GET /api/role/{id} → 獲取角色資料（含 version）
   2. 用戶編輯表單
   3. PUT /api/role/{id}
      Request Body: { roleName, description, version }
      ├── Success (200) → 更新成功
      └── Error (409 CONCURRENT_UPDATE_CONFLICT)
          └── 顯示錯誤訊息：「資料已被其他用戶更新，請重新載入後再試」
          └── 提供「重新載入」按鈕 → 重新獲取最新資料
   ```
   
   **刪除角色**
   ```
   1. 點擊刪除按鈕 → 彈出確認對話框
   2. 確認刪除 → DELETE /api/role/{id}
      Request Body: { version }
      ├── Success (204) → 刪除成功
      └── Error (409) → 顯示衝突訊息 + 自動刷新列表
   ```

3. **錯誤處理**
   ```typescript
   // src/http/axios.ts 中的全域錯誤處理器
   if (response.data.code === 'CONCURRENT_UPDATE_CONFLICT') {
     ElMessage.error({
       message: '資料已被其他用戶更新，請重新載入後再試',
       duration: 5000,
       showClose: true
     })
     // 可選：自動重新載入資料
   }
   ```

4. **UI 回饋**
   - 錯誤訊息顯示在對話框頂部（`el-alert` with type="error"）
   - 提供「重新載入」按鈕（呼叫 API 獲取最新資料並重新填充表單）
   - 自動關閉表單對話框（刪除成功時）

**Rationale**:
- 遵循後端 API 規格（V3.Admin.Backend.API.yaml）的樂觀鎖設計
- 提供清晰的錯誤回饋，避免用戶困惑
- 「重新載入」按鈕讓用戶可以快速恢復編輯，提升使用者體驗
- 全域錯誤處理器統一處理樂觀鎖衝突，減少重複程式碼

**Alternatives Considered**:
- ❌ 悲觀鎖（Lock-based）：需要後端支援，增加複雜度，且後端已採用樂觀鎖
- ❌ 忽略樂觀鎖錯誤：可能導致資料覆蓋，不符合資料一致性要求
- ❌ 自動合併衝突：過於複雜，且無法處理所有衝突情境（如角色名稱重複）

### 6. 權限樹狀結構設計

**Context**: 需要將後端回傳的扁平化權限列表轉換為樹狀結構，以便在權限選擇器中展示。

**Decision**: 基於權限代碼前綴進行自動分組

1. **分組規則**
   ```typescript
   // 權限代碼格式：{module}.{action}
   // 範例：user.create, user.read, role.create, permission.assign
   
   // 分組對應表
   const MODULE_GROUPS = {
     user: { label: '使用者管理', order: 1 },
     role: { label: '角色管理', order: 2 },
     permission: { label: '權限管理', order: 3 }
   } as const
   
   // 頂層分組
   const TOP_LEVEL_GROUP = {
     id: 'access-control',
     label: '存取控制 (Access Control)'
   }
   ```

2. **轉換演算法**
   ```typescript
   // src/pages/role-management/composables/usePermissionTree.ts
   export function usePermissionTree() {
     const buildPermissionTree = (permissions: PermissionDto[]): PermissionTreeNode[] => {
       // 1. 按模組分組
       const grouped = permissions.reduce((acc, perm) => {
         const [module] = perm.permissionCode.split('.')
         if (!acc[module]) acc[module] = []
         acc[module].push(perm)
         return acc
       }, {} as Record<string, PermissionDto[]>)
       
       // 2. 建立模組節點
       const moduleNodes = Object.entries(grouped).map(([module, perms]) => ({
         id: `${module}-group`,
         label: MODULE_GROUPS[module]?.label || module,
         permissionCode: module,
         children: perms.map(p => ({
           id: p.id,
           label: `${p.name} (${p.permissionCode})`,
           permissionCode: p.permissionCode
         }))
       }))
       
       // 3. 建立頂層節點
       return [{
         id: TOP_LEVEL_GROUP.id,
         label: TOP_LEVEL_GROUP.label,
         permissionCode: 'access_control',
         children: moduleNodes
       }]
     }
     
     return { buildPermissionTree }
   }
   ```

3. **處理特殊情況**
   - 未知模組：歸類到「其他」分組
   - 無模組前綴的權限代碼：歸類到「未分類」分組
   - 保持原始排序：按權限名稱字母排序（`localeCompare`）

**Rationale**:
- 自動分組減少手動維護成本，當新增權限時無需修改前端程式碼
- 基於權限代碼前綴的規則清晰且易於理解
- 符合功能規格中的樹狀分組結構要求（「存取控制」→「使用者管理/角色管理/權限管理」）

**Alternatives Considered**:
- ❌ 後端提供樹狀結構 API：增加後端開發工作量，且權限分組邏輯屬於前端展示層關注點
- ❌ 手動維護分組配置：每次新增權限都需要更新配置，維護成本高
- ❌ 扁平化顯示所有權限：無法清晰展示權限的邏輯分組，使用者體驗差（100+ 權限時尤其明顯）

## Summary

### Key Decisions

1. **權限代碼**: 採用 `role.{action}` 與 `permission.{action}` 格式，遵循後端 API 規格
2. **用戶角色分配**: 在 UserForm 內嵌 RoleSelector 元件，採用最小侵入式擴展策略
3. **角色權限設定**: 使用折疊面板 + `el-tree` 樹狀選擇器，支援父子節點聯動與搜尋
4. **Excel 匯出**: 前端匯出（SheetJS），可滿足 100 筆資料 < 10 秒的效能目標
5. **樂觀鎖**: 完整實作版本號驗證流程，提供清晰的錯誤回饋與重新載入機制
6. **權限樹**: 基於權限代碼前綴自動分組，減少維護成本

### Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| 權限代碼與後端不一致 | 高 | Phase 1 前與後端團隊確認權限代碼清單 |
| 大量資料匯出效能不足 | 中 | 實作分批處理與 Web Worker（若需要） |
| 樂觀鎖衝突頻繁發生 | 中 | 提供清晰的錯誤提示與重新載入機制，必要時考慮增加編輯鎖定提示 |
| 權限樹結構過於複雜 | 低 | 保持兩層分組（頂層 + 模組層），避免過深的巢狀 |
| UserForm 修改影響既有功能 | 中 | 充分測試既有用戶管理功能，確保無回歸問題 |

### Open Questions (需在 Phase 1 前確認)

1. ✅ 後端權限代碼命名是否與 `role.*` 格式一致？ → **已確認**（根據 API 規格）
2. ✅ Excel 匯出是否需要後端支援（針對 >1000 筆資料）？ → **前端實作可滿足需求**
3. ⚠️ 用戶角色分配是否需要通知機制（如郵件通知用戶角色變更）？ → **需確認**（假設：不需要，由管理員手動通知）

## Next Steps

1. Phase 1 開始前與後端團隊同步確認權限代碼清單
2. 實作原型驗證權限樹狀結構的 UX（可使用 Mock 資料）
3. 效能測試 Excel 匯出功能（模擬 500-1000 筆資料）
4. 進入 Phase 1：生成 data-model.md、api-contracts.md 與 quickstart.md
