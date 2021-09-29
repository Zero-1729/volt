import React from 'react';

import {createNativeStackNavigator} from 'react-native-screens/native-stack';

import Home from './screens/Home';
import Apps from './screens/Apps';

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
    </InitScreenStack.Navigator>
);

export default initScreen;
