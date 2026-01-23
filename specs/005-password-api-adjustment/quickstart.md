# Quickstart: 密碼修改 API 調整

**Feature**: 密碼修改 API 調整  
**Version**: 1.0.0  
**Created**: 2026-01-22  
**Related**: [spec.md](./spec.md) | [plan.md](./plan.md)

## 開發時間估算

| 階段 | 預估時間 | 內容 |
|-----|---------|------|
| **Phase 1**: Setup | 5 分鐘 | 確認分支與環境 |
| **Phase 2**: Foundational | 30 分鐘 | 型別定義與 API 層實作 |
| **Phase 3**: User Story 1 | 30 分鐘 | 管理者重設密碼功能 |
| **Phase 4**: User Story 2 | 10 分鐘 | 確認用戶修改密碼功能 |
| **Phase 5**: 測試更新 | 45 分鐘 | 更新所有測試 |
| **Phase 6**: 文件更新 | 20 分鐘 | 建立 API/Data Model/Quickstart 文件 |
| **Phase 7**: 最終檢查 | 30 分鐘 | 完整測試與手動驗證 |
| **總計** | **2.5-3 小時** | - |

---

## 快速開始

### 1. 前置條件檢查

確認後端 API 已實作：

```bash
# 檢查管理者重設密碼 API
curl -X PUT https://api.example.com/api/Account/{userId}/reset-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newPassword":"NewPass123","version":1}'

# 檢查用戶修改密碼 API
curl -X PUT https://api.example.com/api/Account/me/password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"oldPassword":"OldPass123","newPassword":"NewPass456","version":1}'
```

**驗證**：兩個 API 都應回傳有效回應（200 或適當的錯誤碼）。

---

### 2. 切換到功能分支

```bash
git checkout 005-password-api-adjustment
```

**驗證**：
```bash
git branch --show-current
# 應輸出：005-password-api-adjustment
```

---

### 3. 實作步驟（簡化版）

#### Step 1: 新增型別定義（5 分鐘）

**檔案**：`src/pages/user-management/types.ts`

```typescript
/** 管理者重設密碼請求（管理者無需提供舊密碼） */
export interface ResetPasswordRequest {
  /** 新密碼（最少 8 字元，包含大小寫字母與數字） */
  newPassword: string
  /** 資料版本號（用於併發控制） */
  version: number
}
```

---

#### Step 2: 新增與修改 API 函式（10 分鐘）

**檔案**：`src/pages/user-management/apis/user.ts`

**2.1 更新 import**：
```typescript
import type {
  ChangePasswordRequest,
  CreateUserRequest,
  DeleteUserRequest,
  ResetPasswordRequest,  // 新增
  UpdateUserRequest,
  User,
  UserListParams,
  UserListResponse
} from "../types"
```

**2.2 新增 `resetPassword` 函式**：
```typescript
/**
 * 管理者重設用戶密碼（後端規格：PUT /api/Account/{id}/reset-password）
 */
export async function resetPassword(
  id: string,
  data: ResetPasswordRequest
): Promise<ApiResponse<null>> {
  return request({ url: `/account/${id}/reset-password`, method: "PUT", data })
}
```

**2.3 修改 `changePassword` 端點**：
```typescript
// 變更前：url: `/account/${id}/password`
// 變更後：url: `/account/me/password`
export async function changePassword(
  id: string,
  data: ChangePasswordRequest
): Promise<ApiResponse<null>> {
  return request({ url: "/account/me/password", method: "PUT", data })
}
```

---

#### Step 3: 更新管理者端組合式函式（15 分鐘）

**檔案**：`src/pages/user-management/composables/useChangePasswordForm.ts`

**3.1 更新 import**：
```typescript
import type { ResetPasswordRequest } from "../types"
import { resetPassword } from "../apis/user"
```

**3.2 移除 `oldPassword` 欄位**：
```typescript
// FormData 介面
interface PasswordFormData {
  newPassword: string
  confirmPassword: string
  userId?: string
  version: number
}

// formData reactive 物件
const formData = reactive<PasswordFormData>({
  newPassword: "",
  confirmPassword: "",
  userId: undefined,
  version: 0
})

// 驗證規則（移除 oldPassword 規則）
const rules: FormRules = {
  newPassword: [...],
  confirmPassword: [...]
}
```

**3.3 更新 `submitForm` 函式**：
```typescript
const response = await resetPassword(formData.userId!, {
  newPassword: formData.newPassword,
  version: formData.version
} as ResetPasswordRequest)
```

**3.4 更新錯誤處理（移除 401 INVALID_OLD_PASSWORD，新增 403/404）**：
```typescript
} else if (status === 403) {
  ElMessage.error("您沒有權限執行此操作")
} else if (status === 404) {
  ElMessage.error("找不到指定的用戶")
```

---

#### Step 4: 確認用戶端功能不變（5 分鐘）

檢查以下檔案保持不變：

- ✅ `src/pages/profile/composables/useChangePassword.ts`（包含 `oldPassword`）
- ✅ `src/pages/profile/components/ChangePasswordForm.vue`（包含舊密碼欄位）

**驗證方法**：
```bash
# 搜尋 oldPassword 欄位
grep -n "oldPassword" src/pages/profile/composables/useChangePassword.ts
grep -n "oldPassword" src/pages/profile/components/ChangePasswordForm.vue
```

應該能找到相關程式碼。

---

#### Step 5: 更新測試（20 分鐘）

**檔案**：`tests/composables/useChangePasswordForm.test.ts`

**5.1 更新 mock**：
```typescript
vi.mock("@/pages/user-management/apis/user", () => ({
  resetPassword: vi.fn()  // 改為 resetPassword
}))
```

**5.2 移除 `oldPassword` 相關測試**：
- 初始化測試不應包含 `oldPassword`
- 驗證規則測試不應包含 `oldPassword`
- 重置表單測試不應包含 `oldPassword`

**5.3 執行測試**：
```bash
pnpm test
```

**預期結果**：所有測試通過（139/139）

---

### 4. 程式碼品質檢查（5 分鐘）

```bash
# TypeScript 類型檢查
pnpm type-check

# ESLint 檢查
pnpm lint
```

**預期結果**：無錯誤、無警告

---

### 5. 手動測試（20 分鐘）

#### 測試 1: 管理者重設用戶密碼

1. 以管理者身份登入系統
2. 進入用戶管理頁面
3. 選擇一個用戶，點擊「修改密碼」（或觸發重設密碼功能）
4. **確認**：表單**不顯示**舊密碼欄位
5. 輸入新密碼與確認密碼（如 `NewPass123`）
6. 點擊提交
7. **驗證**：
   - ✅ 顯示「密碼重設成功」訊息
   - ✅ Modal/Form 關閉
   - ✅ 目標用戶能使用新密碼登入
   - ✅ 目標用戶的舊 JWT 失效（被登出）

---

#### 測試 2: 用戶自行修改密碼

1. 以一般用戶身份登入
2. 進入個人設定頁面（Profile）
3. 點擊「修改密碼」
4. **確認**：表單**顯示**舊密碼欄位
5. 輸入舊密碼、新密碼、確認新密碼
6. 點擊提交
7. **驗證**：
   - ✅ 顯示「密碼修改成功」訊息
   - ✅ 表單重置
   - ✅ 用戶能使用新密碼重新登入
   - ✅ 用戶被自動登出（舊 JWT 失效）

---

#### 測試 3: 錯誤處理

**3.1 新密碼不符合規則**：
- 輸入短於 8 字元的密碼 → 顯示「密碼至少需要 8 字元」
- 輸入無大寫字母的密碼 → 顯示「密碼必須包含大小寫字母和數字」
- 輸入無數字的密碼 → 顯示「密碼必須包含大小寫字母和數字」

**3.2 舊密碼錯誤（僅用戶修改）**：
- 輸入錯誤的舊密碼 → 顯示「舊密碼不正確，請重新輸入」

**3.3 版本衝突**：
1. 開啟兩個瀏覽器視窗
2. 同時為同一用戶修改密碼
3. 第二個提交應失敗 → 顯示「資料已被其他操作修改，請重新整理後再試」

**3.4 權限不足（管理者功能）**：
- 以非管理者身份嘗試呼叫重設 API → 顯示「您沒有權限執行此操作」

---

## 關鍵變更摘要

| 項目 | 變更內容 | 影響範圍 |
|-----|---------|---------|
| **API 端點** | 新增 `PUT /account/{id}/reset-password` | 管理者功能 |
| **API 端點** | 修改 `PUT /account/me/password`（原 `/account/{id}/password`） | 用戶功能 |
| **型別** | 新增 `ResetPasswordRequest` | 管理者功能 |
| **組合式函式** | `useChangePasswordForm`（user-management）移除 `oldPassword` | 管理者功能 |
| **組合式函式** | `useChangePasswordForm`（profile）保持不變 | 用戶功能 |
| **錯誤處理** | 新增 403/404 處理；移除 401 INVALID_OLD_PASSWORD | 管理者功能 |

---

## 常見問題

### Q1: 為什麼要分成兩個不同的 API 端點？

**A**: 因為管理者重設密碼和用戶自行修改密碼的業務邏輯不同：

- **管理者重設**：無需舊密碼，這是支援場景的需求（如用戶忘記密碼）
- **用戶修改**：必須提供舊密碼，這是安全性的需求（驗證身份）

分開端點讓 API 語義更清晰，型別也更安全（`ResetPasswordRequest` 不包含 `oldPassword`）。

---

### Q2: 現有的用戶修改密碼功能會受影響嗎？

**A**: 不會。用戶端的組合式函式（`src/pages/profile/composables/useChangePassword.ts`）和元件保持不變，只是後端 API 端點路徑調整為 `/account/me/password`。

---

### Q3: 樂觀鎖機制如何運作？

**A**: 前端傳遞當前的 `version` 給後端，後端檢查版本是否一致：

- **一致** → 執行更新，`version += 1`
- **不一致** → 回傳 409 錯誤，前端提示用戶重新整理

這防止了並發修改導致的資料覆蓋問題。

---

### Q4: 密碼修改後為什麼會被登出？

**A**: 這是安全機制。密碼修改後，後端會遞增 `jwtVersion`，使所有舊 JWT token 失效。這確保即使攻擊者持有舊 token，也無法在密碼變更後繼續使用。

---

### Q5: 如何測試 403 權限錯誤？

**A**: 方法一：以非管理者身份直接呼叫 `resetPassword` API（需要修改前端程式碼暫時移除權限檢查）。

方法二：在後端暫時移除權限驗證，觀察前端是否正確處理 403 回應。

建議：在測試環境設定一個無權限的管理員帳號進行測試。

---

### Q6: 前端需要實作審計日誌嗎？

**A**: 不需要。審計日誌由後端自動記錄。前端只需正確呼叫 API，後端會在處理請求時記錄操作者、目標用戶、時間、IP 等資訊。

---

## Troubleshooting

### 問題 1: 測試失敗 - "resetPassword is not a function"

**原因**：測試檔案中 mock 尚未更新為 `resetPassword`。

**解決方法**：
```typescript
vi.mock("@/pages/user-management/apis/user", () => ({
  resetPassword: vi.fn()  // 確保 mock 正確
}))
```

---

### 問題 2: TypeScript 錯誤 - "Property 'oldPassword' does not exist"

**原因**：`useChangePasswordForm` 組合式函式中仍在嘗試存取 `oldPassword`。

**解決方法**：
1. 檢查 `FormData` 介面定義
2. 檢查 `formData` reactive 物件
3. 檢查 `submitForm` 函式
4. 確保所有地方都已移除 `oldPassword`

---

### 問題 3: 手動測試時管理者仍顯示舊密碼欄位

**原因**：可能使用了錯誤的元件或組合式函式。

**解決方法**：
1. 確認管理者端使用的是 `@/pages/user-management/composables/useChangePasswordForm`
2. 確認用戶端使用的是 `@/pages/profile/composables/useChangePassword`
3. 檢查元件是否有客製化的表單欄位覆寫

---

### 問題 4: API 呼叫回傳 404

**原因**：後端 API 端點尚未實作或路徑不正確。

**解決方法**：
1. 檢查後端是否實作了 `/api/Account/{id}/reset-password` 和 `/api/Account/me/password`
2. 確認前端 API 路徑與後端一致（注意大小寫，雖然通常不區分）
3. 使用 Postman 或 curl 直接測試後端 API

---

## 下一步行動

完成實作後：

1. ✅ 執行完整測試套件：`pnpm test`
2. ✅ 執行類型檢查：`pnpm type-check`
3. ✅ 執行 ESLint 檢查：`pnpm lint`
4. ✅ 完成手動測試（管理者 + 用戶 + 錯誤場景）
5. ✅ 建立 Pull Request
6. ✅ 填寫 PR 描述（包含測試結果、變更摘要、截圖）
7. ✅ 請求 Code Review
8. ✅ 根據 feedback 調整
9. ✅ 合併至主分支
10. ✅ 部署至測試環境驗證

---

## 參考資源

- [Feature Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [API Contracts](./contracts/api-contracts.md)
- [Data Model](./data-model.md)
- [Project Copilot Instructions](../../.github/instructions/copilot-instructions.md)
- [Element Plus Form Documentation](https://element-plus.org/en-US/component/form.html)

---

## 變更歷史

| 日期 | 版本 | 變更內容 | 作者 |
|-----|------|---------|------|
| 2026-01-22 | 1.0.0 | 初版建立 | GitHub Copilot |
