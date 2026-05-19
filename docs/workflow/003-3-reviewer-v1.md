# 审查报告 — Fix Dashboard Date Format — v1

### 审查范围
- Implementer 报告：`docs/workflow/003-2-implementer-v1.md`
- 变更文件：
  - `miniprogram/pages/dashboard/index.js`
  - `miniprogram/pages/dashboard/index.wxml`
  - `miniprogram/components/weight-chart/index.js`
- 参考约束：`references/architecture-constraints.md`、`references/severity-rubric.md`

### 逐项评估

| # | 检查项 | 结果 |
|---|--------|------|
| 1 | 架构合规 | PASS |
| 2 | 依赖方向 | PASS |
| 3 | 逻辑位置 | PASS |
| 4 | 重复检查 | PASS |
| 5 | 根因解决 | PASS |
| 6 | 隐私合规 | PASS |
| 7 | 平台合规 | PASS |

---

## 详细审查

### 1. 架构合规 — PASS

`utils/date` 是纯工具函数，位于工具层。页面和组件引用它符合依赖方向。

- `dashboard/index.js` 引入 `formatDateTime`：路径 `../../utils/date`，正确
- `weight-chart/index.js` 引入 `formatDateShort`：路径 `../../utils/date`，正确

### 2. 依赖方向 — PASS

- 无循环依赖
- 组件（weight-chart）引用 utils 而非直接调用云函数，符合架构
- 页面（dashboard）引用 utils 和 services，无反向依赖

### 3. 逻辑位置 — PASS

- 日期格式化在 WXML 展示层处理，位置正确
- 组件内部格式化 X 轴标签，属于组件内部渲染逻辑，位置正确

### 4. 重复检查 — PASS

- `weight/index.js:77` 已使用 `_formattedDate: formatDateTime(r.recordedAt)`
- 本次修复的 dashboard/index.js:54 与 weight/index.js:74-78 完全一致
- 与 weight 页面实现对齐，不是重复而是保持一致
- `weight-chart/index.js` 从 `substring(5)` 替换为 `formatDateShort()`：复用已有工具函数，正确

### 5. 根因解决 — PASS

代码链追踪中标记的所有问题均已修复：

| 代码链节点 | 问题 | 修复 | 验证 |
|-----------|------|------|------|
| weight cloudfunction 返回 ISO 字符串 | 根因，无法修改 | 服务端行为不变 | 不适用 |
| dashboard/index.js:50-53 无格式化字段 | 根因 | 添加 `_formattedDate: formatDateTime(r.recordedAt)` | dashboard/index.js:54 |
| dashboard/index.wxml:58 绑定 `recordedAt` | 症状 | 改为 `{{item._formattedDate}}` | dashboard/index.wxml:58 |
| weight-chart/index.js:129-130 `substring(5)` 错误 | 症状 | 替换为 `formatDateShort(dateStr)` | weight-chart/index.js:132 |

修复针对根因（缺乏格式化）而非表面症状（显示错误格式），处理正确。

### 6. 隐私合规 — PASS

- `_formattedWeight` 和 `_formattedDate` 字段在页面内使用，不暴露给其他人
- `recentEntries` 的 `_formattedDate` 仅含日期时间，无体重数据
- 代码中无 `console.log` 输出体重原始值
- `formatDateTime` 和 `formatDateShort` 仅处理日期字符串，不处理体重
- **无隐私泄露**

### 7. 平台合规 — PASS（观察到非阻塞问题）

现有代码审查（非本次修改引入，但符合全检要求）：

- `dashboard/index.js:76, 83` 的 `wx.showToast` 有错误回调
- `weight-chart/index.js:28-35` 的 `wx.createSelectorQuery` 有空值检查

平台合规：无 DOM API（`window`、`document`）、无 `localStorage`（用 `wx.setStorageSync`）。

---

## 发现

| # | 严重性 | 问题 | 文件:行号 |
|---|--------|------|----------|
| 1 | Observation | `recentEntries` 通过 `...r` 展开保留了原始 `weight` 字段（以及 `_id`、`openid` 等），如后续页面模板意外渲染这些字段可能暴露。虽然当前 WXML 仅使用 `_formattedWeight`，建议确认这些原始字段不会被 WXML 访问。 | dashboard/index.js:51-55 |
| 2 | Observation | `formatDateShort` 对空值/无效日期返回空字符串，`weight-chart/index.js:132` 调用时 X 轴标签会显示空白。当前已有 `if (!records || records.length === 0)` 保护，但单条记录时 `sorted.length - 1` 导致除以 0 已在第71行处理。边界情况不影响核心功能。 | weight-chart/index.js:132 |

---

## 约束合规确认

| 约束 | 状态 |
|------|------|
| 层边界遵守（pages → services → cloudfunctions） | PASS |
| 无循环依赖 | PASS |
| 业务逻辑在正确层级 | PASS |
| 隐私规则（无原始体重暴露、日志无体重数据） | PASS |
| 所有 `wx` API 有错误回调 | PASS（现有代码） |
| 无调试代码残留 | PASS |
| 无推测性设计 | PASS |

---

## 测试验证

- 37 tests 全部通过（回归测试）
- 本次修复未破坏任何现有功能

---

## 结论

**状态**：PASS

无 P0 或 P1 问题。所有 7 项检查通过，隐私合规，约束清单全部满足。

下一步：Validator 验证（步骤 4）