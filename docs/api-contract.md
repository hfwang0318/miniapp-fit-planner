# API 契约

## 云函数

### auth
- **login**：POST
  - 输入：`{ code: string }`（来自 wx.login）
  - 输出：`{ success: boolean, data: { openid: string, isNewUser: boolean } }`
  - 鉴权：无（使用微信 code 鉴权）
  - 错误：`{ success: false, error: { code: string, message: string } }`

### team
- **create**：POST
  - 输入：`{ name: string }`
  - 输出：`{ success: boolean, data: { teamId: string, inviteCode: string } }`
  - 鉴权：需有效 openid（来自云函数上下文）
  - 错误码：INVALID_NAME, UNAUTHORIZED

- **join**：POST
  - 输入：`{ inviteCode: string }`
  - 输出：`{ success: boolean, data: { teamId: string, teamName: string, role: string } }`
  - 鉴权：需有效 openid
  - 错误码：INVALID_CODE, EXPIRED_CODE, CODE_FULL, ALREADY_MEMBER, UNAUTHORIZED

- **getInfo**：GET
  - 输入：`{ teamId: string }`
  - 输出：`{ success: boolean, data: { teamId, name, memberCount, createdAt } }`
  - 鉴权：需是团队成员
  - 错误码：NOT_FOUND, NOT_MEMBER, UNAUTHORIZED

- **getMembers**：GET
  - 输入：`{ teamId: string }`
  - 输出：`{ success: boolean, data: { members: Array<{ openid, nickName, avatarUrl, role, joinedAt, goalProgress: number }> } }`
  - 鉴权：需是团队成员
  - 备注：goalProgress 为距目标的百分比。除非成员主动开启共享，不含原始体重。

### weight
- **create**：POST
  - 输入：`{ weight: number, unit: string, recordedAt: string, note?: string }`
  - 输出：`{ success: boolean, data: { recordId: string } }`
  - 鉴权：需有效 openid
  - 错误码：INVALID_WEIGHT, INVALID_DATE, FUTURE_DATE, UNAUTHORIZED

- **list**：GET
  - 输入：`{ limit?: number, offset?: string, startDate?: string, endDate?: string }`
  - 输出：`{ success: boolean, data: { records: Array<{ recordId, weight, unit, recordedAt, note }>, hasMore: boolean } }`
  - 鉴权：需有效 openid（仅返回自己的记录）

- **update**：PUT
  - 输入：`{ recordId: string, weight?: number, unit?: string, recordedAt?: string, note?: string }`
  - 输出：`{ success: boolean, data: { recordId: string } }`
  - 鉴权：需是记录的所有者
  - 错误码：NOT_FOUND, NOT_OWNER, UNAUTHORIZED

- **delete**：DELETE
  - 输入：`{ recordId: string }`
  - 输出：`{ success: boolean }`
  - 鉴权：需是记录的所有者
  - 错误码：NOT_FOUND, NOT_OWNER, UNAUTHORIZED

### goal
- **set**：POST
  - 输入：`{ targetWeight: number, startWeight: number, startDate: string, targetDate?: string }`
  - 输出：`{ success: boolean, data: { goalId: string } }`
  - 鉴权：需有效 openid
  - 错误码：INVALID_WEIGHT, INVALID_DATES, UNAUTHORIZED

- **get**：GET
  - 输出：`{ success: boolean, data: { goalId, targetWeight, startWeight, startDate, targetDate, status, progress: number } | null }`
  - 鉴权：需有效 openid
  - 备注：progress 为百分比 0-100

- **update**：PUT
  - 输入：`{ goalId: string, targetWeight?: number, targetDate?: string, status?: string }`
  - 输出：`{ success: boolean }`
  - 鉴权：需是目标的所有者

### checkin
- **create**：POST
  - 输入：`{ teamId: string, weight?: number, note?: string, mood?: string }`
  - 输出：`{ success: boolean, data: { checkInId: string } }`
  - 鉴权：需是团队成员
  - 备注：创建当日打卡。同日不可重复创建。

- **list**：GET
  - 输入：`{ teamId: string, startDate?: string, endDate?: string }`
  - 输出：`{ success: boolean, data: { checkIns: Array } }`
  - 鉴权：需是团队成员
  - 备注：仅自己的打卡含 weight 字段。其他人的打卡仅见 mood、date、note。
