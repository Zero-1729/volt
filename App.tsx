import React from 'react';

import {StatusBar, StyleSheet, useColorScheme, View} from 'react-native';

import {SafeAreaProvider} from 'react-native-safe-area-context';

import {NavigationContainer} from '@react-navigation/native';

import 'react-native-gesture-handler';

import InitScreen from './Navigation';

const App = () => {
    const isDarkMode = useColorScheme() === 'dark';

    return (
        <SafeAreaProvider>
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
