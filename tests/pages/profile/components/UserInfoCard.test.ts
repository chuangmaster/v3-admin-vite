/**
 * UserInfoCard 元件單元測試
 */
import type { UserProfile } from "@/pages/profile/types"
import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import UserInfoCard from "@/pages/profile/components/UserInfoCard.vue"

describe("userInfoCard component", () => {
  const mockUserInfo: UserProfile = {
    id: "user-123",
    account: "testuser",
    displayName: "Test User",
    roles: ["Admin", "User"],
    permissions: ["account.read", "account.write"],
    version: 1
  }

  it("should render component when userInfo is provided", () => {
    const wrapper = mount(UserInfoCard, {
      props: {
        userInfo: mockUserInfo,
        loading: false
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find(".user-info-card").exists()).toBe(true)
  })

  it("should render component when userInfo is null", () => {
    const wrapper = mount(UserInfoCard, {
      props: {
        userInfo: null,
        loading: false
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find(".user-info-card").exists()).toBe(true)
  })

  it("should have correct CSS class", () => {
    const wrapper = mount(UserInfoCard, {
      props: {
        userInfo: mockUserInfo,
        loading: false
      }
    })

    expect(wrapper.find(".user-info-card").exists()).toBe(true)
  })

  it("should accept loading prop", () => {
    const wrapper = mount(UserInfoCard, {
      props: {
        userInfo: mockUserInfo,
        loading: true
      }
    })

    expect(wrapper.props("loading")).toBe(true)
  })

  it("should accept userInfo prop with all required fields", () => {
    const wrapper = mount(UserInfoCard, {
      props: {
        userInfo: mockUserInfo,
        loading: false
      }
    })

    expect(wrapper.props("userInfo")).toEqual(mockUserInfo)
    expect(wrapper.props("userInfo")?.id).toBe("user-123")
    expect(wrapper.props("userInfo")?.account).toBe("testuser")
    expect(wrapper.props("userInfo")?.displayName).toBe("Test User")
    expect(wrapper.props("userInfo")?.roles).toEqual(["Admin", "User"])
    expect(wrapper.props("userInfo")?.version).toBe(1)
  })

  it("should use default loading value of false", () => {
    const wrapper = mount(UserInfoCard, {
      props: {
        userInfo: mockUserInfo
        // loading 未提供，應使用預設值 false
      }
    })

    expect(wrapper.props("loading")).toBe(false)
  })
})
