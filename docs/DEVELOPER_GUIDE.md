# Developer Guide

## Overview

This guide is meant for developers who will work on the Numil / Todos project. It covers setup, architecture, common workflows, and implementation patterns used in the codebase.

## 1. Getting Started

### Install dependencies
```bash
npm install
```

### Start the Expo app
```bash
npm start
```

### Useful commands
```bash
npm run android
npm run ios
npm run web
npm run lint
```

## 2. Architecture Notes

### Routing
The app uses Expo Router with file-based routes under src/app.

### State management
- Zustand stores are the source of truth.
- Components access store state via hooks.
- Mutations should stay inside the store where possible.

### Persistence
The app uses Async Storage through Zustand persist middleware.

## 3. Key Files to Know

- src/app/_layout.tsx: root layout, notification setup, app shell
- src/app/(tabs)/index.tsx: home dashboard
- src/app/(tabs)/tasks.tsx: task list and filtering
- src/app/(tabs)/calendar.tsx: calendar-based grouping
- src/app/task/[id].tsx: task editor modal
- src/app/project/[id].tsx: project detail view
- src/app/settings.tsx: settings and account controls
- src/store/useStore.ts: main app state
- src/store/useAuth.ts: local authentication state
- src/store/useUI.ts: UI and navigation state
- src/lib/selectors.ts: task filtering and grouping logic
- src/lib/notifications.ts: reminder scheduling logic

## 4. Adding a New Feature

1. Identify whether it belongs in the store, UI, or utility layer.
2. Add or update the relevant type in src/types.
3. Implement the state logic in the appropriate store.
4. Build the screen or component UI.
5. Verify behavior using the app and linting.

## 5. Working with Tasks

Tasks are the central entity in the app. When adding features related to tasks, consider:
- due dates
- priority levels
- recurrence
- reminder scheduling
- subtasks
- labels and projects

## 6. Working with Reminders

Reminder logic lives in src/lib/notifications.ts. If a feature needs local notifications, keep the scheduling logic centralized there.

## 7. Styling Conventions

The app uses StyleSheet with a shared spacing and color system. Reuse existing components wherever possible instead of introducing one-off UI patterns.

## 8. Best Practices

- Keep UI components focused and reusable.
- Prefer store actions over direct state mutation.
- Keep business logic in lib or store modules.
- Maintain strong TypeScript typing.
- Preserve the local-first nature of the app.

## 9. Recommended Next Steps

- Add backend sync
- Implement real user authentication
- Add collaborative shared projects
- Expand calendar and analytics features
- Improve accessibility and offline sync behavior
