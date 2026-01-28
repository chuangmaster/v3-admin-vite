# Notify 元件整合規格

**Feature**: 客戶管理模組 - Excel 背景匯出通知  
**Component**: `src/common/components/Notify`  
**Date**: 2026-01-28

---

## 概述

本文件說明如何整合專案現有的 Notify 元件來推送 Excel 背景匯出完成通知。

---

## 現有 Notify 元件分析

### 檔案結構

```
src/common/components/Notify/
├── index.vue      # 主元件（顯示通知列表）
├── List.vue       # 列表渲染元件
├── type.ts        # TypeScript 型別定義
└── data.ts        # 範例資料（可移除或保留）
```

### 型別定義 (type.ts)

```typescript
export interface NotifyItem {
  avatar?: string
  title: string
  datetime?: string
  description?: string
  status?: "primary" | "success" | "info" | "warning" | "danger"
  extra?: string
  // 擴充屬性（需新增）
  downloadUrl?: string  // 下載連結
  filename?: string     // 檔案名稱
}
```

### 現有狀態管理

目前 `index.vue` 使用 `ref` 管理資料：

```typescript
const data = ref<DataItem[]>([
  {
    name: "notification",
    type: "primary",
    list: notifyData  // 靜態資料
  },
  // ...
])
```

**問題**: 無法從其他模組（如 `useExportExcel`）動態新增通知

---

## 整合方案

### 方案 A: Pinia Store（推薦）✅

**優點**:
- 全域狀態管理,任何地方都可呼叫
- 符合專案現有架構（已使用 Pinia）
- 支援 DevTools 除錯
- 可持久化通知歷史

**實作步驟**:

#### 1. 建立 Notify Store

```typescript
// src/common/components/Notify/store.ts
import { defineStore } from 'pinia'
import type { NotifyItem } from './type'

interface DataItem {
  name: 'notification' | 'message' | 'todo'
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  list: NotifyItem[]
}

export const useNotifyStore = defineStore('notify', () => {
  // 初始資料（可從 data.ts 匯入）
  const data = ref<DataItem[]>([
    { name: 'notification', type: 'primary', list: [] },
    { name: 'message', type: 'danger', list: [] },
    { name: 'todo', type: 'warning', list: [] }
  ])

  /** 新增通知 */
  function addNotification(item: NotifyItem): void {
    const notificationTab = data.value.find(d => d.name === 'notification')
    if (notificationTab) {
      // 新通知插入最前面
      notificationTab.list.unshift(item)
      
      // 可選：限制最大通知數量
      if (notificationTab.list.length > 50) {
        notificationTab.list.pop()
      }
    }
  }

  /** 新增訊息 */
  function addMessage(item: NotifyItem): void {
    const messageTab = data.value.find(d => d.name === 'message')
    if (messageTab) {
      messageTab.list.unshift(item)
    }
  }

  /** 新增待辦 */
  function addTodo(item: NotifyItem): void {
    const todoTab = data.value.find(d => d.name === 'todo')
    if (todoTab) {
      todoTab.list.unshift(item)
    }
  }

  /** 清除指定分類的通知 */
  function clearNotifications(category: 'notification' | 'message' | 'todo'): void {
    const tab = data.value.find(d => d.name === category)
    if (tab) {
      tab.list = []
    }
  }

  /** 移除特定通知（透過索引） */
  function removeNotification(category: 'notification' | 'message' | 'todo', index: number): void {
    const tab = data.value.find(d => d.name === category)
    if (tab) {
      tab.list.splice(index, 1)
    }
  }

  return {
    data,
    addNotification,
    addMessage,
    addTodo,
    clearNotifications,
    removeNotification
  }
})
```

#### 2. 更新 Notify/index.vue

```vue
<script lang="ts" setup>
import { useNotifyStore } from './store'

// 使用 store 替代 ref
const notifyStore = useNotifyStore()
const { data } = storeToRefs(notifyStore)

// 其他邏輯保持不變...
</script>
```

#### 3. 在 useExportExcel 中使用

```typescript
// src/pages/customer-management/composables/useExportExcel.ts
import { useNotifyStore } from '@/common/components/Notify/store'
import type { NotifyItem } from '@/common/components/Notify/type'

export function useExportExcel() {
  const notifyStore = useNotifyStore()

  async function exportInBackground(data: Customer[]): Promise<void> {
    const worker = new Worker(
      new URL('../workers/excel-export.worker.ts', import.meta.url),
      { type: 'module' }
    )

    worker.postMessage({ customers: data })

    worker.onmessage = (e: MessageEvent) => {
      const { type, data } = e.data

      if (type === 'complete') {
        const blob = new Blob([data.buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        })
        const url = URL.createObjectURL(blob)
        const filename = `customers_${new Date().getTime()}.xlsx`

        // 推送通知至 Notify 元件
        notifyStore.addNotification({
          title: '客戶資料匯出完成',
          description: `已成功匯出 ${data.count} 筆客戶資料`,
          datetime: new Date().toLocaleString('zh-TW'),
          status: 'success',
          extra: '點擊下載',
          downloadUrl: url,
          filename: filename
        })

        // 自動觸發下載
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()

        setTimeout(() => URL.revokeObjectURL(url), 60000) // 1分鐘後釋放
        worker.terminate()
      }

      if (type === 'error') {
        notifyStore.addNotification({
          title: '匯出失敗',
          description: data.message || '處理過程中發生錯誤',
          datetime: new Date().toLocaleString('zh-TW'),
          status: 'danger'
        })
        worker.terminate()
      }
    }

    worker.onerror = (error) => {
      notifyStore.addNotification({
        title: '匯出失敗',
        description: 'Worker 執行過程中發生錯誤',
        datetime: new Date().toLocaleString('zh-TW'),
        status: 'danger'
      })
      worker.terminate()
    }
  }

  return { exportInBackground }
}
```

#### 4. 可選：擴充 List.vue 支援點擊下載

```vue
<!-- src/common/components/Notify/List.vue -->
<template>
  <div 
    v-for="(item, index) in data" 
    :key="index"
    class="notify-item"
    @click="handleItemClick(item)"
    :class="{ 'cursor-pointer': item.downloadUrl }"
  >
    <!-- 現有內容 -->
  </div>
</template>

<script lang="ts" setup>
function handleItemClick(item: NotifyItem): void {
  if (item.downloadUrl && item.filename) {
    const a = document.createElement('a')
    a.href = item.downloadUrl
    a.download = item.filename
    a.click()
  }
}
</script>
```

---

### 方案 B: Provide/Inject

**優點**: 輕量級,不需要 Pinia store

**缺點**: 
- 需要在根元件 provide
- 無法持久化
- 不支援 DevTools

**實作**（僅供參考）:

```typescript
// App.vue
import { provide, ref } from 'vue'

const notifyData = ref([])

function addNotification(item: NotifyItem) {
  notifyData.value.unshift(item)
}

provide('notify', { data: notifyData, addNotification })
```

```typescript
// useExportExcel.ts
import { inject } from 'vue'

const { addNotification } = inject('notify')
addNotification({ title: '匯出完成', ... })
```

---

### 方案 C: 全域事件匯流排

**優點**: 完全解耦

**缺點**: 
- 難以追蹤事件流
- 可能導致記憶體洩漏
- 不推薦用於 Vue 3

**不推薦** ❌

---

## 建議實作順序

1. ✅ **T031c**: 建立 `src/common/components/Notify/store.ts`（使用方案 A）
2. ✅ 更新 `src/common/components/Notify/index.vue` 使用 store
3. ✅ 在 `src/common/components/Notify/type.ts` 擴充 `NotifyItem` 介面
4. ✅ **T031b**: 在 `useExportExcel.ts` 整合 `useNotifyStore()`
5. 🆗 可選：擴充 `List.vue` 支援點擊下載

---

## 測試檢查清單

- [ ] 匯出成功時通知正確顯示
- [ ] 匯出失敗時錯誤通知正確顯示
- [ ] 通知數量角標正確更新
- [ ] 點擊通知可觸發檔案下載（若實作）
- [ ] 多次匯出通知不重複（或正確累積）
- [ ] DevTools 中可檢視 notifyStore 狀態

---

## 注意事項

1. **記憶體管理**: 使用 `URL.revokeObjectURL()` 釋放 Blob URL
2. **通知上限**: 建議限制通知列表最大數量（如 50 筆）
3. **持久化**: 可選擇使用 `pinia-plugin-persistedstate` 持久化通知
4. **國際化**: 通知訊息應支援 i18n（使用 `useI18n()`）

---

## 參考資料

- Pinia 官方文件: https://pinia.vuejs.org/
- Web Workers API: https://developer.mozilla.org/en-US/docs/Web/API/Worker
- Transferable Objects: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects
