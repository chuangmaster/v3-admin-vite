# API Contracts

**Feature**: 010-order-document  
**Date**: 2026-02-18

---

## 說明

本功能為**純前端文件產生**，無需呼叫後端 API，因此不需要 API 合約定義。

## 理由

商品訂購單文件產生的資料來源為**現有的訂單資料**（`SalesOrder` 實體），資料取得方式如下：

1. 使用者從「訂單管理頁面」選擇欲產生訂購單的訂單
2. 前端元件接收該訂單的完整資料（已透過訂單列表 API 取得）
3. 組合式函式 `useOrderDocumentPreview` 將 `SalesOrder` 轉換為 `OrderDocumentData`
4. `OrderDocumentPreview` 元件渲染訂購單並支援列印

**無需新增或修改任何後端 API 端點。**

---

## 資料流程

```
訂單管理頁面
    ↓
現有訂單資料 (SalesOrder)
    ↓
useOrderDocumentPreview.transformToOrderDocument()
    ↓
OrderDocumentData
    ↓
OrderDocumentPreview 元件
    ↓
瀏覽器列印 (window.print())
```

---

## 相關文件

- [資料模型](../data-model.md): 定義 `OrderDocumentData` 的結構與轉換邏輯
- [研究文件](../research.md): 說明為何選擇純前端實作方案
- [實作計畫](../plan.md): 功能完整計畫

---

**結論**: 本目錄保留為空，符合 `.specify` 規範的目錄結構要求。
