export default {
  layout: {
    navigationBar: {
      language: "语言",
      zhTW: "繁體中文",
      zhCN: "简体中文",
      en: "English"
    },
    breadcrumb: {
      home: "首页"
    }
  },
  components: {
    searchMenu: {
      placeholder: "搜索菜单",
      tips: "按 ESC 关闭"
    },
    notify: {
      notification: "通知",
      message: "消息",
      todo: "待办",
      history: "查看历史",
      primary: "主要",
      success: "成功",
      warning: "警告",
      danger: "危险",
      info: "信息"
    },
    screenfull: {
      fullscreen: "全屏",
      exitFullscreen: "退出全屏",
      contentLargeOpen: "内容区放大",
      contentLargeClose: "内容区复原",
      contentFullscreen: "内容区全屏"
    }
  },
  tagsView: {
    refresh: "刷新",
    close: "关闭",
    closeOthers: "关闭其它",
    closeAll: "关闭所有",
    scrollLeft: "向左滚动标签（超出最大宽度时可点击）",
    scrollRight: "向右滚动标签（超出最大宽度时可点击）"
  },
  api: {
    validationError: "输入验证错误",
    invalidCredentials: "账号或密码错误",
    unauthorized: "未授权，请重新登入",
    forbidden: "禁止操作",
    notFound: "资源不存在",
    usernameExists: "账号已存在",
    passwordSameAsOld: "新密码与旧密码相同",
    cannotDeleteSelf: "无法删除当前登入的账号",
    lastAccountCannotDelete: "无法删除最后一个有效账号",
    permissionNotFound: "权限不存在",
    roleNotFound: "角色不存在",
    userNotFound: "用户不存在",
    auditLogNotFound: "稽核日志不存在",
    permissionInUse: "权限正被角色使用，无法删除",
    roleInUse: "角色正被用户使用，无法删除",
    duplicatePermissionCode: "权限代码已存在",
    duplicateRoleName: "角色名称已存在",
    concurrentUpdateConflict: "数据已被其他使用者修改",
    internalError: "系统内部错误",
    invalidInterface: "非本系统的接口"
  }
}
