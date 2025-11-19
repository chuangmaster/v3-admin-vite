# Data Model: 權限管理系統

**Date**: 2025-11-19
**Feature**: 權限管理系統
**Phase**: Phase 1 - 資料模型設計

## 概述

本文件定義權限管理系統的資料模型，包含前端 TypeScript 型別定義以及與後端 API 的對應關係。設計遵循 V3.Admin.Backend.API.yaml 規範。

## 核心實體

### 1. Permission（權限）

權限是系統中最小的操作授權單位，定義了使用者可以執行的具體操作。

#### TypeScript 型別定義

```typescript
/**
 * 權限實體
 */
export interface Permission {
  /** 權限 ID（UUID） */
  id: string
  
  /** 權限名稱（顯示名稱） */
  name: string
  
  /** 
   * 權限代碼（唯一識別碼）
   * 格式：module:action 或 module:submodule:action
   * 範例：permission:read, user:profile:edit
   */
  code: string
  
  /** 權限描述（可選） */
  description?: string
  
  /** 是否為系統內建權限（內建權限不可刪除） */
  isSystem: boolean
  
  /** 版本號（用於樂觀鎖定） */
  version: number
  
  /** 建立時間（ISO 8601 格式） */
  createdAt: string
  
  /** 更新時間（ISO 8601 格式） */
  updatedAt: string
  
  /** 建立者 ID */
  createdBy?: string
  
  /** 最後更新者 ID */
  updatedBy?: string
}
```

#### 欄位說明

| 欄位 | 類型 | 必填 | 說明 | 驗證規則 |
|------|------|------|------|----------|
| id | string | 是 | 唯一識別碼 | UUID 格式 |
| name | string | 是 | 權限名稱 | 1-100 字元 |
| code | string | 是 | 權限代碼 | 符合 `^[a-zA-Z0-9_]+:[a-zA-Z0-9_]+(:[a-zA-Z0-9_]+)?$` |
| description | string | 否 | 權限描述 | 最多 500 字元 |
| isSystem | boolean | 是 | 是否系統內建 | true/false |
| version | number | 是 | 版本號 | 正整數，從 1 開始 |
| createdAt | string | 是 | 建立時間 | ISO 8601 格式 |
| updatedAt | string | 是 | 更新時間 | ISO 8601 格式 |
| createdBy | string | 否 | 建立者 ID | UUID 格式 |
| updatedBy | string | 否 | 最後更新者 ID | UUID 格式 |

#### 業務規則

1. **唯一性約束**：`code` 必須在系統中唯一
2. **系統權限保護**：`isSystem = true` 的權限不允許刪除
3. **版本控制**：每次更新必須遞增 `version`，用於樂觀鎖定
4. **代碼格式**：權限代碼必須符合 `module:action` 格式，最多三層
5. **軟刪除**：建議後端實作軟刪除，避免資料遺失（前端不需處理）

### 2. CreatePermissionDto（新增權限 DTO）

```typescript
/**
 * 新增權限請求資料
 */
export interface CreatePermissionDto {
  /** 權限名稱 */
  name: string
  
  /** 權限代碼 */
  code: string
  
  /** 權限描述（可選） */
  description?: string
}
```

#### 驗證規則

- `name`: 必填，1-100 字元
- `code`: 必填，符合格式 `^[a-zA-Z0-9_]+:[a-zA-Z0-9_]+(:[a-zA-Z0-9_]+)?$`
- `description`: 可選，最多 500 字元

### 3. UpdatePermissionDto（更新權限 DTO）

```typescript
/**
 * 更新權限請求資料
 */
export interface UpdatePermissionDto {
  /** 權限名稱 */
  name: string
  
  /** 權限代碼 */
  code: string
  
  /** 權限描述（可選） */
  description?: string
  
  /** 當前版本號（用於樂觀鎖定） */
  version: number
}
```

#### 驗證規則

- `name`: 必填，1-100 字元
- `code`: 必填，符合格式
- `description`: 可選，最多 500 字元
- `version`: 必填，必須與資料庫中的版本號一致

### 4. PermissionQuery（查詢參數）

```typescript
/**
 * 權限查詢參數
 */
export interface PermissionQuery {
  /** 搜尋關鍵字（搜尋 name 或 code） */
  keyword?: string
  
  /** 頁碼（從 1 開始） */
  pageNumber: number
  
  /** 每頁筆數（1-100） */
  pageSize: number
  
  /** 排序欄位（可選） */
  sortBy?: 'name' | 'code' | 'createdAt' | 'updatedAt'
  
  /** 排序方向（可選） */
  sortOrder?: 'asc' | 'desc'
}
```

### 5. PagedResult<Permission>（分頁結果）

```typescript
/**
 * 分頁結果
 */
export interface PagedResult<T> {
  /** 資料列表 */
  items: T[]
  
  /** 當前頁碼 */
  pageNumber: number
  
  /** 每頁筆數 */
  pageSize: number
  
  /** 總筆數 */
  totalCount: number
  
  /** 總頁數 */
  totalPages: number
  
  /** 是否有上一頁 */
  hasPreviousPage: boolean
  
  /** 是否有下一頁 */
  hasNextPage: boolean
}
```

### 6. PermissionUsage（權限使用情況）

```typescript
/**
 * 權限使用情況
 */
export interface PermissionUsage {
  /** 權限 ID */
  permissionId: string
  
  /** 使用該權限的角色數量 */
  roleCount: number
  
  /** 使用該權限的角色列表（簡化資訊） */
  roles: Array<{
    id: string
    name: string
  }>
}
```

## 關聯實體

### PermissionRole（權限-角色關聯）

> **注意**：此實體由角色管理模組維護，權限管理模組僅查詢使用情況。

```typescript
/**
 * 權限-角色關聯（唯讀，僅供查詢）
 */
export interface PermissionRole {
  /** 權限 ID */
  permissionId: string
  
  /** 角色 ID */
  roleId: string
  
  /** 關聯建立時間 */
  createdAt: string
}
```

## 表單驗證規則

### 權限代碼驗證

```typescript
/**
 * 驗證權限代碼格式
 * 格式：module:action 或 module:submodule:action（最多三層）
 * 範例：permission:read, user:profile:edit
 */
export function validatePermissionCode(code: string): boolean {
  const pattern = /^[a-zA-Z0-9_]+:[a-zA-Z0-9_]+(:[a-zA-Z0-9_]+)?$/
  return pattern.test(code)
}
```

### Element Plus 表單驗證規則

```typescript
import type { FormRules } from 'element-plus'

export const permissionFormRules: FormRules = {
  name: [
    { required: true, message: '請輸入權限名稱', trigger: 'blur' },
    { min: 1, max: 100, message: '權限名稱長度為 1-100 字元', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '請輸入權限代碼', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (!validatePermissionCode(value)) {
          callback(new Error('權限代碼格式不正確（格式：module:action，最多三層）'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ],
  description: [
    { max: 500, message: '描述最多 500 字元', trigger: 'blur' }
  ]
}
```

## 狀態轉換

### 權限生命週期

```
[新增] → [啟用中] → [刪除]
           ↓
        [編輯] → [啟用中]
```

#### 狀態說明

1. **新增**：管理員建立新權限
2. **啟用中**：權限正常可用，可被角色引用
3. **編輯**：管理員修改權限資訊（名稱、描述）
4. **刪除**：權限被移除（僅限未被使用的權限）

#### 約束條件

- 系統內建權限（`isSystem = true`）無法刪除
- 正在被角色使用的權限無法刪除（`roleCount > 0`）
- 刪除前必須先檢查使用情況

## API 回應格式

根據 V3.Admin.Backend.API.yaml 規範，所有 API 回應使用統一格式：

```typescript
/**
 * API 標準回應格式
 */
export interface ApiResponse<T> {
  /** 是否成功 */
  success: boolean
  
  /** 業務代碼 */
  code: string
  
  /** 訊息 */
  message: string
  
  /** 資料 */
  data: T | null
  
  /** 時間戳 */
  timestamp: string
  
  /** 追蹤 ID */
  traceId: string
}
```

### 常見錯誤代碼

| 代碼 | 說明 | 處理方式 |
|------|------|----------|
| `SUCCESS` | 操作成功 | - |
| `VALIDATION_ERROR` | 驗證錯誤 | 顯示錯誤訊息 |
| `UNAUTHORIZED` | 未授權 | 導向登入頁 |
| `FORBIDDEN` | 無權限 | 顯示權限不足提示 |
| `NOT_FOUND` | 資源不存在 | 顯示錯誤訊息 |
| `DUPLICATE_CODE` | 權限代碼重複 | 提示修改代碼 |
| `PERMISSION_IN_USE` | 權限使用中 | 提示無法刪除 |
| `CONCURRENT_UPDATE_CONFLICT` | 並行更新衝突 | 提示重新載入 |

## 索引與效能考量

### 前端快取策略

- 權限清單資料快取在 Pinia store 中
- 搜尋結果不快取，每次重新請求
- 權限使用情況即時查詢，不快取

### 後端建議索引（供參考）

- `code`：唯一索引（保證唯一性，提升查詢效能）
- `name`：一般索引（支援模糊搜尋）
- `isSystem`：一般索引（快速過濾系統權限）
- `createdAt`, `updatedAt`：一般索引（支援排序）

## 資料遷移考量

### 初始權限資料

系統初始化時應建立以下預設權限（`isSystem = true`）：

```typescript
const DEFAULT_PERMISSIONS = [
  { code: 'permission.read', name: '查看權限列表', description: '允許查看所有權限資訊' },
  { code: 'permission.create', name: '新增權限', description: '允許建立新的權限' },
  { code: 'permission.update', name: '更新權限', description: '允許修改權限資訊' },
  { code: 'permission.delete', name: '刪除權限', description: '允許刪除未使用的權限' },
  { code: 'permission.assign', name: '指派權限', description: '允許將權限指派給角色' },
  { code: 'permission.remove', name: '移除權限', description: '允許從角色移除權限' }
]
```

## 總結

本資料模型設計涵蓋：

1. **核心實體**：Permission 及相關 DTO
2. **驗證規則**：權限代碼格式、欄位長度限制
3. **關聯設計**：與角色的關聯（唯讀）
4. **狀態管理**：權限生命週期與轉換
5. **API 規範**：遵循 V3.Admin.Backend.API.yaml
6. **效能考量**：快取策略與索引建議

所有設計均基於功能規格需求，並符合專案既有架構規範。
