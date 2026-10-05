import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  createBottomTabNavigator,
  createBottomTabScreen,
} from '@react-navigation/bottom-tabs';
import { getHeaderTitle } from '@react-navigation/elements';
import { CommonActions, createStaticNavigation } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  createNativeStackScreen,
} from '@react-navigation/native-stack';
import type { ReactNode } from 'react';
import { Appbar, BottomNavigation } from 'react-native-paper';
import { Home } from './screens/Home';
import { Login } from './screens/Login';
import { NotFound } from './screens/NotFound';
import { Profile } from './screens/Profile';
import { Settings } from './screens/Settings';
import { SignUp } from './screens/SignUp';
import { Updates } from './screens/Updates';

type AppbarHeaderProps = {
  title?: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
};

function AppbarHeader({ title, onBack, right }: AppbarHeaderProps) {
  return (
    <Appbar.Header>
      {onBack ? <Appbar.BackAction onPress={onBack} /> : null}
      <Appbar.Content title={title} />
      {right}
    </Appbar.Header>
  );
}

const HomeTabs = createBottomTabNavigator({
  screenOptions: {
    animation: 'shift',
    header: ({ route, options }) => (
      <AppbarHeader title={getHeaderTitle(options, route.name)} />
    ),
  },
  tabBar: ({ navigation, state, descriptors, insets }) => (
    <BottomNavigation.Bar
      navigationState={state}
      safeAreaInsets={insets}
      onTabPress={({ route, preventDefault }) => {
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });

        if (event.defaultPrevented) {
          preventDefault();
        } else {
          navigation.dispatch({
            ...CommonActions.navigate(route.name, route.params),
            target: state.key,
          });
        }
      }}
      renderIcon={({ route, focused, color }) =>
        descriptors[route.key].options.tabBarIcon?.({
          focused,
          color,
          size: 24,
        }) ?? null
      }
      getLabelText={({ route }) => {
        const { options } = descriptors[route.key];
        return typeof options.tabBarLabel === 'string'
          ? options.tabBarLabel
          : typeof options.title === 'string'
            ? options.title
            : route.name;
      }}
    />
  ),
  screens: {
    Home: createBottomTabScreen({
      screen: Home,
      options: {
        title: 'Feed',
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="newspaper" color={color} size={size} />
        ),
      },
    }),
    Updates: createBottomTabScreen({
      screen: Updates,
      options: {
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="bell" color={color} size={size} />
        ),
      },
    }),
  },
});

const RootStack = createNativeStackNavigator({
  initialRouteName: 'Login',
  screenOptions: {
    header: ({ navigation, route, options, back }) => (
      <AppbarHeader
        title={getHeaderTitle(options, route.name)}
        onBack={back ? navigation.goBack : undefined}
      />
    ),
  },
  screens: {
    Login: createNativeStackScreen({
      screen: Login,
      options: {
        headerShown: false,
      },
    }),
    SignUp: createNativeStackScreen({
      screen: SignUp,
      options: {
        headerShown: false,
      },
    }),
    HomeTabs: createNativeStackScreen({
      screen: HomeTabs,
      options: {
        title: 'Home',
        headerShown: false,
      },
    }),
    Profile: createNativeStackScreen({
      screen: Profile,
      linking: {
        path: ':user(@[a-zA-Z0-9-_]+)',
        parse: {
          user: (value) => value.replace(/^@/, ''),
        },
        stringify: {
          user: (value) => `@${value}`,
        },
      },
    }),
    Settings: createNativeStackScreen({
      screen: Settings,
      options: ({ navigation }) => ({
        presentation: 'modal',
        header: ({ route, options }) => (
          <AppbarHeader
            title={getHeaderTitle(options, route.name)}
            right={<Appbar.Action icon="close" onPress={navigation.goBack} />}
          />
        ),
      }),
    }),
    NotFound: createNativeStackScreen({
      screen: NotFound,
      options: {
        title: '404',
      },
      linking: {
        path: '*',
      },
    }),
  },
});

export const Navigation = createStaticNavigation(RootStack);

type RootStackType = typeof RootStack;

declare module '@react-navigation/native' {
  interface RootNavigator extends RootStackType {}
}
