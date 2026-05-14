# 变更日志

## [未发布]

### 新增
- **基础体重管理**（首个功能实现）
  - 用户登录：wx.login + 云函数鉴权（auth 云函数）
  - 体重记录：新增、编辑、删除，含表单校验
  - 体重历史：分页列表，含统计信息
  - 体重趋势图：自定义 Canvas 2D 折线图（无第三方依赖）
  - 仪表盘：统计卡片、图表预览、快捷操作按钮
  - 登录页：最小化微信鉴权流程

### 变更
- 删除全部微信云开发 QuickStart 演示代码（46+ 个文件）
- 重写 app.js：基于 globalData + 本地存储的会话管理
- 重写 app.json：更新页面路由（dashboard、login、weight）
- 重写 app.wxss：全局品牌样式、工具类
- 更新 project.config.json：项目名称改为"fit-planner"

### 修复
- models/user.js 中 nickName 默认值与云函数对齐
- 移除 services/weight.js 中未使用的 sanitizeForLogging 导入
- 移除 services/auth.js 中冗余的 wx.login() 调用
- dashboard 页面 onLoad 增加登录态守卫
- 修复 weight 云函数异常日志（仅记录 error.message，不记录原始 error 对象）
- 清理 project.config.json 中残留的 databaseGuide 条件项

## [初始化]

### 新增
- 项目初始化：文档结构、架构决策、功能清单、任务看板
- docs/ 目录及全部项目文档
- 架构决策记录（ADR-001 至 ADR-006）
- 全部实体的数据模型定义（User、Team、TeamMember、WeightRecord、Goal、CheckIn、Invitation）
- 云函数 API 契约（auth、team、weight、goal、checkin）
- 20 项计划功能的功能清单（MVP + 后续版本）
- 首轮 sprint 任务看板（T-001 至 T-003）
- 测试计划模板及初始测试用例（auth、team、weight）
