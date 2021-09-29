import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    useColorScheme,
    Linking,
    TouchableOpacity,
} from 'react-native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import tailwind from 'tailwind-rn';

import Back from './../../assets/svg/arrow-left-24.svg';
import Check from './../../assets/svg/check-circle-24.svg';

const Settings = () => {
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
        backgroundColor: isDarkMode ? '#313131' : '#F3F3F3',
    };

    const DarkGrayedText = {
        color: isDarkMode ? '#676767' : '#B1B1B1',
    };

    const DarkObject = {
        backgroundColor: isDarkMode ? 'white' : 'black',
    };

    const DarkSVGFill = isDarkMode ? 'white' : 'black';

    const disabled = true;

    const navigation = useNavigation();

    return (
        <SafeAreaView style={DarkBackground}>
            <View
                style={[
                    tailwind('w-full h-full justify-start items-center'),
                    DarkBackground,
                ]}>
                <View style={tailwind('w-full h-full items-center')}>
                    <View style={tailwind('w-5/6 mt-4 mb-12')}>
                        <TouchableOpacity
                            style={tailwind('items-center flex-row')}
                            onPress={() => {
                                navigation.navigate('Home');
                            }}>
                            <Back style={tailwind('mr-2')} fill={DarkSVGFill} />
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    DarkText,
                                    styles.BoldText,
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
                                styles.MediumText,
                                DarkText,
                            ]}>
                            Settings
                        </Text>

                        <View
                            style={[tailwind('w-full'), {height: 2}, DarkBar]}
                        />
                    </View>

                    <View style={[tailwind('w-5/6 mb-8')]}>
                        <View
                            style={[
                                tailwind(
                                    'items-center flex-row justify-between mt-2 mb-4',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    styles.MediumText,
                                    DarkText,
                                ]}>
                                Currency
                            </Text>

                            <TouchableOpacity onPress={() => {}}>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        styles.MediumText,
                                        DarkGrayedText,
                                    ]}>
                                    USD
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View
                            style={[
                                tailwind(
                                    'items-center flex-row justify-between mt-2 mb-4',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    styles.MediumText,
                                    DarkText,
                                ]}>
                                Language
                            </Text>

                            <TouchableOpacity onPress={() => {}}>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        styles.MediumText,
                                        DarkGrayedText,
                                    ]}>
                                    English
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View
                            style={[
                                tailwind(
                                    'items-center flex-row justify-between mt-2 mb-4',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    styles.MediumText,
                                    DarkText,
                                ]}>
                                Theme
                            </Text>

                            <TouchableOpacity onPress={() => {}}>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        styles.MediumText,
                                        DarkGrayedText,
                                    ]}>
                                    System Preference
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View
                            style={[
                                tailwind(
                                    'items-center flex-row justify-between mt-2 mb-4',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    styles.MediumText,
                                    DarkText,
                                ]}>
                                Enable Biometrics
                            </Text>

                            <TouchableOpacity onPress={() => {}}>
                                <Check fill={DarkSVGFill} style={DarkSVGFill} />
                            </TouchableOpacity>
                        </View>

                        <View
                            style={[
                                tailwind(
                                    'items-center flex-row justify-between mt-2 mb-4',
                                ),
                            ]}>
                            <TouchableOpacity
                                onPress={() => {
                                    Linking.openSettings;
                                }}>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        styles.MediumText,
                                        DarkText,
                                    ]}>
                                    System Preferences
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View
                        style={tailwind(
                            'justify-center w-full items-center mb-6',
                        )}>
                        <Text
                            style={[
                                tailwind('text-lg w-5/6'),
                                styles.BoldText,
                                DarkText,
                            ]}>
                            Advanced
                        </Text>
                    </View>

                    <View style={[tailwind('w-5/6')]}>
                        <View
                            style={[
                                tailwind(
                                    'items-center flex-row justify-between mt-2 mb-4',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    styles.MediumText,
                                    DarkText,
                                ]}>
                                Enable Advanced Mode
                            </Text>

                            <TouchableOpacity onPress={() => {}}>
                                {!disabled && (
                                    <Check
                                        fill={DarkSVGFill}
                                        style={DarkSVGFill}
                                    />
                                )}
                            </TouchableOpacity>
                        </View>

                        <View
                            style={[
                                tailwind(
                                    'items-center flex-row justify-between mt-2 mb-4',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    styles.MediumText,
                                    DarkText,
                                ]}>
                                Hide Balances
                            </Text>

                            <TouchableOpacity onPress={() => {}}>
                                {!disabled && (
                                    <Check
                                        fill={DarkSVGFill}
                                        style={DarkSVGFill}
                                    />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <TouchableOpacity onPress={() => {}}>
                    <View
                        style={[
                            tailwind(
                                'self-center p-3 px-12 rounded-md absolute bottom-12',
                            ),
                            DarkObject,
                        ]}>
                        <Text
                            style={[
                                tailwind('text-sm'),
                                styles.MediumText,
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

const styles = StyleSheet.create({
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
