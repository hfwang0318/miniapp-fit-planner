# 测试策略 — Fit Planner

## 项目技术栈

- 前端：微信小程序（原生开发，WXML + WXSS + JS）
- 后端：微信云开发（云函数 Node.js + 云数据库）
- 测试框架：Jest
- 自动化工具：miniprogram-automator（可选，需微信开发者工具）

## 测试分层

| 层级 | 工具 | 覆盖范围 | 执行频率 |
|------|------|----------|----------|
| 单元测试 | Jest | utils、models、config | 每次提交 |
| 云函数测试 | Jest + mock wx-server-sdk | 所有云函数 | 每次改动 |
| 集成测试 | Jest + mock | services + cloud functions | 功能完成后 |
| E2E 测试 | miniprogram-automator | 核心用户路径 | 发布前（如环境可用） |
| 页面结构验证 | Bash 脚本 + 交叉检查 | Page 文件完整性、绑定检查 | 每次页面改动 |

## 测试命令

```bash
npm test                          # 全量测试
npm test -- tests/unit            # 单元测试
npm test -- tests/integration     # 集成测试
```

## 现有局限

1. 小程序页面无法在 agent 环境中渲染测试（需要微信开发者工具）
2. miniprogram-automator 需要本地安装开发者工具，当前环境未安装
3. 真实微信授权弹窗（wx.login、手机号授权）无法自动化
4. 真机测试不在日常自动化范围内

## Mock 策略

| 依赖 | Mock 方式 |
|------|-----------|
| wx.login() | 跳过，仅验证调用存在 |
| wx.cloud.callFunction() | mock 返回值 |
| wx.cloud.database() | 不可直接调用（走云函数） |
| cloud.getWXContext() | mock OPENID |
| cloud.database() | 内存数据库 mock |

## 边界限制

- E2E 测试仅在发布前执行，不作为日常自动化主路径
- 真机测试仅作为发布前补充
- 微信支付、授权弹窗等依赖微信能力的功能归档为手动测试
