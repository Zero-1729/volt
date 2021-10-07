import React from 'react';

import {
    StyleSheet,
    Text,
    View,
    useColorScheme,
    TouchableOpacity,
    Linking,
} from 'react-native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import tailwind from 'tailwind-rn';

import NativeBottomPadding from '../../constants/NativeBottomPadding';

import Back from './../../assets/svg/arrow-left-24.svg';
import Right from './../../assets/svg/chevron-right-24.svg';
import Github from './../../assets/svg/mark-github-24.svg';
import Squirel from './../../assets/svg/squirrel-24.svg';
import VoltLogo from './../../assets/svg/volt-logo.svg';
import VoltText from './../../assets/svg/volt-text.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

const About = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    return (
        <SafeAreaView>
            <View
                style={[
                    tailwind('h-full justify-start items-center'),
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
                                Font.BoldText,
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Settings
                        </Text>
                    </TouchableOpacity>
                </View>

                <View
                    style={tailwind('justify-center w-full items-center mb-8')}>
                    <Text
                        style={[
                            tailwind('text-2xl mb-4 w-5/6'),
                            Font.MediumText,
                            {color: ColorScheme.Text.Default},
                        ]}>
                        About
                    </Text>

                    <View
                        style={[
                            tailwind('w-full'),
                            {height: 2},
                            {backgroundColor: ColorScheme.HeadingBar},
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
                            Font.MediumText,
                            {color: ColorScheme.Text.AltGray},
                        ]}>
                        Built with Open Source technologies
                    </Text>
                </View>

                <View style={tailwind('w-5/6')}>
                    <TouchableOpacity
                        onPress={() => {
                            navigation.navigate('Release');
                        }}>
                        <View
                            style={[
                                tailwind(
                                    'items-center flex-row justify-between mt-2 mb-4',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    Font.MediumText,
                                    {color: ColorScheme.Text.Default},
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
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            navigation.navigate('License');
                        }}>
                        <View
                            style={[
                                tailwind(
                                    'items-center flex-row justify-between mt-2',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    Font.MediumText,
                                    {color: ColorScheme.Text.Default},
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
                    </TouchableOpacity>
                </View>

                <View
                    style={[
                        tailwind('w-full absolute items-center justify-center'),
                        NativeBottomPadding,
                    ]}>
                    <TouchableOpacity
                        onPress={() => {
                            Linking.openURL(
                                'https://github.com/Zero-1729/volt/',
                            );
                        }}>
                        <View style={tailwind('flex-row items-center mb-6')}>
                            <Github
                                width={32}
                                fill={ColorScheme.SVG.Default}
                                style={tailwind('mr-2')}
                            />
                            <Text
                                style={[
                                    tailwind('text-xs'),
                                    Font.MediumText,
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                Volt Source Code
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            Linking.openURL(
                                'https://github.com/Zero-1729/volt/issues/',
                            );
                        }}>
                        <View style={tailwind('flex-row items-center')}>
                            <Squirel
                                width={32}
                                fill={ColorScheme.SVG.Default}
                                style={tailwind('mr-2')}
                            />
                            <Text
                                style={[
                                    tailwind('text-xs'),
                                    Font.MediumText,
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                Report Issue or Bug(s)
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default About;

const styles = StyleSheet.create({});
