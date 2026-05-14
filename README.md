# Fit Planner

A WeChat mini program for collaborative weight management in small teams (~4 people).

## Overview

Fit Planner enables small teams to manage weight together through mutual accountability. Members can join a team, record their weight, set personal goals, view trends, and track team progress — all while maintaining privacy control over sensitive weight data.

## Tech Stack

- **Frontend**: Native WeChat Mini Program (WXML + WXSS + JavaScript)
- **Backend**: WeChat Cloud Development (云开发)
  - Cloud Functions for server-side logic
  - Cloud Database for data storage
  - Cloud Storage for file storage
- **Authentication**: wx.login() + cloud function (openid-based)
- **State Management**: Page-level state + global app data for session
- **Charts**: Custom lightweight canvas-based line chart

## Project Structure

```
miniprogram/
  pages/           # Page-level components
    index/         # Dashboard
    login/         # Login page
    team/          # Team management
    weight/        # Weight recording
    profile/       # User profile and settings
  components/      # Reusable UI components
  services/        # Business logic layer
  stores/          # State management
  utils/           # Pure utility functions
  models/          # Data type definitions / validation
  config/          # App configuration
  assets/          # Static assets

cloudfunctions/    # Cloud functions
  auth/            # Login, session management
  team/            # Team operations
  weight/          # Weight record operations
  invitation/      # Invite code generation and validation

docs/              # Project documentation
```

## Getting Started

1. **Open in WeChat DevTools**
   - Open WeChat DevTools
   - Import project from this directory
   - Use AppID

2. **Configure Cloud Environment**
   - Create a cloud development environment in WeChat DevTools
   - Update the `env` value in `miniprogram/app.js` with your environment ID
   - Initialize cloud database collections (see `docs/data-model.md`)

3. **Deploy Cloud Functions**
   - Right-click each cloud function directory in DevTools
   - Select "Upload and Deploy"
   - Verify deployment in cloud development console

4. **Compile and Preview**
   - Use the DevTools compiler and preview on mobile
   - Test login flow and core features

## Development Workflow

This project uses the `fit-planner-workflow` skill for multi-agent development. The workflow enforces:

- **Architecture review** before code changes
- **Test sign-off** before merging
- **Documentation sync** with every change
- **Git discipline** (feature branches, commit conventions)

See `docs/` for all project documentation.

## MVP Features

| Priority | Feature | Status |
|----------|---------|--------|
| P0 | User login | Planned |
| P0 | Create team | Planned |
| P0 | Join team (via invitation code) | Planned |
| P0 | Record weight | Planned |
| P0 | Set goal weight | Planned |
| P0 | Personal weight trend | Planned |
| P0 | Team progress overview | Planned |
| P0 | Check-in | Planned |
| P0 | Basic privacy settings | Planned |
| P0 | Dashboard homepage | Planned |
| P1 | Edit/delete weight record | Planned |

See `docs/feature-list.md` for the complete list.

## License

Private project — internal use.
