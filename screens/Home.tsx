import React from 'react';

import Dots from './../assets/svg/kebab-horizontal-24.svg';
import Bell from './../assets/svg/bell-fill-24.svg';
import Add from './../assets/svg/plus-32.svg';

import Clock from './../assets/svg/clock-24.svg';

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

const Home = () => {
    const isDarkMode = useColorScheme() === 'dark';

    const altGray = {
        backgroundColor: isDarkMode ? '#2C2C2C' : '#ededed',
    };

    const DarkText = {
        color: isDarkMode ? 'white' : 'black',
    };

    const DarkGrayText = {
        color: isDarkMode ? '#B8B8B8' : '#656565',
    };

    const DarkGreyText = {
        color: isDarkMode ? '#4b4b4b' : '#DADADA',
    };

    const svgGrayFill = isDarkMode ? '#4b4b4b' : '#DADADA';

    const DarkBackground = {
        backgroundColor: isDarkMode ? 'black' : 'white',
    };

    const DarkGrayCard = {
        backgroundColor: '#B5B5B5',
    };

    const DarkDescText = {
        color: isDarkMode ? '#828282' : '#606060',
    };

    const svgFill = isDarkMode ? 'white' : 'black';

    const bgFill = {
        backgroundColor: isDarkMode ? 'white' : 'black',
    };

    const AltDarkText = {
        color: isDarkMode ? 'black' : 'white',
    };

    const topPlatformOffset = {
        marginTop: Platform.OS === 'android' ? 12 : 0,
    };

    const navigation = useNavigation();

    return (
        <SafeAreaView style={DarkBackground}>
            <View
                style={[
                    tailwind('h-full items-center justify-start relative'),
                    DarkBackground,
                ]}>
                <View
                    style={[
                        tailwind(
                            'w-5/6 h-10 mb-3 items-center flex-row justify-between',
                        ),
                        topPlatformOffset,
                    ]}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Settings')}>
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
                                    DarkText,
                                    styles.MediumText,
                                ]}>
                                Total Balance
                            </Text>

                            <Text
                                style={[
                                    tailwind('text-3xl'),
                                    styles.MediumText,
                                    DarkText,
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
                                    DarkGrayCard,
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
                                        DarkText,
                                        styles.BoldText,
                                    ]}>
                                    Add new wallet
                                </Text>
                                <Text
                                    style={[
                                        tailwind(
                                            'text-xs w-full text-left mb-4',
                                        ),
                                        DarkDescText,
                                        styles.RegularText,
                                    ]}>
                                    Click ‘add’ button below or ‘+’ icon above
                                    to create a new wallet
                                </Text>

                                <View
                                    style={[
                                        tailwind(
                                            'px-4 py-2 w-2/6 rounded-md mb-6 mt-4 items-center',
                                        ),
                                        bgFill,
                                    ]}>
                                    <TouchableOpacity
                                        style={tailwind(
                                            'items-center flex-row',
                                        )}>
                                        <Text
                                            style={[
                                                tailwind('text-xs'),
                                                AltDarkText,
                                                styles.BoldText,
                                            ]}>
                                            Add
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={[tailwind('w-full h-1/2')]}>
                        <Text
                            style={[
                                tailwind('mb-4'),
                                DarkGrayText,
                                styles.MediumText,
                            ]}>
                            Latest Transactions
                        </Text>

                        <View
                            style={[
                                tailwind(
                                    'flex justify-around text-justify h-5/6 items-center justify-center',
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
                                    styles.MediumText,
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

export default Home;
