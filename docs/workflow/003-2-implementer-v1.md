# 实现报告 — Fix Dashboard Date Format — v1

### 反馈来源
- 需求 spec：`docs/workflow/003-1-spec.md`
- 架构约束：`.claude/skills/fit-planner-workflow/references/architecture-constraints.md`

---

## 代码链追踪

`recordedAt` ISO string（来源：云函数 `weight` 返回的原始字段）
→ `dashboard/index.js:50-53` `recentEntries` map 中无格式化字段
→ `dashboard/index.wxml:58` `{{item.recordedAt}}` 直接输出原始字符串
→ 用户看到 `2025-05-18T16:00:00.000Z` 而非 `2025-05-18 16:00`

---

| 步骤 | 文件:行号 | 会导致问题？ | 现有测试覆盖？ | 证据 |
|------|----------|-------------|-------------|------|
| 1 | weight cloudfunction | 返回 ISO 字符串 | 是 | 云函数始终返回 ISO 8601 `recordedAt` |
| 2 | dashboard/index.js:50-53 | 是 | 否 | `recentEntries` map 只有 `_formattedWeight`，无日期格式化 |
| 3 | dashboard/index.wxml:58 | 是 | 否 | 直接绑定 `item.recordedAt` |
| 4 | weight-chart/index.js:129-130 | 是 | 否 | `substring(5)` 对 `2025-05-18T16:00:00.000Z` 输出 `05-18T16:00:00.000Z` |

---

## 发现

| # | 严重性 | 描述 | 文件:行号 | 处理方式 |
|---|--------|------|----------|---------|
| 1 | P1 | Dashboard 日期直接输出 ISO 字符串 | dashboard/index.js:50-53 | 已修复：添加 `_formattedDate: formatDateTime(r.recordedAt)` |
| 2 | P1 | WXML 绑定到未格式化的 `recordedAt` | dashboard/index.wxml:58 | 已修复：改为 `{{item._formattedDate}}` |
| 3 | P1 | 图表 X 轴用 `substring(5)` 显示多余字符 | weight-chart/index.js:129-130 | 已修复：改用 `formatDateShort()` |

---

## 更改的文件

### `miniprogram/pages/dashboard/index.js`
- 第 2 行后添加：`const { formatDateTime } = require('../../utils/date');`
- 第 51-52 行 `recentEntries` map 中添加：`_formattedDate: formatDateTime(r.recordedAt)`

### `miniprogram/pages/dashboard/index.wxml`
- 第 58 行：`{{item.recordedAt}}` → `{{item._formattedDate}}`

### `miniprogram/components/weight-chart/index.js`
- 第 1 行前添加：`const { formatDateShort } = require('../../utils/date');`
- 第 129-130 行：`dateStr.substring(5)` 逻辑替换为 `formatDateShort(dateStr)`

---

## 测试验证

- 新增测试：0 个（此为纯 bug 修复，未新增功能行为）
- 回归测试：37 个 → 37 GREEN, 0 NEW RED
- 运行命令：`npm test`

---

## 约束合规清单

- [x] 层边界遵守（pages 只调用 services，组件引用 utils/date）
- [x] 无循环依赖
- [x] 业务逻辑在正确层级
- [x] 隐私规则遵守（未暴露原始体重，日志无体重数据）
- [x] 所有 `wx` API 有错误回调
- [x] 无调试代码残留
- [x] 无推测性设计

---

## 下一步

Reviewer 审查（步骤 4）