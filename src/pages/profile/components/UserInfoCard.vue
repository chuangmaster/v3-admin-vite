<script lang="ts" setup>
import type { UserProfile } from "../types"

interface Props {
  /** 用戶資料 */
  userInfo: UserProfile | null
  /** 載入中狀態 */
  loading?: boolean
}

const { userInfo, loading = false } = defineProps<Props>()
</script>

<template>
  <el-card v-loading="loading" class="user-info-card">
    <template #header>
      <div class="card-header">
        <span class="title">個人資訊</span>
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
        <template v-if="userInfo.roles.length > 0">
          <el-tag
            v-for="role in userInfo.roles"
            :key="role"
            type="primary"
            class="role-tag"
          >
            {{ role }}
          </el-tag>
        </template>
        <span v-else class="no-role">尚未指定角色</span>
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

    .title {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .role-tag {
    margin-right: 8px;
    margin-bottom: 4px;
  }

  .no-role {
    color: var(--el-text-color-secondary);
    font-style: italic;
  }
}
</style>
