## 代码审查 — 修复登录失败 bug — v1

### 审查对象
- **变更文件**：
  - `miniprogram/services/auth.js` (修改)
  - `tests/unit/services/auth.test.js` (修改，仅 TC-AUTH-SVC-005)
- **参考文档**：`docs/architecture.md`、`references/architecture-constraints.md`、`CLAUDE.md`
- **架构约束清单**：步骤 2 已跳过，对照 `references/architecture-constraints.md` 通用约束进行第 7 项检查
- **已审查的先前工作**：Cycle 1 完整审查和批准（修复 wx.login 非致命+结构化日志+安全属性访问），Cycle 3 在此基础上修改 wx.login() 失败行为为 fatal

### 变更摘要
Developer 在此 Cycle 3 中对先前已批准的 Cycle 1 做两处变更：

1. `miniprogram/services/auth.js`：wx.login() catch 块从"非致命（继续调用云函数）"改为"致命（立即返回 LOGIN_FAILED）"；两处 `console.warn`/`console.error` 的 Error 对象参数改为 `err.message || JSON.stringify(err)`
2. `tests/unit/services/auth.test.js`：TC-AUTH-SVC-005 更新为测试新行为（wx.login 失败 → 返回 LOGIN_FAILED，云函数不被调用）

### 逐项评估

#### 1. 架构合规
**通过** — 所有层边界均正确遵守：
- `services/auth.js` 位于正确的服务层，调用 `wx.login()` 和 `wx.cloud.callFunction()`
- 服务层统一返回 `{ success, data?, error? }` 格式
- 页面层（`pages/login/index.js`）仅通过 `require('../../services/auth')` 调用服务层，不直接访问云数据库
- 前后端职责划分正确：微信客户端错误（wx.login 失败）在服务层被处理；UI 状态（toast、loading、redirect）在页面层

#### 2. 依赖方向
**通过** — 依赖方向正确：
- `services/auth.js` → `config/constants.js` ✓
- `pages/login/index.js` → `services/auth.js` ✓
- 无循环依赖
- 无反向导入

#### 3. 逻辑位置
**通过** — 业务逻辑在正确层级：
- wx.login() 错误处理和致命返回 → 服务层 (`auth.js:24-30`) ✓
- 字符串化 Error 对象日志 → 服务层 (`auth.js:28, auth.js:65`) ✓
- 云函数调用与结果处理 → 服务层 ✓
- 会话存储 → 服务层 ✓
- Toast 提示、页面跳转、loading 状态 → 页面层 ✓

#### 4. 重复检查
**通过** — 本次变更无新增重复逻辑：
- `err.message || JSON.stringify(err)` 模式是 WeChat 控制台日志的合理做法，代码库中无重复的已有工具函数
- 登录逻辑无与 `utils/privacy.js` 等其他工具函数的重叠
- 未重新实现已有功能

#### 5. 扩展性
**通过** — 不阻塞后续计划工作：
- `LOGIN_FAILED` 错误码比之前的 `AUTH_FAILED` 更具体，有助于区分微信客户端失败与服务端失败
- 变更范围小，不影响后续功能开发

#### 6. 重构必要性
**无需** — 本次变更是对 Cycle 1 行为的有目的调整而非重构。代码已足够清晰。

#### 7. 设计与实现一致性（对照 architecture-constraints.md 通用约束）
**通过**（见下方逐条检查）— 步骤 2 已跳过，按通用约束检查：

| 约束 | 状态 | 说明 |
|------|------|------|
| 层边界：页面→服务→云函数 | ✓ | 严格遵守 |
| `wx.login()` → 云函数获取 OPENID | ✓ | 服务层调用 `wx.login()`，云函数通过 `cloud.getWXContext().OPENID` 解析身份 |
| 命令分发模式 | ✓ | 云函数调用使用 `data: { type: 'login' }` |
| 无 DOM 操作，使用 WXML 数据绑定 | ✓ | 页面使用 `this.setData()` |
| 所有 `wx` API 必须有错误回调 | ✓ | `wx.login()` 有 catch 分支，`wx.cloud.callFunction()` 有外层 try/catch |
| 服务端鉴权，不信任客户端 openid | ✓ | 云函数通过 `cloud.getWXContext().OPENID` 解析用户身份 |
| 登录返回 `{ success, data?, error? }` 格式 | ✓ | 统一返回此格式 |
| 隐私约束：日志不记录原始体重值 | ✓ | 本变更为登录流程，不涉体重数据 |
| 隐私约束：openid-体重映射不入日志 | ✓ | 日志仅含 openid（用于调试），不与体重数据关联 |

### 隐私检查
- [x] 无原始体重暴露 — 本变更为登录流程，不涉体重数据
- [x] 云数据库规则适当 — 不涉及云数据库读写（仅调用云函数）
- [x] 日志中无敏感数据 — `[auth] login successful, openid: ...` 记录 openid 用于调试，不与体重数据关联。`references/architecture-constraints.md` 禁止的是 "openid-体重映射"，本日志不违反

### 发现的问题

#### 1. 提交消息与实际代码不一致 (minor)
**文件**：commit `4f7d193` 的提交消息
- **提交消息第一行**："Make wx.login() non-fatal, continue to cloud function on failure"
- **实际代码** (`auth.js:28-29`)：wx.login() 失败后 `return { success: false, error: { code: 'LOGIN_FAILED' } }` — **这是致命行为**，立即返回，不再继续调用云函数
- **Developer 报告**：正确描述为"立即返回 LOGIN_FAILED"
- **建议**：更新提交消息以匹配实际代码行为。建议改为："Make wx.login() failure fatal — return LOGIN_FAILED immediately"

#### 2. 测试文件中的回溯性注释未修复 (micro-issue，Cycle 1 已指出)
**文件**：`tests/unit/services/auth.test.js:118-119`, `tests/unit/pages/login.test.js:145-146`, `tests/unit/pages/login.test.js:159-160`
- 以上注释描述修复前的预期行为（例如 "This test should FAIL with the current code..."）
- 此问题在 Cycle 1 审查中被指出（micro-issue #1），**仍未修复**
- **建议**：更新为正向描述，例如 "Verifies fallback to AUTH_FAILED when .error.code is missing"

#### 3. 页面层 console.error 相同 [object Object] 模式 (micro-issue，超出本次变更范围)
**文件**：`miniprogram/pages/login/index.js:25,34`
- `console.error('[login] login failed:', result.error)` — `result.error` 为对象
- `console.error('[login] login exception:', err)` — `err` 为 Error 对象
- 虽由 Cycle 1 添加且当时已批准，但与 Cycle 3 在 auth.js 修复的模式相同
- **建议**：在后续迭代中，将页面层 console.error 改为 `result.error.message || JSON.stringify(result.error)` 和 `err.message || JSON.stringify(err)` 以保持一致

### 设计反转说明

Cycle 1 有意将 wx.login() 设置为非致命（失败后继续调用云函数），并在审查中标记为"为后续离线容忍设计打下基础"。Cycle 3 将其反转回致命（失败立即返回 LOGIN_FAILED）。

开发者提供了合理的反转理由：wx.login() 失败意味着当前环境缺少有效临时登录凭证，云函数无法通过 `cloud.getWXContext().OPENID` 解析身份，提前返回语义更清晰、绕路成本不必要。

此反转是合理的，但需要注意：
- `LOGIN_FAILED` 是新错误码，调用方按 `error.code` 做差异处理时需适配
- 页面层当前使用通用 `result.error.message` 不做 code-specific 处理，不影响现有 UI 行为

### 结论
**状态**：APPROVED

- 代码变更正确：wx.login() 致命返回 + 日志字符串化 — 均到位
- 测试更新正确：TC-AUTH-SVC-005 验证新行为（success=false, error.code=LOGIN_FAILED, cloud function 不被调用）
- 全量 20 个单元测试通过（3 个测试套件）
- 未引入新风险（错误码更具体而非模糊）
- 发现的问题为提交消息不一致（minor）和过期注释（micro），不影响代码正确性

**建议在提交前修复的问题**：
1. 修正提交消息以准确描述 wx.login() 致命行为，目前描述为"非致命"与实际代码相反
2. 清理测试文件中的回溯性注释（3 处）

下一步：Tester 验证（步骤 5）
