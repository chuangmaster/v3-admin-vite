# API Contract Updates: 收購單瑕疵欄位

**Feature**: 007-buyback-defect  
**Date**: 2026-01-30  
**API Version**: 依後端 V3.Admin.Backend.API.yaml 規範  
**Impact**: Minor (新增選填欄位，向後相容)

## Overview

本文件定義收購單瑕疵欄位功能所需的 API 契約變更。所有變更遵循 V3.Admin.Backend.API.yaml 規範，確保前後端契約一致性。

**變更原則**:
- ✅ 向後相容：`defects` 為選填欄位，不影響既有 API 行為
- ✅ 最小變更：僅擴展商品項目結構，不修改端點或方法
- ✅ 型別安全：明確定義瑕疵代碼白名單

---

## API Endpoints Affected

### 1. POST `/api/service-orders/buyback` - 建立收購單

**變更類型**: Request Body 擴展

#### Request Body Schema (Updated)

```json
{
  "orderType": "BUYBACK",
  "orderSource": "OFFLINE" | "ONLINE",
  "customerId": "uuid",
  "productItems": [
    {
      "sequenceNumber": 1,
      "brandName": "Hermès (愛馬仕)",
      "styleName": "Birkin 25",
      "internalCode": "HB25001",
      "grade": "A",
      "amount": 150000,
      "accessories": ["box", "dustBag", "purchaseProof"],
      "defects": ["hardwareRustScratchLoss", "leatherWearScratchDent"]  // ✨ 新增
    }
  ],
  "totalAmount": 150000,
  "idCardFrontImageBase64": "...",
  "idCardFrontImageContentType": "image/jpeg",
  "idCardFrontImageFileName": "id-front.jpg",
  "idCardBackImageBase64": "...",
  "idCardBackImageContentType": "image/jpeg",
  "idCardBackImageFileName": "id-back.jpg"
}
```

#### ProductItem Schema (Updated)

| 欄位 | 型別 | 必填 | 說明 | 變更 |
|------|------|------|------|------|
| `sequenceNumber` | `integer` | ✅ | 商品序號 (1-4) | 既有 |
| `brandName` | `string` | ✅ | 品牌名稱 | 既有 |
| `styleName` | `string` | ❌ | 款式 | 既有 |
| `internalCode` | `string` | ❌ | 內碼 | 既有 |
| `grade` | `string` | ❌ | 商品等級 (N/NA/A/B/C) | 既有 |
| `amount` | `number` | ✅ | 收購金額 | 既有 |
| `accessories` | `string[]` | ❌ | 配件代碼陣列 | 既有 |
| **`defects`** | **`string[]`** | **❌** | **瑕疵代碼陣列** | **✨ 新增** |

#### Defects Field Specification

**型別**: `array<string>`  
**必填**: 否 (optional)  
**預設值**: `[]` 或 `null` (依後端實作)  
**驗證規則**:
- 陣列長度：0-4
- 元素必須為有效的瑕疵代碼
- 不允許重複元素
- 空陣列表示「已確認無瑕疵」

**有效瑕疵代碼** (Enum):
```typescript
enum DefectCode {
  HARDWARE_RUST_SCRATCH_LOSS = "hardwareRustScratchLoss",
  LEATHER_WEAR_SCRATCH_DENT = "leatherWearScratchDent",
  LINING_DIRTY = "liningDirty",
  CORNER_WEAR = "cornerWear"
}
```

**範例 Payloads**:

```json
// 有瑕疵
{
  "defects": ["hardwareRustScratchLoss", "leatherWearScratchDent"]
}

// 無瑕疵（明確表示）
{
  "defects": []
}

// 未填寫（選填欄位）
{
  // defects 欄位不存在
}
```

#### Response (Unchanged)

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "建立收購單成功",
  "data": {
    "id": "uuid",
    "orderNumber": "BK20260130001",
    // ... 其他欄位
  },
  "timestamp": "2026-01-30T12:00:00Z",
  "traceId": "trace-id"
}
```

**向後相容性**: ✅ 既有客戶端不傳送 `defects` 欄位仍可正常運作

---

### 2. GET `/api/service-orders/{id}` - 查詢服務單詳細

**變更類型**: Response Body 擴展

#### Response Body Schema (Updated)

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "查詢成功",
  "data": {
    "id": "uuid",
    "orderNumber": "BK20260130001",
    "orderType": "BUYBACK",
    "orderSource": "OFFLINE",
    "customerId": "uuid",
    "productItems": [
      {
        "id": "uuid",
        "sequenceNumber": 1,
        "brandName": "Hermès (愛馬仕)",
        "style": "Birkin 25",
        "internalCode": "HB25001",
        "grade": "A",
        "amount": 150000,
        "accessories": ["box", "dustBag"],
        "defects": ["hardwareRustScratchLoss"]  // ✨ 新增或既有
      }
    ],
    "totalAmount": 150000,
    "status": "COMPLETED",
    "createdAt": "2026-01-30T10:00:00Z",
    "version": 1
  },
  "timestamp": "2026-01-30T12:00:00Z",
  "traceId": "trace-id"
}
```

#### 既有資料處理

**情境 1: 既有收購單（無 defects 欄位）**
```json
{
  "productItems": [
    {
      "id": "uuid",
      "brandName": "Chanel",
      // defects 欄位不存在（未定義）
    }
  ]
}
```
**前端處理**: `productItem.defects ?? []` → 視為空陣列

**情境 2: 新收購單（有 defects 欄位）**
```json
{
  "productItems": [
    {
      "id": "uuid",
      "brandName": "Chanel",
      "defects": []  // 明確為空陣列
    }
  ]
}
```
**前端處理**: 正常顯示為「無瑕疵」

**向後相容性**: ✅ 既有記錄不包含 `defects` 欄位不影響前端顯示

---

### 3. PUT `/api/service-orders/{id}` - 更新服務單 (如適用)

**變更類型**: Request Body 擴展

> **注意**: 若系統支援編輯收購單功能，則需要此 API 變更；否則可忽略。

#### Request Body Schema (Updated)

```json
{
  "productItems": [
    {
      "sequenceNumber": 1,
      "brandName": "Hermès (愛馬仕)",
      "styleName": "Birkin 25",
      "internalCode": "HB25001",
      "grade": "A",
      "amount": 150000,
      "accessories": ["box", "dustBag"],
      "defects": ["hardwareRustScratchLoss", "cornerWear"]  // ✨ 支援更新
    }
  ],
  "totalAmount": 150000,
  "version": 1
}
```

**向後相容性**: ✅ 不傳送 `defects` 欄位視為不更新該屬性

---

## Frontend Integration

### API 呼叫範例

#### 建立收購單（含瑕疵資訊）

**檔案**: `src/pages/service-order-management/composables/useServiceOrderForm.ts`

```typescript
// ✨ 修改後的請求映射
const requestData: CreateBuybackOrderRequest = {
  orderType: formData.orderType!,
  orderSource: formData.orderSource!,
  customerId: formData.customerId!,
  productItems: productItems.value.map((item, index) => ({
    sequenceNumber: index + 1,
    brandName: item.brandName!,
    styleName: item.style,
    internalCode: item.internalCode,
    grade: item.grade,
    amount: item.amount,
    accessories: item.accessories,
    defects: item.defects  // ✨ 新增此行
  })),
  totalAmount: formData.totalAmount!,
  // ... 身分證圖片上傳
}

const response = await createBuybackOrder(requestData)
```

#### 查詢服務單（顯示瑕疵資訊）

**檔案**: `src/pages/service-order-management/detail.vue`

```vue
<template>
  <el-descriptions-item label="商品瑕疵處">
    <template v-if="item.defects && item.defects.length > 0">
      <el-tag 
        v-for="defect in item.defects" 
        :key="defect" 
        type="warning"
      >
        {{ getDefectLabel(defect) }}
      </el-tag>
    </template>
    <span v-else>-</span>
  </el-descriptions-item>
</template>

<script setup lang="ts">
function getDefectLabel(code: string): string {
  return DEFECT_OPTIONS.find(opt => opt.value === code)?.label || code
}
</script>
```

---

## Error Handling

### 新增錯誤情境

| HTTP Status | Code | Message | 處理方式 |
|-------------|------|---------|---------|
| 400 | `VALIDATION_ERROR` | 瑕疵代碼不合法 | 前端顯示錯誤訊息，要求修正 |
| 400 | `VALIDATION_ERROR` | 瑕疵項目重複 | 前端去重後重試 |
| 500 | `INTERNAL_ERROR` | 伺服器錯誤 | 顯示通用錯誤訊息，建議稍後重試 |

### 範例錯誤回應

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "商品項目瑕疵代碼不合法：invalidCode",
  "data": null,
  "timestamp": "2026-01-30T12:00:00Z",
  "traceId": "trace-id"
}
```

**前端處理邏輯**:
```typescript
if (!response.success) {
  if (response.code === "VALIDATION_ERROR") {
    ElMessage.error(`驗證失敗: ${response.message}`)
  } else {
    ElMessage.error("建立收購單失敗，請稍後再試")
  }
}
```

---

## Testing Scenarios

### Contract Test Cases

#### Test 1: 建立收購單（含瑕疵）
```http
POST /api/service-orders/buyback
Content-Type: application/json

{
  "orderType": "BUYBACK",
  "orderSource": "OFFLINE",
  "customerId": "...",
  "productItems": [
    {
      "sequenceNumber": 1,
      "brandName": "Test Brand",
      "amount": 10000,
      "defects": ["hardwareRustScratchLoss", "liningDirty"]
    }
  ],
  "totalAmount": 10000
}

Expected: 201 Created
```

#### Test 2: 建立收購單（無瑕疵）
```http
POST /api/service-orders/buyback
Content-Type: application/json

{
  "productItems": [
    {
      "sequenceNumber": 1,
      "brandName": "Test Brand",
      "amount": 10000,
      "defects": []
    }
  ]
}

Expected: 201 Created (defects 儲存為空陣列)
```

#### Test 3: 建立收購單（不傳 defects）
```http
POST /api/service-orders/buyback
Content-Type: application/json

{
  "productItems": [
    {
      "sequenceNumber": 1,
      "brandName": "Test Brand",
      "amount": 10000
      // 不包含 defects 欄位
    }
  ]
}

Expected: 201 Created (向後相容)
```

#### Test 4: 驗證錯誤（無效代碼）
```http
POST /api/service-orders/buyback
Content-Type: application/json

{
  "productItems": [
    {
      "sequenceNumber": 1,
      "brandName": "Test Brand",
      "amount": 10000,
      "defects": ["invalidCode"]
    }
  ]
}

Expected: 400 Bad Request (VALIDATION_ERROR)
```

#### Test 5: 查詢既有記錄（無 defects）
```http
GET /api/service-orders/{old-buyback-id}

Expected Response:
{
  "productItems": [
    {
      "brandName": "Old Brand",
      // defects 欄位不存在或為 null
    }
  ]
}
```

---

## OpenAPI Schema Snippet (參考)

以下為建議的 OpenAPI 規範片段,供後端團隊參考:

```yaml
components:
  schemas:
    CreateBuybackProductItemRequest:
      type: object
      required:
        - sequenceNumber
        - brandName
        - amount
      properties:
        sequenceNumber:
          type: integer
          minimum: 1
          maximum: 4
        brandName:
          type: string
          minLength: 1
          maxLength: 100
        styleName:
          type: string
          maxLength: 100
        internalCode:
          type: string
          maxLength: 50
        grade:
          type: string
          enum: [N, NA, A, B, C]
        amount:
          type: number
          format: decimal
          minimum: 1
        accessories:
          type: array
          items:
            type: string
        defects:  # ✨ 新增
          type: array
          items:
            type: string
            enum:
              - hardwareRustScratchLoss
              - leatherWearScratchDent
              - liningDirty
              - cornerWear
          maxItems: 4
          uniqueItems: true
```

---

## Migration & Rollout Plan

### Phase 1: 後端 API 更新
- [ ] 更新 V3.Admin.Backend.API.yaml 規範
- [ ] 實作 API 端點變更
- [ ] 新增瑕疵欄位驗證邏輯
- [ ] 資料庫 Schema 確認（ProductItems.Defects）
- [ ] 單元測試與整合測試

### Phase 2: 前端實作
- [ ] 更新型別定義（types.ts）
- [ ] 修改表單元件（ProductItemForm.vue）
- [ ] 更新 API 請求映射（useServiceOrderForm.ts）
- [ ] 更新顯示邏輯（detail.vue, create.vue）
- [ ] Excel 匯出功能擴展

### Phase 3: 測試與部署
- [ ] 前端單元測試
- [ ] 整合測試（前後端聯調）
- [ ] E2E 測試（完整建單流程）
- [ ] UAT 使用者驗收測試
- [ ] 生產環境部署

---

## Backend Coordination Checklist

### 與後端團隊確認事項

- [ ] ✅ V3.Admin.Backend.API.yaml 是否包含 `defects` 欄位規範？
- [ ] ✅ 後端 API 是否已實作該欄位支援？
- [ ] ✅ 資料庫 Schema 是否已包含 `Defects` 欄位？
- [ ] ✅ 既有收購單記錄在 API 回傳時，`defects` 欄位格式為何？（null / undefined / 不存在）
- [ ] ✅ 驗證邏輯是否正確（白名單、去重、長度限制）？
- [ ] ✅ 錯誤訊息是否明確且易於理解？

---

## References

- Feature Spec: `specs/007-buyback-defect/spec.md`
- Data Model: `specs/007-buyback-defect/data-model.md`
- Research: `specs/007-buyback-defect/research.md`
- Backend API Spec: `V3.Admin.Backend.API.yaml`（後端規範文件）
- Frontend Types: `src/pages/service-order-management/types.ts`

---

**Contract Status**: ✅ Defined  
**Backend Sync Required**: ✅ Yes  
**Breaking Changes**: ❌ None (向後相容)
