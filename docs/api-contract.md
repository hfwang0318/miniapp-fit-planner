# API Contract

## Cloud Functions

### auth
- **login**: POST
  - Input: `{ code: string }` (from wx.login)
  - Output: `{ success: boolean, data: { openid: string, isNewUser: boolean } }`
  - Auth: None (uses wx code for auth)
  - Error: `{ success: false, error: { code: string, message: string } }`

### team
- **create**: POST
  - Input: `{ name: string }`
  - Output: `{ success: boolean, data: { teamId: string, inviteCode: string } }`
  - Auth: Requires valid openid (from cloud function context)
  - Error codes: INVALID_NAME, UNAUTHORIZED

- **join**: POST
  - Input: `{ inviteCode: string }`
  - Output: `{ success: boolean, data: { teamId: string, teamName: string, role: string } }`
  - Auth: Requires valid openid
  - Error codes: INVALID_CODE, EXPIRED_CODE, CODE_FULL, ALREADY_MEMBER, UNAUTHORIZED

- **getInfo**: GET
  - Input: `{ teamId: string }`
  - Output: `{ success: boolean, data: { teamId, name, memberCount, createdAt } }`
  - Auth: Requires membership in team
  - Error codes: NOT_FOUND, NOT_MEMBER, UNAUTHORIZED

- **getMembers**: GET
  - Input: `{ teamId: string }`
  - Output: `{ success: boolean, data: { members: Array<{ openid, nickName, avatarUrl, role, joinedAt, goalProgress: number }> } }`
  - Auth: Requires membership in team
  - Note: goalProgress is percentage toward goal. Raw weight NOT included unless member opted in.

### weight
- **create**: POST
  - Input: `{ weight: number, unit: string, recordedAt: string, note?: string }`
  - Output: `{ success: boolean, data: { recordId: string } }`
  - Auth: Requires valid openid
  - Error codes: INVALID_WEIGHT, INVALID_DATE, FUTURE_DATE, UNAUTHORIZED

- **list**: GET
  - Input: `{ limit?: number, offset?: string, startDate?: string, endDate?: string }`
  - Output: `{ success: boolean, data: { records: Array<{ recordId, weight, unit, recordedAt, note }>, hasMore: boolean } }`
  - Auth: Requires valid openid (only returns own records)

- **update**: PUT
  - Input: `{ recordId: string, weight?: number, unit?: string, recordedAt?: string, note?: string }`
  - Output: `{ success: boolean, data: { recordId: string } }`
  - Auth: Requires ownership of record
  - Error codes: NOT_FOUND, NOT_OWNER, UNAUTHORIZED

- **delete**: DELETE
  - Input: `{ recordId: string }`
  - Output: `{ success: boolean }`
  - Auth: Requires ownership of record
  - Error codes: NOT_FOUND, NOT_OWNER, UNAUTHORIZED

### goal
- **set**: POST
  - Input: `{ targetWeight: number, startWeight: number, startDate: string, targetDate?: string }`
  - Output: `{ success: boolean, data: { goalId: string } }`
  - Auth: Requires valid openid
  - Error codes: INVALID_WEIGHT, INVALID_DATES, UNAUTHORIZED

- **get**: GET
  - Output: `{ success: boolean, data: { goalId, targetWeight, startWeight, startDate, targetDate, status, progress: number } | null }`
  - Auth: Requires valid openid
  - Note: progress is percentage 0-100

- **update**: PUT
  - Input: `{ goalId: string, targetWeight?: number, targetDate?: string, status?: string }`
  - Output: `{ success: boolean }`
  - Auth: Requires ownership of goal

### checkin
- **create**: POST
  - Input: `{ teamId: string, weight?: number, note?: string, mood?: string }`
  - Output: `{ success: boolean, data: { checkInId: string } }`
  - Auth: Requires membership in team
  - Note: Creates today's check-in. Cannot create duplicate for same day.

- **list**: GET
  - Input: `{ teamId: string, startDate?: string, endDate?: string }`
  - Output: `{ success: boolean, data: { checkIns: Array } }`
  - Auth: Requires membership in team
  - Note: Weight field only included for own check-ins. Others see only mood, date, note.
