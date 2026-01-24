# 管理者修改密碼API調整

管理者修改密碼不需要提供舊的密碼

PUT /api/Account/{id}/reset-password

{id} - 帳號ID

```
{
  "newPassword": "stringst",
  "version": 0
}
```
# 用戶修改密碼API調整
用戶修改密碼需要提供舊的密碼

PUT /api/Account/me/password
```
{
  "oldPassword": "string",
  "newPassword": "stringst",
  "version": 0
}
```
