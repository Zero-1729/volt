import React, {useEffect} from 'react';

import {StatusBar, StyleSheet, useColorScheme} from 'react-native';

import {SafeAreaProvider} from 'react-native-safe-area-context';

import {NavigationContainer} from '@react-navigation/native';

import SplashScreen from 'react-native-splash-screen';

import 'react-native-gesture-handler';

import InitScreen from './Navigation';

import Color from './constants/Color';

const App = () => {
    useEffect(() => {
        SplashScreen.hide();
    });

    const ColorScheme = Color(useColorScheme());

    return (
        <SafeAreaProvider
            style={{backgroundColor: ColorScheme.Background.Primary}}>
            <StatusBar
                barStyle={
                    ColorScheme.isDarkMode ? 'light-content' : 'dark-content'
                }
            />

            <NavigationContainer theme={ColorScheme.NavigatorTheme}>
                <InitScreen />
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({});

export default App;
