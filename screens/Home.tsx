import React from 'react';

import {Platform, StyleSheet, Text, useColorScheme, View} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation, CommonActions} from '@react-navigation/native';

import tailwind from 'tailwind-rn';

import Dots from './../assets/svg/kebab-horizontal-24.svg';
import Bell from './../assets/svg/bell-fill-24.svg';
import Add from './../assets/svg/plus-32.svg';

import Clock from './../assets/svg/clock-24.svg';

import Color from '../constants/Color';
import Font from '../constants/Font';

import {PlainButton} from '../components/button';
import {EmptyCard, WalletCard} from '../components/card';

import {BaseWalletType} from '../types/wallet';

const Home = () => {
    const ColorScheme = Color(useColorScheme());

    const isWalletInit = false; // Should be from async store

    // List of created wallets from async store
    const wallets: Array<BaseWalletType> = [
        {
            name: 'Dummy Wallet',
            balance: 2600043,
            UTXOs: [],
            isWatchOnly: true,
            descriptor: '',
            type: 'Segwit (native-bech32)',
            address: 'bc1q9x30z7rz52c97jwc2j79w76y7l3ny54nlvd4ew',
            birthday: new Date(),
        },
    ];

    const defaultWallet = wallets[0];

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
                            'w-5/6 h-12 mb-3 items-center flex-row justify-between',
                        ),
                        topPlatformOffset,
                    ]}>
                    <PlainButton
                        style={[tailwind('z-50')]}
                        onPress={() =>
                            navigation.dispatch(
                                CommonActions.navigate({name: 'SettingsRoot'}),
                            )
                        }>
                        <Dots
                            width={32}
                            fill={ColorScheme.SVG.Default}
                            style={tailwind('-ml-1')}
                        />
                    </PlainButton>

                    <View
                        style={tailwind(
                            'flex items-center z-0 left-0 right-0 absolute justify-center',
                        )}>
                        <Text
                            style={[
                                tailwind('text-base font-medium'),
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            Total Balance
                        </Text>
                    </View>

                    <View
                        style={tailwind(
                            'flex-row justify-between items-center z-50 -mr-1',
                        )}>
                        <PlainButton>
                            <Bell
                                width={22}
                                fill={ColorScheme.SVG.Default}
                                style={tailwind('mr-4')}
                            />
                        </PlainButton>
                        <PlainButton
                            onPress={() =>
                                navigation.dispatch(
                                    CommonActions.navigate({
                                        name: 'WalletRoot',
                                    }),
                                )
                            }>
                            <Add width={30} fill={ColorScheme.SVG.Default} />
                        </PlainButton>
                    </View>
                </View>

                <View style={[tailwind('w-5/6 justify-around h-5/6')]}>
                    <View
                        style={[
                            tailwind(
                                'h-2/5 w-full mb-16 items-center justify-between',
                            ),
                        ]}>
                        <Text
                            style={[
                                tailwind('text-3xl font-medium'),
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            <View style={[tailwind('font-bold')]} />-
                        </Text>

                        {/** Create a vertical scroll carousel for 'BaseCard */}
                        {isWalletInit ? (
                            <WalletCard
                                isWatchOnly={defaultWallet.isWatchOnly}
                                label={defaultWallet.name}
                                walletBalance={defaultWallet.balance}
                                walletType={defaultWallet.type}
                            />
                        ) : (
                            <EmptyCard />
                        )}
                    </View>

                    <View style={[tailwind('w-full h-1/2')]}>
                        <Text
                            style={[
                                tailwind('mb-4 font-medium'),
                                DarkGrayText,
                                Font.RobotoText,
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
                                    DarkGreyText,
                                    Font.RobotoText,
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

const styles = StyleSheet.create({});
