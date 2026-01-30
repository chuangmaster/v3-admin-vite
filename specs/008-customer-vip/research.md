# Research: 客戶 VIP 會員管理

**Feature**: 008-customer-vip  
**Date**: 2026-01-31  
**Phase**: Phase 0 - Research & Discovery

**目標**: 解決實作前的技術決策問題，確保選擇最適合的工具與模式

---

## 1. 日期時區轉換最佳實踐

### 問題陳述
前端需要在使用者介面顯示本地時區的日期，但與後端 API 互動時必須使用 UTC ISO 8601 格式。需要確定最佳的日期處理庫與轉換模式。

### 研究發現

#### date-fns vs dayjs 比較

| 特性 | date-fns | dayjs |
|------|----------|-------|
| 套件大小 | ~67KB (tree-shakable) | ~2KB (核心) |
| TypeScript 支援 | ✅ 原生支援 | ✅ 原生支援 |
| 時區插件 | `date-fns-tz` (額外套件) | `dayjs/plugin/timezone` |
| API 風格 | 函式式（純函式） | 鏈式呼叫（類似 Moment.js） |
| Vue 3 整合 | ✅ 無狀態，適合 Composition API | ✅ 需小心可變性 |
| 社群活躍度 | 高 (每週 10M+ 下載) | 高 (每週 15M+ 下載) |

#### Element Plus 日期選擇器時區處理

研究 Element Plus `<el-date-picker>` 文件後發現：
- 預設使用瀏覽器本地時區顯示日期
- `v-model` 綁定的是 JavaScript `Date` 物件（本地時區）
- 需要手動轉換為 UTC ISO 8601 字串才能傳送至後端

**範例程式碼**:
```typescript
// 使用者選擇日期：2026-01-31（本地時區）
const localDate = new Date('2026-01-31') // Fri Jan 31 2026 00:00:00 GMT+0800

// 方案 1: date-fns + date-fns-tz
import { zonedTimeToUtc, formatISO } from 'date-fns-tz'
const utcStartOfDay = zonedTimeToUtc(localDate, Intl.DateTimeFormat().resolvedOptions().timeZone)
const isoString = formatISO(utcStartOfDay) // "2026-01-30T16:00:00Z" (UTC)

// 方案 2: dayjs + timezone plugin
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
dayjs.extend(utc)
dayjs.extend(timezone)
const utcStartOfDay = dayjs.tz(localDate, 'Asia/Taipei').utc().format()
```

### 決策: **選擇 dayjs**

**理由**:
1. **套件大小**: dayjs 核心僅 2KB，即使加上 timezone 插件也遠小於 date-fns + date-fns-tz
2. **API 簡潔性**: 鏈式呼叫在日期轉換場景下更直觀易讀
3. **專案現有使用**: 檢查 `package.json` 後發現專案可能已有類似需求（需確認）
4. **Vue 3 兼容性**: 只要在轉換時建立新實例，不會有可變性問題

**替代方案被否決原因**:
- date-fns: 雖然函式式更純粹，但在複雜時區轉換時需要更多樣板程式碼
- 原生 Date API: 時區處理不穩定，需要大量手動計算

**實作建議**:
```typescript
// src/pages/customer-management/composables/useDateConversion.ts
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export function useDateConversion() {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // 本地日期 00:00:00 → UTC ISO 8601
  const toUTCStartOfDay = (localDate: Date): string => {
    return dayjs.tz(localDate, userTimezone).startOf('day').utc().toISOString()
  }

  // 本地日期 23:59:59 → UTC ISO 8601
  const toUTCEndOfDay = (localDate: Date): string => {
    return dayjs.tz(localDate, userTimezone).endOf('day').utc().toISOString()
  }

  // UTC ISO 8601 → 本地 Date 物件（供 el-date-picker 使用）
  const fromUTCToLocal = (isoString: string): Date => {
    return dayjs.utc(isoString).tz(userTimezone).toDate()
  }

  return {
    toUTCStartOfDay,
    toUTCEndOfDay,
    fromUTCToLocal
  }
}
```

---

## 2. Element Plus 元件整合模式

### 問題陳述
需要確定如何在 Vue 3 Composition API 中管理多模式彈窗（新增/編輯/終止）、權限控制與表單驗證。

### 研究發現

#### 多模式 Dialog 管理模式

研究專案現有程式碼（參考 `src/pages/user-management/components/UserDialog.vue`）後發現以下模式：

**模式 1: 單一元件 + Props 控制模式**
```vue
<script setup lang="ts">
type DialogMode = 'create' | 'edit' | 'terminate'

interface Props {
  mode: DialogMode
  modelValue: boolean
  data?: CustomerLevelPeriodResponse
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': [void]
}>()

const dialogTitle = computed(() => {
  switch (props.mode) {
    case 'create': return '新增 VIP 會員'
    case 'edit': return '編輯 VIP 會員'
    case 'terminate': return '終止 VIP 會籍'
  }
})

const showTerminateConfirm = computed(() => props.mode === 'terminate')
</script>
```

**模式 2: 3 個獨立元件**
- `CustomerLevelCreateDialog.vue`
- `CustomerLevelEditDialog.vue`
- `CustomerLevelTerminateDialog.vue`

**決策**: 選擇**模式 1（單一元件 + Props）**  
**理由**:
- 新增與編輯表單欄位完全相同（等級、開始日期、結束日期），重複程式碼多
- 終止模式僅需確認對話框，可用 `v-if` 控制不同內容區塊
- 減少元件檔案數量，維護更簡單

#### 權限控制整合

研究專案的 `v-permission` 指令（`src/plugins/directives/permission.ts`）：

```typescript
// 使用方式
<el-button v-permission="'customer.level.create'" @click="openDialog('create')">
  新增 VIP
</el-button>

<el-button 
  v-permission="'customer.level.update'" 
  @click="openDialog('edit', row)"
  :disabled="row.status === 'Expired'"
>
  編輯
</el-button>
```

**最佳實踐**:
- 操作按鈕使用 `v-permission` 指令隱藏（無權限則不顯示）
- 表單提交前再次檢查權限（防止直接呼叫 API）
- 權限檢查失敗時顯示 Toast 提示

#### Table 排序與操作按鈕

研究 `src/pages/user-management/components/UserTable.vue` 後發現：

```vue
<el-table :data="tableData" :default-sort="{ prop: 'startDate', order: 'descending' }">
  <el-table-column prop="level" label="等級" sortable />
  <el-table-column prop="startDate" label="開始日期" sortable>
    <template #default="{ row }">
      {{ formatDate(row.startDate) }}
    </template>
  </el-table-column>
  <el-table-column label="操作" width="180" fixed="right">
    <template #default="{ row }">
      <el-button 
        v-permission="'customer.level.update'"
        :disabled="row.status === 'Expired'"
        link 
        type="primary"
        @click="handleEdit(row)"
      >
        編輯
      </el-button>
      <el-button 
        v-permission="'customer.level.terminate'"
        :disabled="row.status !== 'Active'"
        link 
        type="danger"
        @click="handleTerminate(row)"
      >
        終止
      </el-button>
    </template>
  </el-table-column>
</el-table>
```

**最佳實踐**:
- 使用 `:default-sort` 控制預設排序（VIP 歷程按 startDate 降序）
- 操作按鈕使用 `link` 類型（更輕量）
- 根據 status 欄位動態 disable 按鈕（Expired 不可編輯，非 Active 不可終止）

#### el-tag 圖示整合

研究 Element Plus Icon 使用方式：

```vue
<script setup lang="ts">
import { Crown } from '@element-plus/icons-vue'
</script>

<template>
  <el-tag v-if="isVIP" type="warning" :icon="Crown" effect="dark">
    VIP
  </el-tag>
</template>
```

**決策**: 使用 **Element Plus Icons** 的 `Crown` 圖示  
**理由**:
- Element Plus 內建圖示，無需額外套件
- 風格與系統其他元件一致
- TypeScript 型別支援完整

---

## 3. 樂觀鎖衝突處理策略

### 問題陳述
後端使用 version 欄位實作樂觀鎖，當更新請求的 version 與資料庫不一致時回傳 HTTP 409 Conflict。前端需要友善處理此情境。

### 研究發現

#### 業界最佳實踐

研究主流 SaaS 產品（Notion, Linear, Asana）的並發處理方式：

1. **自動重新載入方案** (Notion):
   - 偵測到 409 → 自動重新 GET 最新資料
   - 嘗試合併使用者編輯與最新資料
   - 若無法自動合併 → 提示使用者

2. **提示使用者方案** (Linear):
   - 偵測到 409 → 顯示 Toast 訊息「資料已被更新，請重新載入」
   - 提供「重新載入」按鈕
   - 使用者點按後重新 GET 資料

3. **離線編輯方案** (Google Docs):
   - 複雜的 Operational Transformation (OT)
   - 不適用於簡單 CRUD 表單

### 決策: **提示使用者 + 手動重新載入**

**理由**:
1. **VIP 設定並非高頻協作場景**：通常不會有多人同時編輯同一客戶的 VIP 設定
2. **自動合併風險高**：日期範圍修改無法安全自動合併（可能產生邏輯錯誤）
3. **使用者體驗可接受**：衝突機率低，偶發時提示重新操作不影響整體體驗

**實作建議**:
```typescript
// src/pages/customer-management/composables/useCustomerLevel.ts
import { ElMessage } from 'element-plus'

async function updateLevel(levelId: string, data: UpdateLevelRequest) {
  try {
    const response = await updateLevelAPI(levelId, data)
    ElMessage.success('VIP 設定已更新')
    return response
  } catch (error: any) {
    if (error.response?.status === 409) {
      ElMessage.warning({
        message: '資料已被其他使用者更新，請重新載入後再試',
        duration: 5000,
        showClose: true
      })
      // 自動重新載入最新資料
      await fetchLevelHistory()
    } else {
      ElMessage.error('更新失敗：' + (error.message || '未知錯誤'))
    }
    throw error
  }
}
```

**替代方案被否決原因**:
- 自動合併：日期欄位無法安全合併，可能產生業務邏輯錯誤
- 樂觀更新 + Rollback：VIP 設定涉及計費，不適合樂觀更新

---

## 4. 現有客戶管理頁面元件重用分析

### 問題陳述
VIP 功能需要整合進現有的客戶管理頁面，需要確定哪些檔案需要修改、如何修改。

### 研究發現

#### 檔案分析

**`src/pages/customer-management/index.vue`** (主頁面):
- 目前結構：SearchBar + CustomerTable + CustomerDialog
- **需要修改**: 
  - 新增 CustomerLevelDialog 元件引用
  - 新增「VIP 管理」按鈕（在客戶列表的操作欄）
  - 若有客戶詳細頁：新增 CustomerLevelTable 區塊

**`src/pages/customer-management/components/CustomerTable.vue`** (客戶列表):
- 目前欄位：姓名、電話、Email、地址、建立時間、操作
- **需要修改**:
  - 新增「VIP 狀態」欄位（el-table-column）
  - 從客戶資料中取得 activeLevel 狀態
  - 使用 el-tag 顯示 VIP 徽章

**修改範例**:
```vue
<!-- CustomerTable.vue -->
<el-table-column label="VIP 狀態" width="100">
  <template #default="{ row }">
    <el-tag v-if="row.isVIP" type="warning" :icon="Crown" effect="dark">
      VIP
    </el-tag>
    <span v-else class="text-gray-400">-</span>
  </template>
</el-table-column>
```

**`src/pages/customer-management/composables/useCustomerManagement.ts`**:
- 目前功能：fetchCustomers, createCustomer, updateCustomer, deleteCustomer
- **是否需要修改**: 視客戶列表 API 是否需要額外 join VIP 狀態
- **建議**: 
  - 若後端客戶列表 API 已包含 isVIP 欄位 → 無需修改
  - 若需要前端額外呼叫 `/levels/active` → 新增 enrichCustomersWithVIPStatus 方法

#### API 整合模式

**選項 1: 後端統一回傳**（建議）
```typescript
// 後端客戶列表 API 已包含 VIP 狀態
interface CustomerResponse {
  id: string
  name: string
  email: string
  // ... 其他欄位
  isVIP: boolean // 後端計算好的 VIP 狀態
  vipLevel?: string // 可選，當前 VIP 等級
}
```

**選項 2: 前端批次查詢**
```typescript
// 前端在取得客戶列表後，批次查詢 VIP 狀態
async function fetchCustomersWithVIPStatus() {
  const customers = await fetchCustomers()
  const customerIds = customers.map(c => c.id)
  const vipStatuses = await batchGetVIPStatus(customerIds) // 新 API
  return customers.map(c => ({
    ...c,
    isVIP: vipStatuses[c.id]?.isActive || false
  }))
}
```

### 決策: **優先採用選項 1（後端統一回傳）**

**理由**:
1. **效能最佳**: 單一 API 請求，避免 N+1 查詢問題
2. **一致性**: VIP 狀態計算邏輯統一在後端，前端僅負責顯示
3. **擴展性**: 未來若需要在列表顯示 VIP 等級，後端易擴展

**若後端暫不支援選項 1**: 採用選項 2 作為臨時方案，並記錄技術債

---

## 總結

### 所有技術決策清單

| 決策項目 | 選擇 | 理由 |
|---------|------|------|
| 日期處理庫 | **dayjs** | 輕量（2KB）、API 簡潔、時區插件完善 |
| Dialog 管理 | **單一元件 + Props** | 避免重複程式碼，維護簡單 |
| 權限控制 | **v-permission 指令** | 專案現有模式，一致性 |
| Table 排序 | **Element Plus 內建排序** | 無需額外邏輯 |
| 圖示來源 | **Element Plus Icons (Crown)** | 內建、風格一致 |
| 樂觀鎖處理 | **提示使用者 + 手動重新載入** | 衝突機率低、安全性高 |
| VIP 狀態查詢 | **後端統一回傳（選項 1）** | 效能最佳、一致性高 |

### NEEDS CLARIFICATION 解決狀態

✅ 所有研究任務已完成，無遺留的 NEEDS CLARIFICATION 項目

### 下一步

- ✅ **Phase 0 完成**: research.md 已產生
- ⏭️ **Phase 1**: 產生 data-model.md, contracts/, quickstart.md
- ⏭️ **Phase 2**: 詳細任務分解（使用 `/speckit.tasks` 命令）

---

**研究完成日期**: 2026-01-31  
**建議審查者**: 前端架構師、後端 API 負責人
