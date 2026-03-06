<script lang="ts" setup>
import type { NotifyItem } from "./type"
import { Close } from "@element-plus/icons-vue"

interface Props {
  data: NotifyItem[]
  removable?: boolean
}

const { data, removable = false } = defineProps<Props>()

const emit = defineEmits<{
  remove: [id: string]
}>()
</script>

<template>
  <el-empty v-if="data.length === 0" />
  <div v-else class="notify-list">
    <div
      v-for="item in data"
      :key="item.id ?? item.title"
      class="notify-item"
      :class="`notify-item--${item.status ?? 'info'}`"
    >
      <div class="notify-item__header">
        <span class="notify-item__title">{{ item.title }}</span>
        <div class="notify-item__actions">
          <el-tag v-if="item.extra" :type="item.status" effect="light" size="small" round>
            {{ item.extra }}
          </el-tag>
          <el-button
            v-if="removable && item.id"
            class="notify-item__dismiss"
            :icon="Close"
            size="small"
            text
            circle
            @click.stop="emit('remove', item.id!)"
          />
        </div>
      </div>
      <div class="notify-item__body">
        {{ item.description }}
      </div>
      <div class="notify-item__footer">
        <span v-if="item.avatar" class="notify-item__avatar">
          <img :src="item.avatar" width="16" height="16" style="border-radius: 50%;">
        </span>
        <span class="notify-item__time">{{ item.datetime }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.notify-list {
  padding: 4px 0;
}

.notify-item {
  position: relative;
  padding: 10px 14px 10px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: default;
  transition: background 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    border-radius: 2px 0 0 2px;
  }

  &--info::before {
    background: var(--el-color-info);
  }
  &--warning::before {
    background: var(--el-color-warning);
  }
  &--danger::before {
    background: var(--el-color-danger);
  }
  &--primary::before {
    background: var(--el-color-primary);
  }
  &--success::before {
    background: var(--el-color-success);
  }

  &:hover {
    background: var(--el-fill-color-light);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  &__dismiss {
    opacity: 0;
    transition: opacity 0.15s;
    color: var(--el-text-color-placeholder);
  }

  &:hover &__dismiss {
    opacity: 1;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__body {
    font-size: 12px;
    color: var(--el-text-color-regular);
    line-height: 1.5;
    margin-bottom: 6px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__time {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }
}
</style>
