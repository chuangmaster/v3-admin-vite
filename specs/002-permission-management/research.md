# Research: 權限管理系統

**Date**: 2025-11-19
**Feature**: 權限管理系統
**Phase**: Phase 0 - 研究與決策

## 研究目標

本研究旨在解決權限管理系統實作中的關鍵技術問題，確保設計決策基於最佳實踐並符合專案架構規範。

## 1. 權限代碼格式驗證

### 決策

採用正則表達式驗證權限代碼格式，確保符合 `module:action` 格式，最多支援三層（如 `user:profile:edit`）。

### 理由

1. **清晰的命名規範**：冒號分隔的格式易於理解和維護
2. **層級限制**：最多三層避免過度複雜化
3. **字元限制**：僅允許英數字、底線、冒號，避免特殊字元導致的問題
4. **參考現有實作**：專案中已有 `account.read` 格式（點號分隔），但規格要求使用冒號

### 實作方式

```typescript
/**
 * 驗證權限代碼格式
 * 格式：module:action 或 module:submodule:action（最多三層）
 * 允許字元：英數字、底線、冒號
 * 
 * @param code - 權限代碼
 * @returns 是否有效
 */
export function validatePermissionCode(code: string): boolean {
  // 允許 1-3 層，每層由英數字和底線組成
  const pattern = /^[a-zA-Z0-9_]+:[a-zA-Z0-9_]+(:[a-zA-Z0-9_]+)?$/
  return pattern.test(code)
}
```

### 替代方案考量

- **點號分隔**（如 `user.create`）：專案現有格式，但規格明確要求冒號
- **無層級限制**：可能導致過度複雜的權限代碼，如 `a:b:c:d:e:f`
- **自由格式**：缺乏規範，不利於維護

## 2. 樂觀鎖定機制

### 決策

使用版本號（version）實作樂觀鎖定，每次更新時遞增版本號，並在更新前檢查版本是否匹配。

### 理由

1. **符合 API 規範**：V3.Admin.Backend.API.yaml 中定義了 `CONCURRENT_UPDATE_CONFLICT` 錯誤代碼
2. **簡單有效**：版本號機制是處理並行編輯的標準做法
3. **使用者友善**：衝突時明確提示使用者重新載入資料
4. **效能優勢**：相比悲觀鎖定，不會鎖定資源

### 實作方式

```typescript
// 權限實體包含版本號
interface Permission {
  id: string
  name: string
  code: string
  description?: string
  version: number  // 版本號
  createdAt: string
  updatedAt: string
}

// API 請求包含版本號
async function updatePermission(id: string, data: UpdatePermissionDto, version: number) {
  try {
    const response = await axios.put(`/api/permissions/${id}`, {
      ...data,
      version  // 傳遞當前版本號
    })
    return response.data
  } catch (error) {
    if (error.response?.data?.code === 'CONCURRENT_UPDATE_CONFLICT') {
      ElMessage.error('資料已被其他使用者修改，請重新載入')
      // 觸發重新載入邏輯
    }
    throw error
  }
}
```

### 替代方案考量

- **悲觀鎖定**：需要資料庫層面支援，增加複雜度，不適合 Web 應用
- **時間戳比對**：精度問題可能導致誤判
- **無鎖定**：後提交覆蓋前提交，可能導致資料遺失

## 3. Element Plus 表格與表單最佳實踐

### 決策

採用與 `user-management` 模組一致的架構：
- 使用 `el-table` 顯示權限清單
- 使用 `el-dialog` + `el-form` 處理新增/編輯
- 將表格和表單拆分為獨立元件

### 理由

1. **一致性**：與現有模組保持相同的程式碼風格
2. **可維護性**：獨立元件職責清晰，易於測試
3. **可重用性**：表單元件可用於新增和編輯
4. **使用者體驗**：對話框模式符合使用者習慣

### 元件結構

```
permission-management/
├── index.vue                    # 主頁面（容器）
├── components/
│   ├── PermissionTable.vue      # 表格元件
│   └── PermissionForm.vue       # 表單元件
└── composables/
    ├── usePermissionManagement.ts  # 主邏輯
    └── usePermissionForm.ts        # 表單邏輯
```

### 參考實作

- **表格元件**：參考 `@/pages/user-management/components/UserTable.vue`
- **表單元件**：參考 `@/pages/user-management/components/UserForm.vue`
- **組合式函式**：參考 `@/pages/user-management/composables/useUserManagement.ts`

### 替代方案考量

- **單一元件**：所有邏輯放在一個檔案，難以維護
- **多頁面模式**：需要路由跳轉，使用者體驗較差
- **抽屜模式**：對話框已足夠，不需引入額外元件

## 4. 權限與角色關聯設計

### 決策

權限管理模組僅負責權限的 CRUD 操作，不處理與角色的關聯。關聯關係由角色管理模組維護。

### 理由

1. **單一職責**：權限管理專注於權限本身的管理
2. **避免循環依賴**：權限與角色應該是獨立的模組
3. **符合規格定位**：規格明確定義權限管理是「基礎層」
4. **參考後端設計**：`PermissionRole` 關聯表由角色服務管理

### 互動方式

```
權限管理模組職責：
✅ 權限的新增、編輯、刪除、查詢
✅ 檢查權限是否被角色使用（透過 API 查詢 permissionRole 關聯數量）
✅ 顯示權限使用情況（被哪些角色使用）
❌ 不處理權限與角色的綁定/解綁操作

角色管理模組職責（未來實作）：
✅ 角色的新增、編輯、刪除、查詢
✅ 為角色指派/移除權限
✅ 維護 permissionRole 關聯表
```

### API 設計考量

權限管理需要的 API：
- `GET /api/permissions` - 查詢權限列表
- `GET /api/permissions/{id}` - 查詢單一權限
- `POST /api/permissions` - 新增權限
- `PUT /api/permissions/{id}` - 更新權限
- `DELETE /api/permissions/{id}` - 刪除權限
- `GET /api/permissions/{id}/usage` - 查詢權限使用情況（被哪些角色使用）

### 替代方案考量

- **權限管理包含角色綁定**：違反單一職責原則，增加複雜度
- **完全獨立**：無法顯示使用情況，使用者體驗不佳
- **統一管理介面**：權限和角色放在同一頁面，不符合模組化設計

## 5. 預設權限定義

### 決策

根據使用者提供的資訊，系統預設權限為：
- `permission.read` - 查看權限列表
- `permission.create` - 新增權限
- `permission.update` - 更新權限
- `permission.delete` - 刪除權限
- `permission.assign` - 指派權限（角色管理功能使用）
- `permission.remove` - 移除權限（角色管理功能使用）

### 理由

1. **符合 RBAC 標準**：標準的增刪改查權限
2. **粒度適中**：不過度細分，也不過於粗糙
3. **為未來擴充預留**：assign 和 remove 權限為角色管理功能保留
4. **與現有格式一致**：參考 `account.read` 等現有權限

### 常數定義

```typescript
// @@/constants/permissions.ts
export const PERMISSION_PERMISSIONS = {
  /** 查看權限列表（路由權限） */
  READ: "permission.read",
  /** 新增權限（功能權限） */
  CREATE: "permission.create",
  /** 修改權限（功能權限） */
  UPDATE: "permission.update",
  /** 刪除權限（功能權限） */
  DELETE: "permission.delete",
  /** 指派權限給角色（功能權限） */
  ASSIGN: "permission.assign",
  /** 從角色移除權限（功能權限） */
  REMOVE: "permission.remove"
} as const
```

## 6. 批次操作實作策略

### 決策

第一階段先實作基本的 CRUD 功能，批次操作（如批次刪除）作為優先級 P4 功能，可在後續版本中實作。

### 理由

1. **優先級考量**：規格中批次操作為 P4（最低優先級）
2. **迭代開發**：先確保核心功能穩定，再增加進階功能
3. **降低複雜度**：避免第一版過於複雜
4. **API 支援**：需確認後端是否支援批次操作 API

### 未來實作方向

如需實作批次刪除：
1. 使用 `el-table` 的 `selection` 功能
2. 提供批次刪除按鈕
3. 後端提供 `DELETE /api/permissions/batch` API
4. 處理部分成功的情況（某些權限正在使用中）

## 總結

本研究為權限管理系統的實作提供了明確的技術方向：

1. **權限代碼驗證**：使用正則表達式驗證 `module:action` 格式（最多三層）
2. **樂觀鎖定**：使用版本號機制處理並行編輯衝突
3. **元件架構**：遵循 `user-management` 模組的架構模式
4. **模組職責**：權限管理專注於權限 CRUD，不處理與角色的關聯
5. **預設權限**：定義六個標準權限（read, create, update, delete, assign, remove）
6. **迭代開發**：第一階段專注核心功能，批次操作留待後續

所有決策均基於專案現有架構、最佳實踐以及使用者需求，確保實作的一致性和可維護性。
