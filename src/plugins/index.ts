import type { App } from "vue"
import { installElementPlusIcons } from "./element-plus-icons"
import { installI18n } from "./i18n"
import { installPermissionDirective } from "./permission-directive"
import { installSvgIcon } from "./svg-icon"
import { installVxeTable } from "./vxe-table"

export function installPlugins(app: App) {
  installElementPlusIcons(app)
  installPermissionDirective(app)
  installSvgIcon(app)
  installVxeTable(app)
  installI18n(app)
}
