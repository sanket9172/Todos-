# Numil / Todos Project Documentation

## 1. Project Overview

Numil is a cross-platform mobile productivity app built with Expo and React Native. The app focuses on task management, projects, reminders, and lightweight planning workflows for everyday personal productivity.

The current implementation is a local-first experience with persistent offline storage on the device. It is designed to feel simple, modern, and native, while still providing useful productivity features like due dates, priorities, recurring tasks, reminders, labels, projects, and saved views.

### Project Goals
- Help users capture and organize tasks quickly.
- Provide a clean mobile-first interface for daily planning.
- Support local persistence so data remains available without a backend.
- Create a foundation for future expansion into team collaboration, cloud sync, and advanced automation.

### Current App Name
- App name: Todos
- Project slug: numil
- Platform: iOS, Android, and web (via Expo)

---

## 2. Product Summary

This app combines the core strengths of popular productivity tools into a focused mobile experience. Users can:
- Add and edit tasks
- Group work into projects
- Assign priorities and due dates
- Track subtasks
- Use labels and saved filters
- Review tasks by calendar or quick views
- Receive local reminders
- Sign in locally with optional device-based account support

---

## 3. Core Features

### Task Management
- Create, edit, delete, and complete tasks
- Add notes and subtasks
- Assign priority levels
- Set due dates and reminders
- Support recurrence for repeating tasks

### Projects
- Organize tasks under named projects
- Assign colors to projects
- View project-specific task lists

### Views and Filtering
- Home dashboard with summary cards
- Tasks screen with quick filters and search
- Calendar view for due tasks
- Saved views for reusable filters
- Inbox and completed task views

### Reminders and Notifications
- Local reminder scheduling for due tasks
- Snooze support
- Notification permission handling

### Local Authentication
- Optional local sign-in/sign-up flow
- Stores account data on-device
- Does not require a remote backend

---

## 4. Tech Stack

### Frontend
- React Native
- Expo SDK 54
- Expo Router
- TypeScript
- React Native Gesture Handler
- React Navigation

### State and Storage
- Zustand for global state
- Async Storage for persistence
- Expo Notifications for reminders
- date-fns for date handling

### UI and Styling
- React Native StyleSheet
- Expo Vector Icons
- Safe Area Context
- Custom reusable components

### Development Tools
- TypeScript
- ESLint via Expo
- EAS configuration for Expo builds

---

## 5. Project Architecture

The application follows a modular mobile architecture:

### App Shell
- Root layout initializes the app theme, notification configuration, and persistent stores
- Sidebar and reminder host are mounted globally
- Tab-based navigation handles the main experience

### State Architecture
The app uses multiple Zustand stores:
- useStore: main task, project, label, saved view, and settings data
- useAuth: optional local account/session management
- useUI: sidebar state, pending navigation actions, and reminder UI state

### Data Flow
1. User actions occur on a screen.
2. Screen calls store actions from Zustand.
3. Store updates local state and persists data to Async Storage.
4. UI re-renders based on the updated state.

---

## 6. Project Structure

```text
src/
  app/
    (tabs)/
      index.tsx          # Home dashboard
      tasks.tsx          # Task list and filters
      calendar.tsx      # Calendar-based task view
      more.tsx          # Projects and quick views
    login.tsx           # Local sign-in / sign-up screen
    settings.tsx        # App settings
    project/[id].tsx    # Project detail screen
    task/[id].tsx       # Create/edit task screen
    _layout.tsx         # Root navigation and app shell

  components/
    reusable UI pieces such as cards, headers, FABs, sheets, rows, and empty states

  constants/
    theme values and design tokens

  hooks/
    theme and UI helpers

  lib/
    date logic, selectors, colors, notifications, auth helpers, and seed data

  store/
    Zustand store definitions for auth, UI, and task data

  types/
    TypeScript types for tasks, projects, labels, accounts, and settings
```

---

## 7. Main Screens

### Home Screen
Shows a daily overview with:
- quick add task input
- summary counts for today, overdue, upcoming, and flagged tasks
- a list of tasks due today and priority tasks

### Tasks Screen
A full task list with:
- quick filter tabs
- search
- saved views
- label-based views
- completed task support

### Calendar Screen
Displays tasks grouped by upcoming due dates, making it easier to view deadlines and schedules.

### More Screen
Provides access to:
- quick views
- project overview
- project creation
- settings navigation

### Task Editor
Used for creating and editing a task. Supports:
- title and notes
- priority
- due date and time
- reminders
- recurrence
- subtasks
- labels
- project assignment

### Project Screen
Shows all tasks inside a project and allows:
- renaming the project
- changing color
- deleting the project

### Settings Screen
Lets users manage:
- theme preference
- haptics
- notification permissions
- default reminder time
- clearing completed tasks
- deleting stored data
- account sign-out / removal

---

## 8. Data Model

### Task
Represents a single task with fields such as:
- id
- title
- notes
- projectId
- priority
- dueAt
- dueHasTime
- completed
- labels
- subtasks
- recurrence
- reminderOffsetMin
- reminderId
- createdAt
- updatedAt

### Project
Represents a grouping of tasks with:
- id
- name
- color
- createdAt

### Label
Used for tagging and filtering tasks.

### Saved View
Stores a reusable task list configuration, such as a quick filter or label-based view.

### Account
Optional local account data used by the sign-in flow.

---

## 9. State Management Details

### useStore
This is the core store for the app and handles:
- adding/updating/deleting tasks
- creating projects and labels
- saving views
- updating settings
- clearing completed tasks
- reminder scheduling and snoozing
- persistence to Async Storage

### useAuth
Handles local authentication and remembers whether the user is signed in on the current device.

### useUI
Handles non-persistent UI state like:
- sidebar visibility
- pending navigation actions from the More screen
- reminder popup state

---

## 10. Routing Overview

The app uses Expo Router with file-based routing.

### Main Routes
- / (Home tab)
- /tasks
- /calendar
- /more
- /task/[id]
- /project/[id]
- /settings
- /login

### Navigation Behavior
- The app uses modal presentation for task editing.
- The sidebar is available from the main app shell.
- Navigation between views is lightweight and native-feeling.

---

## 11. Local Persistence and Offline Behavior

The app is local-first and stores data in Async Storage. This means:
- tasks remain available offline
- app data survives restarts
- no backend or cloud sync is required for the current version

### Notes
- This is ideal for a personal productivity app prototype or MVP.
- Future versions could add cloud sync, multi-device support, and real backend services.

---

## 12. Notifications and Reminders

Reminder scheduling is handled through Expo Notifications.

Features include:
- scheduling local reminders for tasks with due dates
- snoozing reminders
- respecting notification permissions
- Android channel setup for reminder notifications

---

## 13. Development Setup

### Prerequisites
- Node.js
- npm
- Expo CLI / Expo Go
- Android Studio or iOS simulator (optional)

### Install Dependencies
```bash
npm install
```

### Start the App
```bash
npm start
```

### Run on Specific Platforms
```bash
npm run android
npm run ios
npm run web
```

### Lint the Project
```bash
npm run lint
```

---

## 14. Build and Release Notes

The project includes Expo configuration for builds through EAS.

### Current Setup
- Expo application configured with app name, slug, icon, and platform settings
- EAS project ID included in the Expo config
- Notifications and router plugins enabled

### Recommended Next Step
- Run an Expo build for production testing.
- Add backend sync if multi-device support is required.

---

## 15. Design and UX Notes

The app is built around a modern mobile experience with:
- clear visual hierarchy
- card-based content sections
- large touch-friendly controls
- simple navigation
- accessible labels and clear empty states

The UI uses a consistent color system and reusable screen components to keep the experience cohesive.

---

## 16. Extensibility and Future Improvements

Potential upgrades for later versions include:
- cloud sync and user accounts
- real-time collaboration
- drag-and-drop task organization
- richer analytics and reports
- AI-based task suggestions
- calendar integration
- team workspaces and shared projects
- advanced automation workflows

---

## 17. Summary

Numil / Todos is a polished local-first mobile productivity app built with Expo, React Native, and TypeScript. It provides a practical foundation for task organization, project tracking, reminders, and planning while remaining simple enough for daily personal use.

This documentation is intended to help developers understand the architecture, screens, state flow, and extension points for the project.
