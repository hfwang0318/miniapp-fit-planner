# Architecture Decision Records

## ADR-001: Native WeChat Mini Program Development
- **Date**: 2026-05-14
- **Context**: Need to choose between native WeChat mini program development or cross-platform frameworks (Taro, uni-app).
- **Decision**: Use native WeChat mini program development.
- **Rationale**: Native development provides full access to WeChat APIs, simpler debugging, no build toolchain overhead, and the project scope is small enough that cross-platform benefits are unnecessary. WeChat Cloud Development is also designed for native mini programs.
- **Consequences**: Code cannot be reused on other platforms (web, Alipay), but this is acceptable since we target only WeChat.

## ADR-002: WeChat Cloud Development for Backend
- **Date**: 2026-05-14
- **Context**: Need to choose backend infrastructure — WeChat Cloud Development (云开发), CloudBase, or custom Node.js backend.
- **Decision**: Use WeChat Cloud Development (云开发).
- **Rationale**: Zero-ops, built-in WeChat authentication (openid), auto-scaling, free tier sufficient for small teams (~4 people). No server management needed. Direct cloud function integration with mini program SDK.
- **Consequences**: Vendor lock-in to Tencent Cloud ecosystem. Cannot migrate to another cloud provider without rewriting cloud functions.

## ADR-003: Page-Level State Management with Global Session
- **Date**: 2026-05-14
- **Context**: Need to decide on state management approach for the mini program.
- **Decision**: Use page-level state management with global app data (app.js globalData) for session/user state only. No third-party state management library.
- **Rationale**: The app has few pages with simple data flow. A global store adds complexity without benefit for MVP. Page-level state keeps components self-contained. If complexity grows post-MVP, consider a minimal observable store pattern.
- **Consequences**: Page-to-page data sharing requires URL parameters or cloud DB queries. No shared reactivity between pages.

## ADR-004: Custom Canvas Chart for Weight Trend
- **Date**: 2026-05-14
- **Context**: Need to display weight trend chart without adding heavy dependencies.
- **Decision**: Build a lightweight custom canvas-based chart (line chart) for weight trend display.
- **Rationale**: ECharts for mini program adds ~200KB to package size. For a simple line chart showing weight over time, a custom 2D canvas implementation is 5-10KB and sufficient. The chart only needs: line, dots, axis labels, and basic interaction.
- **Consequences**: More development effort for chart rendering. Limited chart types (only line chart initially). If more chart types are needed post-MVP, consider ECharts.

## ADR-005: Two-Role Permission Model
- **Date**: 2026-05-14
- **Context**: Need a permission system for team management.
- **Decision**: Use a simple two-role model: admin and member.
- **Rationale**: For ~4 person teams, complex RBAC is overengineering. Admin can manage team settings and members. Member can use all basic features. This is sufficient for MVP. Can be extended post-MVP if needed.
- **Consequences**: No granular permissions (e.g., cannot have "moderator" role). Admin has all management capabilities. If more roles are needed later, the schema is extensible.

## ADR-006: Privacy-First Weight Data Design
- **Date**: 2026-05-14
- **Context**: Weight data is sensitive personal information. Need to decide how to handle visibility.
- **Decision**: By default, team members see only progress percentage (toward goal), trend direction (up/down arrow), and check-in count. Raw weight values are never exposed unless the member explicitly opts in via privacy settings.
- **Rationale**: Privacy regulation trends (especially in healthcare/wellness apps) favor data minimization. Users should control their own data visibility. This also reduces compliance risk.
- **Consequences**: Team progress view shows abstract metrics, which may reduce engagement for some users. Mitigated by allowing opt-in sharing.
