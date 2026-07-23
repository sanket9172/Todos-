# Numil / Todos

Numil is a cross-platform mobile productivity application built with Expo and React Native. The current implementation focuses on task management, projects, reminders, local persistence, and an intuitive mobile-first experience.

## What this app does

- Lets users create and manage tasks quickly
- Organizes tasks into projects
- Supports due dates, priorities, reminders, labels, and recurrence
- Provides views for today, upcoming, overdue, inbox, and completed tasks
- Stores data locally on the device for an offline-first experience
- Includes a simple local sign-in flow for device-based account usage

## Tech stack

- React Native
- Expo
- TypeScript
- Zustand
- Async Storage
- Expo Notifications
- Expo Router

## Project structure

- src/app: screens and navigation
- src/components: reusable UI components
- src/store: state management
- src/lib: helper modules for selectors, date logic, auth, and notifications
- src/types: shared TypeScript models
- docs/: product and developer documentation

## Getting started

1. Install dependencies
   ```bash
   npm install
   ```

2. Start the app
   ```bash
   npm start
   ```

3. Run on a target platform
   ```bash
   npm run android
   npm run ios
   npm run web
   ```

## Documentation

- [docs/PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md)
- [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)

## Notes

This project is currently local-first and optimized for a personal productivity workflow. It is designed to be extensible for future features such as cloud sync, collaboration, and richer automation.
