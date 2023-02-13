import React, {useEffect} from 'react';

import {StatusBar, useColorScheme} from 'react-native';

import {SafeAreaProvider} from 'react-native-safe-area-context';

import {NavigationContainer, DefaultTheme} from '@react-navigation/native';

import SplashScreen from 'react-native-splash-screen';

import 'react-native-gesture-handler';

import InitScreen from './Navigation';

import Color from './constants/Color';

function App(): JSX.Element {
    useEffect(() => {
        SplashScreen.hide();
    });

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
            />

            <NavigationContainer theme={Theme}>
                <InitScreen />
            </NavigationContainer>
        </SafeAreaProvider>
    );
}

export default App;
