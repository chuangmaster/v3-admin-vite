import type { App } from "vue"
import i18n from "@/i18n"

export function installI18n(app: App): void {
  app.use(i18n)
}
