import { isArray, validatePermissionCode } from "@@/utils/validate"
import { describe, expect, it } from "vitest"

describe("isArray", () => {
  it("string", () => {
    expect(isArray("")).toBe(false)
  })

  it("number", () => {
    expect(isArray(1)).toBe(false)
  })

  it("boolean", () => {
    expect(isArray(true)).toBe(false)
  })

  it("null", () => {
    expect(isArray(null)).toBe(false)
  })

  it("undefined", () => {
    expect(isArray(undefined)).toBe(false)
  })

  it("symbol", () => {
    expect(isArray(Symbol())).toBe(false)
  })

  it("bigInt", () => {
    expect(isArray(BigInt(1))).toBe(false)
  })

  it("object", () => {
    expect(isArray({})).toBe(false)
  })

  it("array object", () => {
    expect(isArray([])).toBe(true)
  })
})

describe("validatePermissionCode", () => {
  it("should accept valid two-level permission codes", () => {
    expect(validatePermissionCode("permission:create")).toBe(true)
    expect(validatePermissionCode("user:delete")).toBe(true)
    expect(validatePermissionCode("role:edit")).toBe(true)
  })

  it("should accept valid three-level permission codes", () => {
    expect(validatePermissionCode("user:profile:edit")).toBe(true)
    expect(validatePermissionCode("document:comment:delete")).toBe(true)
    expect(validatePermissionCode("system:admin:access")).toBe(true)
  })

  it("should accept permission codes with underscores", () => {
    expect(validatePermissionCode("user_management:create")).toBe(true)
    expect(validatePermissionCode("user:profile_info:edit")).toBe(true)
  })

  it("should accept permission codes with numbers", () => {
    expect(validatePermissionCode("permission1:create")).toBe(true)
    expect(validatePermissionCode("user:profile2:edit")).toBe(true)
  })

  it("should reject one-level permission codes", () => {
    expect(validatePermissionCode("permission")).toBe(false)
    expect(validatePermissionCode("user")).toBe(false)
  })

  it("should reject four-level or deeper permission codes", () => {
    expect(validatePermissionCode("system:user:profile:edit")).toBe(false)
    expect(validatePermissionCode("a:b:c:d")).toBe(false)
  })

  it("should reject codes with special characters", () => {
    expect(validatePermissionCode("permission@create")).toBe(false)
    expect(validatePermissionCode("user-profile:edit")).toBe(false)
    expect(validatePermissionCode("permission.create")).toBe(false)
  })

  it("should reject codes with spaces", () => {
    expect(validatePermissionCode("permission :create")).toBe(false)
    expect(validatePermissionCode("permission: create")).toBe(false)
  })

  it("should reject empty or whitespace codes", () => {
    expect(validatePermissionCode("")).toBe(false)
    expect(validatePermissionCode("   ")).toBe(false)
  })
})
