  # Quick Start: 客戶管理模組

**Branch**: `006-customer-management` | **Date**: 2026-01-28  
**Target Developers**: 前端工程師（Vue 3 + TypeScript）

---

## 1. Prerequisites（前置需求）

### 必要工具

| 工具 | 版本 | 安裝確認 | 備註 |
|------|------|---------|------|
| **Node.js** | 20.x LTS | `node -v` | 建議使用 nvm 管理版本 |
| **pnpm** | 9.x+ | `pnpm -v` | 使用 `npm install -g pnpm` 安裝 |
| **Git** | 2.x+ | `git --version` | 用於版本控制 |
| **VS Code** | Latest | - | 推薦編輯器（搭配 Vue Language Features 插件） |

### VS Code 推薦插件

```text
- Vue - Official (Vue.volar)
- ESLint
- TypeScript Vue Plugin (Volar)
- UnoCSS
- i18n Ally
```

---

## 2. Project Setup（專案設定）

### 2.1 Clone Repository

```powershell
# 切換到專案目錄
cd D:\Repository\real-you\real-you-front-end

# 確保主分支最新
git checkout main
git pull origin main

# 切換到功能分支
git checkout 006-customer-management
```

### 2.2 Install Dependencies

```powershell
# 安裝套件（首次執行或 package.json 更新後）
pnpm install

# 若遇到依賴衝突，使用強制安裝
pnpm install --force
```

### 2.3 Environment Configuration

建立或檢查 `.env.development` 檔案：

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_TITLE=客戶管理系統
```

**注意**: 後端 API 必須在 `http://localhost:5000` 啟動

---

## 3. Development Workflow（開發流程）

### 3.1 Start Dev Server

```powershell
# 啟動開發伺服器（支援 HMR 熱更新）
pnpm dev

# 預期輸出：
# VITE v7.x.x  ready in 500 ms
# ➜  Local:   http://localhost:3333/
# ➜  Network: http://192.168.x.x:3333/
```

開啟瀏覽器訪問 `http://localhost:3333`，使用測試帳號登入：

```text
帳號：admin
密碼：12345678
```

### 3.2 Navigate to Customer Management

登入後，點擊左側選單：

```text
客戶管理 (Customer Management)
```

### 3.3 Module File Structure

客戶管理模組的所有檔案位於 `src/pages/customer-management/`：

```
customer-management/
├── index.vue                    # 主頁面（列表 + 搜尋 + 操作）
├── types.ts                     # TypeScript 型別定義
├── apis/
│   └── customer.ts              # API 服務層
├── components/
│   ├── CustomerList.vue         # 客戶列表表格
│   ├── CustomerForm.vue         # 新增/編輯表單
│   ├── IdCardUpload.vue         # 身分證上傳元件
│   └── CustomerDeleteDialog.vue # 刪除確認對話框
└── composables/
    ├── useCustomerManagement.ts # 列表管理邏輯
    ├── useCustomerForm.ts       # 表單管理邏輯
    ├── useIdCardOcr.ts          # AI 辨識邏輯
    └── useCustomerExport.ts     # Excel 匯出邏輯
```

---

## 4. Development Tasks（開發任務）

### Phase 1: 基礎架構（已完成）

- ✅ 資料模型設計（data-model.md）
- ✅ API 合約定義（contracts/customer-api.md）
- ✅ 型別定義（types.ts）

### Phase 2: 核心功能（進行中）

#### Task 2.1: 建立 API 服務層

**檔案**: `src/pages/customer-management/apis/customer.ts`

**內容**:

```typescript
import request from '@/http/axios'
import type { ApiResponseModel } from '@@/types/api'
import type { 
  Customer, 
  CreateCustomerRequest, 
  UpdateCustomerRequest,
  CustomerListParams,
  IdCardRecognitionResponse
} from '../types'

/**
 * 客戶管理 API 服務
 */
export const customerApi = {
  /** 查詢客戶列表（分頁 + 搜尋） */
  search(params: CustomerListParams): Promise<ApiResponseModel<Customer[]>> {
    return request.get('/api/customers/search', { params })
  },
  
  /** 建立客戶 */
  create(data: CreateCustomerRequest): Promise<ApiResponseModel<Customer>> {
    return request.post('/api/customers', data)
  },
  
  /** 取得單一客戶 */
  getById(id: string): Promise<ApiResponseModel<Customer>> {
    return request.get(`/api/customers/${id}`)
  },
  
  /** 更新客戶（含樂觀鎖定） */
  update(id: string, data: UpdateCustomerRequest): Promise<ApiResponseModel<Customer>> {
    return request.put(`/api/customers/${id}`, data)
  },
  
  /** 刪除客戶（軟刪除） */
  delete(id: string): Promise<ApiResponseModel<null>> {
    return request.delete(`/api/customers/${id}`)
  },
  
  /** AI 辨識身分證（Gemini AI） */
  recognizeIdCard(frontImage: File, backImage: File): Promise<ApiResponseModel<IdCardRecognitionResponse>> {
    const formData = new FormData()
    formData.append('images', frontImage)  // 身分證正面
    formData.append('images', backImage)   // 身分證背面
    
    return request.post('/api/ocr/id-card-multi', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000 // 30 秒逾時
    })
  }
}
```

#### Task 2.2: 實作列表管理邏輯

**檔案**: `src/pages/customer-management/composables/useCustomerManagement.ts`

**關鍵功能**:
- 分頁查詢
- 搜尋防抖（500ms）
- 權限檢查
- 錯誤處理

**參考範例**: `src/pages/user-management/composables/useUserManagement.ts`

#### Task 2.3: 實作表單管理邏輯

**檔案**: `src/pages/customer-management/composables/useCustomerForm.ts`

**關鍵功能**:
- 表單驗證（Element Plus Form Rules）
- 新增/編輯模式切換
- 樂觀鎖定處理（409 Conflict）
- 身分證檢查碼驗證

**參考範例**: `src/pages/user-management/composables/useUserForm.ts`

#### Task 2.4: 實作 AI 辨識邏輯

**檔案**: `src/pages/customer-management/composables/useIdCardOcr.ts`

**關鍵功能**:
- 檔案上傳驗證（格式、大小）
- API 請求處理（loading 狀態、錯誤處理、30 秒逾時）
- 部分辨識處理（某些欄位為 null）
- 自動填入表單

---

## 5. Testing（測試）

### 5.1 Unit Tests

```powershell
# 執行所有測試
pnpm test

# 執行特定測試檔案
pnpm test customer-management

# 監視模式（檔案變更時自動執行）
pnpm test:watch

# 生成覆蓋率報告
pnpm test:coverage
```

### 5.2 Test File Structure

```
tests/
└── pages/
    └── customer-management/
        ├── CustomerList.test.ts
        ├── CustomerForm.test.ts
        ├── useCustomerManagement.test.ts
        ├── useCustomerForm.test.ts
        └── useIdCardOcr.test.ts
```

### 5.3 Example Unit Test

```typescript
// tests/pages/customer-management/useCustomerForm.test.ts
import { describe, it, expect, vi } from 'vitest'
import { useCustomerForm } from '@/pages/customer-management/composables/useCustomerForm'

describe('useCustomerForm', () => {
  it('should validate Taiwan ID number correctly', () => {
    const { validateIdNumber } = useCustomerForm()
    
    expect(validateIdNumber('A123456789')).toBe(true)
    expect(validateIdNumber('Z987654321')).toBe(true)
    expect(validateIdNumber('A123456788')).toBe(false) // 檢查碼錯誤
    expect(validateIdNumber('123456789')).toBe(false)  // 格式錯誤
  })
  
  it('should handle optimistic locking conflict', async () => {
    const { handleUpdateError } = useCustomerForm()
    const error = { response: { status: 409 } }
    
    await expect(handleUpdateError(error)).rejects.toThrow('CONCURRENT_UPDATE_CONFLICT')
  })
})
```

---

## 6. Code Quality（程式碼品質）

### 6.1 Linting

```powershell
# 檢查程式碼風格錯誤
pnpm lint

# 自動修復可修復的錯誤
pnpm lint:fix
```

### 6.2 Type Checking

```powershell
# TypeScript 型別檢查
pnpm type-check
```

### 6.3 Code Review Checklist

提交 PR 前請確認：

- [ ] 所有 TypeScript 錯誤已修復（`pnpm type-check`）
- [ ] 通過 ESLint 檢查（`pnpm lint`）
- [ ] 所有單元測試通過（`pnpm test`）
- [ ] 程式碼包含 JSDoc 註解
- [ ] 遵循專案命名規範（PascalCase 元件、camelCase 變數）
- [ ] 無 console.log（使用 debugger 或移除）
- [ ] 敏感資訊已移除（API Token、測試資料）

---

## 7. Common Issues（常見問題）

### Issue 1: CORS Error

**錯誤訊息**:
```text
Access to XMLHttpRequest at 'http://localhost:5000/api/customers' 
from origin 'http://localhost:3333' has been blocked by CORS policy
```

**解決方案**:
1. 確認後端已啟動 (`http://localhost:5000`)
2. 檢查後端 CORS 設定允許 `http://localhost:3333`
3. 若使用 Nginx，檢查 proxy 設定

---

### Issue 2: 401 Unauthorized

**錯誤訊息**:
```json
{ "success": false, "message": "Unauthorized", "code": 401 }
```

**解決方案**:
1. 檢查 `localStorage.getItem('token')` 是否存在
2. 嘗試重新登入取得新 Token
3. 確認後端 JWT 密鑰一致

---

### Issue 3: 403 Forbidden

**錯誤訊息**:
```json
{ "success": false, "message": "Forbidden", "code": 403 }
```

**解決方案**:
1. 檢查使用者權限是否包含 `customer.read`/`customer.create` 等
2. 在「權限管理」頁面為角色新增客戶管理權限
3. 確認 `v-permission` 指令正確使用

---

### Issue 4: 樂觀鎖定衝突（409）

**錯誤訊息**:
```json
{ "success": false, "message": "Conflict: resource version mismatch", "code": 409 }
```

**原因**: 
其他使用者已修改此客戶資料，導致 `version` 欄位不符。

**解決方案**:
1. 前端自動顯示提示：「此客戶資料已被其他使用者修改，請重新載入」
2. 使用者點擊「重新載入」按鈕
3. 前端重新取得最新資料（包含新的 `version`）
4. 使用者再次修改並提交

---

### Issue 5: AI 辨識逾時（504）

**錯誤訊息**:
```json
{ "success": false, "message": "OCR service timeout", "code": 504 }
```

**解決方案**:
1. 檢查圖片大小是否 > 5MB（前端應已限制）
2. 檢查網路連線速度
3. 嘗試壓縮圖片後重新上傳
4. 若持續失敗，手動輸入資料

---

## 8. Performance Optimization（效能優化）

### 8.1 建議的最佳實務

| 項目 | 建議 | 原因 |
|------|------|------|
| 搜尋防抖 | 500ms | 避免每次輸入都發送 API 請求 |
| 分頁大小 | 20 筆/頁 | 平衡資料量與載入速度 |
| 圖片壓縮 | 前端壓縮至 1MB | 減少上傳時間 |
| 快取策略 | 避免使用 | 資料即時性要求高 |
| Excel 匯出 | 前端處理 | 避免後端負載（資料量 < 5000 筆） |

### 8.2 效能指標

根據 `research.md` 定義：

| 指標 | 目標 | 測試方式 |
|------|------|---------|
| 初始載入時間 | < 3 秒 | Chrome DevTools Lighthouse |
| 路由切換時間 | < 500 毫秒 | Performance 面板 |
| 搜尋回應時間 | < 1 秒 | Network 面板（API 回應時間） |
| Excel 匯出時間 | < 15 秒（5000 筆） | 實測計時 |

---

## 9. Deployment（部署）

### 9.1 Build for Production

```powershell
# 建立生產版本
pnpm build

# 預期輸出目錄：dist/
```

### 9.2 Preview Production Build

```powershell
# 預覽生產版本（本地測試）
pnpm preview

# 開啟 http://localhost:4173
```

### 9.3 Environment Variables

確認 `.env.production` 設定：

```bash
# .env.production
VITE_API_BASE_URL=https://api.realyou.com
VITE_APP_TITLE=客戶管理系統
```

---

## 10. Resources（參考資源）

### 內部文件

- [資料模型設計](./data-model.md)
- [API 合約文件](./contracts/customer-api.md)
- [需求規格書](./spec.md)
- [技術研究文件](./research.md)
- [專案開發規範](../../.github/instructions/copilot-instructions.md)

### 外部文件

| 技術 | 文件連結 |
|------|---------|
| Vue 3 | https://vuejs.org/guide/introduction.html |
| TypeScript | https://www.typescriptlang.org/docs/ |
| Element Plus | https://element-plus.org/zh-CN/component/overview.html |
| Pinia | https://pinia.vuejs.org/introduction.html |
| Vitest | https://vitest.dev/guide/ |

---

## 11. Contact（聯絡資訊）

**問題回報**:
1. 技術問題：在 Slack `#dev-frontend` 頻道詢問
2. Bug 回報：在 GitHub Issues 建立 Issue
3. 功能需求：聯繫產品經理

**Reviewer**:
- Frontend Lead: @frontend-lead
- Tech Lead: @tech-lead

---

**Next Steps**:
- ✅ Quick Start 指南完成
- ➡️ 進入 Phase 1：更新 Agent 上下文
