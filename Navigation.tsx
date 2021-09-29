import React from 'react';

import {createNativeStackNavigator} from 'react-native-screens/native-stack';

import Home from './screens/Home';
import Apps from './screens/Apps';
import Settings from './screens/settings/Settings';

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
            name="Settings"
            component={Settings}
            options={{headerShown: false, replaceAnimation: 'push'}}
        />
    </InitScreenStack.Navigator>
);

export default initScreen;
