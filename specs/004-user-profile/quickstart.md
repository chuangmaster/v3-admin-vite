# Quickstart Guide: 用戶個人資料與密碼管理

**Date**: 2026-01-19  
**Feature**: 004-user-profile  
**Status**: ✅ Complete

## Overview

本指南提供開發者快速上手「用戶個人資料與密碼管理」功能的開發、測試與部署流程。

---

## Prerequisites

**環境需求**:
- Node.js 20+
- pnpm 9+
- Git
- VS Code（推薦）

**專案依賴**（已安裝）:
- Vue 3.5+
- Vite 7+
- TypeScript 5.7+
- Element Plus
- Pinia
- Vue Router

**後端 API**（需確認可用）:
- `GET /api/Account/me`
- `PUT /api/Account/{id}/password`

---

## Quick Start (5 分鐘)

### 1. Clone & Install

```bash
# Clone 專案（若尚未 clone）
git clone <repository-url>
cd v3-admin-vite

# 切換至功能分支
git checkout 004-user-profile

# 安裝依賴
pnpm install
```

### 2. Start Development Server

```bash
# 啟動開發伺服器
pnpm dev

# 伺服器將在 http://localhost:3000 啟動
```

### 3. Access Profile Page

1. 登入系統（`http://localhost:3000/login`）
2. 點擊右上角用戶頭像
3. 選擇「個人資訊」選單項目
4. 進入個人資料頁面（`http://localhost:3000/profile`）

---

## Project Structure

```text
src/
├── pages/
│   └── profile/                      # 個人資料模組
│       ├── index.vue                 # 📄 主頁面
│       ├── components/               # 頁面元件
│       │   ├── UserInfoCard.vue      # 用戶資訊卡片
│       │   └── ChangePasswordForm.vue # 密碼修改表單
│       ├── composables/              # 組合式函式
│       │   ├── useUserProfile.ts     # 用戶資料邏輯
│       │   └── useChangePassword.ts  # 密碼修改邏輯
│       └── types.ts                  # 型別定義
│
├── layouts/components/NavigationBar/ # NavigationBar 元件
├── common/apis/users/                # 用戶 API
└── router/index.ts                   # 路由配置

tests/
└── pages/profile/                    # 測試檔案
    ├── profile.test.ts
    └── components/
```

---

## Development Workflow

### Step 1: 建立型別定義

**File**: `src/pages/profile/types.ts`

```typescript
/** 用戶資料實體 */
export interface UserProfile {
  id: string
  account: string
  displayName: string
  roles: string[]
  permissions: string[]
  version: number
}

/** 密碼修改表單資料 */
export interface ChangePasswordFormData {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

/** 密碼修改 API 請求 */
export interface ChangePasswordRequest {
  id: string
  oldPassword: string
  newPassword: string
  version: number
}
```

---

### Step 2: 建立用戶資料組合式函式

**File**: `src/pages/profile/composables/useUserProfile.ts`

```typescript
import { ref } from 'vue'
import { getCurrentUserApi } from '@@/apis/users'
import type { UserProfile } from '../types'

export function useUserProfile() {
  const userInfo = ref<UserProfile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** 載入用戶資料 */
  const fetchUserProfile = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await getCurrentUserApi()
      if (response.success) {
        userInfo.value = response.data
      } else {
        error.value = response.message
      }
    } catch (err: any) {
      console.error('載入用戶資料失敗:', err)
      error.value = '載入用戶資料失敗，請稍後再試'
    } finally {
      loading.value = false
    }
  }

  /** 重新載入用戶資料 */
  const refreshProfile = async () => {
    await fetchUserProfile()
  }

  return {
    userInfo,
    loading,
    error,
    fetchUserProfile,
    refreshProfile
  }
}
```

---

### Step 3: 建立密碼修改組合式函式

**File**: `src/pages/profile/composables/useChangePassword.ts`

```typescript
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { changePassword } from '@/pages/user-management/apis/user'
import type { ChangePasswordFormData, ChangePasswordRequest } from '../types'

export function useChangePasswordForm(emit: any) {
  const formRef = ref<FormInstance>()
  const submitting = ref(false)

  const formData = reactive<ChangePasswordFormData>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  /** 驗證確認密碼 */
  const validateConfirmPassword = (rule: any, value: string, callback: any) => {
    if (value !== formData.newPassword) {
      callback(new Error('兩次輸入的密碼不一致'))
    } else {
      callback()
    }
  }

  const rules: FormRules = {
    oldPassword: [
      { required: true, message: '請輸入舊密碼', trigger: 'blur' }
    ],
    newPassword: [
      { required: true, message: '請輸入新密碼', trigger: 'blur' },
      { min: 6, message: '密碼長度至少 6 字元', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '請再次輸入新密碼', trigger: 'blur' },
      { validator: validateConfirmPassword, trigger: 'blur' }
    ]
  }

  /** 驗證表單 */
  const validateForm = async (): Promise<boolean> => {
    if (!formRef.value) return false
    return formRef.value.validate().catch(() => false)
  }

  /** 提交表單 */
  const handleSubmit = async (userId: string, version: number) => {
    const isValid = await validateForm()
    if (!isValid) return

    submitting.value = true

    try {
      const response = await changePassword({
        id: userId,
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
        version
      })

      if (response.success) {
        ElMessage.success('密碼修改成功')
        handleReset()
        emit('password-changed')
      } else {
        ElMessage.error(response.message)
      }
    } catch (err: any) {
      const status = err.response?.status
      const code = err.response?.data?.code

      if (status === 409 && code === 'CONCURRENT_UPDATE_CONFLICT') {
        ElMessage.error('資料已被修改，請重新整理後再試')
        emit('refresh-required')
      } else if (status === 401) {
        ElMessage.error('舊密碼不正確，請重新輸入')
      } else {
        ElMessage.error('密碼修改失敗，請稍後再試')
      }
    } finally {
      submitting.value = false
    }
  }

  /** 重置表單 */
  const handleReset = () => {
    formRef.value?.resetFields()
  }

  return {
    formRef,
    formData,
    rules,
    submitting,
    handleSubmit,
    handleReset
  }
}
```

---

### Step 4: 建立用戶資訊卡片元件

**File**: `src/pages/profile/components/UserInfoCard.vue`

```vue
<script lang="ts" setup>
import type { UserProfile } from '../types'

interface Props {
  userInfo: UserProfile | null
  loading: boolean
}

defineProps<Props>()
</script>

<template>
  <el-card v-loading="loading" class="user-info-card">
    <template #header>
      <div class="card-header">
        <span>個人資訊</span>
      </div>
    </template>

    <el-descriptions v-if="userInfo" :column="1" border>
      <el-descriptions-item label="帳號">
        {{ userInfo.account }}
      </el-descriptions-item>
      <el-descriptions-item label="顯示名稱">
        {{ userInfo.displayName }}
      </el-descriptions-item>
      <el-descriptions-item label="角色">
        <el-tag v-for="role in userInfo.roles" :key="role" type="primary">
          {{ role }}
        </el-tag>
      </el-descriptions-item>
    </el-descriptions>

    <el-empty v-else description="無資料" />
  </el-card>
</template>

<style scoped lang="scss">
.user-info-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .el-tag {
    margin-right: 10px;
  }
}
</style>
```

---

### Step 5: 建立密碼修改表單元件

**File**: `src/pages/profile/components/ChangePasswordForm.vue`

```vue
<script lang="ts" setup>
import { useChangePasswordForm } from '../composables/useChangePassword'

interface Props {
  userId: string
  version: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'password-changed': []
  'refresh-required': []
}>()

const { formRef, formData, rules, submitting, handleSubmit, handleReset } = 
  useChangePasswordForm(emit)

const onSubmit = () => handleSubmit(props.userId, props.version)
</script>

<template>
  <el-card class="change-password-card">
    <template #header>
      <div class="card-header">
        <span>修改密碼</span>
      </div>
    </template>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="舊密碼" prop="oldPassword">
        <el-input
          v-model="formData.oldPassword"
          type="password"
          placeholder="請輸入舊密碼"
          show-password
        />
      </el-form-item>

      <el-form-item label="新密碼" prop="newPassword">
        <el-input
          v-model="formData.newPassword"
          type="password"
          placeholder="請輸入新密碼"
          show-password
        />
      </el-form-item>

      <el-form-item label="確認密碼" prop="confirmPassword">
        <el-input
          v-model="formData.confirmPassword"
          type="password"
          placeholder="請再次輸入新密碼"
          show-password
        />
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          :loading="submitting"
          @click="onSubmit"
        >
          提交
        </el-button>
        <el-button @click="handleReset">
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped lang="scss">
.change-password-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
```

---

### Step 6: 建立個人資料頁面

**File**: `src/pages/profile/index.vue`

```vue
<script lang="ts" setup>
import { onMounted } from 'vue'
import { useUserProfile } from './composables/useUserProfile'
import UserInfoCard from './components/UserInfoCard.vue'
import ChangePasswordForm from './components/ChangePasswordForm.vue'

const { userInfo, loading, fetchUserProfile, refreshProfile } = useUserProfile()

const handlePasswordChanged = () => {
  // 可選：重新載入用戶資料
  refreshProfile()
}

const handleRefreshRequired = () => {
  // 併發衝突時重新載入資料
  refreshProfile()
}

onMounted(() => {
  fetchUserProfile()
})
</script>

<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="14">
        <UserInfoCard :user-info="userInfo" :loading="loading" />
      </el-col>
      <el-col :xs="24" :sm="24" :md="10">
        <ChangePasswordForm
          v-if="userInfo"
          :user-id="userInfo.id"
          :version="userInfo.version"
          @password-changed="handlePasswordChanged"
          @refresh-required="handleRefreshRequired"
        />
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.profile-page {
  padding: 20px;
}
</style>
```

---

### Step 7: 更新 NavigationBar 選單

**File**: `src/layouts/components/NavigationBar/index.vue`

在 `<template>` 中的 `<el-dropdown-menu>` 新增個人資訊選單項目：

```vue
<template #dropdown>
  <el-dropdown-menu>
    <!-- 新增：個人資訊選單項目 -->
    <router-link to="/profile">
      <el-dropdown-item>個人資訊</el-dropdown-item>
    </router-link>
    
    <!-- 保留原有選單項目 -->
    <a target="_blank" href="#">
      <el-dropdown-item>Info</el-dropdown-item>
    </a>
    <el-dropdown-item divided @click="logout">
      登出
    </el-dropdown-item>
  </el-dropdown-menu>
</template>
```

---

### Step 8: 新增路由配置

**File**: `src/router/index.ts`

在 `constantRoutes` 陣列中新增個人資料路由：

```typescript
{
  path: "/profile",
  component: Layouts,
  meta: {
    hidden: true  // 不在側邊欄顯示
  },
  children: [
    {
      path: "",
      component: () => import("@/pages/profile/index.vue"),
      name: "UserProfile",
      meta: {
        title: { zhCN: "个人信息", zhTW: "個人資訊", en: "Profile" },
        titleKey: "userProfile"
      }
    }
  ]
}
```

---

## Testing

### Unit Tests

**Run Tests**:
```bash
# 執行所有測試
pnpm test

# 執行特定測試
pnpm test -- profile

# 執行測試並生成覆蓋率報告
pnpm test:coverage
```

**Test Example** (`tests/pages/profile/profile.test.ts`):
```typescript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useUserProfile } from '@/pages/profile/composables/useUserProfile'

describe('useUserProfile', () => {
  it('should fetch user profile successfully', async () => {
    const { userInfo, fetchUserProfile } = useUserProfile()
    
    await fetchUserProfile()
    
    expect(userInfo.value).toBeDefined()
    expect(userInfo.value?.id).toBeTruthy()
    expect(userInfo.value?.version).toBeGreaterThanOrEqual(0)
  })
})
```

---

## Common Issues & Solutions

### Issue 1: API 回應缺少 `version` 欄位

**Error**:
```
TypeError: Cannot read property 'version' of undefined
```

**Solution**:
1. 確認後端 API `/api/Account/me` 已實作 `version` 欄位
2. 檢查型別定義是否與後端回應一致
3. 檢查 Axios 攔截器是否正確處理回應

---

### Issue 2: 密碼修改後其他裝置未失效

**Symptom**: 修改密碼後，其他裝置仍可正常使用

**Solution**:
- 此問題屬於後端職責，前端無法直接解決
- 確認後端已實作 Session 失效邏輯（JWT Token 黑名單或 Secret 更新）
- 前端僅需提示用戶「其他裝置需重新登入」

---

### Issue 3: 併發衝突未正確處理

**Error**: 修改密碼時回傳 `409 Conflict`，但未重新載入資料

**Solution**:
1. 確認錯誤處理邏輯中捕捉 `status === 409`
2. 呼叫 `refreshProfile()` 重新載入用戶資料
3. 顯示提示訊息告知用戶資料已更新

```typescript
if (status === 409) {
  ElMessage.error('資料已被修改，請重新整理後再試')
  emit('refresh-required')  // 觸發重新載入
}
```

---

## API Integration Checklist

✅ **確認 `/api/Account/me` 可用並回傳完整欄位（包含 `id`, `version`）**  
✅ **確認 `/api/Account/{id}/password` 可用並處理併發控制**  
✅ **檢查 JWT Token 認證是否正確設定**  
✅ **驗證錯誤代碼處理邏輯（`401`, `409`, `500`）**  
✅ **測試併發場景（多裝置同時修改密碼）**

---

## Next Steps

1. **完成程式碼實作**（按照 Step 1-8）
2. **執行單元測試** (`pnpm test`)
3. **手動測試功能** （登入 → 進入個人資料頁面 → 修改密碼）
4. **整合測試** （測試併發場景與錯誤處理）
5. **Code Review** （提交 PR 至 `main` 分支）
6. **部署至測試環境** （驗證後端整合）

---

**Phase 1.3 Complete** ✅  
**Next**: 更新 AI Agent Context
