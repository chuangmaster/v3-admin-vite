# Quickstart Guide: 客戶 VIP 會員管理

**Feature**: 008-customer-vip
**最後更新**: 2026-01-31

快速上手指南，幫助開發者在 5 分鐘內啟動本功能的開發與測試。

---

## 📋 功能概述

允許管理員為客戶設定、查詢、編輯與終止 VIP 會員等級與效期。主要功能：
- ✅ 在客戶列表顯示 VIP 狀態徽章
- ✅ 透過彈窗新增/編輯 VIP 效期（等級、開始日期、結束日期）
- ✅ 查看客戶 VIP 歷程記錄（表格形式）
- ✅ 終止當前有效的 VIP 會籍
- ✅ 日期選擇器顯示本地時區，自動轉換為 UTC ISO 8601 傳送至後端
- ✅ 權限控制（customer.level.create / update / terminate / view）

---

## 🛠️ 前置需求

### 環境要求

- **Node.js**: 18.x 或更高
- **pnpm**: 8.x 或更高
- **瀏覽器**: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+

### 安裝相依套件

若尚未安裝專案相依套件，請執行：

```powershell
# 安裝所有相依套件
pnpm install

# 安裝本功能新增的套件（若需要）
pnpm add dayjs
```

### 後端 API

確認後端 API 已啟動並可存取：

```powershell
# 檢查後端健康狀態
curl http://localhost:5176/api/health

# 查看 Swagger API 文件
# 在瀏覽器開啟：http://localhost:5176/swagger
```

**API 端點清單**:
- `POST /api/customers/{customerId}/levels` - 新增 VIP
- `GET /api/customers/{customerId}/levels` - 查詢歷程
- `GET /api/customers/{customerId}/levels/active` - 查詢當前 VIP
- `PUT /api/customers/{customerId}/levels/{levelId}` - 更新 VIP
- `POST /api/customers/{customerId}/levels/terminate` - 終止 VIP

---

## 🚀 本地開發設定

### 1. 啟動開發伺服器

```powershell
# 啟動前端開發伺服器（預設 port 5173）
pnpm dev
```

### 2. 存取客戶管理頁面

在瀏覽器開啟：http://localhost:5173/#/customer-management

### 3. 登入與權限

使用測試帳號登入（需要 `customer.level.*` 權限）：

```
測試帳號：admin@real-you.com
測試密碼：admin123
```

---

## 📁 目錄結構導覽

```
src/pages/customer-management/
├── index.vue                          # 主頁面（整合 VIP 功能的入口）
├── types.ts                           # 型別定義（包含 VIP 相關介面）
│
├── apis/
│   └── customer-level.ts              # VIP API 服務（封裝所有 HTTP 請求）
│
├── components/
│   ├── CustomerTable.vue              # 客戶列表（顯示 VIP 徽章）
│   ├── CustomerLevelDialog.vue        # VIP 設定彈窗（新增/編輯/終止）
│   └── CustomerLevelTable.vue         # VIP 歷程表格
│
└── composables/
    └── useCustomerLevel.ts            # VIP 業務邏輯（CRUD + 狀態管理）
```

**關鍵檔案說明**:

| 檔案 | 職責 | 編輯頻率 |
|------|------|---------|
| `apis/customer-level.ts` | API 請求封裝、日期轉換 | 低（僅後端 API 變更時） |
| `composables/useCustomerLevel.ts` | 業務邏輯、響應式狀態管理 | 中（新增功能時） |
| `components/CustomerLevelDialog.vue` | VIP 設定表單 UI | 高（UI 調整時） |
| `components/CustomerLevelTable.vue` | VIP 歷程列表 UI | 中（欄位調整時） |
| `types.ts` | TypeScript 型別定義 | 低（資料模型變更時） |

---

## 🔧 常見開發任務

### 任務 1: 新增 VIP 等級選項

**需求**: 目前支援 VIP、VVIP，現在要新增 SVIP。

**步驟**:

1. **更新型別定義** (`types.ts`):
```typescript
export enum CustomerLevel {
  VIP = 'VIP',
}
```

2. **更新彈窗表單選項** (`components/CustomerLevelDialog.vue`):
```vue
<el-select v-model="form.level" placeholder="請選擇 VIP 等級">
  <el-option label="VIP" value="VIP" />
</el-select>
```

3. **更新後端 API 合約** (`contracts/customer-level-api.yaml`):
```yaml
level:
  type: string
  enum:
    - VIP
    - VVIP
    - SVIP  # 新增
```

### 任務 2: 修改日期顯示格式

**需求**: 將日期顯示從 `2026-01-31` 改為 `2026/01/31`。

**步驟**:

1. **修改日期格式化函式** (`composables/useCustomerLevel.ts` 或新增 `common/utils/date.ts`):
```typescript
import dayjs from 'dayjs'

export function formatDate(isoString: string): string {
  return dayjs(isoString).format('YYYY/MM/DD') // 原本可能是 'YYYY-MM-DD'
}
```

2. **更新顯示元件** (`components/CustomerLevelTable.vue`):
```vue
<el-table-column label="開始日期">
  <template #default="{ row }">
    {{ formatDate(row.startDate) }}
  </template>
</el-table-column>
```

### 任務 3: 新增權限檢查

**需求**: 根據使用者權限隱藏特定操作按鈕。

**步驟**:

1. **在元件中使用 `v-permission` 指令** (`components/CustomerLevelTable.vue`):
```vue
<el-button
  v-permission="'customer.level.create'"
  @click="openCreateDialog"
>
  新增 VIP
</el-button>

<el-button
  v-permission="'customer.level.terminate'"
  :disabled="row.status !== 'Active'"
  @click="handleTerminate(row)"
>
  終止
</el-button>
```

2. **權限碼清單**:
- `customer.level.create` - 新增 VIP
- `customer.level.read` - 查詢當前 VIP 狀態
- `customer.level.update` - 編輯 VIP 效期
- `customer.level.terminate` - 終止 VIP
- `customer.level.view` - 查看 VIP 歷程

### 任務 4: 調整樂觀鎖錯誤提示

**需求**: 當發生版本衝突時，自動重新載入資料並提示使用者。

**步驟**:

1. **修改錯誤處理邏輯** (`composables/useCustomerLevel.ts`):
```typescript
async function updateLevel(levelId: string, data: UpdateLevelRequest) {
  try {
    const response = await updateLevelAPI(levelId, data)
    ElMessage.success('VIP 設定已更新')
    return response
  } catch (error: any) {
    if (error.response?.status === 409) {
      ElMessage.warning({
        message: '資料已被其他使用者更新，正在重新載入...',
        duration: 3000
      })
      // 自動重新載入最新資料
      await fetchLevelHistory(data.customerId)
    } else {
      ElMessage.error('更新失敗：' + (error.message || '未知錯誤'))
    }
    throw error
  }
}
```

---

## 🧪 測試執行方法

### 單元測試

執行 VIP 相關的單元測試：

```powershell
# 執行所有 customer-management 相關測試
pnpm test src/pages/customer-management

# 僅執行 VIP 組合式函式測試
pnpm test src/pages/customer-management/composables/useCustomerLevel.test.ts

# 執行測試並產生覆蓋率報告
pnpm test:coverage
```

### 手動測試清單

在瀏覽器中手動測試以下情境：

- [ ] 客戶列表顯示 VIP 徽章（有 Active VIP 的客戶顯示皇冠圖示）
- [ ] 點按「VIP 管理」按鈕開啟彈窗
- [ ] 新增 VIP：選擇等級、選擇日期、提交成功
- [ ] 日期選擇器顯示本地時區時間
- [ ] VIP 歷程表格正確顯示所有記錄（按 startDate 降序排序）
- [ ] 編輯 VIP：修改等級或日期、提交成功
- [ ] 終止 VIP：點按終止按鈕、確認對話框、終止成功
- [ ] 樂觀鎖測試：開啟兩個瀏覽器分頁，同時編輯同一 VIP 記錄，後提交的應看到衝突提示
- [ ] 權限控制：使用無權限帳號登入，確認相關按鈕隱藏

---

## 🐛 常見問題排查

### 問題 1: 日期轉換錯誤

**現象**: 使用者選擇 2026-01-31，但後端收到 2026-01-30。

**原因**: 時區轉換邏輯錯誤，未考慮使用者本地時區。

**解決**:
```typescript
// ❌ 錯誤寫法（直接使用 Date.toISOString()）
const isoString = new Date('2026-01-31').toISOString() // "2026-01-30T16:00:00Z" (若本地為 GMT+8)

// ✅ 正確寫法（使用 useDateConversion）
import { useDateConversion } from '@@/composables/useDateConversion'
const { toUTCStartOfDay } = useDateConversion()
const isoString = toUTCStartOfDay(new Date('2026-01-31')) // "2026-01-31T00:00:00Z"
```

### 問題 2: VIP 徽章未顯示

**現象**: 客戶明明有 Active VIP，但列表未顯示徽章。

**檢查步驟**:
1. 確認後端 API `/api/customers/search` 回傳的客戶資料包含 `activePeriod` 欄位
2. 確認 `isCurrentlyAtLevel === true` 或 `activePeriod.status === "Active"` （而非 `Expired` 或 `Upcoming`）
3. 確認 `CustomerTable.vue` 的判定邏輯正確（優先使用 `isCurrentlyAtLevel`）：
```vue
<!-- 推薦寫法：直接使用後端計算好的 boolean -->
<el-tag v-if="row.isCurrentlyAtLevel" ...>
  {{ row.activePeriod?.level }}
</el-tag>

<!-- 或使用 status 判斷 -->
<el-tag v-if="row.activePeriod?.status === 'Active'" ...>
  {{ row.activePeriod?.level }}
</el-tag>
```

**後端 API 回傳範例**:
```json
{
  "id": "fa2d8c89-643c-4113-9841-39833aee7186",
  "name": "詹滋嫦",
  "isCurrentlyAtLevel": true,
  "currentLevel": "VIP",
  "activePeriod": {
    "id": "f81d17a6-f659-459c-838f-8af5ac47f59e",
    "level": "VIP",
    "status": "Active",
    "startDate": "2026-01-29T17:01:12.156Z",
    "endDate": "2027-01-29T17:01:12.156Z"
  }
}
```

### 問題 3: 權限按鈕仍然顯示

**現象**: 使用者沒有 `customer.level.create` 權限，但「新增 VIP」按鈕仍然顯示。

**檢查步驟**:
1. 確認已正確使用 `v-permission` 指令
2. 確認 JWT Token 包含正確的權限清單（在瀏覽器 DevTools Network 查看 Authorization header）
3. 確認 `v-permission` 指令已在 `src/plugins/directives/permission.ts` 正確註冊

---

## 📚 延伸閱讀

- [完整 API 規格](./contracts/customer-level-api.yaml)
- [資料模型文件](./data-model.md)
- [技術研究報告](./research.md)
- [實作計畫](./plan.md)

---

## 💡 開發建議

1. **時區處理**: 統一使用 `useDateConversion` 組合式函式，避免手動計算時區
2. **錯誤處理**: 所有 API 請求必須包含 try-catch，並顯示友善的錯誤訊息
3. **權限檢查**: 前端 `v-permission` + 後端 API 雙重檢查，避免安全漏洞
4. **樂觀鎖**: 編輯時必須帶上 `version` 欄位，處理 409 Conflict
5. **測試**: 關鍵業務邏輯（日期轉換、樂觀鎖）必須撰寫單元測試

---

**最後更新**: 2026-01-31
**維護者**: Real You Development Team
**回報問題**: [GitHub Issues](https://github.com/real-you/issues)
