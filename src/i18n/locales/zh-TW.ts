export default {
  layout: {
    navigationBar: {
      language: "語言",
      zhTW: "繁體中文",
      zhCN: "簡體中文",
      en: "English"
    },
    breadcrumb: {
      home: "首頁"
    }
  },
  components: {
    searchMenu: {
      placeholder: "搜尋菜單",
      tips: "按 ESC 關閉"
    },
    notify: {
      notification: "通知",
      message: "訊息",
      todo: "待辦",
      history: "查看歷史",
      primary: "主要",
      success: "成功",
      warning: "警告",
      danger: "危險",
      info: "資訊"
    },
    screenfull: {
      fullscreen: "全螢幕",
      exitFullscreen: "退出全螢幕",
      contentLargeOpen: "內容區放大",
      contentLargeClose: "內容區復原",
      contentFullscreen: "內容區全螢幕"
    }
  },
  tagsView: {
    refresh: "重新整理",
    close: "關閉",
    closeOthers: "關閉其他",
    closeAll: "關閉全部",
    scrollLeft: "向左滾動標籤（超出最大寬度時可點擊）",
    scrollRight: "向右滾動標籤（超出最大寬度時可點擊）"
  },
  api: {
    validationError: "輸入驗證錯誤",
    invalidCredentials: "帳號或密碼錯誤",
    unauthorized: "未授權，請重新登入",
    forbidden: "禁止操作",
    notFound: "資源不存在",
    usernameExists: "帳號已存在",
    passwordSameAsOld: "新密碼與舊密碼相同",
    cannotDeleteSelf: "無法刪除當前登入的帳號",
    lastAccountCannotDelete: "無法刪除最後一個有效帳號",
    permissionNotFound: "權限不存在",
    roleNotFound: "角色不存在",
    userNotFound: "用戶不存在",
    auditLogNotFound: "稽核日誌不存在",
    permissionInUse: "權限正被角色使用，無法刪除",
    roleInUse: "角色正被用戶使用，無法刪除",
    duplicatePermissionCode: "權限代碼已存在",
    duplicateRoleName: "角色名稱已存在",
    concurrentUpdateConflict: "資料已被其他使用者修改",
    internalError: "系統內部錯誤",
    invalidInterface: "非本系統的介面"
  }
}
