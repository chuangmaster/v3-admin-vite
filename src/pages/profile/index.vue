<script lang="ts" setup>
import { onMounted } from "vue"
import ChangePasswordForm from "./components/ChangePasswordForm.vue"
import UserInfoCard from "./components/UserInfoCard.vue"
import { useUserProfile } from "./composables/useUserProfile"

const { userInfo, loading, fetchUserProfile, refreshProfile } = useUserProfile()

/**
 * 處理密碼修改成功事件
 * @description 密碼修改成功後可選擇重新載入用戶資料
 */
function handlePasswordChanged(): void {
  refreshProfile()
}

/**
 * 處理需要重新載入事件
 * @description 併發衝突時重新載入用戶資料以取得最新 version
 */
function handleRefreshRequired(): void {
  refreshProfile()
}

onMounted(() => {
  fetchUserProfile()
})
</script>

<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <!-- 用戶資訊卡片 -->
      <el-col :xs="24" :sm="24" :md="14">
        <UserInfoCard :user-info="userInfo" :loading="loading" />
      </el-col>

      <!-- 密碼修改表單 -->
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

  // 響應式設計：手機版增加卡片間距
  .el-col {
    margin-bottom: 20px;

    @media screen and (min-width: 992px) {
      margin-bottom: 0;
    }
  }
}
</style>
