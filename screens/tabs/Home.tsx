/* eslint-disable react-native/no-inline-styles */
import React, {useContext} from 'react';

import {Platform, Text, useColorScheme, View} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation, CommonActions} from '@react-navigation/native';

import {FlatList} from 'react-native-gesture-handler';

import {useTailwind} from 'tailwind-rn';

import {AppStorageContext} from '../../class/storageContext';

import Dots from '../../assets/svg/kebab-horizontal-24.svg';
import Bell from '../../assets/svg/bell-fill-24.svg';
import Add from '../../assets/svg/plus-32.svg';

import Clock from '../../assets/svg/clock-24.svg';

import Color from '../../constants/Color';
import Font from '../../constants/Font';

import {PlainButton} from '../../components/button';
import {EmptyCard, WalletCard} from '../../components/card';

import {normalizeFiat} from '../../modules/transform';

import {BaseWallet} from '../../class/wallet/base';

const Home = () => {
    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const navigation = useNavigation();

    const {isWalletInitialized, wallets, hideTotalBalance, appFiatCurrency} =
        useContext(AppStorageContext);

    // add the total balances of the wallets
    const totalBalance = wallets.reduce(
        (accumulator: number, currentValue: BaseWallet) =>
            accumulator + currentValue.balance,
        0,
    );

    const fiatUSDRate = 23_000;

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

    const renderCard = ({item}: {item: BaseWallet}) => {
        return (
            <View style={[tailwind('w-full absolute -top-24')]}>
                <WalletCard
                    isWatchOnly={item.isWatchOnly}
                    label={item.name}
                    walletBalance={item.balance}
                    walletType={item.type}
                    hideBalance={hideTotalBalance}
                    unit={item.units}
                    navCallback={() => {
                        navigation.dispatch(
                            CommonActions.navigate('WalletRoot', {
                                screen: 'WalletView',
                            }),
                        );
                    }}
                />
            </View>
        );
    };

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
                            'w-5/6 h-10 items-center flex-row justify-between',
                        ),
                        topPlatformOffset,
                    ]}>
                    <PlainButton
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

                    {isWalletInitialized ? (
                        <View
                            style={tailwind(
                                'flex-row justify-between items-center -mr-1',
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
                                <Add
                                    width={30}
                                    fill={ColorScheme.SVG.Default}
                                />
                            </PlainButton>
                        </View>
                    ) : (
                        <></>
                    )}
                </View>

                <View style={[tailwind('w-5/6 h-full justify-around')]}>
                    <View
                        style={[
                            tailwind(
                                `w-full items-center justify-between ${
                                    !isWalletInitialized ? 'mb-4' : ''
                                }`,
                            ),
                        ]}>
                        <View
                            style={tailwind('justify-around w-full mt-2 mb-4')}>
                            {isWalletInitialized ? (
                                <>
                                    <Text
                                        style={[
                                            tailwind(
                                                'text-base font-medium mb-1',
                                            ),
                                            {color: ColorScheme.Text.Default},
                                            Font.RobotoText,
                                        ]}>
                                        Total Balance
                                    </Text>

                                    {!hideTotalBalance ? (
                                        <Text
                                            style={[
                                                tailwind(
                                                    'text-3xl font-medium',
                                                ),
                                                {
                                                    color: ColorScheme.Text
                                                        .Default,
                                                },
                                                Font.RobotoText,
                                            ]}>
                                            {`${
                                                appFiatCurrency.symbol
                                            } ${normalizeFiat(
                                                totalBalance,
                                                fiatUSDRate,
                                            )}`}
                                        </Text>
                                    ) : (
                                        <View
                                            style={[
                                                tailwind(
                                                    'rounded-sm w-5/6 mt-1 opacity-80 h-8 flex-row items-center',
                                                ),
                                                {
                                                    backgroundColor:
                                                        ColorScheme.Background
                                                            .Greyed,
                                                },
                                            ]}
                                        />
                                    )}
                                </>
                            ) : (
                                <></>
                            )}
                        </View>

                        {/** Create a vertical scroll carousel for 'BaseCard */}
                        {isWalletInitialized ? (
                            <FlatList
                                style={[tailwind('w-full h-48')]}
                                data={wallets}
                                renderItem={renderCard}
                                keyExtractor={item => item.id}
                                initialNumToRender={10}
                                contentContainerStyle={[
                                    tailwind('flex justify-center'),
                                    {flex: 1},
                                ]}
                                contentInsetAdjustmentBehavior="automatic"
                                inverted
                                showsVerticalScrollIndicator
                            />
                        ) : (
                            <EmptyCard />
                        )}
                    </View>

                    <View
                        style={[
                            tailwind(
                                `w-full ${
                                    isWalletInitialized ? 'h-3/5' : 'h-4/6'
                                } mt-4`,
                            ),
                        ]}>
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
