# API Contracts: 密碼修改 API 調整

**Feature**: 密碼修改 API 調整  
**Version**: 1.0.0  
**Created**: 2026-01-22  
**Related**: [spec.md](../spec.md) | [plan.md](../plan.md)

## 概述

本文件定義了密碼修改功能的兩個 API 端點的詳細規格。

- **管理者重設用戶密碼**：無需舊密碼，支援管理場景
- **用戶自行修改密碼**：需要舊密碼驗證，確保安全性

兩個 API 都使用樂觀鎖（version）機制防止並發衝突。

---

## API Endpoints

### 1. 管理者重設用戶密碼

**Endpoint**: `PUT /api/Account/{id}/reset-password`

**描述**: 管理者無需知道用戶的舊密碼即可重設密碼。此 API 僅供擁有 `account.password.reset` 權限的管理者使用。

**Authorization**: ✅ Required（JWT Bearer Token + `account.password.reset` 權限）

#### Request

**Path Parameters**:

| 參數 | 型別 | 描述 | 範例 |
|-----|------|------|------|
| `id` | `string` (UUID) | 目標用戶 ID | `3fa85f64-5717-4562-b3fc-2c963f66afa6` |

**Request Body**:

```json
{
  "newPassword": "NewSecureP@ss123",
  "version": 5
}
```

**欄位說明**:

| 欄位 | 型別 | 必填 | 描述 | 驗證規則 |
|-----|------|------|------|---------|
| `newPassword` | `string` | ✅ | 新密碼 | 最少 8 字元，包含大小寫字母與數字 |
| `version` | `number` | ✅ | 資料版本號 | 整數，≥ 0，用於樂觀鎖 |

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "密碼重設成功",
  "data": null,
  "timestamp": "2026-01-22T10:30:00.000Z"
}
```

**Error Responses**:

| HTTP 狀態碼 | Code | Message | 說明 |
|-----------|------|---------|------|
| 400 | `VALIDATION_ERROR` | 新密碼不符合規則 | 密碼格式錯誤（長度不足、缺少大小寫字母或數字） |
| 403 | `FORBIDDEN` | 無權限執行此操作 | 用戶沒有 `account.password.reset` 權限 |
| 404 | `NOT_FOUND` | 找不到指定的用戶 | 目標用戶不存在 |
| 409 | `API_CODE_CONCURRENT_UPDATE_CONFLICT` | 資料已被其他操作修改 | 版本號不一致（樂觀鎖衝突） |

**Error Response 範例（403）**:

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "無權限執行此操作",
  "data": null,
  "timestamp": "2026-01-22T10:30:00.000Z"
}
```

---

### 2. 用戶自行修改密碼

**Endpoint**: `PUT /api/Account/me/password`

**描述**: 用戶修改自己的密碼，需提供舊密碼驗證。後端會從 JWT 取得當前用戶 ID。

**Authorization**: ✅ Required（JWT Bearer Token）

#### Request

**Request Body**:

```json
{
  "oldPassword": "CurrentP@ssw0rd",
  "newPassword": "NewSecureP@ss123",
  "version": 5
}
```

**欄位說明**:

| 欄位 | 型別 | 必填 | 描述 | 驗證規則 |
|-----|------|------|------|---------|
| `oldPassword` | `string` | ✅ | 當前密碼 | - |
| `newPassword` | `string` | ✅ | 新密碼 | 最少 8 字元，包含大小寫字母與數字 |
| `version` | `number` | ✅ | 資料版本號 | 整數，≥ 0，用於樂觀鎖 |

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "密碼修改成功",
  "data": null,
  "timestamp": "2026-01-22T10:30:00.000Z"
}
```

**Error Responses**:

| HTTP 狀態碼 | Code | Message | 說明 |
|-----------|------|---------|------|
| 400 | `VALIDATION_ERROR` | 新密碼不符合規則 | 密碼格式錯誤（長度不足、缺少大小寫字母或數字） |
| 401 | `INVALID_OLD_PASSWORD` | 舊密碼不正確 | 提供的舊密碼驗證失敗 |
| 409 | `API_CODE_CONCURRENT_UPDATE_CONFLICT` | 資料已被其他操作修改 | 版本號不一致（樂觀鎖衝突） |

**Error Response 範例（401）**:

```json
{
  "success": false,
  "code": "INVALID_OLD_PASSWORD",
  "message": "舊密碼不正確",
  "data": null,
  "timestamp": "2026-01-22T10:30:00.000Z"
}
```

---

## TypeScript 型別定義

### 前端型別（src/pages/user-management/types.ts）

```typescript
/** 管理者重設密碼請求（管理者無需提供舊密碼） */
export interface ResetPasswordRequest {
  /** 新密碼（最少 8 字元，包含大小寫字母與數字） */
  newPassword: string
  /** 資料版本號（用於併發控制） */
  version: number
}

/** 變更密碼請求 */
export interface ChangePasswordRequest {
  /** 舊密碼 */
  oldPassword: string
  /** 新密碼（最少 8 字元，包含大小寫字母與數字） */
  newPassword: string
  /** 資料版本號（用於併發控制） */
  version: number
}
```

### 前端 API 封裝（src/pages/user-management/apis/user.ts）

```typescript
/**
 * 管理者重設用戶密碼（後端規格：PUT /api/Account/{id}/reset-password）
 * 
 * 此 API 僅供管理者使用，無需提供用戶的舊密碼。
 * 
 * @param id - 目標用戶 ID（UUID）
 * @param data - 重設密碼請求資料
 * @returns 重設結果（data 為 null）
 * @throws {409} API_CODE_CONCURRENT_UPDATE_CONFLICT - 版本衝突
 * @throws {400} VALIDATION_ERROR - 新密碼不符合規則
 * @throws {403} FORBIDDEN - 非管理者權限
 * @throws {404} NOT_FOUND - 用戶不存在
 */
export async function resetPassword(
  id: string,
  data: ResetPasswordRequest
): Promise<ApiResponse<null>> {
  return request({ url: `/account/${id}/reset-password`, method: "PUT", data })
}

/**
 * 用戶自行修改密碼（後端規格：PUT /api/Account/me/password）
 *
 * 此 API 用於用戶修改自己的密碼，必須提供舊密碼驗證。
 * 實際使用時，傳入的 id 應為當前登入用戶的 ID。
 *
 * @param id - 用戶 ID（UUID，應為當前用戶 ID）
 * @param data - 變更密碼請求資料
 * @returns 變更結果（data 為 null）
 * @throws {409} API_CODE_CONCURRENT_UPDATE_CONFLICT - 版本衝突
 * @throws {401} INVALID_OLD_PASSWORD - 舊密碼錯誤
 * @throws {400} VALIDATION_ERROR - 新密碼不符合規則
 */
export async function changePassword(
  id: string,
  data: ChangePasswordRequest
): Promise<ApiResponse<null>> {
  return request({ url: "/account/me/password", method: "PUT", data })
}
```

---

## 安全性考量

### 1. 權限驗證（後端責任）

- **管理者重設密碼**：後端必須驗證 JWT 中包含 `account.password.reset` 權限
- **用戶修改密碼**：後端必須驗證 JWT 有效性並從 JWT 中取得用戶 ID

### 2. 審計日誌（後端責任）

所有密碼修改操作都應記錄審計日誌，包含：
- 操作時間
- 操作者 ID
- 目標用戶 ID（管理者重設時）
- 操作類型（重設/修改）
- IP 位址

### 3. JWT 版本失效機制

密碼修改成功後，用戶的所有舊 JWT token 應立即失效。這通過以下機制實現：

1. Account 實體包含 `jwtVersion` 欄位
2. 密碼修改時，後端遞增 `jwtVersion`
3. 後端驗證 JWT 時，比對 token 中的 version 與資料庫中的 `jwtVersion`
4. 不一致則拒絕請求

### 4. 密碼強度規則

新密碼必須符合以下規則（後端驗證）：
- 最少 8 字元
- 至少包含一個大寫字母（A-Z）
- 至少包含一個小寫字母（a-z）
- 至少包含一個數字（0-9）

前端也實施相同驗證規則，提供即時反饋。

---

## 測試場景

### 管理者重設密碼

✅ **正常流程**：
1. 管理者呼叫 `PUT /api/Account/{id}/reset-password`
2. 提供 newPassword 和 version
3. 後端驗證權限、版本、密碼規則
4. 更新密碼、遞增 version 和 jwtVersion
5. 返回成功

❌ **錯誤場景**：
- 無管理權限 → 403 FORBIDDEN
- 用戶不存在 → 404 NOT_FOUND
- 版本衝突 → 409 API_CODE_CONCURRENT_UPDATE_CONFLICT
- 密碼格式錯誤 → 400 VALIDATION_ERROR

### 用戶修改密碼

✅ **正常流程**：
1. 用戶呼叫 `PUT /api/Account/me/password`
2. 提供 oldPassword、newPassword 和 version
3. 後端驗證舊密碼、版本、密碼規則
4. 更新密碼、遞增 version 和 jwtVersion
5. 返回成功

❌ **錯誤場景**：
- 舊密碼錯誤 → 401 INVALID_OLD_PASSWORD
- 版本衝突 → 409 API_CODE_CONCURRENT_UPDATE_CONFLICT
- 密碼格式錯誤 → 400 VALIDATION_ERROR

---

## 變更歷史

| 日期 | 版本 | 變更內容 | 作者 |
|-----|------|---------|------|
| 2026-01-22 | 1.0.0 | 初版建立 | GitHub Copilot |

---

## 相關文件

- [Feature Specification](../spec.md)
- [Implementation Plan](../plan.md)
- [Data Model](./data-model.md)
- [Quickstart Guide](../quickstart.md)
