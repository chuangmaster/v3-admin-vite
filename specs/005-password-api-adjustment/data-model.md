# Data Model: 密碼修改 API 調整

**Feature**: 密碼修改 API 調整  
**Version**: 1.0.0  
**Created**: 2026-01-22  
**Related**: [spec.md](./spec.md) | [plan.md](./plan.md)

## 核心實體

### Account Entity（既有）

密碼修改操作會影響 Account 實體的以下欄位：

| 欄位 | 型別 | 描述 | 變更時機 |
|-----|------|------|---------|
| `id` | `string` (UUID) | 用戶唯一識別碼 | 不變 |
| `account` | `string` | 帳號名稱 | 不變 |
| `passwordHash` | `string` | 密碼雜湊值 | 密碼修改/重設成功時更新 |
| `version` | `number` | 資料版本號 | 密碼修改/重設成功時遞增 |
| `jwtVersion` | `number` | JWT 版本號 | 密碼修改/重設成功時遞增（使舊 token 失效） |
| `updatedAt` | `datetime` | 最後更新時間 | 密碼修改/重設成功時更新 |

**注意**：`jwtVersion` 欄位用於實現 JWT token 失效機制，確保密碼修改後所有舊 token 無法使用。

---

## 請求/回應模型

### ResetPasswordRequest（新增）

管理者重設用戶密碼的請求模型。

| 欄位 | 型別 | 必填 | 驗證規則 | 描述 |
|-----|------|------|---------|------|
| `newPassword` | `string` | ✅ | 長度 ≥ 8，包含大小寫字母與數字 | 新密碼 |
| `version` | `number` | ✅ | 整數，≥ 0 | 樂觀鎖版本號 |

**使用場景**：管理者為用戶重設密碼，無需知道舊密碼。

**權限要求**：`account.password.reset`

---

### ChangePasswordRequest（既有，無變更）

用戶自行修改密碼的請求模型。

| 欄位 | 型別 | 必填 | 驗證規則 | 描述 |
|-----|------|------|---------|------|
| `oldPassword` | `string` | ✅ | - | 當前密碼 |
| `newPassword` | `string` | ✅ | 長度 ≥ 8，包含大小寫字母與數字 | 新密碼 |
| `version` | `number` | ✅ | 整數，≥ 0 | 樂觀鎖版本號 |

**使用場景**：用戶自行修改密碼，必須提供舊密碼驗證身份。

**權限要求**：已登入用戶（JWT 驗證）

---

## 密碼驗證規則

### 前端驗證

前端實施即時驗證，提供用戶友善的錯誤提示：

```typescript
/**
 * 密碼驗證函式
 * 驗證密碼必須至少 8 字元，包含大小寫字母與數字
 */
const passwordValidator = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error("請輸入密碼"))
  } else if (value.length < 8) {
    callback(new Error("密碼至少需要 8 字元"))
  } else if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    callback(new Error("密碼必須包含大小寫字母和數字"))
  } else {
    callback()
  }
}
```

### 後端驗證（後端責任）

後端必須實施相同或更嚴格的驗證規則，包括：

1. **長度檢查**：最少 8 字元
2. **字元類型**：至少包含大寫字母、小寫字母、數字
3. **黑名單檢查**（可選）：避免常見弱密碼（如 "Password123"）
4. **歷史檢查**（可選）：避免與最近 N 次使用過的密碼相同

---

## 狀態流轉

### 管理者重設密碼流程

```
[開始] 
  → 驗證 JWT token 有效性
  → 驗證管理者權限（account.password.reset）
  → 檢查目標用戶存在性
  → 驗證版本號（樂觀鎖）
  → 驗證新密碼規則
  → 雜湊新密碼
  → 更新 passwordHash
  → 遞增 version
  → 遞增 jwtVersion（使所有舊 token 失效）
  → 更新 updatedAt
  → 記錄審計日誌 ⚠️
  → [成功]
```

### 用戶修改密碼流程

```
[開始]
  → 驗證 JWT token 有效性
  → 從 JWT 取得當前用戶 ID
  → 檢查用戶存在性
  → 驗證版本號（樂觀鎖）
  → 驗證舊密碼正確性 ⚠️
  → 驗證新密碼規則
  → 檢查新密碼 ≠ 舊密碼（可選）
  → 雜湊新密碼
  → 更新 passwordHash
  → 遞增 version
  → 遞增 jwtVersion（使所有舊 token 失效）
  → 更新 updatedAt
  → 記錄審計日誌 ⚠️
  → [成功]
```

⚠️ = 與管理者重設的主要差異點

---

## 版本控制機制

密碼修改操作使用**樂觀鎖（Optimistic Locking）**防止並發衝突：

### 工作原理

1. **前端**：從用戶資料中取得當前 `version`
2. **前端**：提交請求時帶上此 `version`
3. **後端**：比對資料庫中的 `version`
   - **相符** → 執行更新，`version += 1`
   - **不符** → 拒絕請求，回傳 409 錯誤
4. **前端**：收到 409 錯誤時，提示用戶重新整理資料

### 範例場景

**情境**：管理者 A 和管理者 B 同時為用戶 C 重設密碼

```
時間線：
T0: 用戶 C 的 version = 5
T1: 管理者 A 讀取用戶資料（version = 5）
T2: 管理者 B 讀取用戶資料（version = 5）
T3: 管理者 A 提交重設（version = 5）→ 成功，version 更新為 6
T4: 管理者 B 提交重設（version = 5）→ 失敗，返回 409 錯誤
```

**結果**：管理者 B 收到錯誤提示，需重新整理後再試。

---

## JWT 版本失效機制

### 目的

確保密碼修改後，所有舊的 JWT token 立即失效，強制用戶重新登入。

### 實現方式

1. **Account 實體包含 `jwtVersion` 欄位**
2. **JWT payload 包含 `jwtVersion`**

   ```json
   {
     "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
     "account": "john_doe",
     "jwtVersion": 5,
     "iat": 1706000000,
     "exp": 1706086400
   }
   ```

3. **密碼修改時**：
   - 後端遞增資料庫中的 `jwtVersion`（如 5 → 6）

4. **JWT 驗證時**：
   - 後端從資料庫讀取當前 `jwtVersion`
   - 比對 token 中的 `jwtVersion`
   - **不一致** → 拒絕請求，返回 401 Unauthorized

### 流程圖

```
用戶修改密碼
  → 後端更新 passwordHash
  → 後端遞增 jwtVersion（5 → 6）
  ↓
用戶使用舊 token 呼叫 API
  → 後端解析 token（jwtVersion = 5）
  → 後端查詢資料庫（jwtVersion = 6）
  → 比對結果：5 ≠ 6
  → 拒絕請求，返回 401
  ↓
前端偵測到 401
  → 清除本地 token
  → 重新導向至登入頁
```

---

## 審計日誌模型（後端責任）

密碼修改操作應記錄完整的審計日誌：

| 欄位 | 型別 | 描述 | 範例 |
|-----|------|------|------|
| `logId` | `string` (UUID) | 日誌 ID | `7c9e6679-7425-40de-944b-e07fc1f90ae7` |
| `timestamp` | `datetime` | 操作時間 | `2026-01-22T10:30:00.000Z` |
| `operatorId` | `string` (UUID) | 操作者 ID | `admin-123` |
| `operatorAccount` | `string` | 操作者帳號 | `admin_user` |
| `targetUserId` | `string` (UUID) | 目標用戶 ID | `user-456` |
| `targetUserAccount` | `string` | 目標用戶帳號 | `john_doe` |
| `operationType` | `string` | 操作類型 | `PASSWORD_RESET` 或 `PASSWORD_CHANGE` |
| `ipAddress` | `string` | IP 位址 | `192.168.1.100` |
| `userAgent` | `string` | User Agent | `Mozilla/5.0 ...` |
| `result` | `string` | 操作結果 | `SUCCESS` 或 `FAILED` |
| `errorCode` | `string` | 錯誤代碼（失敗時） | `FORBIDDEN` 或 `INVALID_OLD_PASSWORD` |

**範例日誌（管理者重設）**：

```json
{
  "logId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "timestamp": "2026-01-22T10:30:00.000Z",
  "operatorId": "admin-123",
  "operatorAccount": "admin_user",
  "targetUserId": "user-456",
  "targetUserAccount": "john_doe",
  "operationType": "PASSWORD_RESET",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...",
  "result": "SUCCESS",
  "errorCode": null
}
```

---

## 前端表單資料模型

### 管理者重設密碼表單

```typescript
interface PasswordFormData {
  /** 新密碼 */
  newPassword: string
  /** 確認新密碼 */
  confirmPassword: string
  /** 待修改的用戶 ID */
  userId?: string
  /** 資料版本號 */
  version: number
}
```

**特點**：不包含 `oldPassword` 欄位

### 用戶修改密碼表單

```typescript
interface ChangePasswordFormData {
  /** 舊密碼 */
  oldPassword: string
  /** 新密碼 */
  newPassword: string
  /** 確認新密碼 */
  confirmPassword: string
}
```

**特點**：包含 `oldPassword` 欄位，用於身份驗證

---

## 變更歷史

| 日期 | 版本 | 變更內容 | 作者 |
|-----|------|---------|------|
| 2026-01-22 | 1.0.0 | 初版建立 | GitHub Copilot |

---

## 相關文件

- [Feature Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [API Contracts](./contracts/api-contracts.md)
- [Quickstart Guide](./quickstart.md)
