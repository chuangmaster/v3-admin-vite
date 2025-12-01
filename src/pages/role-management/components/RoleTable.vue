<script setup lang="ts">
import type { Role } from "../types"
import dayjs from "dayjs"

interface Props {
  /** 角色資料 */
  data: Role[]
  /** 是否載入中 */
  loading: boolean
}

interface Emits {
  (e: "edit", role: Role): void
  (e: "delete", role: Role): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <el-table :data="data" v-loading="loading" stripe border>
    <el-table-column prop="roleName" label="角色名稱" min-width="150" />
    <el-table-column prop="description" label="角色描述" min-width="250" show-overflow-tooltip />
    <el-table-column prop="createdAt" label="建立時間" min-width="180">
      <template #default="{ row }">
        {{ dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') }}
      </template>
    </el-table-column>
    <el-table-column label="操作" width="200" fixed="right" align="center">
      <template #default="{ row }">
        <el-button
          type="primary"
          link
          @click="$emit('edit', row)"
          v-permission="['role.update']"
        >
          編輯
        </el-button>
        <el-divider direction="vertical" />
        <el-button
          type="danger"
          link
          @click="$emit('delete', row)"
          v-permission="['role.delete']"
        >
          刪除
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>
