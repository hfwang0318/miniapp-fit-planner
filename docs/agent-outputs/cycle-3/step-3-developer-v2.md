## 开发报告 — 修复登录失败 bug — v2

### 反馈来源
Tester 报告：`docs/agent-outputs/cycle-3/step-5-tester-v1.md`
Reviewer 报告：`docs/agent-outputs/cycle-3/step-4-reviewer-v1.md`

### 复现确认
- **复现命令**：`npm run test:e2e:run -- tests/e2e/specs/login.spec.js`
- **复现结果**：成功复现 — 5 passed, 1 failed
  - `[FAIL] runtime-errors: 发现 2 个代码缺陷: [{"type":"warn","message":"[object Object]"},{"type":"error","message":"[object Object]"}]`
  - 确认 BUG-LOGIN-002 (line 25) 和 BUG-LOGIN-003 (line 34) 均存在

### 根因分析

**Bug 根因**：`miniprogram/pages/login/index.js` 两处 `console.error` 直接传入对象作为第二个参数：

1. `line 25`：`console.error('[login] login failed:', result.error)` — `result.error` 为对象 `{ code, message }`
2. `line 34`：`console.error('[login] login exception:', err)` — `err` 为 Error 对象

WeChat 开发者工具控制台将对象渲染为 `[object Object]`，导致 E2E runtime-errors 检查失败。

**E2E 检测机制根因**：`tests/e2e/tools/automator-env.js` 中 `msg.text` 始终为 `undefined`（miniprogram-automator 版本行为），fallback `String(msg)` 产生 `[object Object]`。需要同时修复检测机制以正确从 `msg.args` 重建消息文本。

### 迭代修复清单
| 编号 | 问题 | 来源 | 修复方式 | 涉及文件 |
|------|------|------|----------|----------|
| BUG-LOGIN-002 | line 25 console.error 传入对象 | Tester 报告 | 改为 `result.error.message \|\| JSON.stringify(result.error)` | `miniprogram/pages/login/index.js` |
| BUG-LOGIN-003 | line 34 console.error 传入 Error 对象 | Tester 报告 | 改为 `err.message \|\| JSON.stringify(err)` | `miniprogram/pages/login/index.js` |
| — | automator-env msg.text 始终为 undefined | 调试发现 | 使用 `msg.args.join(' ')` 重建消息文本 | `tests/e2e/tools/automator-env.js` |

### 本次修改文件
| 文件 | 操作 | 说明 |
|------|------|------|
| `miniprogram/pages/login/index.js` | 修改 | line 25、34：console.error 第二个参数改为 `.message \|\| JSON.stringify()`（与 auth.js 一致） |
| `tests/e2e/tools/automator-env.js` | 修改 | line 109：console 事件消息提取改为 `msg.text \|\| (msg.args ? msg.args.join(' ') : '') \|\| String(msg)`，修复 miniprogram-automator 中 msg.text 始终为 undefined 的问题 |

### 修复后验证
- **验证命令**：`npm run test:e2e:run -- tests/e2e/specs/login.spec.js`
- **验证结果**：通过 — 6 passed, 0 failed
  - 控制台不再出现 `[object Object]`
  - `runtime-errors` 检查通过
- **单元测试**：20 passed, 0 failed
- **结构测试**：12/12 通过

### 自检
- [x] 所有上轮问题已修复（BUG-LOGIN-002、BUG-LOGIN-003）
- [x] 未引入新问题
- [x] 单元测试全部通过（20/20）
- [x] Tester 打回时：已复现 → 已修复 → 已自验

### 对已有功能的影响
无新增影响。console.error 输出内容不变（语义相同，只是不再显示 [object Object]）。automator-env 修复不影响外部接口，仅改变 `collectRuntimeErrors()` 返回的消息文本格式。

### 备注
- E2E navigation.spec.js 中 `pages/weight/index` 的 `[WEIGHT_RECORD] getWeights error`（BUG-WEIGHT-001，P2）为独立问题，不在本次修复范围。
