# 微信小程序测试指南

## 测试能力分级

在 agent 环境中，无法打开 GUI 版微信开发者工具。但可以通过以下方式执行有意义的运行时验证：

### 级别 1：云函数本地测试（强烈推荐，可自动化）

云函数是 Node.js 代码，在 agent 环境中**可以直接运行**。这是最有价值的测试方式。

**步骤**：
1. 安装依赖：`cd cloudfunctions/<name> && npm install`
2. 编写测试脚本或直接 require 函数
3. 使用 mock 的 `wx-server-sdk` 上下文调用

**示例**：
```bash
# 测试 auth 云函数
cd cloudfunctions/auth && npm install 2>/dev/null
node -e "
const cloud = require('wx-server-sdk');
cloud.init();
// 模拟 getWXContext
const origGetWXContext = cloud.getWXContext;
cloud.getWXContext = () => ({ OPENID: 'test-openid-123' });
// 测试 login
const main = require('./index.js').main;
main({ type: 'login' }, {}).then(r => console.log(JSON.stringify(r, null, 2)));
"
```

### 级别 2：服务层代码流程追踪

服务层（`miniprogram/services/`）依赖 `wx.*` API（在 agent 环境中不可用），但可以通过以下方式验证：

1. **代码执行路径验证**：追踪每个函数的调用链，确认所有分支可达
2. **错误路径验证**：确认每个 `try/catch` 和错误返回路径存在
3. **类型和参数验证**：确认函数签名与调用方一致
4. **引用完整性**：确认所有 require 的模块路径存在且正确

### 级别 3：页面层结构验证

页面层（WXML/WXSS/JS）无法在 agent 环境中渲染，但可以：

1. **WXML 数据绑定检查**：确认 WXML 中引用的变量在 JS 的 `data` 中有定义
2. **事件绑定检查**：确认 WXML 中的 `bindtap`/`bindinput` 等在 JS 中有对应方法
3. **组件引用检查**：确认 JSON 中声明的组件路径存在
4. **文件完整性**：确认每个 page 有 4 个文件（js/wxml/wxss/json）

### 级别 4：开发者工具 CLI 测试（如果可用）

微信开发者工具提供 CLI 接口，可以自动化编译：

```bash
# 检查项目能否编译
/Applications/wechatwebdevtools.app/Contents/MacOS/cli --project-path /path/to/project --compile
```

需要在电脑上安装微信开发者工具。如果不可用，跳过此级别。

## 测试执行流程

每个 Tester 任务按以下顺序执行：

### 步骤 A：云函数测试（执行实际代码）

对涉及的云函数执行级别 1 测试。**这是强制的运行时验证**：
- 安装 npm 依赖
- mock `cloud.getWXContext()` 返回测试 openid
- 调用函数并验证返回值结构（`success`、`data`、`error` 字段）
- 验证错误路径（传入 invalid type 应返回 error）

### 步骤 B：服务层代码追踪

验证修改涉及的所有服务层代码的执行路径。

### 步骤 C：页面层结构验证

验证修改涉及的所有页面的绑定和引用完整性。

### 步骤 D：完整性检查

- 所有 require 路径存在
- 所有 page 注册在 app.json 中
- 所有 component 在对应 json 中声明

## 输出要求

测试报告必须包含：
1. **"运行时验证命令及输出"** 部分：粘贴实际执行的 bash 命令及其输出（级别 1 的结果）
2. 测试用例表格中 **"实际输出"** 列必须填实际值，不能只写 PASS/FAIL
