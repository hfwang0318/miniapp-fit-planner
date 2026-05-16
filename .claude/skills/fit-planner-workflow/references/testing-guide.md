# 微信小程序测试工具指南

## 测试方法选择

本项目是微信小程序 + 云开发。测试分为四个层级：

## 级别 1：云函数单元测试（Jest + mock）

云函数是 Node.js 代码，**可以直接在 agent 环境中运行**。这是最可靠的运行时验证方式。

### 已安装

项目根目录已配置 Jest。

### 运行方式

```bash
npm test -- tests/unit/cloudfunctions/
```

### Mock wx-server-sdk 方法

创建测试文件时，在测试文件顶部 mock `wx-server-sdk`：

```javascript
jest.mock('wx-server-sdk', () => {
  const mockDb = { /* 内存数据库 mock */ };
  return function() {
    return {
      init: jest.fn(),
      getWXContext: () => ({ OPENID: 'test-openid-xxx' }),
      database: () => mockDb
    };
  };
});
```

### 快速手动测试（无 Jest）

```bash
cd cloudfunctions/<name> && npm install 2>/dev/null
node -e "
const main = require('./index.js').main;
// 通过模块缓存注入 mock...
main({ type: 'login' }, {}).then(r => console.log(JSON.stringify(r)));
"
```

## 级别 2：服务层代码追踪

服务层（`miniprogram/services/`）依赖 `wx.*` API，在 agent 环境中无法直接运行。验证方法：

1. 代码执行路径追踪：确认每个分支可达
2. 错误路径验证：确认 try/catch 和错误返回完整
3. 参数验证：确认函数签名与调用方一致
4. require 引用完整性：确认所有模块路径存在

## 级别 3：页面层结构验证

页面层无法在 agent 环境中渲染，验证方法：

1. WXML 数据绑定检查：引用的变量在 JS `data` 中定义
2. 事件绑定检查：`bindtap`/`bindinput` 等在 JS `methods` 中有对应
3. 组件引用检查：JSON 中声明的组件路径存在
4. 文件完整性：每个 page 有 4 文件

## 级别 4：miniprogram-automator（强制 E2E 验证）

微信官方的自动化测试框架。需要真实微信开发者工具。**此为强制验证层，不可跳过。**

E2E 是页面与主流程验证的强制层。若 miniprogram-automator、E2E 目录、E2E 脚本或配置不存在，Tester agent 必须先初始化。只有在微信开发者工具 CLI、系统权限、测试账号、后端测试环境等外部条件缺失时，才允许标记 BLOCKED。不得将 E2E 未运行写为 PASS。

### 安装

```bash
npm install --save-dev miniprogram-automator
```

### 配置

创建 `tests/e2e/config/local.config.json`（从 `local.config.example.json` 复制并修改实际路径）：

```json
{
  "cliPath": "/Applications/wechatwebdevtools.app/Contents/MacOS/cli",
  "projectPath": "miniprogram",
  "defaultTimeout": 30000,
  "headless": true,
  "env": { "NODE_ENV": "test" }
}
```

### 工具链

| 文件 | 用途 |
|------|------|
| `tests/e2e/tools/automator-env.js` | miniprogram-automator 统一封装（加载配置、启动/关闭 IDE、页面操作、错误收集） |
| `tests/e2e/tools/doctor.js` | E2E 环境诊断（检查 CLI、配置、依赖、spec、项目路径） |
| `tests/e2e/tools/run-spec.js` | 运行单个 E2E spec 文件 |
| `tests/e2e/tools/run-all.js` | 运行全部 E2E spec，生成统一报告 |
| `tests/e2e/tools/reporter.js` | 结构化报告生成（result.json、summary.md、error.log、commands.log） |
| `tests/e2e/tools/assertions.js` | 轻量 E2E 断言库 |
| `tests/e2e/tools/clean-reports.js` | 清理 E2E 报告目录 |

### E2E 规格

| 文件 | 覆盖范围 |
|------|---------|
| `tests/e2e/specs/smoke.spec.js` | 启动验证 + 首页渲染 + 运行时错误检查 |
| `tests/e2e/specs/navigation.spec.js` | 所有 `app.json` 注册页面的导航验证 |
| `tests/e2e/specs/home.spec.js` | 首页结构和核心交互 |

### 执行命令

```bash
npm run test:e2e:doctor     # 诊断 E2E 环境
npm run test:e2e            # 运行全部 E2E
npm run test:e2e:run -- tests/e2e/specs/smoke.spec.js  # 运行单个 spec
npm run test:e2e:clean      # 清理 E2E 报告
```

### 强制规则

详见 `references/agents/tester.md` 中的"强制 E2E 规则"章节（10 条规则 + 失败分类表）。

### 常见失败处理

| 场景 | 分类 | 处理 |
|------|------|------|
| cliPath 不存在 | `E2E_CLI_ERROR` | BLOCKED — 安装微信开发者工具或修正 cliPath |
| miniprogram-automator 未安装 | `E2E_DEPENDENCY_ERROR` | 执行 `npm install --save-dev miniprogram-automator` |
| 页面变更无 E2E | `E2E_CONFIG_ERROR` | 创建 spec 后执行 |
| P0 流程无 E2E 覆盖 | `E2E_CONFIG_ERROR` | 至少补 smoke spec |
| 运行时错误 | `E2E_RUNTIME_ERROR` | 分析错误 → 修复 → 重跑 |

## 测试命令

```bash
npm test                          # 运行全量 Jest 测试
npm test -- tests/unit            # 仅单元测试
npm test -- tests/integration     # 仅集成测试
npm test -- --testPathPattern=xxx # 指定测试文件

# 新增编排命令
npm run test:doctor               # 全量测试环境诊断
npm run test:scan                 # 项目结构扫描
npm run test:unit                 # 运行单元测试 (Jest)
npm run test:structure            # 页面结构验证
npm run test:e2e                  # 运行全部 E2E
npm run test:e2e:doctor           # E2E 环境诊断
npm run test:e2e:run -- <spec>    # 运行单个 E2E spec
npm run test:e2e:clean            # 清理 E2E 报告
npm run test:related              # 运行变更相关测试
npm run test:all                  # 运行全部测试 (doctor → scan → unit → structure → e2e)
npm run test:clean                # 清理全部报告
```

## 页面结构验证脚本

```
# 检查页面文件完整性
for page_dir in miniprogram/pages/*/; do
  page=$(basename "$page_dir")
  for ext in js wxml wxss json; do
    [ -f "${page_dir}index.${ext}" ] || echo "MISSING: ${page_dir}index.${ext}"
  done
done

# 检查 app.json 注册的页面路径存在
# (需要 python 或 node 解析 JSON)
```
