## 开发报告 — 微信一键登录提示失败 — v1

### 分支
`fix/login-error`

### 反馈来源
[Tester 前置复现报告](step-3-tester-v1.md)

### 复现确认
- 复现命令：`npm test -- tests/unit/login-regression.spec.js`
- 复现结果：成功复现 — 3 个回归用例 TC-REG-LOGIN-001~003 为 RED
- （必填——必须先复现再修复）

### 根因定位
`miniprogram/pages/login/index.js:25` 在中 `result.error` 为 null/undefined 时未做空值保护：

```js
// 问题行（修复前）：
console.error('[login] login failed:', result.error.message || JSON.stringify(result.error));
```

当 `result.error` 为 `null` 或 `undefined` 时，`result.error.message` 抛出 TypeError。该错误未被本地处理，而是传播到 `.catch()` 回调，导致：
1. 预期的 `[login] login failed:` 日志未被记录
2. 用户看到默认的 "登录失败，请重试" toast（掩盖了真实的失败原因）
3. 开发调试困难

### 修改文件
| 文件 | 操作 | 说明 |
|------|------|------|
| `miniprogram/pages/login/index.js` | 修改 | 第 25 行增加 `result.error &&` 空值保护 |

### 修复说明
- **修复方式**：在第 25 行的 `console.error` 调用中，将 `result.error.message` 改为 `result.error && result.error.message`
- **为什么选这个方案**：
  - 与同文件第 27 行已存在的空值保护模式完全一致（`result.error && result.error.message || '登录失败，请重试'`）
  - 最小改动：仅修改 1 行代码，不改变控制流
  - 不引入新依赖（如 lodash.get 或 optional chaining，后者在微信小程序环境中可能不兼容）
- **为什么不选其他方案**：
  - `if/else` 分支：过度设计，在此场景下不比一行式更清晰
  - Optional chaining（`result.error?.message`）：微信小程序基础库版本兼容性不确定

### 修复后验证
- 验证命令：`npm test -- tests/unit/login-regression.spec.js`
- 验证结果：通过 — 10/10 全部 GREEN（之前 3 个 RED 用例转为 GREEN）
- 全量测试：`npm test` — 30/30 测试通过，无回归（4 个 E2E 空套件为预期行为）
- （必填——修复后重新运行前置失败用例）

### 自检
- [x] 前置报告中的失败用例已全部转为通过（TC-REG-LOGIN-001/002/003 从 RED 转为 GREEN）
- [x] 相关模块回归测试通过（authService 5 用例 + login 页面 5 用例 = 10 全部通过）
- [x] 架构约束已遵循（仅修改页面层代码，不涉及服务层/云函数）
- [x] 隐私规则已遵守（无原始体重数据暴露）
- [x] 微信开发者工具编译成功（代码不涉及新 API）
- [x] 未引入新 console.error
- [x] 无调试代码残留

### 对已有功能的影响
无新增影响。修复仅修改一条 console.error 调用，不改变任何业务逻辑路径。
