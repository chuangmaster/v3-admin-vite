<script lang="ts" setup>
import { useLayoutMode } from "@@/composables/useLayoutMode"

interface Props {
  collapse?: boolean
}

const { collapse = true } = defineProps<Props>()

const { isTop } = useLayoutMode()
</script>

<template>
  <div class="layout-logo-container" :class="{ 'collapse': collapse, 'layout-mode-top': isTop }">
    <transition name="layout-logo-fade">
      <router-link v-if="collapse" key="collapse" to="/" class="logo-link">
        <span class="layout-logo-abbr">RY</span>
      </router-link>
      <router-link v-else key="expand" to="/" class="logo-link">
        <span class="layout-logo-text">REAL YOU</span>
      </router-link>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.layout-logo-container {
  position: relative;
  width: 100%;
  height: var(--v3-header-height);
  line-height: var(--v3-header-height);
  text-align: center;
  overflow: hidden;
}

.logo-link {
  display: inline-flex;
  align-items: center;
  height: 100%;
  text-decoration: none;
}

.layout-logo-abbr {
  font-family: "AFuturaOrto", sans-serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 3px;
  color: var(--v3-sidebar-menu-active-text-color);
  line-height: 1;
}

.layout-logo-text {
  font-family: "AFuturaOrto", sans-serif;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 5px;
  color: var(--v3-sidebar-menu-active-text-color);
  line-height: 1;
  white-space: nowrap;
}

.layout-mode-top {
  height: var(--v3-navigationbar-height);
  line-height: var(--v3-navigationbar-height);
}
</style>
