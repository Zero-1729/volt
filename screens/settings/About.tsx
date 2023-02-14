/* eslint-disable react-native/no-inline-styles */
import React from 'react';

import {StyleSheet, Text, View, useColorScheme, Linking} from 'react-native';

import {CommonActions} from '@react-navigation/native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import RNHapticFeedback from 'react-native-haptic-feedback';

import {useTailwind} from 'tailwind-rn';

import {PlainButton} from '../../components/button';

import NativeBottomPadding from '../../constants/NativeWindowMetrics';

import Back from './../../assets/svg/arrow-left-24.svg';
import Right from './../../assets/svg/chevron-right-24.svg';
import Github from './../../assets/svg/mark-github-24.svg';
import Squirrel from './../../assets/svg/squirrel-24.svg';
import VoltLogo from './../../assets/svg/volt-logo.svg';
import VoltText from './../../assets/svg/volt-text.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

const About = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const RNHapticFeedbackOptions = {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
    };

    return (
        <SafeAreaView>
            <View
                style={[
                    tailwind('h-full justify-start items-center'),
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
                                tailwind('text-sm font-bold'),
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            Settings
                        </Text>
                    </PlainButton>
                </View>

                <View
                    style={tailwind('justify-center w-full items-center mb-8')}>
                    <Text
                        style={[
                            tailwind('text-2xl mb-4 w-5/6 font-medium'),
                            {color: ColorScheme.Text.Default},
                            Font.RobotoText,
                        ]}>
                        About
                    </Text>

                    <View
                        style={[
                            tailwind('w-full'),
                            {
                                height: 2,
                                backgroundColor: ColorScheme.HeadingBar,
                            },
                        ]}
                    />
                </View>

                <View style={[tailwind('w-full mb-10')]}>
                    <View
                        style={[
                            tailwind(
                                'flex-row items-center justify-center mb-4',
                            ),
                        ]}>
                        <VoltLogo
                            width={72}
                            height={72}
                            style={[tailwind('mr-3')]}
                        />
                        <VoltText width={98} fill={ColorScheme.SVG.Default} />
                    </View>

                    <Text
                        style={[
                            tailwind('w-3/6 text-sm self-center text-center'),
                            {color: ColorScheme.Text.AltGray},
                            Font.RobotoText,
                        ]}>
                        Built with Open Source technologies
                    </Text>
                </View>

                <View style={tailwind('w-5/6')}>
                    <PlainButton
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate({name: 'Release'}),
                            );
                        }}>
                        <View
                            style={[
                                tailwind(
                                    'items-center flex-row justify-between mt-2 mb-4',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                Release Notes
                            </Text>

                            <Right
                                width={16}
                                stroke={ColorScheme.SVG.GrayFill}
                                fill={ColorScheme.SVG.GrayFill}
                                style={[]}
                            />
                        </View>
                    </PlainButton>

                    <PlainButton
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate({name: 'License'}),
                            );
                        }}>
                        <View
                            style={[
                                tailwind(
                                    'items-center flex-row justify-between mt-2',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                License
                            </Text>

                            <Right
                                width={16}
                                stroke={ColorScheme.SVG.GrayFill}
                                fill={ColorScheme.SVG.GrayFill}
                                style={[]}
                            />
                        </View>
                    </PlainButton>
                </View>

                <View
                    style={[
                        tailwind('w-full absolute items-center justify-center'),
                        NativeBottomPadding,
                    ]}>
                    <PlainButton
                        onPress={() => {
                            RNHapticFeedback.trigger(
                                'impactLight',
                                RNHapticFeedbackOptions,
                            );

                            Linking.openURL(
                                'https://github.com/Zero-1729/volt/',
                            );
                        }}>
                        <View style={tailwind('flex-row items-center mb-8')}>
                            <Github
                                width={32}
                                fill={ColorScheme.SVG.Default}
                                style={tailwind('mr-2')}
                            />
                            <Text
                                style={[
                                    tailwind('text-xs font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                Volt Source Code
                            </Text>
                        </View>
                    </PlainButton>

                    <PlainButton
                        onPress={() => {
                            RNHapticFeedback.trigger(
                                'impactLight',
                                RNHapticFeedbackOptions,
                            );

                            Linking.openURL(
                                'https://github.com/Zero-1729/volt/issues/',
                            );
                        }}>
                        <View style={tailwind('flex-row items-center')}>
                            <Squirrel
                                width={32}
                                fill={ColorScheme.SVG.Default}
                                style={tailwind('mr-2')}
                            />
                            <Text
                                style={[
                                    tailwind('text-xs font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                Report Issue or Bug(s)
                            </Text>
                        </View>
                    </PlainButton>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default About;
