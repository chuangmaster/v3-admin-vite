# Quickstart Guide: 用戶個人資料與選單權限管理

**Date**: 2026-01-16  
**Feature**: 004-user-profile  
**Target Audience**: 開發者

---

## 概述

本指南提供用戶個人資料功能的快速入門，包含開發環境設定、核心功能實作步驟與測試方法。

---

## 前置需求

### 環境
- Node.js >= 18
- pnpm >= 8
- VS Code (推薦)

### 專案依賴
```json
{
  "vue": "^3.5.0",
  "vue-router": "^4.0.0",
  "pinia": "^2.0.0",
  "element-plus": "^2.0.0",
  "axios": "^1.0.0",
  "@vueuse/core": "^10.0.0"
}
```

### 後端 API
確保後端服務已啟動並可存取：
- **Base URL**: `http://localhost:5176`
- **Swagger**: `http://localhost:5176/swagger`
- **Test Account**: 使用既有測試帳號或建立新帳號

---

## 快速開始

### 1. 安裝依賴
```bash
cd d:\Repository\v3-admin-vite
pnpm install
```

### 2. 啟動開發伺服器
```bash
pnpm dev
```

瀏覽器開啟 `http://localhost:5173`

### 3. 核心檔案結構

```
src/
├── common/
│   ├── apis/account/
│   │   └── profile.ts              # API 呼叫函式
│   ├── components/UserProfile/
│   │   ├── index.vue               # Profile 顯示元件
│   │   └── ChangePasswordDialog.vue # 密碼修改對話框
│   └── composables/
│       └── useProfile.ts           # Profile 組合式函式
├── layouts/components/
│   └── Header.vue                  # Layout Header (修改)
├── pages/profile/
│   └── change-password.vue         # 密碼修改獨立頁面 (可選)
├── pinia/stores/
│   └── user.ts                     # User Store (擴充)
└── router/
    ├── guard.ts                    # 路由守衛 (修改)
    └── helper.ts                   # 選單過濾邏輯 (修改)
```

---

## 實作步驟

### Step 1: 建立 API 呼叫函式

```typescript
// @/common/apis/account/profile.ts

import type { ApiResponse } from "@/types/api"
import { request } from "@/http/axios"

/** 用戶個人資料回應 */
export interface UserProfileResponse {
  /** 帳號 */
  account: string | null
  /** 顯示名稱 */
  displayName: string | null
  /** 角色名稱清單 */
  roles: string[]
  /** 權限代碼清單 */
  permissions: string[]
}

/** 變更密碼請求 */
export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

/**
 * 查詢當前用戶個人資料
 */
export async function getUserProfile(): Promise<ApiResponse<UserProfileResponse>> {
  return request({
    url: "/api/Account/me",
    method: "GET"
  })
}

/**
 * 變更密碼
 * @param id 用戶 ID
 * @param data 變更密碼請求
 * @param version 版本號 (預設 1)
 */
export async function changePassword(
  id: string,
  data: ChangePasswordRequest,
  version: number = 1
): Promise<ApiResponse<null>> {
  return request({
    url: `/api/Account/${id}/password?version=${version}`,
    method: "PUT",
    data
  })
}
```

### Step 2: 擴充 Pinia User Store

```typescript
// @/pinia/stores/user.ts

import { defineStore } from "pinia"
import { ref, computed } from "vue"
import type { UserProfileResponse } from "@/common/apis/account/profile"
import { getUserProfile, changePassword } from "@/common/apis/account/profile"
import type { ChangePasswordRequest } from "@/common/apis/account/profile"

export const useUserStore = defineStore("user", () => {
  // State
  const token = ref<string | null>(localStorage.getItem("token"))
  const profile = ref<UserProfileResponse | null>(null)
  const profileLoading = ref(false)

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const displayName = computed(() => profile.value?.displayName || profile.value?.account || "")
  const permissions = computed(() => profile.value?.permissions || [])
  const hasPermission = computed(() => (permission: string) => {
    return permissions.value.includes(permission)
  })

  // Actions
  async function fetchProfile() {
    profileLoading.value = true
    try {
      const response = await getUserProfile()
      if (response.success && response.data) {
        profile.value = response.data
      }
    } finally {
      profileLoading.value = false
    }
  }

  async function changeUserPassword(data: ChangePasswordRequest) {
    if (!profile.value?.id) throw new Error("User ID not found")
    
    const response = await changePassword(
      profile.value.id,
      data,
      profile.value.version || 1
    )
    
    if (!response.success) {
      throw new Error(response.message || "密碼修改失敗")
    }
  }

  function clearUser() {
    token.value = null
    profile.value = null
    localStorage.removeItem("token")
  }

  return {
    token,
    profile,
    profileLoading,
    isLoggedIn,
    displayName,
    permissions,
    hasPermission,
    fetchProfile,
    changeUserPassword,
    clearUser
  }
})
```

### Step 3: 建立 Profile 元件

```vue
<!-- @/common/components/UserProfile/index.vue -->

<script setup lang="ts">
import { computed } from "vue"
import { useUserStore } from "@/pinia/stores/user"
import { User, Key, SwitchButton } from "@element-plus/icons-vue"

const userStore = useUserStore()

const displayName = computed(() => userStore.displayName)
const account = computed(() => userStore.profile?.account)
const roles = computed(() => userStore.profile?.roles || [])

function handleChangePassword() {
  // 導向密碼修改頁面或開啟對話框
  console.log("Change password")
}

function handleLogout() {
  userStore.clearUser()
  // 導向登入頁
}
</script>

<template>
  <el-dropdown trigger="click" class="user-profile">
    <div class="profile-trigger">
      <el-avatar :icon="User" />
      <span class="display-name">{{ displayName }}</span>
    </div>
    
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item disabled>
          <div class="profile-info">
            <div class="info-item">
              <span class="label">顯示名稱：</span>
              <span class="value">{{ displayName }}</span>
            </div>
            <div class="info-item">
              <span class="label">帳號：</span>
              <span class="value">{{ account }}</span>
            </div>
            <div class="info-item">
              <span class="label">角色：</span>
              <span class="value">{{ roles.join(", ") || "無" }}</span>
            </div>
          </div>
        </el-dropdown-item>
        
        <el-dropdown-item divided :icon="Key" @click="handleChangePassword">
          修改密碼
        </el-dropdown-item>
        
        <el-dropdown-item :icon="SwitchButton" @click="handleLogout">
          登出
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss">
.user-profile {
  cursor: pointer;
}

.profile-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
}

.display-name {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.profile-info {
  padding: 8px 0;
  min-width: 200px;
  
  .info-item {
    display: flex;
    padding: 4px 0;
    
    .label {
      font-weight: 600;
      margin-right: 8px;
      color: var(--el-text-color-secondary);
    }
    
    .value {
      color: var(--el-text-color-primary);
    }
  }
}
</style>
```

### Step 4: 整合至 Layout Header

```vue
<!-- @/layouts/components/Header.vue -->

<script setup lang="ts">
import UserProfile from "@@/components/UserProfile/index.vue"
// ... 其他 imports
</script>

<template>
  <div class="layout-header">
    <!-- 其他 header 內容 -->
    
    <div class="header-right">
      <!-- 其他右側元件 -->
      <UserProfile />
    </div>
  </div>
</template>
```

### Step 5: 實作密碼修改功能 (擇一)

#### 選項 A: 獨立頁面

```vue
<!-- @/pages/profile/change-password.vue -->

<script setup lang="ts">
import { ref, reactive } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/pinia/stores/user"
import { ElMessage, type FormInstance, type FormRules } from "element-plus"

const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const formData = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
})

const rules: FormRules = {
  oldPassword: [
    { required: true, message: "請輸入舊密碼", trigger: "blur" }
  ],
  newPassword: [
    { required: true, message: "請輸入新密碼", trigger: "blur" },
    { min: 8, message: "密碼至少 8 個字元", trigger: "blur" },
    { 
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
      message: "密碼需包含大小寫字母與數字",
      trigger: "blur"
    }
  ],
  confirmPassword: [
    { required: true, message: "請確認新密碼", trigger: "blur" },
    {
      validator: (_rule, value, callback) => {
        if (value !== formData.newPassword) {
          callback(new Error("兩次密碼輸入不一致"))
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ]
}

async function handleSubmit() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    await userStore.changeUserPassword({
      oldPassword: formData.oldPassword,
      newPassword: formData.newPassword
    })
    
    ElMessage.success("密碼修改成功")
    router.back()
  } catch (error: any) {
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  router.back()
}
</script>

<template>
  <div class="change-password-page">
    <el-card>
      <template #header>
        <span>修改密碼</span>
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
        
        <el-form-item label="確認新密碼" prop="confirmPassword">
          <el-input
            v-model="formData.confirmPassword"
            type="password"
            placeholder="請再次輸入新密碼"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            確認修改
          </el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.change-password-page {
  padding: 20px;
  
  .el-card {
    max-width: 600px;
    margin: 0 auto;
  }
}
</style>
```

### Step 6: 選單權限過濾

```typescript
// @/router/helper.ts

import type { RouteRecordRaw } from "vue-router"

/**
 * 根據用戶權限過濾選單項目
 * @param routes 路由配置
 * @param userPermissions 用戶權限清單
 */
export function filterMenusByPermission(
  routes: RouteRecordRaw[],
  userPermissions: string[]
): RouteRecordRaw[] {
  return routes.filter(route => {
    const permission = route.meta?.permission as string | undefined
    
    // 無權限要求則顯示
    if (!permission) return true
    
    // 檢查用戶是否擁有該權限
    return userPermissions.includes(permission)
  }).map(route => {
    // 遞迴過濾子選單
    if (route.children) {
      return {
        ...route,
        children: filterMenusByPermission(route.children, userPermissions)
      }
    }
    return route
  })
}
```

```vue
<!-- @/layouts/components/Sidebar.vue -->

<script setup lang="ts">
import { computed } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/pinia/stores/user"
import { filterMenusByPermission } from "@/router/helper"

const router = useRouter()
const userStore = useUserStore()

const visibleRoutes = computed(() => {
  const routes = router.getRoutes()
  const permissions = userStore.permissions
  return filterMenusByPermission(routes, permissions)
})
</script>

<template>
  <el-menu :default-active="activeMenu">
    <template v-for="route in visibleRoutes" :key="route.path">
      <!-- 渲染選單項目 -->
    </template>
  </el-menu>
</template>
```

---

## 測試

### 單元測試

```typescript
// tests/composables/useProfile.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { useUserStore } from "@/pinia/stores/user"
import * as profileApi from "@/common/apis/account/profile"

vi.mock("@/common/apis/account/profile")

describe("useProfile", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("should fetch user profile", async () => {
    const mockProfile = {
      account: "testuser",
      displayName: "Test User",
      roles: ["Admin"],
      permissions: ["user.read"]
    }

    vi.mocked(profileApi.getUserProfile).mockResolvedValue({
      success: true,
      code: "SUCCESS",
      message: "查詢成功",
      data: mockProfile,
      timestamp: "2026-01-16T10:00:00Z",
      traceId: "test-trace"
    })

    const store = useUserStore()
    await store.fetchProfile()

    expect(store.profile).toEqual(mockProfile)
    expect(store.displayName).toBe("Test User")
  })

  it("should check permission correctly", () => {
    const store = useUserStore()
    store.profile = {
      account: "testuser",
      displayName: "Test User",
      roles: ["Admin"],
      permissions: ["user.read", "user.create"]
    }

    expect(store.hasPermission("user.read")).toBe(true)
    expect(store.hasPermission("user.delete")).toBe(false)
  })
})
```

### 手動測試

1. **登入測試**
   - 登入系統
   - 確認右上角顯示 Profile 選單
   - 點擊 Profile 下拉，確認顯示用戶資訊

2. **密碼修改測試**
   - 點擊「修改密碼」
   - 輸入錯誤舊密碼，確認顯示錯誤訊息
   - 輸入正確舊密碼與新密碼，確認修改成功
   - 開啟另一瀏覽器登入同一帳號，確認原 session 失效

3. **選單權限測試**
   - 以不同權限帳號登入
   - 確認僅顯示有權限的選單項目
   - 嘗試直接存取無權限路徑，確認被阻擋

---

## 常見問題

### Q1: Profile 資料何時載入？
**A**: 登入成功後立即呼叫 `userStore.fetchProfile()`，資料快取於 Pinia。

### Q2: 密碼修改後需要重新登入嗎？
**A**: 不需要。當前 session 保持，其他裝置 session 由後端失效。

### Q3: 選單權限更新需要重新登入嗎？
**A**: 根據 spec，需重新載入頁面。可在權限變更後重新呼叫 `fetchProfile()`。

### Q4: 如何測試 401 錯誤處理？
**A**: 手動清除 localStorage token，重新整理頁面，應自動導向登入頁。

---

## 下一步

- 閱讀 [data-model.md](./data-model.md) 了解資料模型
- 閱讀 [api-contracts.md](./contracts/api-contracts.md) 了解 API 契約
- 查看 [spec.md](./spec.md) 完整功能需求

---

**Last Updated**: 2026-01-16
