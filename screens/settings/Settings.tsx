import React, {useContext} from 'react';

import {StyleSheet, Text, View, useColorScheme, Linking} from 'react-native';

import {CommonActions} from '@react-navigation/native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import {AppStorageContext} from '../../class/storageContext';

import tailwind from 'tailwind-rn';

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

    const {
        appLanguage,
        appFiatCurrency,
        resetAppData,
        isDevMode,
        IsWalletInitialized,
    } = useContext(AppStorageContext);

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
                                        'flex-row justify-between items-center',
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind('text-xs mr-2'),
                                        {color: ColorScheme.Text.GrayedText},
                                    ]}>
                                    {`${appFiatCurrency.short} (${appFiatCurrency.symbol})`}
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
                                        'flex-row justify-between items-center',
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind('text-xs mr-2'),
                                        {color: ColorScheme.Text.GrayedText},
                                    ]}>
                                    {appLanguage.name}
                                </Text>
                                <Right
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
                                />
                            </View>
                        </View>
                    </PlainButton>

                    <PlainButton
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate({name: 'Security'}),
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
                                Security
                            </Text>

                            <Right
                                width={16}
                                stroke={ColorScheme.SVG.GrayFill}
                                fill={ColorScheme.SVG.GrayFill}
                            />
                        </View>
                    </PlainButton>

                    <PlainButton
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate({name: 'Network'}),
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
                                Network
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
                                'items-center flex-row justify-between mt-4',
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

                {isDevMode ? (
                    <PlainButton
                        disabled={!IsWalletInitialized}
                        onPress={() => {
                            if (IsWalletInitialized) {
                                resetAppData();
                            }
                        }}
                        style={[tailwind('absolute bottom-20 items-center')]}>
                        <Text
                            style={[
                                tailwind(
                                    `text-sm w-full font-bold ${
                                        !IsWalletInitialized ? 'opacity-20' : ''
                                    } text-red-600`,
                                ),
                            ]}>
                            Reset Data
                        </Text>
                    </PlainButton>
                ) : (
                    <></>
                )}

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
