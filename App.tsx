import React, {useEffect} from 'react';

import {StatusBar, StyleSheet, useColorScheme, View} from 'react-native';

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
            <View style={[styles.container]}>
                <StatusBar
                    barStyle={
                        ColorScheme.isDarkMode
                            ? 'light-content'
                            : 'dark-content'
                    }
                />

                <NavigationContainer>
                    <InitScreen />
                </NavigationContainer>
            </View>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default App;
