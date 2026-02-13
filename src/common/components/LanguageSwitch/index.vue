<script lang="ts" setup>
import { useI18n } from "vue-i18n"
import i18n from "@/i18n"

interface LanguageItem {
  locale: string
  label: string
}

const { locale, t } = useI18n()

const languages: LanguageItem[] = [
  { locale: "zh-TW", label: "繁體中文" },
  { locale: "zh-CN", label: "简体中文" },
  { locale: "en", label: "English" }
]

/** 切換語言 */
function changeLanguage(selectedLocale: string) {
  // 同時更新組件和全局的 locale
  locale.value = selectedLocale as any
  ;(i18n.global.locale as any).value = selectedLocale
  // 保存語言設定到 localStorage
  localStorage.setItem("app-language", selectedLocale)
}
</script>

<template>
  <el-dropdown trigger="click">
    <div>
      <el-tooltip effect="dark" :content="t('layout.navigationBar.language')" placement="bottom">
        <SvgIcon name="earth" class="svg-icon" />
      </el-tooltip>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="lang in languages"
          :key="lang.locale"
          :disabled="locale === lang.locale"
          @click="changeLanguage(lang.locale)"
        >
          <span>{{ lang.label }}</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style lang="scss" scoped>
.svg-icon {
  font-size: 20px;
  &:focus {
    outline: none;
  }
}
</style>
