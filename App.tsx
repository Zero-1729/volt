/* eslint-disable react-native/no-inline-styles */
import React from 'react';

import Github from './assets/svg/repo-forked-24.svg';
import Dots from './assets/svg/kebab-horizontal-24.svg';
import Bell from './assets/svg/bell-fill-24.svg';
import Add from './assets/svg/plus-32.svg';

import {
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

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

    const svgFill = isDarkMode ? 'white' : 'black';

    const bgFill = {
        backgroundColor: isDarkMode ? 'white' : 'black',
    };

    const AltDarkText = {
        color: isDarkMode ? 'black' : 'white',
    };

    return (
        <SafeAreaProvider>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            />

            <View style={tailwind('w-full h-16 absolute top-0')} />

            <SafeAreaView style={tailwind('h-full w-full')}>
                <View
                    style={[
                        root,
                        tailwind('items-center justify-center relative'),
                    ]}>
                    <View
                        style={tailwind(
                            'w-5/6 h-10 absolute top-2 items-center flex-row justify-between',
                        )}>
                        <TouchableOpacity>
                            <Dots
                                width={32}
                                fill={svgFill}
                                style={tailwind('-ml-1')}
                            />
                        </TouchableOpacity>

                        <View
                            style={tailwind(
                                'flex-row justify-between items-center -mr-1',
                            )}>
                            <TouchableOpacity>
                                <Bell
                                    width={22}
                                    fill={svgFill}
                                    style={tailwind('mr-4')}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Add width={30} fill={svgFill} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={tailwind('w-5/6 h-52 relative items-center')}>
                        <View
                            style={tailwind(
                                'w-11/12 h-full absolute -bottom-2 rounded-md bg-purple-500 z-20 opacity-60',
                            )}
                        />

                        <View
                            style={tailwind(
                                'w-5/6 h-full absolute -bottom-4 rounded-md bg-blue-500 opacity-60',
                            )}
                        />

                        <View
                            style={[
                                tailwind(
                                    'w-full h-52 bg-gray-100 p-6 items-center justify-center rounded-md z-30',
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

                            <View
                                style={tailwind(
                                    'justify-center items-center flex-row',
                                )}>
                                <Github
                                    fill={svgFill}
                                    style={tailwind('mr-2')}
                                />
                                <Text style={[styles.RegularText, DarkText]}>
                                    Built with Open Technologies
                                </Text>
                            </View>

                            <View
                                style={[
                                    tailwind(
                                        'px-4 py-2 rounded-full mb-6 mt-4',
                                    ),
                                    bgFill,
                                ]}>
                                <TouchableOpacity
                                    style={tailwind('items-center flex-row')}>
                                    <Text
                                        style={[
                                            styles.MediumText,
                                            tailwind('text-xs'),
                                            AltDarkText,
                                        ]}>
                                        Supports the Satoshi Symbol (
                                        <Text
                                            style={[
                                                styles.SatSymbol,
                                                tailwind('text-sm'),
                                            ]}>
                                            S
                                        </Text>
                                        )
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <Text
                        style={[
                            styles.MediumText,
                            DarkText,
                            tailwind('absolute bottom-8'),
                        ]}>
                        MIT License
                    </Text>
                </View>
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    SatSymbol: {
        fontFamily: 'Satoshi Symbol',
    },
});

export default App;
