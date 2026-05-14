# Architecture Design — Fit Planner

## Technology Stack
- **Runtime**: WeChat Mini Program (native development)
- **Backend**: WeChat Cloud Development (cloud functions + cloud database + cloud storage)
- **State Management**: Page-level state + global app state for user session
- **Component Library**: Custom components (no third-party library for MVP)
- **Charts**: Custom lightweight canvas-based chart for weight trend (no ECharts dependency to save package size)
- **Login**: wx.login() -> cloud function for openid-based authentication

## Layer Architecture

```
Page Layer (pages/)
    |
    v
Service Layer (services/)
    |
    v
Data Layer (cloud functions + cloud database)
```

- **Page Layer**: WXML + WXSS + Page JS. Handles UI rendering and user interaction. Calls service layer for business logic. Must NOT directly access cloud database.
- **Service Layer**: Pure JS modules. Contains all business logic. Orchestrates cloud function calls, validates data, transforms responses. No WXML/WXSS.
- **Data Layer**: Cloud functions in `cloudfunctions/` and cloud database collections. Cloud functions enforce auth, permission, and data validation server-side.

## Page Routes

| Path | Name | Description | Auth Required |
|------|------|-------------|---------------|
| pages/index/index | Dashboard | Homepage showing team progress, personal stats, quick actions | Yes |
| pages/login/index | Login | First-run login/onboarding | No |
| pages/team/index | Team Management | Team creation, join, settings | Yes |
| pages/weight/index | Weight Recording | Record/edit weight, view history | Yes |
| pages/profile/index | Profile | User profile, privacy settings, goal settings | Yes |

## State Management
- **Global state** (app.js globalData): user session (openid, logged-in status), current team ID
- **Page-level state**: UI state specific to each page (form inputs, loading states, local data)
- No third-party state management library for MVP. If needed later, consider a minimal store pattern.

## Data Flow

1. User interacts with Page -> Page calls Service function
2. Service function validates input, calls Cloud Function
3. Cloud Function authenticates (verifies openid), authorizes (checks permissions), validates data, interacts with Cloud Database
4. Cloud Function returns result to Service
5. Service transforms data, returns to Page
6. Page updates WXML data binding -> UI updates

## Subpackage Strategy
- MVP: Single main package (all pages in main package, <2MB)
- If needed post-MVP: Split into subpackages by feature area (team, weight, profile)
