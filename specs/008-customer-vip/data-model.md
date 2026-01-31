# Data Model: 客戶 VIP 會員管理

**Feature**: 008-customer-vip
**Date**: 2026-01-31
**Phase**: Phase 1 - Design & Contracts

---

## 核心實體

### 1. CustomerLevelPeriod (VIP 會員效期)

VIP 會員效期記錄，表示客戶在特定時間區間內的 VIP 等級。

#### 屬性

| 欄位名稱 | 型別 | 必填 | 說明 | 約束 |
|---------|------|------|------|------|
| `id` | `string` (UUID) | ✅ | 唯一識別碼 | Primary Key, 後端產生 |
| `customerId` | `string` (UUID) | ✅ | 所屬客戶 ID | Foreign Key → Customer |
| `level` | `string` | ✅ | VIP 等級 | 列舉: "VIP", "VVIP" 等 |
| `startDate` | `string` (ISO 8601) | ✅ | 效期開始日期 | UTC 時間，格式: `2026-01-31T00:00:00Z` |
| `endDate` | `string` (ISO 8601) | ✅ | 效期結束日期 | UTC 時間，格式: `2026-12-31T23:59:59Z` |
| `status` | `CustomerLevelStatus` | ✅ | 當前狀態 | 列舉: "Active", "Expired", "Upcoming" |
| `createdAt` | `string` (ISO 8601) | ✅ | 建立時間 | 後端自動產生，UTC 時間 |
| `updatedAt` | `string \| null` (ISO 8601) | - | 最後更新時間 | 後端自動更新，UTC 時間 |
| `version` | `number` | ✅ | 版本號 | 樂觀鎖，初始值為 1，每次更新 +1 |

#### TypeScript 定義

```typescript
/**
 * VIP 會員效期回應（從後端 API 取得）
 */
interface CustomerLevelPeriodResponse {
  /** 唯一識別碼 (UUID) */
  id: string

  /** 所屬客戶 ID (UUID) */
  customerId: string

  /** VIP 等級（例如: "VIP", "VVIP"） */
  level: string

  /** 效期開始日期（UTC ISO 8601 格式） */
  startDate: string

  /** 效期結束日期（UTC ISO 8601 格式） */
  endDate: string

  /** 當前狀態 */
  status: CustomerLevelStatus

  /** 建立時間（UTC ISO 8601 格式） */
  createdAt: string

  /** 最後更新時間（UTC ISO 8601 格式，可為 null） */
  updatedAt: string | null

  /** 樂觀鎖版本號 */
  version: number
}

/**
 * VIP 會員狀態列舉
 */
enum CustomerLevelStatus {
  /** 進行中（當前時間在 startDate 與 endDate 之間） */
  Active = 'Active',

  /** 已過期（當前時間 >= endDate） */
  Expired = 'Expired',

  /** 即將生效（當前時間 < startDate） */
  Upcoming = 'Upcoming'
}

/**
 * VIP 等級列舉
 */
enum CustomerLevel {
  VIP = 'VIP',
  VVIP = 'VVIP'
  // 未來可擴展其他等級
}
```

#### 狀態轉換圖

```
[新建]
  ↓
  ├─ startDate > now → [Upcoming]
  │                        ↓ (當 now >= startDate)
  │                    [Active]
  │                        ↓ (當 now >= endDate 或手動終止)
  │                    [Expired]
  │
  └─ startDate <= now < endDate → [Active]
                                     ↓
                                 [Expired]
```

**狀態轉換規則**:
1. **新建時自動判定初始狀態**:
   - `startDate > now` → `Upcoming`
   - `startDate <= now < endDate` → `Active`

2. **自動狀態轉換**（後端定時任務或查詢時計算）:
   - `Upcoming` → `Active`: 當系統時間達到 `startDate`
   - `Active` → `Expired`: 當系統時間達到 `endDate`

3. **手動終止**:
   - 僅 `Active` 狀態可終止
   - 終止操作：更新 `endDate` 為當前 UTC 時間 - 1 秒
   - 狀態自動變為 `Expired`

#### 驗證規則

前端驗證（表單提交前）:
```typescript
interface ValidationRule {
  // 必填欄位
  level: { required: true, message: '請選擇 VIP 等級' }
  startDate: { required: true, message: '請選擇開始日期' }
  endDate: { required: true, message: '請選擇結束日期' }

  // 日期範圍驗證
  dateRange: {
    validator: (value: any, callback: Function) => {
      if (form.endDate <= form.startDate) {
        callback(new Error('結束日期必須晚於開始日期'))
      } else {
        callback()
      }
    }
  }
}
```

後端驗證（API 層）:
- ✅ `startDate` 必須 < `endDate`
- ✅ 新建或編輯時，不可與同一客戶的現有 `Active` 期間重疊
- ✅ 僅 `Active` 或 `Upcoming` 狀態可被編輯
- ✅ 僅 `Active` 狀態可被終止
- ✅ 更新時 `version` 必須與資料庫一致（樂觀鎖）

---

## 請求/回應模型

### 2.1 CreateLevelRequest (新增 VIP 請求)

前端傳送至後端的新增 VIP 請求。

```typescript
/**
 * 新增 VIP 會員效期請求
 */
interface CreateLevelRequest {
  /** VIP 等級 */
  level: string

  /** 效期開始日期（UTC ISO 8601，必須為該日 00:00:00Z） */
  startDate: string

  /** 效期結束日期（UTC ISO 8601，必須為該日 23:59:59Z） */
  endDate: string
}
```

**範例**:
```json
{
  "level": "VIP",
  "startDate": "2026-01-31T00:00:00Z",
  "endDate": "2026-12-31T23:59:59Z"
}
```

**前端處理邏輯**:
```typescript
// 使用者在日期選擇器選擇本地日期
const localStartDate = new Date('2026-01-31') // 本地時區 00:00:00
const localEndDate = new Date('2026-12-31')   // 本地時區 00:00:00

// 轉換為 UTC ISO 8601
import { useDateConversion } from '@@/composables/useDateConversion'
const { toUTCStartOfDay, toUTCEndOfDay } = useDateConversion()

const request: CreateLevelRequest = {
  level: 'VIP',
  startDate: toUTCStartOfDay(localStartDate),  // "2026-01-30T16:00:00Z" (若本地為 GMT+8)
  endDate: toUTCEndOfDay(localEndDate)         // "2026-12-31T15:59:59Z" (若本地為 GMT+8)
}
```

### 2.2 UpdateLevelRequest (更新 VIP 請求)

前端傳送至後端的更新 VIP 請求（包含樂觀鎖版本號）。

```typescript
/**
 * 更新 VIP 會員效期請求
 */
interface UpdateLevelRequest {
  /** VIP 等級 */
  level: string

  /** 效期開始日期（UTC ISO 8601） */
  startDate: string

  /** 效期結束日期（UTC ISO 8601） */
  endDate: string

  /** 樂觀鎖版本號（必須與當前資料庫版本一致） */
  version: number
}
```

**範例**:
```json
{
  "level": "VVIP",
  "startDate": "2026-02-01T00:00:00Z",
  "endDate": "2027-01-31T23:59:59Z",
  "version": 2
}
```

**樂觀鎖處理流程**:
```typescript
// 1. 編輯時先載入當前資料
const currentData = await getActiveLevel(customerId)

// 2. 使用者修改表單
const form = {
  level: 'VVIP',
  startDate: new Date('2026-02-01'),
  endDate: new Date('2027-01-31')
}

// 3. 提交時帶上原始 version
const request: UpdateLevelRequest = {
  level: form.level,
  startDate: toUTCStartOfDay(form.startDate),
  endDate: toUTCEndOfDay(form.endDate),
  version: currentData.version // 必須是原始資料的版本號
}

// 4. 若後端回傳 409 Conflict
try {
  await updateLevel(currentData.id, request)
} catch (error) {
  if (error.response?.status === 409) {
    // 提示使用者資料已被更新，需重新載入
    ElMessage.warning('資料已被其他使用者更新，請重新載入後再試')
    // 重新載入最新資料
    await fetchLevelHistory()
  }
}
```

---

## 擴展實體

### 2. Customer (客戶實體擴展)

客戶實體擴展以支援 VIP 會員等級功能。後端在回傳客戶列表時會自動附加當前有效的 VIP 資訊。

#### 新增屬性

| 欄位名稱 | 型別 | 必填 | 說明 | 約束 |
|---------|------|------|------|------|
| `isCurrentlyAtLevel` | `boolean` | ✅ | 是否當前有有效等級 | 由後端計算並回傳 |
| `currentLevel` | `string \| null` | - | 當前等級名稱 | 若無有效等級則為 null |
| `activePeriod` | `CustomerLevelPeriodResponse \| null` | - | 當前有效的會員等級詳細資訊 | 若無有效等級則為 null |

#### TypeScript 定義

```typescript
/**
 * 客戶實體（擴展 VIP 會員等級支援）
 * 對應後端 API: GET /api/customers/search
 */
interface Customer {
  /** 客戶唯一識別碼（UUID） */
  id: string

  /** 客戶姓名（必填，1-100 字元） */
  name: string

  /** 聯絡電話（必填，台灣手機格式：10 字元） */
  phoneNumber: string

  /** 電子郵件（選填，最多 100 字元，需符合 email 格式） */
  email: string | null

  /** 身分證字號/外籍人士格式（必填，10 字元） */
  idNumber: string

  /** 居住地址（必填，1-200 字元） */
  residentialAddress: string

  /** LINE ID（選填，最多 50 字元） */
  lineId: string | null

  /** 建立時間（ISO 8601 格式，UTC） */
  createdAt: string

  /** 最後更新時間（ISO 8601 格式，UTC，可為 null） */
  updatedAt: string | null

  /** 資料版本號（用於樂觀鎖定，從 1 開始） */
  version: number

  /** 是否當前有有效等級（由後端 API 回傳） */
  isCurrentlyAtLevel: boolean

  /** 當前等級名稱（由後端 API 回傳，若無有效等級則為 null） */
  currentLevel: string | null

  /** 當前有效的會員等級詳細資訊（由後端 API 回傳，若無有效等級則為 null） */
  activePeriod: CustomerLevelPeriodResponse | null
}
```

#### 後端 API 回應範例

```json
{
  "id": "fa2d8c89-643c-4113-9841-39833aee7186",
  "name": "詹滋嫺",
  "phoneNumber": "0912345678",
  "email": "example@gmail.com",
  "idNumber": "U223456789",
  "residentialAddress": "高雄市鳳山區王生明路26號",
  "lineId": "example_line",
  "createdAt": "2026-01-03T10:26:05.141Z",
  "updatedAt": "2026-01-28T16:19:50.507Z",
  "version": 3,
  "isCurrentlyAtLevel": true,
  "currentLevel": "VIP",
  "activePeriod": {
    "id": "f81d17a6-f659-459c-838f-8af5ac47f59e",
    "customerId": "fa2d8c89-643c-4113-9841-39833aee7186",
    "level": "VIP",
    "startDate": "2026-01-29T17:01:12.156Z",
    "endDate": "2027-01-29T17:01:12.156Z",
    "status": "Active",
    "createdAt": "2026-01-29T17:04:30.630Z",
    "version": 1
  }
}
```

**前端使用範例**:
```typescript
// 在客戶列表顯示等級徽章（推薦：直接使用後端計算好的 boolean）
const hasActiveLevel = (customer: Customer) => {
  return customer.isCurrentlyAtLevel
}

// 或使用 activePeriod.status 判斷（較冗長）
const hasActiveLevelAlt = (customer: Customer) => {
  return customer.activePeriod?.status === CustomerLevelStatus.Active
}

// 取得當前等級名稱
const getLevelName = (customer: Customer) => {
  return customer.currentLevel || '-'
}
```

**效能優化**:
- ✅ 前端無需額外查詢每位客戶的 VIP 狀態
- ✅ 後端在列表 API 一次回傳所有資料（避免 N+1 查詢問題）
- ✅ `isCurrentlyAtLevel` 提供快速判斷，無需檢查 `activePeriod` 是否為 null

---

## 關聯關係

### Customer ↔ CustomerLevelPeriod

```
Customer (1) ──── (0..N) CustomerLevelPeriod
```

- 一個客戶可以有 0 到多筆 VIP 效期記錄
- 一筆 VIP 效期記錄屬於一個客戶
- 在任意時間點，一個客戶最多只能有「一筆 Active 狀態」的記錄

**查詢範例**:
```typescript
// 查詢客戶當前有效 VIP
GET /api/customers/{customerId}/levels/active
→ 回傳單一 CustomerLevelPeriodResponse 或 404

// 查詢客戶所有 VIP 歷程（包含過期）
GET /api/customers/{customerId}/levels?includeExpired=true
→ 回傳 CustomerLevelPeriodResponse[]

// 查詢客戶未過期的 VIP（包含 Active 與 Upcoming）
GET /api/customers/{customerId}/levels?includeExpired=false
→ 回傳 CustomerLevelPeriodResponse[]
```

---

## 索引建議（供後端參考）

為了優化查詢效能，建議後端資料表建立以下索引：

```sql
-- 主鍵
PRIMARY KEY (id)

-- 客戶 ID 索引（查詢特定客戶的 VIP 記錄）
INDEX idx_customer_id (customerId)

-- 客戶 ID + 狀態組合索引（查詢客戶當前 Active VIP）
INDEX idx_customer_status (customerId, status)

-- 日期範圍索引（查詢特定時間區間的 VIP）
INDEX idx_date_range (startDate, endDate)
```

---

## 前端狀態管理

### Pinia Store (可選)

若 VIP 狀態需要在多個元件間共享，可建立 Pinia Store：

```typescript
// src/pinia/stores/customer-level.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CustomerLevelPeriodResponse } from '@/pages/customer-management/types'

export const useCustomerLevelStore = defineStore('customerLevel', () => {
  // 當前客戶的 VIP 歷程
  const levelHistory = ref<CustomerLevelPeriodResponse[]>([])

  // 當前有效的 VIP
  const activeLevel = ref<CustomerLevelPeriodResponse | null>(null)

  // 是否正在載入
  const loading = ref(false)

  return {
    levelHistory,
    activeLevel,
    loading
  }
})
```

**建議**: 由於 VIP 資料通常與特定客戶綁定，優先使用元件內 `composables` 管理狀態（`useCustomerLevel.ts`），僅在需要跨頁面共享時才使用 Pinia Store。

---

## 錯誤處理

### 前端需處理的 HTTP 錯誤

| HTTP Status | 錯誤情境 | 前端處理方式 |
|-------------|---------|-------------|
| `400 Bad Request` | 請求參數錯誤（日期格式錯誤、startDate >= endDate） | 顯示錯誤訊息，提示使用者檢查輸入 |
| `404 Not Found` | 查詢 active VIP 時無結果、終止時無 active VIP | 顯示「目前無有效 VIP」，隱藏終止按鈕 |
| `409 Conflict` | 樂觀鎖衝突（version 不一致）或與現有期間重疊 | 提示「資料已更新，請重新載入」，自動刷新列表 |
| `500 Internal Server Error` | 後端伺服器錯誤 | 顯示通用錯誤訊息，記錄到錯誤追蹤系統 |

### 錯誤訊息範例

```typescript
const ERROR_MESSAGES = {
  400: '請求參數錯誤，請檢查日期範圍設定',
  404: '查無有效的 VIP 會籍',
  409: '資料已被其他使用者更新，請重新載入後再試',
  500: '系統錯誤，請稍後再試或聯絡系統管理員'
}
```

---

## 測試資料範例

### 測試案例 1: 有效 VIP

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "customerId": "c1d2e3f4-a5b6-7890-cdef-ab1234567890",
  "level": "VIP",
  "startDate": "2026-01-01T00:00:00Z",
  "endDate": "2026-12-31T23:59:59Z",
  "status": "Active",
  "createdAt": "2026-01-01T08:30:00Z",
  "updatedAt": null,
  "version": 1
}
```

### 測試案例 2: 已過期 VIP

```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "customerId": "c1d2e3f4-a5b6-7890-cdef-ab1234567890",
  "level": "VIP",
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-12-31T23:59:59Z",
  "status": "Expired",
  "createdAt": "2025-01-01T09:00:00Z",
  "updatedAt": "2025-12-31T23:59:59Z",
  "version": 1
}
```

### 測試案例 3: 即將生效 VIP

```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "customerId": "c1d2e3f4-a5b6-7890-cdef-ab1234567890",
  "level": "VVIP",
  "startDate": "2027-01-01T00:00:00Z",
  "endDate": "2027-12-31T23:59:59Z",
  "status": "Upcoming",
  "createdAt": "2026-12-15T10:20:30Z",
  "updatedAt": null,
  "version": 1
}
```

---

## 資料模型版本歷史

| 版本 | 日期 | 變更內容 |
|------|------|---------|
| 1.0 | 2026-01-31 | 初始版本：定義 CustomerLevelPeriod 實體與相關模型 |
| 1.1 | 2026-02-01 | 擴展 Customer 實體：新增 `isCurrentlyAtLevel`、`currentLevel`、`activePeriod` 欄位支援前端直接取得 VIP 狀態（避免 N+1 查詢） |

---

**完成日期**: 2026-02-01
**最後更新**: 2026-02-01
