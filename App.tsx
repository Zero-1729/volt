/* eslint-disable react-native/no-inline-styles */
import React from 'react';

import {
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import tailwind from 'tailwind-rn';

const App = () => {
    const isDarkMode = useColorScheme() === 'dark';

    const root = {
        backgroundColor: isDarkMode ? '#000000' : 'white',
        ...styles.container,
    };

    const altGray = {
        backgroundColor: isDarkMode ? '#2C2C2C' : '#ededed',
    };

    const DarkText = {
        color: isDarkMode ? 'white' : 'black',
    };

    return (
        <SafeAreaProvider>
            <View style={root}>
                <StatusBar
                    barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                />
                <View
                    style={[
                        tailwind(
                            'w-5/6 h-52 bg-gray-100 p-6 items-center justify-center rounded-md',
                        ),
                        altGray,
                    ]}>
                    <Text
                        style={[
                            styles.BoldText,
                            tailwind('text-4xl mb-2'),
                            DarkText,
                        ]}>
                        Volt
                    </Text>
                    <Text style={[styles.RegulatText, DarkText]}>
                        Built with Open Technologies.
                    </Text>
                    <View
                        style={tailwind(
                            'bg-blue-200 px-4 py-2 rounded-full mb-6 mt-8',
                        )}>
                        <TouchableOpacity
                            style={tailwind('items-center flex-row')}>
                            <Text
                                style={[
                                    styles.MediumText,
                                    tailwind('text-xs'),
                                ]}>
                                Supports the Satoshi Symbol (
                                <Text style={styles.SatSymbol}>S</Text>)
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text
                    style={[
                        styles.MediumText,
                        DarkText,
                        tailwind('absolute bottom-14'),
                    ]}>
                    MIT License
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
    RegulatText: {
        fontFamily: 'Roboto',
    },
    MediumText: {
        fontFamily: 'Roboto Medium',
    },
    BoldText: {
        fontFamily: 'Roboto Bold',
    },
    SatSymbol: {
        fontFamily: 'Satoshi Symbol',
    },
});

export default App;
