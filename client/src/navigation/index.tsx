import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import {
  DrawerContentScrollView,
  createDrawerNavigator,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { getHeaderTitle } from '@react-navigation/elements';
import {
  CommonActions,
  DrawerActions,
  createStaticNavigation,
  type StaticParamList,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  createNativeStackScreen,
} from '@react-navigation/native-stack';
import type { ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  Appbar,
  BottomNavigation,
  Drawer as PaperDrawer,
} from 'react-native-paper';
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
  left?: ReactNode;
  right?: ReactNode;
};

function AppbarHeader({ title, onBack, left, right }: AppbarHeaderProps) {
  return (
    <Appbar.Header>
      {left ?? (onBack ? <Appbar.BackAction onPress={onBack} /> : null)}
      <Appbar.Content title={title} />
      {right}
    </Appbar.Header>
  );
}

type HomeParamList = {
  Home: undefined;
  Updates: undefined;
};

const Tab = createBottomTabNavigator<HomeParamList>();
const Drawer = createDrawerNavigator<HomeParamList>();

/** MD3 navigation bar, wired to the tab navigator. */
function HomeTabBar({
  navigation,
  state,
  descriptors,
  insets,
}: BottomTabBarProps) {
  return (
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
  );
}

function HomeTabsLayout() {
  return (
    <Tab.Navigator
      screenOptions={{
        animation: 'shift',
        header: ({ route, options }) => (
          <AppbarHeader title={getHeaderTitle(options, route.name)} />
        ),
      }}
      tabBar={(props) => <HomeTabBar {...props} />}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="newspaper"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Updates"
        component={Updates}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bell" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/** MD3 navigation drawer, used instead of the bottom bar in landscape. */
function HomeDrawerContent(props: DrawerContentComponentProps) {
  const activeRoute = props.state.routeNames[props.state.index];
  const { navigation } = props;

  return (
    <DrawerContentScrollView {...props}>
      <PaperDrawer.Section title="Study Habits">
        <PaperDrawer.Item
          label="Feed"
          icon="newspaper"
          active={activeRoute === 'Home'}
          onPress={() => navigation.navigate('Home')}
        />
        <PaperDrawer.Item
          label="Updates"
          icon="bell"
          active={activeRoute === 'Updates'}
          onPress={() => navigation.navigate('Updates')}
        />
      </PaperDrawer.Section>
    </DrawerContentScrollView>
  );
}

/** A permanent drawer only fits once the window is wide (MD3 expanded class). */
const PERMANENT_DRAWER_MIN_WIDTH = 840;

function HomeDrawerLayout({ permanent }: { permanent: boolean }) {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <HomeDrawerContent {...props} />}
      screenOptions={{
        drawerType: permanent ? 'permanent' : 'front',
        header: ({ route, options, navigation }) => (
          <AppbarHeader
            title={getHeaderTitle(options, route.name)}
            left={
              permanent ? undefined : (
                <Appbar.Action
                  icon="menu"
                  accessibilityLabel="Open navigation menu"
                  onPress={() =>
                    navigation.dispatch(DrawerActions.toggleDrawer())
                  }
                />
              )
            }
          />
        ),
      }}
    >
      <Drawer.Screen name="Home" component={Home} options={{ title: 'Feed' }} />
      <Drawer.Screen name="Updates" component={Updates} options={{ title: 'Updates' }} />
    </Drawer.Navigator>
  );
}

/**
 * Landscape swaps the bottom bar for a drawer; portrait keeps the bar. Reading
 * the window dimensions means rotating or resizing adapts without a restart.
 */
function HomeNavigation() {
  const { width, height } = useWindowDimensions();

  if (width > height) {
    return <HomeDrawerLayout permanent={width >= PERMANENT_DRAWER_MIN_WIDTH} />;
  }

  return <HomeTabsLayout />;
}

const AppStack = createNativeStackNavigator({
  initialRouteName: 'HomeTabs',
  screenOptions: {
    header: ({ navigation, route, options, back }) => (
      <AppbarHeader
        title={getHeaderTitle(options, route.name)}
        onBack={back ? navigation.goBack : undefined}
      />
    ),
  },
  screens: {
    HomeTabs: createNativeStackScreen({
      screen: HomeNavigation,
      // The tabs/drawer pair is rendered dynamically, so React Navigation can't
      // discover its routes from the tree. Declaring them here keeps the Feed
      // and Updates addressable by URL; the empty path keeps the Feed at "/".
      linking: {
        path: '',
        initialRouteName: 'Home',
        screens: {
          Home: 'home',
          Updates: 'updates',
        },
      },
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

const AuthStack = createNativeStackNavigator({
  screenOptions: {
    headerShown: false,
  },
  screens: {
    Login: createNativeStackScreen({ screen: Login }),
    SignUp: createNativeStackScreen({ screen: SignUp }),
  },
});

export const AppNavigation = createStaticNavigation(AppStack);

export const AuthNavigation = createStaticNavigation(AuthStack);

export type AuthStackParamList = StaticParamList<typeof AuthStack>;

type AppStackType = typeof AppStack;

declare module '@react-navigation/native' {
  interface RootNavigator extends AppStackType {}
}
