import React from 'react';

import {View, useColorScheme} from 'react-native';

import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import tailwind from 'tailwind-rn';

import HomeIcon from './assets/svg/home-fill-24.svg';
import DashboardIcon from './assets/svg/dashboard.svg';
import QRIcon from './assets/svg/scan.svg';

import Home from './screens/Home';

// Wallet screens
import Import from './screens/wallet/Import';
import RestoreActions from './screens/wallet/RestoreActions';
import CreateActions from './screens/wallet/CreateActions';

import Apps from './screens/Apps';

// QR Code Scan screen
import Scan from './screens/Scan';

// Main app settings screens
import Settings from './screens/settings/Settings';

import Language from './screens/settings/Language';
import Currency from './screens/settings/Currency';
import Network from './screens/settings/Network';

import About from './screens/settings/About';
import License from './screens/settings/License';
import Release from './screens/settings/Release';

import NativeMetrics from './constants/NativeWindowMetrics';

import Color from './constants/Color';

const SettingsStack = createNativeStackNavigator();
const SettingsRoot = () => {
    return (
        <SettingsStack.Navigator screenOptions={{headerShown: false}}>
            <SettingsStack.Screen name="Settings" component={Settings} />
            <SettingsStack.Screen name="Currency" component={Currency} />
            <SettingsStack.Screen name="Language" component={Language} />
            <SettingsStack.Screen name="Network" component={Network} />
            <SettingsStack.Screen name="About" component={About} />
            <SettingsStack.Screen name="License" component={License} />
            <SettingsStack.Screen name="Release" component={Release} />
        </SettingsStack.Navigator>
    );
};

const ScanStack = createNativeStackNavigator();
const ScanRoot = () => {
    return (
        <ScanStack.Navigator screenOptions={{headerShown: false}}>
            <ScanStack.Screen name="Scan" component={Scan} />
        </ScanStack.Navigator>
    );
};

const WalletStack = createNativeStackNavigator();
const WalletRoot = () => {
    return (
        <WalletStack.Navigator screenOptions={{headerShown: false}}>
            <WalletStack.Screen name="Import" component={Import} />
            <WalletStack.Screen
                name="RestoreActions"
                component={RestoreActions}
            />
            <WalletStack.Screen
                name="CreateActions"
                component={CreateActions}
            />
        </WalletStack.Navigator>
    );
};

const HomeTabStack = createBottomTabNavigator();
const HomeTabs = () => {
    const ColorScheme = Color(useColorScheme());

    return (
        <HomeTabStack.Navigator
            initialRouteName="HomeScreen"
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: [
                    {
                        position: 'absolute',
                        bottom: NativeMetrics.navBottom,
                        margin: 0,
                        paddingTop: 0,
                        paddingBottom: 0,
                        left: NativeMetrics.width / 6, // 65,
                        right: NativeMetrics.width / 6, // 65,
                        width: 'auto',
                        backgroundColor: 'transparent',
                        borderRadius: 50,
                        borderTopColor: 'transparent',
                        elevation: 0,
                    },
                ],
            }}>
            <HomeTabStack.Screen
                name="HomeScreen"
                component={Home}
                options={{
                    tabBarIcon: ({focused}) => (
                        <HomeIcon
                            fill={
                                focused
                                    ? ColorScheme.SVG.Default
                                    : ColorScheme.SVG.GrayFill
                            }
                        />
                    ),
                }}
            />
            <HomeTabStack.Screen
                name="Scan"
                component={Scan}
                options={{
                    tabBarIcon: () => (
                        <View
                            style={[
                                tailwind(
                                    'rounded-full w-12 h-12 items-center justify-center',
                                ),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Inverted,
                                },
                            ]}>
                            <QRIcon fill={ColorScheme.SVG.Inverted} />
                        </View>
                    ),
                }}
            />
            <HomeTabStack.Screen
                name="Apps"
                component={Apps}
                options={{
                    tabBarIcon: ({focused}) => (
                        <DashboardIcon
                            fill={
                                !focused
                                    ? ColorScheme.SVG.GrayFill
                                    : ColorScheme.SVG.Default
                            }
                        />
                    ),
                }}
            />
        </HomeTabStack.Navigator>
    );
};

const InitScreenStack = createNativeStackNavigator();
const initScreen = () => {
    return (
        <InitScreenStack.Navigator screenOptions={{headerShown: false}}>
            <InitScreenStack.Screen name="Home" component={HomeTabs} />
            <InitScreenStack.Screen name="WalletRoot" component={WalletRoot} />
            <InitScreenStack.Screen
                name="SettingsRoot"
                component={SettingsRoot}
            />
            <InitScreenStack.Screen name="ScanQR" component={ScanRoot} />
        </InitScreenStack.Navigator>
    );
};

export default initScreen;
