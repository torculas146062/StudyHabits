# Starter Template with React Navigation

This is a minimal starter template for React Native apps using Expo and React Navigation.

It includes the following:

- Example [Native Stack](https://reactnavigation.org/docs/native-stack-navigator) with a nested [Bottom Tab](https://reactnavigation.org/docs/bottom-tab-navigator)
- Material Design 3 login/sign-up screens as the app entry point
- Session-backed auth: token and user persisted with AsyncStorage and shared through React context
- Material Design 3 Settings screen with a System / Light / Dark theme preference, also persisted
- Task and event scheduling with optional reminders, plus a Statistics tab with charts
- Exam planning with generated study tasks and preparation progress
- Offline-first local storage with per-account cloud sync across devices
- Account deletion that removes the account, synced plan and local copies
- Do Not Disturb prompt when a pomodoro focus block starts
- Web support with [React Native for Web](https://necolas.github.io/react-native-web/)
- UI components and Material Design 3 theming with [React Native Paper](https://oss.callstack.com/react-native-paper/), kept in sync with React Navigation
- TypeScript support and configured for React Navigation
- Automatic [deep link](https://reactnavigation.org/docs/deep-linking) and [URL handling configuration](https://reactnavigation.org/docs/configuring-links)
- Theme support [based on system appearance](https://reactnavigation.org/docs/themes/#using-the-operating-system-preferences)
- Expo [Development Build](https://docs.expo.dev/develop/development-builds/introduction/) with [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)

## Getting Started

1. Create a new project using this template:

   ```sh
   npx create-expo-app@latest --template react-navigation/template
   ```

2. Edit the `app.json` file to configure the `name`, `slug`, `scheme` and bundle identifiers (`ios.bundleIdentifier` and `android.bundleIdentifier`) for your app.

3. Edit the `src/App.tsx` file to start working on your app.

## Running the app

- Install the dependencies:

  ```sh
  npm install
  ```

- Start the development server:

  ```sh
  npm start
  ```

- Build and run iOS and Android development builds:

  ```sh
  npm run ios
  # or
  npm run android
  ```

- In the terminal running the development server, press `i` to open the iOS simulator, `a` to open the Android device or emulator, or `w` to open the web browser.

## Connecting to the API

The app reaches the backend using the host that served the Expo bundle, so Expo
Go and installed builds can talk to a dev server running on your machine without
any configuration.

| Situation | API base URL |
| --------- | ------------ |
| Expo Go / development build | `http://<your machine's LAN IP>:3000` |
| `EXPO_PUBLIC_API_URL` set | that value |
| No host available (e.g. a plain web export) | `http://localhost:3000` |

`localhost` is deliberately not the default: on a phone it points at the phone
itself, so a device running Expo Go or an installed APK could never reach the
computer running the server that way.

To point the app at a specific backend:

```sh
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000 npm start
```

> `EXPO_PUBLIC_*` values are inlined into the bundle at build time and cached, so
> after changing one, clear the bundler cache (`npm start -- --clear`, or
> `npx expo export --clear`), otherwise the old value is reused.

### Theming

`ThemePreferenceProvider` (`src/context/ThemeContext.tsx`) holds a `system` /
`light` / `dark` preference, persisted in AsyncStorage under `studyhabits.theme`
and applied to both React Native Paper and React Navigation. `system` follows the
device setting, so the app matches the OS unless the user overrides it.

### Sessions

`AuthProvider` (`src/context/AuthContext.tsx`) holds the signed-in user and
token and persists them in AsyncStorage under `studyhabits.session`. `useAuth()`
exposes `user`, `token`, `isRestoring`, `signIn`, `signUp` and `signOut`.

The stored session is restored on launch — a signed-in user skips the sign-in
screens — and the sign-in stack is used whenever there is no session.

`useAuth()` also exposes `deleteAccount()`. It calls `DELETE /account`, which
removes the user and their study plan through a cascading foreign key. Only
after the server confirms does the app clear the local plan, sync bookkeeping
and session, so a failed request leaves everything intact.

> Native builds reach the API directly. On web the page and the API are on
> different origins, so the server needs CORS enabled for browser clients.

### Study plan

`StudyProvider` (`src/context/StudyContext.tsx`) owns the plan for the signed-in
account and persists it under `studyhabits.study.<userId>`. A plan holds:

- **Subjects** with a daily minute goal.
- **Tasks** — recurring to-dos with the weekdays they run on, or one-off tasks
  pinned to a date. Both carry an optional `HH:mm` reminder and a planned
  duration (entered in minutes or hours) that each check-in logs. Tasks were
  previously called habits; stored plans are migrated on read, including the old
  `habitId` session link.
- **Sessions** logged by ticking a task or finishing a focus block. Deleting a
  task, or a subject/exam that owns tasks, also removes the sessions those tasks
  logged, so study totals and exam progress revert.
- **Focus timer tasks** — starting a focus block creates one task per subject per
  day. Pausing and resuming reuses that task, and each finished pomodoro adds to
  the same day's session. These are read-only in the task list: they show a
  *Timer* or *Focused* status instead of tick/skip/undo actions.
- **Events** — one-off calendar entries with an optional `HH:mm` reminder.
- **Exams** — events with `kind: 'exam'`, a subject and a study target. Planning
  one generates dated preparation tasks (`src/study/exams.ts`) spread over the
  days leading up to it; their sessions count toward the exam's progress.
- **Rest days**, on which no tasks are scheduled.

### Responsive layout

Screens cap their content to a centred 960 px column so rows do not stretch in
landscape, on tablets, or in a browser. Dialogs are limited to 480 px, the focus
controls to 520 px, and the authentication column to 420 px.

The **Stats** tab charts study minutes for the last seven days, today's task
completion and each subject's share of all study time. The dashboard also shows
a countdown and preparation progress for upcoming exams.

### Offline use and data sync

The plan is always read from and written to AsyncStorage first, so every feature
works without a connection. Sync is layered on top:

- `src/api/study.ts` pulls and pushes the whole plan through `GET /study` and
  `PUT /study`.
- `src/storage/sync.ts` keeps per-account bookkeeping under
  `studyhabits.sync.<userId>`: the last server revision, the last successful sync
  and whether local edits are still pending.
- `decideSync` (`src/study/sync.ts`) picks a winner when both sides changed:
  the newest edit by timestamp wins, and the server acts as tie-breaker.
- `StudyProvider` syncs on load, 1.5 seconds after an edit, when the app returns
  to the foreground, and from **Settings → Cloud sync → Sync now**. A failed
  request keeps the edit pending and reports *Offline* instead of losing it.

Uploads carry the revision they were based on. If another device saved first the
server answers `409`, and the app re-fetches, compares timestamps and either
adopts the remote plan or retries the upload.

### Reminders and Do Not Disturb

Reminders are local notifications scheduled with `expo-notifications`
(`src/notifications/reminders.ts`): one weekly notification per task weekday and
one date-triggered notification per future event. They are opt-in from
**Settings → Focus and reminders**, which also asks for notification permission.
Scheduling is unavailable on web, so the app only shows reminders in the UI
there.

The same section controls the Do Not Disturb prompt. Starting a focus block can
prompt the user to enable the device's DND setting, with a *Remember my choice*
checkbox. The preference (`ask` / `always` / `never`) is stored under
`studyhabits.dnd.mode`; the OS owns the actual setting, so the app only opens
the matching system screen.

> `expo-notifications` and `expo-intent-launcher` contain native code, so the app
> needs a development build after installing dependencies.

## Notes

This project uses a [development build](https://docs.expo.dev/develop/development-builds/introduction/) and cannot be run with [Expo Go](https://expo.dev/go). To run the app with Expo Go, edit the `package.json` file, remove the `expo-dev-client` package and `--dev-client` flag from the `start` script.

We highly recommend using the development builds for normal development and testing.

The `ios` and `android` folder are gitignored in the project by default as they are automatically generated during the build process ([Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)). This means that you should not edit these folders directly and use [config plugins](https://docs.expo.dev/config-plugins/) instead. However, if you need to edit these folders, you can remove them from the `.gitignore` file so that they are tracked by git.

## Resources

- [React Navigation documentation](https://reactnavigation.org/)
- [Expo documentation](https://docs.expo.dev/)

---

Demo assets are from [lucide.dev](https://lucide.dev/)
