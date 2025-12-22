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
  },
  serviceOrder: {
    title: "服務單管理",
    createOrder: "建立服務單",
    createBuybackOrder: "建立收購單",
    createConsignmentOrder: "建立寄賣單",
    orderList: "服務單列表",
    orderDetail: "服務單詳情",
    orderNumber: "服務單編號",
    orderType: "服務單類型",
    orderStatus: "服務單狀態",
    customer: "客戶資訊",
    customerName: "客戶姓名",
    customerPhone: "客戶電話",
    customerEmail: "客戶Email",
    customerIdCard: "身分證字號",
    searchCustomer: "搜尋客戶",
    addCustomer: "新增客戶",
    selectCustomer: "選擇客戶",
    productInfo: "商品資訊",
    productItems: "商品項目",
    brandName: "品牌名稱",
    style: "款式",
    internalCode: "內碼",
    accessories: "配件",
    defects: "瑕疵處",
    totalAmount: "總金額",
    consignmentDate: "寄賣日期",
    consignmentStartDate: "寄賣起始日期",
    consignmentEndDate: "寄賣結束日期",
    renewalOption: "續約設定",
    idCardUpload: "身分證明上傳",
    signature: "簽名",
    offlineSignature: "線下簽名",
    onlineSignature: "線上簽名",
    attachments: "附件",
    modificationHistory: "修改歷史",
    status: {
      draft: "草稿",
      pending: "待確認",
      confirmed: "已確認",
      inProgress: "處理中",
      completed: "已完成",
      cancelled: "已取消"
    },
    type: {
      buyback: "收購單",
      consignment: "寄賣單"
    },
    renewal: {
      none: "無續約",
      autoRetrieve: "到期自動取回",
      autoDiscount10: "第三個月起自動調降 10%",
      discussLater: "屆時討論"
    },
    message: {
      createSuccess: "服務單建立成功",
      updateSuccess: "服務單更新成功",
      deleteSuccess: "服務單刪除成功",
      customerSelected: "已選擇客戶",
      customerCreated: "客戶新增成功",
      ocrRecognized: "辨識成功",
      ocrFailed: "辨識失敗，請重新拍攝或手動輸入",
      signatureSaved: "簽名已儲存",
      signatureRequired: "請先簽名",
      idCardRequired: "身分證明文件為必要附件，請上傳或拍攝身分證照片",
      exportSuccess: "匯出成功",
      noDataToExport: "目前無資料可匯出",
      dataTooLarge: "資料量過大，建議縮小篩選範圍"
    }
  }
}
