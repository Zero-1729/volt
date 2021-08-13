/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {StatusBar, StyleSheet, Text, useColorScheme, View} from 'react-native';

import {SafeAreaProvider} from 'react-native-safe-area-context';

const App = () => {
    const isDarkMode = useColorScheme() === 'dark';

    const root = {
        backgroundColor: isDarkMode ? '#1a1a1a' : 'white',
        ...styles.container,
    };

    return (
        <SafeAreaProvider>
            <View style={root}>
                <StatusBar
                    barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                />
                <Text
                    style={{
                        fontSize: 16,
                        color: isDarkMode ? 'white' : 'black',
                    }}>
                    Volt App
                </Text>
            </View>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default App;
