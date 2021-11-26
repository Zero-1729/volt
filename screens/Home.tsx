import React from 'react';

import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation} from '@react-navigation/native';

import tailwind from 'tailwind-rn';

import Dots from './../assets/svg/kebab-horizontal-24.svg';
import Bell from './../assets/svg/bell-fill-24.svg';
import Add from './../assets/svg/plus-32.svg';

import Clock from './../assets/svg/clock-24.svg';

import Color from '../constants/Color';
import Font from '../constants/Font';

const Home = () => {
    const ColorScheme = Color(useColorScheme());

    const altGray = {
        backgroundColor: ColorScheme.isDarkMode ? '#2C2C2C' : '#ededed',
    };

    const DarkGrayText = {
        color: ColorScheme.isDarkMode ? '#B8B8B8' : '#656565',
    };

    const DarkGreyText = {
        color: ColorScheme.isDarkMode ? '#4b4b4b' : '#DADADA',
    };

    const svgGrayFill = ColorScheme.isDarkMode ? '#4b4b4b' : '#DADADA';

    const topPlatformOffset = {
        marginTop: Platform.OS === 'android' ? 12 : 0,
    };

    const navigation = useNavigation();

    return (
        <SafeAreaView>
            <View
                style={[
                    tailwind('h-full items-center justify-start relative'),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <View
                    style={[
                        tailwind(
                            'w-5/6 h-10 mb-3 items-center flex-row justify-between',
                        ),
                        topPlatformOffset,
                    ]}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('SettingsRoot')}>
                        <Dots
                            width={32}
                            fill={ColorScheme.SVG.Default}
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
                                fill={ColorScheme.SVG.Default}
                                style={tailwind('mr-4')}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity>
                            <Add width={30} fill={ColorScheme.SVG.Default} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[tailwind('w-5/6 justify-around h-5/6')]}>
                    <View
                        style={[
                            tailwind(
                                'h-2/5 w-full mb-16 items-center justify-between',
                            ),
                        ]}>
                        <View
                            style={tailwind(
                                'items-center mb-6 justify-around',
                            )}>
                            <Text
                                style={[
                                    tailwind('text-base mb-2'),
                                    Font.MediumText,
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                Total Balance
                            </Text>

                            <Text
                                style={[
                                    tailwind('text-3xl'),
                                    Font.MediumText,
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                -
                            </Text>
                        </View>

                        <View
                            style={tailwind(
                                'w-full h-48 relative items-center',
                            )}>
                            <View
                                style={[
                                    tailwind(
                                        'w-11/12 h-full absolute -bottom-2 rounded-md z-20 opacity-60',
                                    ),
                                    styles.DarkGrayCard,
                                ]}
                            />

                            <View
                                style={[
                                    tailwind('w-full h-48 p-6 rounded-md z-30'),
                                    altGray,
                                ]}>
                                <Text
                                    style={[
                                        tailwind(
                                            'text-lg w-full text-left mb-4',
                                        ),
                                        Font.BoldText,
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    Add new wallet
                                </Text>
                                <Text
                                    style={[
                                        tailwind(
                                            'text-xs w-full text-left mb-4',
                                        ),
                                        Font.RegularText,
                                        {color: ColorScheme.Text.DescText},
                                    ]}>
                                    Click ‘add’ button below or ‘+’ icon above
                                    to create a new wallet
                                </Text>

                                <TouchableOpacity
                                    style={tailwind('items-center flex-row')}
                                    onPress={() => {}}>
                                    <View
                                        style={[
                                            tailwind(
                                                'px-4 py-2 w-2/6 rounded-md mb-6 mt-4 items-center',
                                            ),
                                            {
                                                backgroundColor:
                                                    ColorScheme.Background
                                                        .Inverted,
                                            },
                                        ]}>
                                        <Text
                                            style={[
                                                tailwind('text-xs'),
                                                Font.BoldText,
                                                {color: ColorScheme.Text.Alt},
                                            ]}>
                                            Add
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={[tailwind('w-full h-1/2')]}>
                        <Text
                            style={[
                                tailwind('mb-4'),
                                DarkGrayText,
                                Font.MediumText,
                            ]}>
                            Latest Transactions
                        </Text>

                        <View
                            style={[
                                tailwind(
                                    'flex justify-around text-justify h-4/6 items-center justify-center',
                                ),
                            ]}>
                            <Clock
                                width={32}
                                fill={svgGrayFill}
                                style={tailwind('mb-4')}
                            />
                            <Text
                                style={[
                                    tailwind('w-3/5 text-center'),
                                    Font.MediumText,
                                    DarkGreyText,
                                ]}>
                                A list of all latest transactions will be
                                display
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Home;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    DarkGrayCard: {
        backgroundColor: '#B5B5B5',
    },
});
