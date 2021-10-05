import React from 'react';

import {createNativeStackNavigator} from 'react-native-screens/native-stack';

import Home from './screens/Home';
import Apps from './screens/Apps';

// Main app settings screens
import Settings from './screens/settings/Settings';

import Language from './screens/settings/Language';
import Currency from './screens/settings/Currency';

import About from './screens/settings/About';
import License from './screens/settings/License';
import Release from './screens/settings/Release';

const SettingsStack = createNativeStackNavigator();
const SettingsRoot = () => {
    return (
        <SettingsStack.Navigator screenOptions={{headerShown: false}}>
            <SettingsStack.Screen name="Settings" component={Settings} />
            <SettingsStack.Screen name="Language" component={Language} />
            <SettingsStack.Screen name="Currency" component={Currency} />
            <SettingsStack.Screen name="About" component={About} />
            <SettingsStack.Screen name="License" component={License} />
            <SettingsStack.Screen name="Release" component={Release} />
        </SettingsStack.Navigator>
    );
};

const InitScreenStack = createNativeStackNavigator();
const initScreen = () => {
    return (
        <InitScreenStack.Navigator
            initialRouteName="Home"
            screenOptions={{headerShown: false}}>
            <InitScreenStack.Screen name="Home" component={Home} />
            <InitScreenStack.Screen
                name="Apps"
                component={Apps}
                options={{replaceAnimation: 'push'}}
            />
            <InitScreenStack.Screen
                name="SettingsRoot"
                component={SettingsRoot}
                options={{replaceAnimation: 'push'}}
            />
        </InitScreenStack.Navigator>
    );
};

export default initScreen;
