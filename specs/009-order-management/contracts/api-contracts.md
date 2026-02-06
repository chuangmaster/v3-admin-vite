# API Contracts: 訂單管理模組

**Date**: 2026-02-06 | **Branch**: `009-order-management` | **Phase**: 1

## Overview

本文件定義訂單管理模組所有後端 API 端點的完整契約,包括請求/回應格式、業務邏輯錯誤碼、分頁規範等。所有 API 遵循 `ApiResponseModel<T>` 標準格式。

## Base URL

```text
開發環境: http://localhost:5176
生產環境: [待部署後提供]
```

## Authentication

所有 API 端點需在 HTTP 標頭攜帶 JWT 令牌:

```text
Authorization: Bearer {access_token}
```

## Standard Response Format

### Success Response

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "操作成功",
  "data": { /* 實際資料物件 */ },
  "timestamp": "2026-02-06T08:30:00.000Z",
  "traceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}
```

### Error Response (業務邏輯錯誤)

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "資料驗證失敗",
  "data": null,
  "timestamp": "2026-02-06T08:30:00.000Z",
  "traceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": {
    "orderItems[0].unitPrice": ["單價必須大於 0"],
    "deliveryInfo.recipientPhone": ["手機號碼格式錯誤"]
  }
}
```

### Error Response (系統錯誤)

```json
{
  "success": false,
  "code": "INTERNAL_ERROR",
  "message": "系統發生錯誤,請稍後再試",
  "data": null,
  "timestamp": "2026-02-06T08:30:00.000Z",
  "traceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}
```

## Business Logic Codes

### Common Codes (通用)

| Code | 說明 | HTTP Status | 處理方式 |
|------|------|-------------|---------|
| `SUCCESS` | 操作成功 | 200 | 顯示成功訊息 |
| `VALIDATION_ERROR` | 資料驗證失敗 | 400 | 顯示表單錯誤 |
| `UNAUTHORIZED` | 未授權 | 401 | 導向登入頁 |
| `FORBIDDEN` | 無權限 | 403 | 顯示無權限訊息 |
| `NOT_FOUND` | 資源不存在 | 404 | 顯示資源不存在訊息 |
| `CONCURRENT_UPDATE_CONFLICT` | 樂觀鎖定衝突 | 409 | 提示資料已被他人修改,請重新整理 |
| `INTERNAL_ERROR` | 系統錯誤 | 500 | 顯示通用錯誤訊息 |

### Order-Specific Codes (訂單專用)

| Code | 說明 | HTTP Status | 處理方式 |
|------|------|-------------|---------|
| `DAILY_ORDER_LIMIT_REACHED` | 當日訂單上限已達(9999 筆) | 400 | 禁止建立新訂單,提示明日再試 |
| `INVALID_CUSTOMER` | 客戶不存在或已刪除 | 400 | 提示選擇有效客戶 |
| `ORDER_ALREADY_COMPLETED` | 訂單已完成,無法修改 | 400 | 禁止編輯操作 |
| `ORDER_ALREADY_CANCELLED` | 訂單已取消,無法修改 | 400 | 禁止編輯操作 |
| `PAYMENT_EXCEEDS_TOTAL` | 付款金額超過訂單總額 | 400 | 提示剩餘應付金額 |
| `PAYMENT_RECORD_NOT_FOUND` | 付款記錄不存在 | 404 | 刷新資料 |
| `CANNOT_DELETE_PAID_RECORD` | 無法刪除已付款記錄 | 400 | 禁止刪除操作 |

## API Endpoints

### 1. 建立銷售訂單

**Endpoint**: `POST /api/sales-orders`  
**Permission**: `sales-order:create`  
**Description**: 建立新的銷售訂單,訂單編號由後端自動生成

#### Request Body

```json
{
  "orderType": "SPOT_PURCHASE",
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "orderItems": [
    {
      "productName": "Hermès Kelly 25",
      "brandName": "Hermès",
      "panshiCode": "HK25001",
      "serialId": "A202401001",
      "productStyle": "經典款 黑色",
      "accessories": "盒子、防塵袋、保卡",
      "productSource": "BUYBACK",
      "unitPrice": 250000,
      "quantity": 1
    }
  ],
  "deliveryMethod": "HOME_DELIVERY",
  "deliveryInfo": {
    "type": "HOME_DELIVERY",
    "recipientName": "王小明",
    "recipientPhone": "0912345678",
    "recipientAddress": "台北市信義區信義路五段 7 號"
  },
  "shippingFee": 60,
  "remarks": "客戶指定週五下午配送"
}
```

#### Success Response (201 Created)

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "訂單建立成功",
  "data": {
    "id": "7e68e6a1-2f9d-4b7c-8a5d-3c9e8f1a2b3c",
    "orderNumber": "RYO20260206001",
    "orderDate": "2026-02-06T08:30:00.000Z",
    "orderType": "SPOT_PURCHASE",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerName": "王小明",
    "customerPhone": "0912345678",
    "subtotalAmount": 250000,
    "shippingFee": 60,
    "totalAmount": 250060,
    "paymentStatus": "UNPAID",
    "orderStatus": "PLACED",
    "shippingStatus": "NOT_SHIPPED",
    "deliveryMethod": "HOME_DELIVERY",
    "deliveryInfo": {
      "type": "HOME_DELIVERY",
      "recipientName": "王小明",
      "recipientPhone": "0912345678",
      "recipientAddress": "台北市信義區信義路五段 7 號"
    },
    "remarks": "客戶指定週五下午配送",
    "orderItems": [
      {
        "id": "9f78e6a1-2f9d-4b7c-8a5d-3c9e8f1a2b3c",
        "productName": "Hermès Kelly 25",
        "brandName": "Hermès",
        "panshiCode": "HK25001",
        "serialId": "A202401001",
        "productStyle": "經典款 黑色",
        "accessories": "盒子、防塵袋、保卡",
        "productSource": "BUYBACK",
        "unitPrice": 250000,
        "quantity": 1
      }
    ],
    "paymentRecords": [],
    "createdAt": "2026-02-06T08:30:00.000Z",
    "createdByName": "系統管理員",
    "version": 1
  },
  "timestamp": "2026-02-06T08:30:00.000Z",
  "traceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}
```

#### Error Responses

```json
// DAILY_ORDER_LIMIT_REACHED (400)
{
  "success": false,
  "code": "DAILY_ORDER_LIMIT_REACHED",
  "message": "今日訂單已達上限 9999 筆,請明日再試",
  "data": null,
  "timestamp": "2026-02-06T08:30:00.000Z",
  "traceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}

// INVALID_CUSTOMER (400)
{
  "success": false,
  "code": "INVALID_CUSTOMER",
  "message": "客戶不存在或已刪除",
  "data": null,
  "timestamp": "2026-02-06T08:30:00.000Z",
  "traceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}

// VALIDATION_ERROR (400)
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "資料驗證失敗",
  "data": null,
  "timestamp": "2026-02-06T08:30:00.000Z",
  "traceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": {
    "orderItems[0].unitPrice": ["單價必須大於 0"],
    "deliveryInfo.recipientPhone": ["手機號碼必須為 10 位數字"]
  }
}
```

---

### 2. 取得訂單列表(分頁)

**Endpoint**: `GET /api/sales-orders`  
**Permission**: `sales-order:read`  
**Description**: 查詢訂單列表,支援多條件篩選與分頁

#### Query Parameters

| 參數 | 型別 | 必填 | 說明 | 預設值 |
|------|------|------|------|--------|
| `pageNumber` | int | 是 | 頁碼(從 1 開始) | 1 |
| `pageSize` | int | 是 | 每頁筆數(1-100) | 20 |
| `orderNumber` | string | 否 | 訂單編號(模糊搜尋) | - |
| `customerName` | string | 否 | 客戶名稱(模糊搜尋) | - |
| `productName` | string | 否 | 商品名稱(模糊搜尋) | - |
| `orderStatus` | string | 否 | 訂單狀態篩選 | - |
| `paymentStatus` | string | 否 | 付款狀態篩選 | - |
| `shippingStatus` | string | 否 | 出貨狀態篩選 | - |
| `orderDateStart` | string | 否 | 訂單日期起始(YYYY-MM-DD) | - |
| `orderDateEnd` | string | 否 | 訂單日期結束(YYYY-MM-DD) | - |

#### Request Example

```text
GET /api/sales-orders?pageNumber=1&pageSize=20&customerName=王小明&paymentStatus=UNPAID
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "查詢成功",
  "data": [
    {
      "id": "7e68e6a1-2f9d-4b7c-8a5d-3c9e8f1a2b3c",
      "orderNumber": "RYO20260206001",
      "orderDate": "2026-02-06T08:30:00.000Z",
      "orderType": "SPOT_PURCHASE",
      "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "customerName": "王小明",
      "customerPhone": "0912345678",
      "subtotalAmount": 250000,
      "shippingFee": 60,
      "totalAmount": 250060,
      "paymentStatus": "UNPAID",
      "orderStatus": "PLACED",
      "shippingStatus": "NOT_SHIPPED",
      "deliveryMethod": "HOME_DELIVERY",
      "remarks": "客戶指定週五下午配送",
      "createdAt": "2026-02-06T08:30:00.000Z",
      "createdByName": "系統管理員",
      "version": 1
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 1,
  "timestamp": "2026-02-06T08:30:00.000Z",
  "traceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}
```

---

### 3. 取得訂單詳細資訊

**Endpoint**: `GET /api/sales-orders/{id}`  
**Permission**: `sales-order:read`  
**Description**: 取得指定訂單的完整資訊,包含訂單項目與付款記錄

#### Path Parameters

| 參數 | 型別 | 說明 |
|------|------|------|
| `id` | UUID | 訂單 ID |

#### Request Example

```text
GET /api/sales-orders/7e68e6a1-2f9d-4b7c-8a5d-3c9e8f1a2b3c
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "查詢成功",
  "data": {
    "id": "7e68e6a1-2f9d-4b7c-8a5d-3c9e8f1a2b3c",
    "orderNumber": "RYO20260206001",
    "orderDate": "2026-02-06T08:30:00.000Z",
    "orderType": "SPOT_PURCHASE",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerName": "王小明",
    "customerPhone": "0912345678",
    "subtotalAmount": 250000,
    "shippingFee": 60,
    "totalAmount": 250060,
    "paymentStatus": "UNPAID",
    "orderStatus": "PLACED",
    "shippingStatus": "NOT_SHIPPED",
    "deliveryMethod": "HOME_DELIVERY",
    "deliveryInfo": {
      "type": "HOME_DELIVERY",
      "recipientName": "王小明",
      "recipientPhone": "0912345678",
      "recipientAddress": "台北市信義區信義路五段 7 號"
    },
    "remarks": "客戶指定週五下午配送",
    "orderItems": [
      {
        "id": "9f78e6a1-2f9d-4b7c-8a5d-3c9e8f1a2b3c",
        "productName": "Hermès Kelly 25",
        "brandName": "Hermès",
        "panshiCode": "HK25001",
        "serialId": "A202401001",
        "productStyle": "經典款 黑色",
        "accessories": "盒子、防塵袋、保卡",
        "productSource": "BUYBACK",
        "unitPrice": 250000,
        "quantity": 1
      }
    ],
    "paymentRecords": [],
    "createdAt": "2026-02-06T08:30:00.000Z",
    "createdByName": "系統管理員",
    "version": 1
  },
  "timestamp": "2026-02-06T08:30:00.000Z",
  "traceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}
```

#### Error Response (404 Not Found)

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "訂單不存在",
  "data": null,
  "timestamp": "2026-02-06T08:30:00.000Z",
  "traceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}
```

---

### 4. 修改銷售訂單

**Endpoint**: `PUT /api/sales-orders/{id}`  
**Permission**: `sales-order:update`  
**Description**: 修改訂單資訊,支援樂觀鎖定防止並發衝突

#### Path Parameters

| 參數 | 型別 | 說明 |
|------|------|------|
| `id` | UUID | 訂單 ID |

#### Request Body

```json
{
  "orderItems": [
    {
      "productName": "Hermès Birkin 30",
      "brandName": "Hermès",
      "panshiCode": "HB30001",
      "serialId": "B202401001",
      "productStyle": "經典款 紅色",
      "accessories": "盒子、防塵袋",
      "productSource": "CONSIGNMENT",
      "unitPrice": 350000,
      "quantity": 1
    }
  ],
  "deliveryMethod": "PICKUP",
  "deliveryInfo": {
    "type": "PICKUP",
    "pickupLocation": "台北門市",
    "pickupTime": "2026-02-10T14:00:00.000Z"
  },
  "shippingFee": 0,
  "remarks": "客戶臨時改為門市自取",
  "version": 1
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "訂單修改成功",
  "data": {
    "id": "7e68e6a1-2f9d-4b7c-8a5d-3c9e8f1a2b3c",
    "orderNumber": "RYO20260206001",
    "orderDate": "2026-02-06T08:30:00.000Z",
    "orderType": "SPOT_PURCHASE",
    "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerName": "王小明",
    "customerPhone": "0912345678",
    "subtotalAmount": 350000,
    "shippingFee": 0,
    "totalAmount": 350000,
    "paymentStatus": "UNPAID",
    "orderStatus": "PLACED",
    "shippingStatus": "NOT_SHIPPED",
    "deliveryMethod": "PICKUP",
    "deliveryInfo": {
      "type": "PICKUP",
      "pickupLocation": "台北門市",
      "pickupTime": "2026-02-10T14:00:00.000Z"
    },
    "remarks": "客戶臨時改為門市自取",
    "orderItems": [
      {
        "id": "1a78e6a1-2f9d-4b7c-8a5d-3c9e8f1a2b3c",
        "productName": "Hermès Birkin 30",
        "brandName": "Hermès",
        "panshiCode": "HB30001",
        "serialId": "B202401001",
        "productStyle": "經典款 紅色",
        "accessories": "盒子、防塵袋",
        "productSource": "CONSIGNMENT",
        "unitPrice": 350000,
        "quantity": 1
      }
    ],
    "paymentRecords": [],
    "createdAt": "2026-02-06T08:30:00.000Z",
    "createdByName": "系統管理員",
    "version": 2
  },
  "timestamp": "2026-02-06T09:00:00.000Z",
  "traceId": "4fa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}
```

#### Error Responses

```json
// CONCURRENT_UPDATE_CONFLICT (409)
{
  "success": false,
  "code": "CONCURRENT_UPDATE_CONFLICT",
  "message": "資料已被他人修改,請重新整理後再試",
  "data": null,
  "timestamp": "2026-02-06T09:00:00.000Z",
  "traceId": "4fa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}

// ORDER_ALREADY_COMPLETED (400)
{
  "success": false,
  "code": "ORDER_ALREADY_COMPLETED",
  "message": "訂單已完成,無法修改",
  "data": null,
  "timestamp": "2026-02-06T09:00:00.000Z",
  "traceId": "4fa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}
```

---

### 5. 刪除銷售訂單

**Endpoint**: `DELETE /api/sales-orders/{id}`  
**Permission**: `sales-order:delete`  
**Description**: 刪除訂單(軟刪除)

#### Path Parameters

| 參數 | 型別 | 說明 |
|------|------|------|
| `id` | UUID | 訂單 ID |

#### Success Response (204 No Content)

無回應內容

#### Error Response (404 Not Found)

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "訂單不存在",
  "data": null,
  "timestamp": "2026-02-06T09:00:00.000Z",
  "traceId": "5fa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}
```

---

### 6. 新增付款記錄

**Endpoint**: `POST /api/sales-orders/{orderId}/payment-records`  
**Permission**: `sales-order:update`  
**Description**: 為訂單新增付款記錄,系統自動檢查是否超額並更新付款狀態

#### Path Parameters

| 參數 | 型別 | 說明 |
|------|------|------|
| `orderId` | UUID | 訂單 ID |

#### Request Body

```json
{
  "paymentDate": "2026-02-06T10:00:00.000Z",
  "paymentAmount": 100000,
  "paymentMethod": "STORE_CASH",
  "bankAccountLastFive": null
}
```

#### Success Response (201 Created)

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "付款記錄新增成功",
  "data": {
    "id": "2b78e6a1-2f9d-4b7c-8a5d-3c9e8f1a2b3c",
    "paymentDate": "2026-02-06T10:00:00.000Z",
    "paymentAmount": 100000,
    "paymentMethod": "STORE_CASH",
    "bankAccountLastFive": null,
    "createdAt": "2026-02-06T10:00:00.000Z"
  },
  "timestamp": "2026-02-06T10:00:00.000Z",
  "traceId": "6fa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}
```

#### Error Response (400 PAYMENT_EXCEEDS_TOTAL)

```json
{
  "success": false,
  "code": "PAYMENT_EXCEEDS_TOTAL",
  "message": "付款金額超過訂單總額,剩餘應付金額為 150060 元",
  "data": null,
  "timestamp": "2026-02-06T10:00:00.000Z",
  "traceId": "6fa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}
```

---

### 7. 修改付款記錄

**Endpoint**: `PUT /api/sales-orders/{orderId}/payment-records/{paymentRecordId}`  
**Permission**: `sales-order:update`  
**Description**: 修改付款記錄(僅允許修改銀行末五碼)

#### Path Parameters

| 參數 | 型別 | 說明 |
|------|------|------|
| `orderId` | UUID | 訂單 ID |
| `paymentRecordId` | UUID | 付款記錄 ID |

#### Request Body

```json
{
  "bankAccountLastFive": "12345"
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "付款記錄修改成功",
  "data": {
    "id": "2b78e6a1-2f9d-4b7c-8a5d-3c9e8f1a2b3c",
    "paymentDate": "2026-02-06T10:00:00.000Z",
    "paymentAmount": 100000,
    "paymentMethod": "BANK_TRANSFER",
    "bankAccountLastFive": "12345",
    "createdAt": "2026-02-06T10:00:00.000Z"
  },
  "timestamp": "2026-02-06T10:30:00.000Z",
  "traceId": "7fa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}
```

---

### 8. 刪除付款記錄

**Endpoint**: `DELETE /api/sales-orders/{orderId}/payment-records/{paymentRecordId}`  
**Permission**: `sales-order:update`  
**Description**: 刪除付款記錄(硬刪除),系統自動重新計算付款狀態

#### Path Parameters

| 參數 | 型別 | 說明 |
|------|------|------|
| `orderId` | UUID | 訂單 ID |
| `paymentRecordId` | UUID | 付款記錄 ID |

#### Success Response (204 No Content)

無回應內容

#### Error Response (404 PAYMENT_RECORD_NOT_FOUND)

```json
{
  "success": false,
  "code": "PAYMENT_RECORD_NOT_FOUND",
  "message": "付款記錄不存在",
  "data": null,
  "timestamp": "2026-02-06T10:30:00.000Z",
  "traceId": "8fa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}
```

---

### 9. 更新付款狀態(手動)

**Endpoint**: `PATCH /api/sales-orders/{id}/payment-status`  
**Permission**: `sales-order:update`  
**Description**: 手動調整訂單付款狀態(特殊情境使用)

#### Path Parameters

| 參數 | 型別 | 說明 |
|------|------|------|
| `id` | UUID | 訂單 ID |

#### Request Body

```json
{
  "paymentStatus": "PAID"
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "付款狀態更新成功",
  "data": null,
  "timestamp": "2026-02-06T11:00:00.000Z",
  "traceId": "9fa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}
```

---

### 10. 更新訂單狀態

**Endpoint**: `PATCH /api/sales-orders/{id}/order-status`  
**Permission**: `sales-order:update`  
**Description**: 更新訂單狀態(訂單成立 → 已完成 → 已取消)

#### Path Parameters

| 參數 | 型別 | 說明 |
|------|------|------|
| `id` | UUID | 訂單 ID |

#### Request Body

```json
{
  "orderStatus": "COMPLETED"
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "訂單狀態更新成功",
  "data": null,
  "timestamp": "2026-02-06T11:00:00.000Z",
  "traceId": "Afa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}
```

---

### 11. 更新出貨狀態

**Endpoint**: `PATCH /api/sales-orders/{id}/shipping-status`  
**Permission**: `sales-order:update`  
**Description**: 更新出貨狀態(未出貨 → 已出貨)

#### Path Parameters

| 參數 | 型別 | 說明 |
|------|------|------|
| `id` | UUID | 訂單 ID |

#### Request Body

```json
{
  "shippingStatus": "SHIPPED"
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "出貨狀態更新成功",
  "data": null,
  "timestamp": "2026-02-06T11:00:00.000Z",
  "traceId": "Bfa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}
```

---

### 12. 匯出訂單報表(Excel)

**Endpoint**: `GET /api/sales-orders/export`  
**Permission**: `sales-order:export`  
**Description**: 匯出訂單報表為 Excel 檔案(前端使用 xlsx 庫處理)

#### Query Parameters

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `orderStatus` | string | 否 | 訂單狀態篩選 |
| `paymentStatus` | string | 否 | 付款狀態篩選 |
| `orderDateStart` | string | 否 | 訂單日期起始 |
| `orderDateEnd` | string | 否 | 訂單日期結束 |

#### Request Example

```text
GET /api/sales-orders/export?orderStatus=PLACED&orderDateStart=2026-02-01&orderDateEnd=2026-02-28
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "匯出成功",
  "data": [
    {
      "orderNumber": "RYO20260206001",
      "customerName": "王小明",
      "productName": "Hermès Birkin 30",
      "totalAmount": 350000,
      "paymentStatus": "未付款",
      "orderStatus": "訂單成立",
      "shippingStatus": "未出貨",
      "createdAt": "2026-02-06",
      "createdByName": "系統管理員"
    }
  ],
  "timestamp": "2026-02-06T11:30:00.000Z",
  "traceId": "Cfa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}
```

**前端處理**: 使用 `xlsx` 庫將 `data` 陣列轉換為 Excel 檔案並下載

---

### 13. 取得出貨單資料

**Endpoint**: `GET /api/sales-orders/{id}/shipping-label`  
**Permission**: `sales-order:read`  
**Description**: 取得出貨單資料(用於列印/預覽)

#### Path Parameters

| 參數 | 型別 | 說明 |
|------|------|------|
| `id` | UUID | 訂單 ID |

#### Success Response (200 OK)

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "查詢成功",
  "data": {
    "orderNumber": "RYO20260206001",
    "orderDate": "2026-02-06",
    "customerName": "王小明",
    "deliveryMethod": "HOME_DELIVERY",
    "deliveryInfo": {
      "type": "HOME_DELIVERY",
      "recipientName": "王小明",
      "recipientPhone": "0912345678",
      "recipientAddress": "台北市信義區信義路五段 7 號"
    },
    "orderItems": [
      {
        "id": "1a78e6a1-2f9d-4b7c-8a5d-3c9e8f1a2b3c",
        "productName": "Hermès Birkin 30",
        "brandName": "Hermès",
        "panshiCode": "HB30001",
        "serialId": "B202401001",
        "productStyle": "經典款 紅色",
        "accessories": "盒子、防塵袋",
        "productSource": "CONSIGNMENT",
        "unitPrice": 350000,
        "quantity": 1
      }
    ]
  },
  "timestamp": "2026-02-06T11:30:00.000Z",
  "traceId": "Dfa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}
```

---

## Pagination Specification

### Request Format

```text
GET /api/sales-orders?pageNumber=1&pageSize=20
```

### Response Format

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "查詢成功",
  "data": [ /* 項目陣列 */ ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 1,
  "timestamp": "2026-02-06T08:30:00.000Z",
  "traceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "errors": null
}
```

### Pagination Rules

1. **頁碼從 1 開始**: `pageNumber` 最小值為 1
2. **每頁筆數限制**: `pageSize` 範圍為 1-100
3. **總頁數計算**: `Math.ceil(totalCount / pageSize)`
4. **空結果**: `data` 為空陣列 `[]`,`totalCount` 為 0

---

## Error Handling Strategy

### Frontend Implementation

```typescript
// axios interceptor 處理 ApiResponse
axios.interceptors.response.use(
  (response) => {
    const apiResponse = response.data as ApiResponse
    if (!apiResponse.success) {
      // 業務邏輯錯誤
      ElMessage.error(apiResponse.message)
      return Promise.reject(new Error(apiResponse.message))
    }
    return response
  },
  (error) => {
    // HTTP 錯誤
    const apiResponse = error.response?.data as ApiResponse
    if (apiResponse) {
      // 特殊錯誤碼處理
      if (apiResponse.code === 'CONCURRENT_UPDATE_CONFLICT') {
        ElMessageBox.confirm(
          '資料已被他人修改,是否重新載入最新資料?',
          '資料衝突',
          { type: 'warning' }
        ).then(() => {
          // 重新載入資料
        })
      } else if (apiResponse.code === 'VALIDATION_ERROR' && apiResponse.errors) {
        // 顯示表單錯誤
        Object.entries(apiResponse.errors).forEach(([field, messages]) => {
          ElMessage.error(`${field}: ${messages.join(', ')}`)
        })
      } else {
        ElMessage.error(apiResponse.message)
      }
    } else {
      ElMessage.error('系統錯誤,請稍後再試')
    }
    return Promise.reject(error)
  }
)
```

---

## API Contracts Summary

### Endpoints Overview

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| POST | `/api/sales-orders` | `sales-order:create` | 建立銷售訂單 |
| GET | `/api/sales-orders` | `sales-order:read` | 取得訂單列表(分頁) |
| GET | `/api/sales-orders/{id}` | `sales-order:read` | 取得訂單詳細資訊 |
| PUT | `/api/sales-orders/{id}` | `sales-order:update` | 修改銷售訂單 |
| DELETE | `/api/sales-orders/{id}` | `sales-order:delete` | 刪除銷售訂單 |
| POST | `/api/sales-orders/{orderId}/payment-records` | `sales-order:update` | 新增付款記錄 |
| PUT | `/api/sales-orders/{orderId}/payment-records/{paymentRecordId}` | `sales-order:update` | 修改付款記錄 |
| DELETE | `/api/sales-orders/{orderId}/payment-records/{paymentRecordId}` | `sales-order:update` | 刪除付款記錄 |
| PATCH | `/api/sales-orders/{id}/payment-status` | `sales-order:update` | 更新付款狀態(手動) |
| PATCH | `/api/sales-orders/{id}/order-status` | `sales-order:update` | 更新訂單狀態 |
| PATCH | `/api/sales-orders/{id}/shipping-status` | `sales-order:update` | 更新出貨狀態 |
| GET | `/api/sales-orders/export` | `sales-order:export` | 匯出訂單報表(Excel) |
| GET | `/api/sales-orders/{id}/shipping-label` | `sales-order:read` | 取得出貨單資料 |

### Key Design Principles

1. **RESTful 風格**: 使用標準 HTTP 動詞與資源路徑
2. **統一回應格式**: 所有 API 遵循 `ApiResponseModel<T>` 格式
3. **業務邏輯錯誤碼**: 使用 `code` 欄位區分不同錯誤情境
4. **樂觀鎖定**: 使用 `version` 欄位防止並發衝突
5. **分頁一致性**: 所有列表 API 使用統一分頁格式
6. **權限控制**: 每個 API 定義明確的權限代碼

---

**API Contracts Completed**: 2026-02-06 | **Author**: GitHub Copilot | **Next**: Quickstart Guide
