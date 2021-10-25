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

    return (
        <SafeAreaView>
            <View
                style={[
                    tailwind('w-full h-full items-center'),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <View style={tailwind('w-5/6 mt-4 mb-16')}>
                    <TouchableOpacity
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
                                tailwind('text-sm'),
                                {color: ColorScheme.Text.Default},
                                Font.BoldText,
                            ]}>
                            Back
                        </Text>
                    </TouchableOpacity>
                </View>

                <View
                    style={tailwind('justify-center w-full items-center mb-6')}>
                    <Text
                        style={[
                            tailwind('text-2xl mb-4 w-5/6'),
                            Font.MediumText,
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Settings
                    </Text>

                    <View style={[tailwind('w-full'), HeadingBar]} />
                </View>

                <View style={[tailwind('w-5/6')]}>
                    <TouchableOpacity
                        onPress={() => {
                            navigation.navigate('Currency');
                        }}>
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
                                    {color: ColorScheme.Text.Default},
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
                                        {
                                            color: ColorScheme.Text.GrayedText,
                                        },
                                    ]}>
                                    USD
                                </Text>
                                <Right
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
                                    style={[]}
                                />
                            </View>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            navigation.navigate('Language');
                        }}>
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
                                    {color: ColorScheme.Text.Default},
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
                                        {
                                            color: ColorScheme.Text.GrayedText,
                                        },
                                    ]}>
                                    English
                                </Text>
                                <Right
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
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
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                Wallet
                            </Text>

                            <Right
                                width={16}
                                stroke={ColorScheme.SVG.GrayFill}
                                fill={ColorScheme.SVG.GrayFill}
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
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                Security
                            </Text>

                            <Right
                                width={16}
                                stroke={ColorScheme.SVG.GrayFill}
                                fill={ColorScheme.SVG.GrayFill}
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
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                Network
                            </Text>

                            <Right
                                width={16}
                                stroke={ColorScheme.SVG.GrayFill}
                                fill={ColorScheme.SVG.GrayFill}
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
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                Tools
                            </Text>

                            <Right
                                width={16}
                                stroke={ColorScheme.SVG.GrayFill}
                                fill={ColorScheme.SVG.GrayFill}
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
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                System Preferences
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={[
                        tailwind('items-center justify-center absolute'),
                        NativeBottomPadding,
                    ]}
                    onPress={() => {
                        navigation.navigate('About');
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
                                tailwind('text-sm'),
                                Font.MediumText,
                                {color: ColorScheme.Text.Alt},
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
