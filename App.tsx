import 'react-native-gesture-handler';

import React, {useEffect} from 'react';

import {StatusBar, useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';

import Privacy from 'react-native-privacy-snapshot';

import InitScreen from './Navigation';
import Color from './constants/Color';

import SplashScreen from 'react-native-splash-screen';

const App = () => {
    useEffect(() => {
        SplashScreen.hide();

        // Enable privacy blur for IOS; blur screen when screen inactive
        Privacy?.enabled(true);
    }, []);

    const ColorScheme = Color(useColorScheme());

    let Theme = {
        dark: ColorScheme.isDarkMode,
        colors: {
            // Spread the colors from the default theme
            // and include the custom Navigator theme colors
            ...DefaultTheme.colors,
            ...ColorScheme.NavigatorTheme.colors,
        },
    };

    return (
        <SafeAreaProvider
            style={{backgroundColor: ColorScheme.Background.Primary}}>
            <StatusBar
                barStyle={
                    ColorScheme.isDarkMode ? 'light-content' : 'dark-content'
                }
                backgroundColor={ColorScheme.Background.Primary}
            />

            <NavigationContainer theme={Theme}>
                <InitScreen />
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default App;
