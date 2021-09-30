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
        <SettingsStack.Navigator initialRouteName="Settings">
            <SettingsStack.Screen
                name="Settings"
                component={Settings}
                options={{headerShown: false, replaceAnimation: 'push'}}
            />
            <SettingsStack.Screen
                name="Language"
                component={Language}
                options={{headerShown: false, replaceAnimation: 'push'}}
            />
            <SettingsStack.Screen
                name="Currency"
                component={Currency}
                options={{headerShown: false, replaceAnimation: 'push'}}
            />
            <SettingsStack.Screen
                name="About"
                component={About}
                options={{headerShown: false, replaceAnimation: 'push'}}
            />
            <SettingsStack.Screen
                name="License"
                component={License}
                options={{headerShown: false, replaceAnimation: 'push'}}
            />
            <SettingsStack.Screen
                name="Release"
                component={Release}
                options={{headerShown: false, replaceAnimation: 'push'}}
            />
        </SettingsStack.Navigator>
    );
};

const InitScreenStack = createNativeStackNavigator();
const initScreen = () => (
    <InitScreenStack.Navigator initialRouteName="Home">
        <InitScreenStack.Screen
            name="Home"
            component={Home}
            options={{headerShown: false}}
        />
        <InitScreenStack.Screen
            name="Apps"
            component={Apps}
            options={{headerShown: false, replaceAnimation: 'push'}}
        />
        <InitScreenStack.Screen
            name="SettingsRoot"
            component={SettingsRoot}
            options={{headerShown: false, replaceAnimation: 'push'}}
        />
    </InitScreenStack.Navigator>
);

export default initScreen;
