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

## 级别 4：miniprogram-automator（需安装环境）

微信官方的自动化测试框架。需要真实微信开发者工具。

```bash
npm install --save-dev miniprogram-automator
```

如环境不可用，跳过此级别，在 TEST_STRATEGY.md 中标注为"需开发者工具环境"。

## 测试命令

```bash
npm test                          # 运行全量测试
npm test -- tests/unit            # 仅单元测试
npm test -- tests/integration     # 仅集成测试
npm test -- --testPathPattern=xxx # 指定测试文件
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
