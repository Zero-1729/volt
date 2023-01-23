import React, {useEffect, useState} from 'react';

import {StyleSheet, Text, View, useColorScheme, Linking} from 'react-native';

import {CommonActions} from '@react-navigation/native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import tailwind from 'tailwind-rn';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';
import Right from './../../assets/svg/chevron-right-24.svg';

import NativeBottomPadding from '../../constants/NativeWindowMetrics';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

const Settings = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const HeadingBar = {
        height: 2,
        backgroundColor: ColorScheme.HeadingBar,
    };

    const [currency, setDefaultCurrency] = useState('USD');
    const [language, setDefaultLanguage] = useState('en');

    const retrieveSetting = async (item: string) => {
        try {
            const value = await AsyncStorage.getItem(item);

            if (value !== null) {
                return value;
            }
        } catch (e) {
            console.error(
                '[AsyncStorage] (Main settings) Error loading data: ',
                e,
            );
        }
    };

    useEffect(() => {
        retrieveSetting('defaultCurrency').then(value => {
            if (value) {
                setDefaultCurrency(value);
            }
        });

        retrieveSetting('defaultLanguage').then(value => {
            if (value) {
                setDefaultLanguage(value);
            }
        });
    }, [currency, language]);

    return (
        <SafeAreaView>
            <View
                style={[
                    tailwind('w-full h-full items-center'),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <View style={tailwind('w-5/6 mt-4 mb-16')}>
                    <PlainButton
                        style={tailwind('items-center flex-row -ml-1')}
                        onPress={() => {
                            navigation.goBack();
                        }}>
                        <Back
                            style={tailwind('mr-2')}
                            fill={ColorScheme.SVG.Default}
                        />
                        <Text
                            style={[
                                tailwind('text-sm font-medium'),
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            Back
                        </Text>
                    </PlainButton>
                </View>

                <View
                    style={tailwind('justify-center w-full items-center mb-6')}>
                    <Text
                        style={[
                            tailwind('text-2xl mb-4 w-5/6 font-medium'),
                            {color: ColorScheme.Text.Default},
                            Font.RobotoText,
                        ]}>
                        Settings
                    </Text>

                    <View style={[tailwind('w-full'), HeadingBar]} />
                </View>

                <View style={[tailwind('w-5/6')]}>
                    <PlainButton
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate({name: 'Currency'}),
                            );
                        }}>
                        <View
                            style={[
                                tailwind(
                                    'items-center flex-row justify-between mt-2 mb-6',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
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
                                        {
                                            color: ColorScheme.Text.GrayedText,
                                        },
                                        Font.RobotoText,
                                    ]}>
                                    {currency}
                                </Text>
                                <Right
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
                                    style={[]}
                                />
                            </View>
                        </View>
                    </PlainButton>

                    <PlainButton
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate({name: 'Language'}),
                            );
                        }}>
                        <View
                            style={[
                                tailwind(
                                    'items-center flex-row justify-between mt-2 mb-6',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
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
                                        {
                                            color: ColorScheme.Text.GrayedText,
                                        },
                                        Font.RobotoText,
                                    ]}>
                                    {language}
                                </Text>
                                <Right
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
                                />
                            </View>
                        </View>
                    </PlainButton>

                    <PlainButton onPress={() => {}}>
                        <View
                            style={[
                                tailwind(
                                    'items-center flex-row justify-between mt-2 mb-6',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                Wallet
                            </Text>

                            <Right
                                width={16}
                                stroke={ColorScheme.SVG.GrayFill}
                                fill={ColorScheme.SVG.GrayFill}
                            />
                        </View>
                    </PlainButton>

                    <PlainButton onPress={() => {}}>
                        <View
                            style={[
                                tailwind(
                                    'items-center flex-row justify-between mt-2 mb-6',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                Security
                            </Text>

                            <Right
                                width={16}
                                stroke={ColorScheme.SVG.GrayFill}
                                fill={ColorScheme.SVG.GrayFill}
                            />
                        </View>
                    </PlainButton>

                    <PlainButton onPress={() => {}}>
                        <View
                            style={[
                                tailwind(
                                    'items-center flex-row justify-between mt-2 mb-6',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                Network
                            </Text>

                            <Right
                                width={16}
                                stroke={ColorScheme.SVG.GrayFill}
                                fill={ColorScheme.SVG.GrayFill}
                            />
                        </View>
                    </PlainButton>

                    <PlainButton onPress={() => {}}>
                        <View
                            style={[
                                tailwind(
                                    'items-center flex-row justify-between mt-2 mb-6',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                Tools
                            </Text>

                            <Right
                                width={16}
                                stroke={ColorScheme.SVG.GrayFill}
                                fill={ColorScheme.SVG.GrayFill}
                            />
                        </View>
                    </PlainButton>

                    <View
                        style={[
                            tailwind(
                                'items-center flex-row justify-between mt-2',
                            ),
                        ]}>
                        <PlainButton
                            onPress={() => {
                                Linking.openSettings();
                            }}>
                            <Text
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                System Preferences
                            </Text>
                        </PlainButton>
                    </View>
                </View>

                <PlainButton
                    style={[
                        tailwind('items-center justify-center absolute'),
                        NativeBottomPadding,
                    ]}
                    onPress={() => {
                        navigation.dispatch(
                            CommonActions.navigate({name: 'About'}),
                        );
                    }}>
                    <View
                        style={[
                            tailwind('self-center p-3 px-12 rounded-md'),
                            {
                                backgroundColor:
                                    ColorScheme.Background.Inverted,
                            },
                        ]}>
                        <Text
                            style={[
                                tailwind('text-sm font-medium'),
                                {color: ColorScheme.Text.Alt},
                                Font.RobotoText,
                            ]}>
                            About
                        </Text>
                    </View>
                </PlainButton>
            </View>
        </SafeAreaView>
    );
};

export default Settings;

const styles = StyleSheet.create({});
