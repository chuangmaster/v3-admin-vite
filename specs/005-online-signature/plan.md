# Implementation Plan: 線上簽章請求

**Feature Branch**: `005-online-signature`  
**Created**: 2026-01-10  
**Status**: Ready for Implementation  
**Spec**: [spec.md](./spec.md)

---

## 概述

本功能為服務單管理模組新增線上簽章請求功能，讓服務人員可以透過 UI 發送簽章請求給線上客戶，並管理簽章狀態。功能包含：發送簽章請求、重新發送請求、複製簽章連結、查看簽章狀態。

### 技術棧

- **框架**: Vue 3.5+ (Composition API + `<script setup>`)
- **UI 庫**: Element Plus
- **狀態管理**: Pinia（如需要）
- **HTTP 客戶端**: Axios
- **語言**: TypeScript
- **樣式**: SCSS (Scoped)

---

## 架構設計

### 目錄結構

本功能屬於現有 `service-order-management` 模組的擴展，不需要創建新模組目錄。修改與新增的檔案：

```
src/pages/service-order-management/
├── types.ts                           # 【修改】新增線上簽章相關型別
├── detail.vue                         # 【修改】新增線上簽章區塊
├── apis/
│   └── online-signature.ts            # 【新增】線上簽章 API
└── components/
    └── OnlineSignatureSection.vue     # 【新增】線上簽章區塊元件
```

---

## 第一階段：資料模型與型別定義

### 1.1 新增簽章狀態列舉

**檔案**: `src/pages/service-order-management/types.ts`

```typescript
/** 線上簽章狀態 */
export enum OnlineSignatureStatus {
  /** 待簽名 */
  PENDING = "PENDING",
  /** 完成簽名 */
  COMPLETED = "COMPLETED",
  /** 已中止 */
  TERMINATED = "TERMINATED"
}
```

### 1.2 擴展 SignatureRecord 型別

**檔案**: `src/pages/service-order-management/types.ts`

修改現有的 `SignatureRecord` 介面，新增線上簽章相關欄位：

```typescript
/** 簽名記錄實體 */
export interface SignatureRecord {
  /** 唯一識別碼（UUID） */
  id: string
  /** 服務單 ID */
  serviceOrderId: string
  /** 簽名文件類型 */
  documentType: DocumentType
  /** 簽名類型（用於顯示） */
  signatureType?: string
  /** 簽名資料（Base64 PNG，僅線下簽名） */
  signatureData?: string
  /** 簽名 URL（用於顯示簽名圖片） */
  signatureUrl?: string
  /** 簽名方式 */
  signatureMethod: SignatureMethod
  /** Dropbox Sign 請求 ID（僅線上簽名） */
  dropboxSignRequestId?: string
  /** 簽名者姓名 */
  signerName: string
  /** 簽名時間（ISO 8601, UTC） */
  signedAt: string
  
  // === 新增欄位 ===
  /** 線上簽章狀態（僅線上簽名） */
  status?: OnlineSignatureStatus
  /** 發送時間（ISO 8601, UTC，僅線上簽名） */
  sentAt?: string
  /** 到期時間（ISO 8601, UTC，僅線上簽名） */
  expiresAt?: string
  /** 最後通知時間（ISO 8601, UTC，用於頻率限制） */
  lastNotifiedAt?: string
}
```

### 1.3 新增 API 請求與回應型別

**檔案**: `src/pages/service-order-management/types.ts`

```typescript
/** 發送線上簽章請求（選填參數） */
export interface SendOnlineSignatureRequest {
  /** 自訂訊息（選填，最多 500 字元） */
  customMessage?: string
}

/** 發送線上簽章請求回應 */
export interface SendOnlineSignatureResponse {
  /** 簽章紀錄 ID */
  signatureRecordId: string
  /** Dropbox Sign 請求 ID */
  dropboxSignRequestId?: string
  /** 簽章 URL */
  signatureUrl?: string
  /** 發送時間（ISO 8601, UTC） */
  sentAt: string
  /** 到期時間（ISO 8601, UTC） */
  expiresAt: string
  /** 訊息 */
  message?: string
}
```

---

## 第二階段：API 服務層

### 2.1 創建線上簽章 API 服務

**檔案**: `src/pages/service-order-management/apis/online-signature.ts`

```typescript
/**
 * 線上簽章 API 服務
 * @module @/pages/service-order-management/apis/online-signature
 */

import type { ApiResponse } from "@@/types/api"
import type {
  SendOnlineSignatureRequest,
  SendOnlineSignatureResponse
} from "../types"
import { request } from "@/http/axios"

/**
 * 發送線上簽章請求
 * @param serviceOrderId - 服務單 ID
 * @param data - 發送請求資料（可選）
 * @returns 簽章請求回應
 */
export async function sendOnlineSignature(
  serviceOrderId: string,
  data?: SendOnlineSignatureRequest
): Promise<ApiResponse<SendOnlineSignatureResponse>> {
  return request({
    url: `/api/service-orders/${serviceOrderId}/signatures/online`,
    method: "POST",
    data: data || {}
  })
}

/**
 * 重新發送線上簽章請求
 * @param serviceOrderId - 服務單 ID
 * @returns 簽章請求回應
 */
export async function resendOnlineSignature(
  serviceOrderId: string
): Promise<ApiResponse<SendOnlineSignatureResponse>> {
  return request({
    url: `/api/service-orders/${serviceOrderId}/signatures/online/resend`,
    method: "POST"
  })
}
```

**API 端點說明**：
- `POST /api/service-orders/{serviceOrderId}/signatures/online` - 發送簽章請求
- `POST /api/service-orders/{serviceOrderId}/signatures/online/resend` - 重新發送簽章請求（不需要 signatureRecordId）

---

## 第三階段：業務邏輯層（組合式函式）

### 3.1 創建線上簽章管理組合式函式

**檔案**: `src/pages/service-order-management/composables/useOnlineSignature.ts`

```typescript
import type { SignatureRecord } from "../types"
import { ElMessage, ElMessageBox } from "element-plus"
import { ref } from "vue"
import * as onlineSignatureApi from "../apis/online-signature"

/**
 * 線上簽章管理組合式函式
 */
export function useOnlineSignature() {
  /** 載入狀態 */
  const loading = ref(false)
  
  /**
   * 發送線上簽章請求
   * @param serviceOrderId - 服務單 ID
   * @param customMessage - 自訂訊息（選填）
   */
  async function sendSignatureRequest(
    serviceOrderId: string,
    customMessage?: string
  ): Promise<boolean> {
    loading.value = true
    try {
      const response = await onlineSignatureApi.sendOnlineSignature(
        serviceOrderId,
        customMessage ? { customMessage } : undefined
      )
      
      if (response.success) {
        ElMessage.success("簽章請求已成功發送")
        return true
      }
      return false
    } catch (error) {
      console.error("發送簽章請求失敗:", error)
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 重新發送線上簽章請求
   * @param serviceOrderId - 服務單 ID
   */
  async function resendSignatureRequest(
    serviceOrderId: string
  ): Promise<boolean> {
    loading.value = true
    try {
      const response = await onlineSignatureApi.resendOnlineSignature(
        serviceOrderId
      )
      
      if (response.success) {
        ElMessage.success("簽章請求已重新發送")
        return true
      }
      
      return false
    } catch (error) {
      console.error("重新發送簽章請求失敗:", error)
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 複製簽章連結
   * @param signatureUrl - 簽章 URL
   */
  async function copySignatureUrl(signatureUrl: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(signatureUrl)
      ElMessage.success("連結已複製")
    } catch (error) {
      console.error("複製失敗:", error)
      ElMessage.error("複製失敗，請手動複製")
    }
  }
  
  /**
   * 取得簽章狀態文字
   * @param status - 簽章狀態
   */
  function getStatusText(status?: string): string {
    const statusMap: Record<string, string> = {
      PENDING: "待簽名",
      COMPLETED: "已完成",
      TERMINATED: "已中止"
    }
    return status ? statusMap[status] || status : "-"
  }
  
  /**
   * 取得簽章狀態標籤類型
   * @param status - 簽章狀態
   */
  function getStatusType(status?: string): string {
    const typeMap: Record<string, string> = {
      PENDING: "warning",
      COMPLETED: "success",
      TERMINATED: "info"
    }
    return status ? typeMap[status] || "info" : "info"
  }
  
  /**
   * 檢查是否可以重新發送
   * @param record - 簽章紀錄
   */
  function canResend(record: SignatureRecord): boolean {
    // 僅 PENDING 狀態可以重新發送
    return record.status === "PENDING"
  }
  
  /**
   * 檢查是否可以複製連結
   * @param record - 簽章紀錄
   */
  function canCopyUrl(record: SignatureRecord): boolean {
    // 有簽章 URL 且狀態為 PENDING 或 COMPLETED
    return !!(
      record.signatureUrl &&
      (record.status === "PENDING" || record.status === "COMPLETED")
    )
  }
  
  return {
    loading,
    sendSignatureRequest,
    resendSignatureRequest,
    copySignatureUrl,
    getStatusText,
    getStatusType,
    canResend,
    canCopyUrl
  }
}
```

---

## 第四階段：UI 元件層

### 4.1 創建線上簽章區塊元件

**檔案**: `src/pages/service-order-management/components/OnlineSignatureSection.vue`

```vue
<script setup lang="ts">
import type { ServiceOrder, SignatureRecord } from "../types"
import { CopyDocument, Refresh, Send } from "@element-plus/icons-vue"
import { computed } from "vue"
import { formatDateTime } from "@@/utils/datetime"
import { useOnlineSignature } from "../composables/useOnlineSignature"

interface Props {
  /** 服務單資料 */
  serviceOrder: ServiceOrder
}

interface Emits {
  /** 操作成功事件（需要重新載入服務單） */
  (e: "success"): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const {
  loading,
  sendSignatureRequest,
  resendSignatureRequest,
  copySignatureUrl,
  getStatusText,
  getStatusType,
  canResend,
  canCopyUrl
} = useOnlineSignature()

/**
 * 線上簽章紀錄（篩選出 ONLINE 類型）
 */
const onlineSignatureRecords = computed(() => {
  return props.serviceOrder.signatureRecords?.filter(
    record => record.signatureMethod === "ONLINE"
  ) || []
})

/**
 * 是否有線上簽章紀錄
 */
const hasOnlineSignature = computed(() => {
  return onlineSignatureRecords.value.length > 0
})

/**
 * 是否可以發送簽章請求
 * 條件：服務單來源為線上 && 尚未有線上簽章紀錄
 */
const canSendRequest = computed(() => {
  return (
    props.serviceOrder.orderSource === "ONLINE" &&
    !hasOnlineSignature.value
  )
})

/**
 * 處理發送簽章請求
 */
async function handleSendRequest(): Promise<void> {
  // 假設發送收購合約簽章請求
  // TODO: 根據服務單類型決定 documentType
  const documentType = props.serviceOrder.orderType === "BUYBACK"
    ?不需要指定 documentType，後端會根據服務單類型自動決定
  const success = await sendSignatureRequest(
    props.serviceOrder.id
    emit("success")
  }
}

/**
 * 處理重新發送簽章請求
 */
async function handleResend(record: SignatureRecord): Promise<void> {
  const success = await resendSignatureRequest(
    props.serviceOrder.id,
    record.id
  )
  
  if (success) {): Promise<void> {
  const success = await resendSignatureRequest(
    props.serviceOrder

/**
 * 處理複製簽章連結
 */
function handleCopyUrl(record: SignatureRecord): void {
  if (record.signatureUrl) {
    copySignatureUrl(record.signatureUrl)
  }
}
</script>

<template>
  <div v-if="serviceOrder.orderSource === 'ONLINE'" class="online-signature-section">
    <h3 class="section-title">
      <el-icon><DocumentChecked /></el-icon>
      <span>線上簽章</span>
    </h3>

    <!-- 發送簽章請求按鈕（尚未發送時顯示） -->
    <div v-if="canSendRequest" class="send-request-container">
      <el-alert
        type="info"
        :closable="false"
        style="margin-bottom: 16px;"
      >
        此訂單來自線上渠道，請發送簽章請求給客戶完成合約簽署。
      </el-alert>
      <el-button
        type="primary"
        :icon="Send"
        :loading="loading"
        @click="handleSendRequest"
      >
        發送簽章請求
      </el-button>
    </div>

    <!-- 簽章紀錄列表 -->
    <div v-if="hasOnlineSignature" class="signature-records">
      <el-timeline>
        <el-timeline-item
          v-for="record in onlineSignatureRecords"
          :key="record.id"
          :timestamp="record.sentAt ? formatDateTime(record.sentAt) : '待發送'"
        >
          <el-card shadow="hover">
            <div class="record-header">
              <span class="record-title">
                {{ record.documentType === 'BUYBACK_CONTRACT' ? '收購合約' : '寄賣合約' }}
              </span>
              <el-tag :type="getStatusType(record.status)" size="small">
                {{ getStatusText(record.status) }}
              </el-tag>
            </div>

            <div class="record-content">
              <p><strong>簽名者：</strong>{{ record.signerName }}</p>
              <p v-if="record.sentAt">
                <strong>發送時間：</strong>{{ formatDateTime(record.sentAt) }}
              </p>
              <p v-if="record.expiresAt">
                <strong>到期時間：</strong>{{ formatDateTime(record.expiresAt) }}
              </p>
              <p v-if="record.signedAt">
                <strong>簽名時間：</strong>{{ formatDateTime(record.signedAt) }}
              </p>

              <!-- 操作按鈕 -->
              <div class="record-actions">
                <el-button
                  v-if="canResend(record)"
                  :icon="Refresh"
                  size="small"
                  type="primary"
                  :loading="loading"
                  @click="handleResend(record)"
                >
                  重新發送簽章請求
                </el-button>
                <el-button
                  v-if="canCopyUrl(record)"
                  :icon="CopyDocument"
                  size="small"
                  @click="handleCopyUrl(record)"
                >
                  複製簽章連結
                </el-button>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<style scoped lang="scss">
.online-signature-section {
  margin-top: 24px;

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 16px;
    padding-left: 12px;
    border-left: 4px solid var(--el-color-primary);

    .el-icon {
      color: var(--el-color-primary);
    }
  }

  .send-request-container {
    padding: 16px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
  }

  .signature-records {
    margin-top: 16px;

    .record-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .record-title {
        font-size: 16px;
        font-weight: 600;
      }
    }

    .record-content {
      p {
        margin: 8px 0;
        color: var(--el-text-color-regular);
      }

      .record-actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
      }
    }
  }
}
</style>
```

### 4.2 修改服務單詳情頁面

**檔案**: `src/pages/service-order-management/detail.vue`

在現有的詳情頁面中整合線上簽章區塊元件：

```vue
<script setup lang="ts">
// ... 現有匯入

import OnlineSignatureSection from "./components/OnlineSignatureSection.vue"

// ... 現有程式碼

/**
 * 處理線上簽章操作成功
 */
function handleOnlineSignatureSuccess(): void {
  // 重新載入服務單資料
  window.location.reload()
}
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never">
      <!-- ... 現有內容 -->

      <!-- 線上簽章區塊（插入在簽名記錄之前或之後） -->
      <OnlineSignatureSection
        v-if="serviceOrder"
        :service-order="serviceOrder"
        @success="handleOnlineSignatureSuccess"
      />

      <!-- ... 現有內容 -->
    </el-card>
  </div>
</template>
```

---

## 第五階段：權限控制（可選）

### 5.1 定義權限常數

如果需要權限控制，在權限常數檔案中新增：

**檔案**: `src/common/constants/permissions.ts`

```typescript
/**
 * 服務單權限常數
 */
export const SERVICE_ORDER_PERMISSIONS = {
  // ... 現有權限
  /** 發送線上簽章請求 */
  SEND_ONLINE_SIGNATURE: "service-order.send-online-signature",
  /** 重新發送線上簽章請求 */
  RESEND_ONLINE_SIGNATURE: "service-order.resend-online-signature"
} as const
```

### 5.2 應用權限指令

在元件中使用 `v-permission` 指令：

```vue
<el-button
  v-permission="[SERVICE_ORDER_PERMISSIONS.SEND_ONLINE_SIGNATURE]"
  type="primary"
  @click="handleSendRequest"
>
  發送簽章請求
</el-button>
```

---

## 第六階段：工具函式

### 6.1 日期格式化（使用現有工具）

專案已有 `formatDateTime` 工具函式，位於：
- `src/common/utils/datetime.ts`

直接使用即可：

```typescript
import { formatDateTime } from "@@/utils/datetime"

const formattedDate = formatDateTime(record.sentAt)
```

---

## 測試計劃

### 單元測試

**測試檔案**: `tests/composables/useOnlineSignature.test.ts`

測試項目：
- ✅ 發送簽章請求成功
- ✅ 發送簽章請求失敗處理
- ✅ 重新發送簽章請求成功
- ✅ 重新發送頻率限制錯誤處理
- ✅ 複製簽章連結
- ✅ 狀態文字與標籤類型映射
- ✅ 重新發送與複製連結權限檢查

### 整合測試

**測試檔案**: `tests/components/OnlineSignatureSection.test.ts`

測試項目：
- ✅ 元件渲染（線上訂單）
- ✅ 元件不渲染（線下訂單）
- ✅ 發送簽章請求按鈕顯示邏輯
- ✅ 簽章紀錄列表渲染
- ✅ 按鈕點擊事件觸發
- ✅ 操作成功後發出 success 事件

### 端對端測試場景

1. **發送簽章請求流程**
   - 進入線上訂單詳情頁
   - 點擊「發送簽章請求」
   - 驗證成功訊息顯示
   - 驗證簽章紀錄出現

2. **重新發送簽章請求流程**
   - 進入已發送但未完成的訂單
   - 點擊「重新發送簽章請求」
   - 驗證成功訊息
   - 驗證頻率限制錯誤提示

3. **複製簽章連結流程**
   - 點擊「複製簽章連結」
   - 驗證成功訊息
   - 驗證剪貼簿內容

---

## 實作檢查清單

### 📋 資料層
- [ ] 新增 `OnlineSignatureStatus` 列舉
- [ ] 擴展 `SignatureRecord` 介面
- [ ] 新增 API 請求與回應型別

### 🌐 API 層
- [ ] 創建 `online-signature.ts` API 服務
- [ ] 實作 `sendOnlineSignature` 函式
- [ ] 實作 `resendOnlineSignature` 函式
- [ ] API 函式包含完整 JSDoc 註解

### 🔧 業務邏輯層
- [ ] 創建 `useOnlineSignature` 組合式函式
- [ ] 實作發送簽章請求邏輯
- [ ] 實作重新發送邏輯（含頻率限制處理）
- [ ] 實作複製連結邏輯
- [ ] 實作狀態文字與標籤類型映射
- [ ] 實作權限檢查邏輯

### 🎨 UI 元件層
- [ ] 創建 `OnlineSignatureSection.vue` 元件
- [ ] 實作發送簽章請求按鈕
- [ ] 實作簽章紀錄列表
- [ ] 實作重新發送按鈕
- [ ] 實作複製連結按鈕
- [ ] 整合到 `detail.vue` 頁面

### 🔐 權限控制（可選）
- [ ] 定義權限常數
- [ ] 應用 `v-permission` 指令

### ✅ 測試
- [ ] 撰寫 `useOnlineSignature` 單元測試
- [ ] 撰寫 `OnlineSignatureSection` 元件測試
- [ ] 執行端對端測試場景

### 📝 其他
- [ ] 無 TypeScript 編譯錯誤
- [ ] 無 ESLint 錯誤
- [ ] 程式碼格式化
- [ ] 驗證 UI 在各種狀態下的顯示

---

## 實作順序建議

1. **第一階段**：資料模型與型別定義（1 小時）
   - 修改 `types.ts`
   - 新增所有必要的型別與列舉

2. **第二階段**：API 服務層（1 小時）
   - 創建 `apis/online-signature.ts`
   - 實作 API 函式

3. **第三階段**：業務邏輯層（2 小時）
   - 創建 `composables/useOnlineSignature.ts`
   - 實作所有業務邏輯函式

4. **第四階段**：UI 元件層（3 小時）
   - 創建 `OnlineSignatureSection.vue`
   - 修改 `detail.vue`
   - 樣式調整

5. **第五階段**：測試與驗證（2 小時）
   - 單元測試
   - 整合測試
   - 端對端測試

**總預估時間**: 9 小時

---

## 潛在風險與注意事項

### 🚨 風險項目

1. **API 錯誤碼不一致**
   - 風險：後端回傳的錯誤碼可能與預期不同
   - 緩解：與後端確認錯誤碼規範，做好錯誤處理

2. **頻率限制檢查**
   - 風險：前端無法準確判斷是否可重新發送
   - 緩解：依賴後端 API 回傳的錯誤，前端僅做 UI 提示

3. **簽章狀態同步**
   - 風險：客戶完成簽署後狀態未即時更新
   - 緩解：提供手動重新整理功能，或實作輪詢機制

4. **瀏覽器相容性**
   - 風險：`navigator.clipboard` API 在某些瀏覽器不支援
   - 緩解：提供降級方案（顯示 URL 讓使用者手動複製）

### ⚠️ 注意事項

1. **訂單來源判斷**：僅線上訂單（`orderSource === "ONLINE"`）顯示線上簽章功能

2. **文件類型選擇**：根據服務單類型（收購單/寄賣單）自動選擇對應的合約文件類型

3. **時間顯示**：使用 UTC 時間，需轉換為本地時間顯示

4. **權限控制**：如需要，與團隊確認權限設定

5. **錯誤處理**：所有 API 呼叫都要有完整的錯誤處理

---

## 參考資料

- [規範文件](./spec.md)
- [V3 Admin Vite 開發規範](../../.specify/memory/plan-instruction.md)
- [Element Plus 文件](https://element-plus.org/)
- [Vue 3 文件](https://vuejs.org/)

---

**文件版本**: 1.0.0  
**最後更新**: 2026-01-10  
**維護者**: 開發團隊
