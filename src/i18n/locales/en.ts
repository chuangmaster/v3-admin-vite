export default {
  layout: {
    navigationBar: {
      language: "Language",
      zhTW: "Traditional Chinese",
      zhCN: "Simplified Chinese",
      en: "English"
    },
    breadcrumb: {
      home: "Home"
    }
  },
  components: {
    searchMenu: {
      placeholder: "Search menu",
      tips: "Press ESC to close"
    },
    notify: {
      notification: "Notifications",
      message: "Messages",
      todo: "Todo",
      history: "View History",
      primary: "Primary",
      success: "Success",
      warning: "Warning",
      danger: "Danger",
      info: "Info"
    },
    screenfull: {
      fullscreen: "Fullscreen",
      exitFullscreen: "Exit Fullscreen",
      contentLargeOpen: "Enlarge Content",
      contentLargeClose: "Restore Content",
      contentFullscreen: "Content Fullscreen"
    }
  },
  tagsView: {
    refresh: "Refresh",
    close: "Close",
    closeOthers: "Close Others",
    closeAll: "Close All",
    scrollLeft: "Scroll tags left (clickable when overflow)",
    scrollRight: "Scroll tags right (clickable when overflow)"
  },
  api: {
    validationError: "Input validation error",
    invalidCredentials: "Invalid username or password",
    unauthorized: "Unauthorized, please login again",
    forbidden: "Access denied",
    notFound: "Resource not found",
    usernameExists: "Username already exists",
    passwordSameAsOld: "New password cannot be the same as old password",
    cannotDeleteSelf: "Cannot delete the current login account",
    lastAccountCannotDelete: "Cannot delete the last valid account",
    permissionNotFound: "Permission not found",
    roleNotFound: "Role not found",
    userNotFound: "User not found",
    auditLogNotFound: "Audit log not found",
    permissionInUse: "Permission is in use by roles, cannot delete",
    roleInUse: "Role is in use by users, cannot delete",
    duplicatePermissionCode: "Permission code already exists",
    duplicateRoleName: "Role name already exists",
    concurrentUpdateConflict: "Data has been modified by another user",
    internalError: "System internal error",
    invalidInterface: "Invalid interface"
  }
}
