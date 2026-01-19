import type { RouteRecordRaw } from "vue-router"
import { createRouter } from "vue-router"
import { routerConfig } from "@/router/config"
import { registerNavigationGuard } from "@/router/guard"
import { flatMultiLevelRoutes } from "./helper"

const Layouts = () => import("@/layouts/index.vue")

/**
 * @name 常驻路由
 * @description 除了 redirect/403/404/login 等隐藏页面，其他页面建议设置唯一的 Name 属性
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/redirect",
    component: Layouts,
    meta: {
      hidden: true
    },
    children: [
      {
        path: ":path(.*)",
        component: () => import("@/pages/redirect/index.vue")
      }
    ]
  },
  {
    path: "/403",
    component: () => import("@/pages/error/403.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/404",
    component: () => import("@/pages/error/404.vue"),
    meta: {
      hidden: true
    },
    alias: "/:pathMatch(.*)*"
  },
  {
    path: "/login",
    component: () => import("@/pages/login/index.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/profile",
    component: Layouts,
    meta: {
      hidden: true
    },
    children: [
      {
        path: "",
        component: () => import("@/pages/profile/index.vue"),
        name: "UserProfile",
        meta: {
          title: { zhCN: "个人信息", zhTW: "個人資訊", en: "Profile" },
          titleKey: "userProfile"
        }
      }
    ]
  },
  {
    path: "/",
    component: Layouts,
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        component: () => import("@/pages/dashboard/index.vue"),
        name: "Dashboard",
        meta: {
          title: { zhCN: "首页", zhTW: "首頁", en: "Dashboard" },
          titleKey: "dashboard",
          svgIcon: "dashboard",
          affix: true
        }
      }
    ]
  }
]

/**
 * @name 动态路由
 * @description 用来放置有权限 (Roles 属性) 的路由
 * @description 必须带有唯一的 Name 属性
 */
export const dynamicRoutes: RouteRecordRaw[] = [
  {
    path: "/identity",
    component: Layouts,
    redirect: "/identity/user",
    name: "IdentityAndPermission",
    meta: {
      title: { zhCN: "身分與权限管理", zhTW: "身分與權限管理", en: "Identity & Permissions" },
      titleKey: "identityAndPermission",
      elIcon: "User",
      alwaysShow: true
    },
    children: [
      {
        path: "user",
        component: () => import("@/pages/user-management/index.vue"),
        name: "UserManagementPage",
        meta: {
          title: { zhCN: "用户管理", zhTW: "用戶管理", en: "User Management" },
          titleKey: "userManagement",
          keepAlive: true,
          permissions: ["account.read"]
        }
      },
      {
        path: "permission",
        component: () => import("@/pages/permission-management/index.vue"),
        name: "PermissionManagementPage",
        meta: {
          title: { zhCN: "权限管理", zhTW: "權限管理", en: "Permission Management" },
          titleKey: "permissionManagement",
          keepAlive: true,
          permissions: ["permission.read"]
        }
      },
      {
        path: "role",
        component: () => import("@/pages/role-management/index.vue"),
        name: "RoleManagementPage",
        meta: {
          title: { zhCN: "角色管理", zhTW: "角色管理", en: "Role Management" },
          titleKey: "roleManagement",
          keepAlive: true,
          permissions: ["role.read"]
        }
      }
    ]
  },
  {
    path: "/service-order",
    component: Layouts,
    redirect: "/service-order/index",
    name: "ServiceOrderManagement",
    meta: {
      title: { zhCN: "服务单管理", zhTW: "服務單管理", en: "Service Order Management" },
      titleKey: "serviceOrderManagement",
      elIcon: "Document",
      alwaysShow: true
    },
    children: [
      {
        path: "index",
        component: () => import("@/pages/service-order-management/index.vue"),
        name: "ServiceOrderList",
        meta: {
          title: { zhCN: "服务单列表", zhTW: "服務單列表", en: "Service Order List" },
          titleKey: "serviceOrderList",
          keepAlive: true,
          permissions: ["serviceOrder.buyback.read", "serviceOrder.consignment.read"]
        }
      },
      {
        path: "create",
        component: () => import("@/pages/service-order-management/create.vue"),
        name: "ServiceOrderCreate",
        meta: {
          title: { zhCN: "建立服务单", zhTW: "建立服務單", en: "Create Service Order" },
          titleKey: "serviceOrderCreate",
          hidden: true,
          permissions: ["serviceOrder.buyback.create", "serviceOrder.consignment.create"]
        }
      },
      {
        path: "detail/:id",
        component: () => import("@/pages/service-order-management/detail.vue"),
        name: "ServiceOrderDetail",
        meta: {
          title: { zhCN: "服务单详情", zhTW: "服務單詳情", en: "Service Order Detail" },
          titleKey: "serviceOrderDetail",
          hidden: true,
          permissions: ["serviceOrder.buyback.read", "serviceOrder.consignment.read"]
        }
      }
    ]
  }
]

/** 路由实例 */
export const router = createRouter({
  history: routerConfig.history,
  routes: routerConfig.thirdLevelRouteCache ? flatMultiLevelRoutes(constantRoutes) : constantRoutes
})

/** 重置路由 */
export function resetRouter() {
  try {
    // 注意：所有动态路由路由必须带有 Name 属性，否则可能会不能完全重置干净
    router.getRoutes().forEach((route) => {
      const { name, meta } = route
      if (name && meta.roles?.length) {
        router.hasRoute(name) && router.removeRoute(name)
      }
    })
  } catch {
    // 强制刷新浏览器也行，只是交互体验不是很好
    location.reload()
  }
}

// 注册路由导航守卫
registerNavigationGuard(router)
