# Starter Template with React Navigation

This is a minimal starter template for React Native apps using Expo and React Navigation.

It includes the following:

- Example [Native Stack](https://reactnavigation.org/docs/native-stack-navigator) with a nested [Bottom Tab](https://reactnavigation.org/docs/bottom-tab-navigator)
- Material Design 3 login/sign-up screens as the app entry point
- Session-backed auth: token and user persisted with AsyncStorage and shared through React context
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

### Sessions

`AuthProvider` (`src/context/AuthContext.tsx`) holds the signed-in user and
token and persists them in AsyncStorage under `studyhabits.session`. `useAuth()`
exposes `user`, `token`, `isRestoring`, `signIn`, `signUp` and `signOut`.

The stored session is restored on launch — a signed-in user skips the sign-in
screens — and the sign-in stack is used whenever there is no session.

> Native builds reach the API directly. On web the page and the API are on
> different origins, so the server needs CORS enabled for browser clients.

## Notes

This project uses a [development build](https://docs.expo.dev/develop/development-builds/introduction/) and cannot be run with [Expo Go](https://expo.dev/go). To run the app with Expo Go, edit the `package.json` file, remove the `expo-dev-client` package and `--dev-client` flag from the `start` script.

We highly recommend using the development builds for normal development and testing.

The `ios` and `android` folder are gitignored in the project by default as they are automatically generated during the build process ([Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)). This means that you should not edit these folders directly and use [config plugins](https://docs.expo.dev/config-plugins/) instead. However, if you need to edit these folders, you can remove them from the `.gitignore` file so that they are tracked by git.

## Resources

- [React Navigation documentation](https://reactnavigation.org/)
- [Expo documentation](https://docs.expo.dev/)

---

Demo assets are from [lucide.dev](https://lucide.dev/)
