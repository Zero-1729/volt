import React, {useEffect} from 'react';

import {StatusBar, StyleSheet, useColorScheme, View} from 'react-native';

import {SafeAreaProvider} from 'react-native-safe-area-context';

import {NavigationContainer} from '@react-navigation/native';

import SplashScreen from 'react-native-splash-screen';

import 'react-native-gesture-handler';

import InitScreen from './Navigation';

const App = () => {
    useEffect(() => {
        SplashScreen.hide();
    });

    const isDarkMode = useColorScheme() === 'dark';

    const DarkBackground = {
        backgroundColor: isDarkMode ? 'black' : 'white',
    };

    return (
        <SafeAreaProvider style={DarkBackground}>
            <View style={[styles.container]}>
                <StatusBar
                    barStyle={isDarkMode ? 'light-content' : 'dark-content'}
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
    RegularText: {
        fontFamily: 'Roboto',
    },
    MediumText: {
        fontFamily: 'Roboto Medium',
    },
    BoldText: {
        fontFamily: 'Roboto Bold',
    },
});

export default App;
