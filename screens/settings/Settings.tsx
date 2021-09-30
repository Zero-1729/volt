import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    useColorScheme,
    Linking,
    TouchableOpacity,
    Platform,
} from 'react-native';

import {useNavigation} from '@react-navigation/core';

import {
    SafeAreaView,
    initialWindowMetrics,
} from 'react-native-safe-area-context';

import tailwind from 'tailwind-rn';

import Back from './../../assets/svg/arrow-left-24.svg';
import Right from './../../assets/svg/chevron-right-24.svg';

import Font from '../../constants/Font';

const Settings = () => {
    const navigation = useNavigation();

    const insets = initialWindowMetrics.insets;

    const bottomPadding = {
        bottom:
            Platform.OS === 'ios'
                ? insets.bottom - 18
                : insets.bottom > 16
                ? insets.bottom - 20 // Android with default 3 buttons
                : insets.bottom + 20, // Android with IOS-like bottom
    };

    const isDarkMode = useColorScheme() === 'dark';

    const DarkBackground = {
        backgroundColor: isDarkMode ? 'black' : 'white',
    };

    const DarkText = {
        color: isDarkMode ? 'white' : 'black',
    };

    const AltDarkText = {
        color: isDarkMode ? 'black' : 'white',
    };

    const DarkBar = {
        backgroundColor: isDarkMode ? '#1b1b1b' : '#F3F3F3',
    };

    const DarkGrayedText = {
        color: isDarkMode ? '#676767' : '#B1B1B1',
    };

    const DarkObject = {
        backgroundColor: isDarkMode ? 'white' : 'black',
    };

    const DarkSVGFill = isDarkMode ? 'white' : 'black';

    const DarkGraySVGFill = isDarkMode ? '#676767' : '#B1B1B1';

    return (
        <SafeAreaView style={DarkBackground}>
            <View
                style={[
                    tailwind('w-full h-full justify-start items-center'),
                    DarkBackground,
                ]}>
                <View style={tailwind('w-full h-full items-center')}>
                    <View style={tailwind('w-5/6 mt-4 mb-16')}>
                        <TouchableOpacity
                            style={tailwind('items-center flex-row -ml-1')}
                            onPress={() => {
                                navigation.goBack();
                            }}>
                            <Back style={tailwind('mr-2')} fill={DarkSVGFill} />
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    DarkText,
                                    Font.BoldText,
                                ]}>
                                Back
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View
                        style={tailwind(
                            'justify-center w-full items-center mb-6',
                        )}>
                        <Text
                            style={[
                                tailwind('text-2xl mb-4 w-5/6'),
                                Font.MediumText,
                                DarkText,
                            ]}>
                            Settings
                        </Text>

                        <View
                            style={[tailwind('w-full'), {height: 2}, DarkBar]}
                        />
                    </View>

                    <View style={[tailwind('w-5/6')]}>
                        <TouchableOpacity onPress={() => {}}>
                            <View
                                style={[
                                    tailwind(
                                        'items-center flex-row justify-between mt-2 mb-6',
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        Font.MediumText,
                                        DarkText,
                                    ]}>
                                    Currency
                                </Text>

                                <View
                                    style={[
                                        tailwind(
                                            'flex-row items-center justify-between',
                                        ),
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind('text-xs mr-4'),
                                            Font.MediumText,
                                            DarkGrayedText,
                                        ]}>
                                        USD
                                    </Text>
                                    <Right
                                        width={16}
                                        stroke={DarkGraySVGFill}
                                        fill={DarkGraySVGFill}
                                        style={[]}
                                    />
                                </View>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => {}}>
                            <View
                                style={[
                                    tailwind(
                                        'items-center flex-row justify-between mt-2 mb-6',
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        Font.MediumText,
                                        DarkText,
                                    ]}>
                                    Language
                                </Text>

                                <View
                                    style={[
                                        tailwind(
                                            'flex-row items-center justify-between',
                                        ),
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind('text-xs mr-4'),
                                            Font.MediumText,
                                            DarkGrayedText,
                                        ]}>
                                        English
                                    </Text>
                                    <Right
                                        width={16}
                                        stroke={DarkGraySVGFill}
                                        fill={DarkGraySVGFill}
                                    />
                                </View>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => {}}>
                            <View
                                style={[
                                    tailwind(
                                        'items-center flex-row justify-between mt-2 mb-6',
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        Font.MediumText,
                                        DarkText,
                                    ]}>
                                    Wallet
                                </Text>

                                <Right
                                    width={16}
                                    stroke={DarkGraySVGFill}
                                    fill={DarkGraySVGFill}
                                />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => {}}>
                            <View
                                style={[
                                    tailwind(
                                        'items-center flex-row justify-between mt-2 mb-6',
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        Font.MediumText,
                                        DarkText,
                                    ]}>
                                    Security
                                </Text>

                                <Right
                                    width={16}
                                    stroke={DarkGraySVGFill}
                                    fill={DarkGraySVGFill}
                                />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => {}}>
                            <View
                                style={[
                                    tailwind(
                                        'items-center flex-row justify-between mt-2 mb-6',
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        Font.MediumText,
                                        DarkText,
                                    ]}>
                                    Network
                                </Text>

                                <Right
                                    width={16}
                                    stroke={DarkGraySVGFill}
                                    fill={DarkGraySVGFill}
                                />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => {}}>
                            <View
                                style={[
                                    tailwind(
                                        'items-center flex-row justify-between mt-2 mb-6',
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        Font.MediumText,
                                        DarkText,
                                    ]}>
                                    Tools
                                </Text>

                                <Right
                                    width={16}
                                    stroke={DarkGraySVGFill}
                                    fill={DarkGraySVGFill}
                                />
                            </View>
                        </TouchableOpacity>

                        <View
                            style={[
                                tailwind(
                                    'items-center flex-row justify-between mt-2',
                                ),
                            ]}>
                            <TouchableOpacity
                                onPress={() => {
                                    Linking.openSettings();
                                }}>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        Font.MediumText,
                                        DarkText,
                                    ]}>
                                    System Preferences
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <TouchableOpacity onPress={() => {}}>
                    <View
                        style={[
                            tailwind(
                                'self-center p-3 px-12 rounded-md absolute',
                            ),
                            DarkObject,
                            bottomPadding,
                        ]}>
                        <Text
                            style={[
                                tailwind('text-sm'),
                                Font.MediumText,
                                AltDarkText,
                            ]}>
                            About
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default Settings;

const styles = StyleSheet.create({});
