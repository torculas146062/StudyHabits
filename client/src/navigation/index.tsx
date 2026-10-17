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
  createStaticNavigation,
  type StaticParamList,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  createNativeStackScreen,
} from '@react-navigation/native-stack';
import { useCallback, useState, type ReactNode } from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  Appbar,
  BottomNavigation,
  Drawer as PaperDrawer,
} from 'react-native-paper';
import {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import type { HomeParamList } from './homeParamList';
import { Calendar } from './screens/Calendar';
import { Focus } from './screens/Focus';
import { Home } from './screens/Home';
import { Login } from './screens/Login';
import { NotFound } from './screens/NotFound';
import { Settings } from './screens/Settings';
import { SignUp } from './screens/SignUp';
import { Stats } from './screens/Stats';
import { Subjects } from './screens/Subjects';
import { Tasks } from './screens/Tasks';

type AppbarHeaderProps = {
  title?: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

function AppbarHeader({ title, onBack, right, style }: AppbarHeaderProps) {
  return (
    // Both ends get an equally wide box, filled or empty, so the centred title
    // sits at the exact middle of the bar rather than in the space left over
    // between whatever actions this screen happens to have.
    <Appbar.Header style={style} mode="center-aligned">
      <View style={styles.headerSlot}>
        {onBack ? <Appbar.BackAction onPress={onBack} /> : null}
      </View>
      <Appbar.Content title={title} />
      <View style={styles.headerSlot}>{right}</View>
    </Appbar.Header>
  );
}

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

type ActiveRoute = {
  name: keyof HomeParamList;
  params?: { date?: string };
};

function HomeTabsLayout({
  initialRoute,
  onRouteChange,
}: {
  initialRoute: ActiveRoute;
  onRouteChange: (route: ActiveRoute) => void;
}) {
  return (
    <Tab.Navigator
      initialRouteName={initialRoute.name}
      screenListeners={{
        state: (event) => {
          const state = event.data.state;

          if (state) {
            const route = state.routes[state.index];
            onRouteChange({
              name: route.name as keyof HomeParamList,
              params: route.params as ActiveRoute['params'],
            });
          }
        },
      }}
      screenOptions={{
        animation: 'shift',
        header: ({ route, options, navigation }) => (
          <AppbarHeader
            title={getHeaderTitle(options, route.name)}
            right={
              <Appbar.Action
                icon="cog-outline"
                accessibilityLabel="Open settings"
                onPress={() => navigation.getParent()?.navigate('Settings')}
              />
            }
          />
        ),
      }}
      tabBar={(props) => <HomeTabBar {...props} />}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={Tasks}
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="checkbox-marked-circle-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={Calendar}
        initialParams={
          initialRoute.name === 'Calendar' ? initialRoute.params : undefined
        }
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="calendar-month-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Stats"
        component={Stats}
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="chart-bar"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Subjects"
        component={Subjects}
        options={{
          title: 'Subjects',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="book-open-variant"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * MD3 navigation rail. `Drawer.CollapsedItem` is built for an 80dp rail, so the
 * drawer stays on screen in landscape as icons instead of opening over content.
 */
function HomeRailContent(props: DrawerContentComponentProps) {
  const activeRoute = props.state.routeNames[props.state.index];
  const insets = useSafeAreaInsets();
  const { navigation } = props;

  // A collapsed item is exactly as wide as the rail, so only the left safe area
  // is kept here; the scroll view's own spacing would push the item out of view.
  const railStyle = { paddingStart: insets.left, paddingEnd: 0 };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={railStyle}>
      <PaperDrawer.CollapsedItem
        label="Home"
        focusedIcon="home"
        unfocusedIcon="home-outline"
        active={activeRoute === 'Home'}
        onPress={() => navigation.navigate('Home')}
      />
      <PaperDrawer.CollapsedItem
        label="Tasks"
        focusedIcon="checkbox-marked-circle"
        unfocusedIcon="checkbox-marked-circle-outline"
        active={activeRoute === 'Tasks'}
        onPress={() => navigation.navigate('Tasks')}
      />
      <PaperDrawer.CollapsedItem
        label="Calendar"
        focusedIcon="calendar-month"
        unfocusedIcon="calendar-month-outline"
        active={activeRoute === 'Calendar'}
        onPress={() => navigation.navigate('Calendar')}
      />
      <PaperDrawer.CollapsedItem
        label="Stats"
        focusedIcon="chart-bar"
        unfocusedIcon="chart-bar"
        active={activeRoute === 'Stats'}
        onPress={() => navigation.navigate('Stats')}
      />
      <PaperDrawer.CollapsedItem
        label="Subjects"
        focusedIcon="book-open-variant"
        unfocusedIcon="book-open-page-variant-outline"
        active={activeRoute === 'Subjects'}
        onPress={() => navigation.navigate('Subjects')}
      />
    </DrawerContentScrollView>
  );
}

/** Drawer.CollapsedItem's own width, which is also MD3's navigation rail width. */
const RAIL_WIDTH = 80;

/**
 * The screens beside the rail already start past the left inset, so their header
 * must not pad that side again. Paper's Appbar folds both horizontal insets into
 * one padding, so it is re-applied here as the right inset only.
 */
function RailAppbarHeader({
  title,
  right,
}: {
  title?: ReactNode;
  right?: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaInsetsContext.Provider
      value={{ top: insets.top, bottom: insets.bottom, left: 0, right: 0 }}
    >
      <AppbarHeader
        title={title}
        right={right}
        style={{ paddingRight: insets.right }}
      />
    </SafeAreaInsetsContext.Provider>
  );
}

function HomeRailLayout({
  initialRoute,
  onRouteChange,
}: {
  initialRoute: ActiveRoute;
  onRouteChange: (route: ActiveRoute) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Drawer.Navigator
      initialRouteName={initialRoute.name}
      screenListeners={{
        state: (event) => {
          const state = event.data.state;

          if (state) {
            const route = state.routes[state.index];
            onRouteChange({
              name: route.name as keyof HomeParamList,
              params: route.params as ActiveRoute['params'],
            });
          }
        },
      }}
      drawerContent={(props) => <HomeRailContent {...props} />}
      screenOptions={{
        drawerType: 'permanent',
        // The rail keeps its 80dp of usable width and the left safe area sits
        // beside it, so the items clear a landscape notch instead of the rail
        // shrinking under it.
        drawerStyle: {
          width: RAIL_WIDTH + insets.left,
          // A permanent drawer draws a hairline divider; MD3's rail has none.
          borderLeftWidth: 0,
          borderRightWidth: 0,
        },
        header: ({ route, options, navigation }) => (
          <RailAppbarHeader
            title={getHeaderTitle(options, route.name)}
            right={
              <Appbar.Action
                icon="cog-outline"
                accessibilityLabel="Open settings"
                onPress={() => navigation.getParent()?.navigate('Settings')}
              />
            }
          />
        ),
      }}
    >
      <Drawer.Screen name="Home" component={Home} options={{ title: 'Home' }} />
      <Drawer.Screen
        name="Tasks"
        component={Tasks}
        options={{ title: 'Tasks' }}
      />
      <Drawer.Screen
        name="Calendar"
        component={Calendar}
        initialParams={
          initialRoute.name === 'Calendar' ? initialRoute.params : undefined
        }
        options={{ title: 'Calendar' }}
      />
      <Drawer.Screen
        name="Stats"
        component={Stats}
        options={{ title: 'Stats' }}
      />
      <Drawer.Screen
        name="Subjects"
        component={Subjects}
        options={{ title: 'Subjects' }}
      />
    </Drawer.Navigator>
  );
}

/**
 * Landscape shows a permanent icon rail; portrait keeps the bottom bar. Reading
 * the window dimensions means rotating or resizing adapts without a restart.
 * The tabs and the rail are separate navigators, so the active route is kept
 * here and handed to whichever mounts — otherwise rotating always lands back
 * on Home.
 */
function HomeNavigation() {
  const { width, height } = useWindowDimensions();
  const [activeRoute, setActiveRoute] = useState<ActiveRoute>({
    name: 'Home',
  });
  const handleRouteChange = useCallback(
    (route: ActiveRoute) => setActiveRoute(route),
    []
  );

  if (width > height) {
    return (
      <HomeRailLayout
        initialRoute={activeRoute}
        onRouteChange={handleRouteChange}
      />
    );
  }

  return (
    <HomeTabsLayout
      initialRoute={activeRoute}
      onRouteChange={handleRouteChange}
    />
  );
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
      // discover its routes from the tree. Declaring them here keeps every
      // destination addressable by URL; the empty path keeps Home at "/".
      linking: {
        path: '',
        initialRouteName: 'Home',
        screens: {
          Home: 'home',
          Tasks: 'tasks',
          Calendar: 'calendar',
          Stats: 'stats',
          Subjects: 'subjects',
        },
      },
      options: {
        title: 'Home',
        headerShown: false,
      },
    }),
    // The focus timer hides the tabs and header so nothing competes with the
    // countdown; it is opened from a subject's Start focus button.
    Focus: createNativeStackScreen({
      screen: Focus,
      options: {
        headerShown: false,
        presentation: 'fullScreenModal',
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

const styles = StyleSheet.create({
  headerSlot: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
