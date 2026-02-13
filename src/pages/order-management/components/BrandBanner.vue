<!--
/**
 * 品牌標題橫幅元件
 *
 * @module order-management/components/BrandBanner
 * @description 顯示 REAL YOU 品牌標誌、標語和副標題的可重用元件
 *              用於保證書、出貨單等列印文件的頂部
 */
-->
<script setup lang="ts">
defineOptions({ name: "BrandBanner" })
</script>

<template>
  <div class="brand-banner">
    <h2 class="brand-logo-text">
      REAL YOU
    </h2>
    <p class="brand-slogan">
      無 懼 追 求 唯 真 世 代
    </p>
    <p class="brand-subtitle">
      — L V M H 集 團 授 權 鑑 定 中 心 —
    </p>
  </div>
</template>

<style scoped lang="scss">
.brand-banner {
  padding: 0px 12px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: fit-content;
  margin-inline: auto;
}

.brand-logo-text {
  font-family: "AFuturaOrto", sans-serif;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 6px;
  margin: 0 0 8px;
  color: var(--el-text-color-primary);
  line-height: 1;
  white-space: nowrap;
}

.brand-slogan {
  font-size: 12px;
  letter-spacing: 8px;
  margin: 0 0 6px;
  font-weight: 400;
  color: var(--el-text-color-primary);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand-subtitle {
  font-size: 7.2px;
  letter-spacing: 3px;
  margin: 10px 0 0;
  color: var(--el-text-color-primary);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
