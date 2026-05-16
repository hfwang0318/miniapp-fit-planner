## 测试报告 — 修复登录失败 bug — v1

### 测试范围
- 已测试：
  - 单元测试（tests/unit/）：auth 服务层、login 页面层、weight 云函数 — 3 suites, 20 测试
  - 结构验证（test:structure）：3 个页面的 12 个文件
  - E2E 全量（test:e2e）：home.spec.js, login.spec.js, navigation.spec.js, smoke.spec.js — 4 个 spec
  - E2E login.spec.js 重点验证：按钮存在、按钮文字、点击行为、loading 状态变化和重置、无 [object Object] 错误、页面不崩溃
- 未测试：集成测试（tests/integration/ 目录为空）
- 回归检查区域：auth 服务层登录流程、login 页面 UI 交互、所有页面导航

### 测试用例结果
| ID | 描述 | 预期 | 实际 | 状态 |
|----|------|------|------|------|
| TC-AUTH-001 ~ TC-AUTH-004 | 云函数 Auth 相关 | — | — | 未执行（云函数测试，不在本次变更范围） |
| TC-AUTH-SVC-001 ~ TC-AUTH-SVC-008 | 服务层 Auth 相关 | 全部通过 | 全部通过 | PASS |
| TC-LOGIN-001 ~ TC-LOGIN-008 | Login 页面相关 | 全部通过 | 全部通过 | PASS |
| TC-WEIGHT-001 ~ TC-WEIGHT-008 | Weight 模块 | — | — | 未执行不在本次变更范围 |
| E2E: home.spec.js | 首页打开和数据加载 | 全部 7 项通过 | 7/7 通过 | PASS |
| E2E: login.spec.js | 登录流程完整验证（6 项检查） | 全部通过 | 5/6 通过，1 项失败 | FAIL |
| E2E: navigation.spec.js | 所有页面导航 | 全部 7 项通过 | 6/7 通过，1 项失败 | FAIL |
| E2E: smoke.spec.js | 基本启动验证 | 全部 5 项通过 | 5/5 通过 | PASS |

### 发现的 Bug

| Bug ID | 严重程度 | 描述 | 页面 | 触发操作 | 错误类型 | 错误信息 | 复现命令 |
|--------|----------|------|------|----------|----------|----------|----------|
| BUG-LOGIN-002 | P0 阻塞 | 登录页面 console.error 传入 Error 对象导致 [object Object] | pages/login/index | 登录按钮点击 → 失败时 | E2E_RUNTIME_ERROR | `console.error('[login] login failed:', result.error)` — result.error 为对象 | `npm run test:e2e` → login.spec.js → runtime-errors |
| BUG-LOGIN-003 | P0 阻塞 | 登录页面 catch 路径 console.error 传入 Error 对象导致 [object Object] | pages/login/index | 登录抛出异常时 | E2E_RUNTIME_ERROR | `console.error('[login] login exception:', err)` — err 为 Error 对象 | `npm run test:e2e` → login.spec.js → runtime-errors |
| BUG-WEIGHT-001 | P2 轻微 | 体重页面导航时 [object Object] 运行时错误 | pages/weight/index | 导航到体重页面 | E2E_RUNTIME_ERROR | [object Object] 运行时错误，pagePath: unknown | `npm run test:e2e` → navigation.spec.js → pages/weight/index |

### 微信开发者工具验证
- [ ] 编译成功 — 无法验证（无 CI 集成，编译由微信开发者工具 IDE 处理）
- [ ] 页面渲染正常（iPhone 6/7/8 和 iPhone X/11/12） — 无法验证（无真机环境）
- [X] 控制台无新增错误 — 未通过（E2E runtime-errors 检测到 [object Object] 错误）
- [ ] 网络请求符合预期 — 未验证（E2E 环境中云函数自然失败）

### E2E 状态
- E2E CLI 可用：是（`/Applications/wechatwebdevtools.app/Contents/MacOS/cli` 存在）
- miniprogram-automator 已安装：是（`package.json devDependencies` 中）
- 配置就绪：是（`tests/e2e/config/local.config.json` 存在）
- 规格就绪：smoke / navigation / home / login
- 执行结果：FAIL（12 passed, 2 failed）
- 失败分类：E2E_RUNTIME_ERROR（2 个 spec 因运行时 [object Object] 错误失败）
- 报告路径：tests/e2e/reports/latest/

### 执行命令

```
$ npm run test:unit
Test Suites: 3 passed, 3 total
Tests:       20 passed, 20 total

$ npm run test:structure
结果: 12/12 通过

$ npm run test:e2e
=== E2E Summary ===
Status: FAIL
Total:  4
Passed: 12
Failed: 2
Time:   82.16s

login.spec.js: 5 passed, 1 failed
  FAIL: runtime-errors: 发现 2 个代码缺陷: [{"type":"warn","message":"[object Object]"},
  {"type":"error","message":"[object Object]"}]

navigation.spec.js: 6 passed, 1 failed
  FAIL: runtime-errors: pages/weight/index 发现 1 个错误: [{"type":"error","message":"[object Object]"}]
```

### 对比分析：修复前 vs 修复后

| 指标 | 修复前 (上一轮 E2E) | 本轮 E2E | 变化 |
|------|---------------------|----------|------|
| login [object Object] 数量 | 3 个 | 2 个 | 减少 1 个（auth.js 中 1 处已修复） |
| login 用户流程 | 5/6 通过 | 5/6 通过 | 不变 |
| loading 重置 | 正确 | 正确 | 不变 |
| 页面崩溃 | 无 | 无 | 不变 |

**分析**：Developer 修复了 `services/auth.js` 中的 3 处 console 调用（全部改为 `err.message || JSON.stringify(err)`），但 **未修复 `pages/login/index.js` 中的 2 处**：
- 第 25 行：`console.error('[login] login failed:', result.error);` — result.error 为对象
- 第 34 行：`console.error('[login] login exception:', err);` — err 为 Error 对象

这 2 处已在 Cycle 3 的 Reviewer 报告的 Issue #3 中明确指出（micro-issue，超出本次变更范围）。

### 结论
**状态**：FAIL

**阻塞项**：
1. **BUG-LOGIN-002** (P0)：`pages/login/index.js:25` — `console.error('[login] login failed:', result.error)` 传入 Error 对象，控制台显示 `[object Object]`
2. **BUG-LOGIN-003** (P0)：`pages/login/index.js:34` — `console.error('[login] login exception:', err)` 传入 Error 对象，控制台显示 `[object Object]`

这 2 个错误导致 E2E login.spec.js 的 `runtime-errors` 断言失败。虽然 Developer 已修复 `services/auth.js` 中的所有 3 处，但 `pages/login/index.js` 的 2 处依然存在。

此外，navigation.spec.js 在 `pages/weight/index` 处也发现 1 个 [object Object] 运行时错误（**BUG-WEIGHT-001**，P2），在修复上述 2 个 P0 后可一并跟进。

Developer 需要对页面层做同样的 Error 对象字符串化修复，修复后需要重新执行 E2E 验证。

### 归档更新

| 目标文件 | 操作 | 内容 |
|---------|------|------|
| test-runs.md | 追加一行 | `2026-05-16 \| E2E+单元+结构 \| login 修复回归验证 \| npm run test:all \| 20 单元 + 12 结构 + 12 E2E \| 3 (2 login + 1 weight) \| 0 \| FAIL` |
| test-cases.md | 更新 | TC-AUTH-SVC-005 描述更新；BUG-AUTH-001 根因+修复更新；新增登录相关回归用例 |
| test-strategy.md | 无需更新 | — |
