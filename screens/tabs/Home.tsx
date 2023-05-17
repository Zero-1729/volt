/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useContext, useEffect, useState, useCallback} from 'react';

import {Platform, Text, useColorScheme, View, FlatList} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation, CommonActions} from '@react-navigation/native';

import BigNumber from 'bignumber.js';

import {useTailwind} from 'tailwind-rn';

import {AppStorageContext} from '../../class/storageContext';

import Dots from '../../assets/svg/kebab-horizontal-24.svg';
import Bell from '../../assets/svg/bell-fill-24.svg';
import Add from '../../assets/svg/plus-32.svg';

import Box from '../../assets/svg/inbox-24.svg';

import Color from '../../constants/Color';
import Font from '../../constants/Font';

import {PlainButton} from '../../components/button';
import {EmptyCard, WalletCard} from '../../components/card';
import {TransactionListItem} from '../../components/transaction';

import {normalizeFiat} from '../../modules/transform';

import {BaseWallet} from '../../class/wallet/base';
import {BalanceType, TransactionType} from '../../types/wallet';

import NetInfo from '@react-native-community/netinfo';

import {fetchFiatRate} from '../../modules/currency';

const Home = () => {
    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

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

    const {
        isWalletInitialized,
        wallets,
        hideTotalBalance,
        appFiatCurrency,
        setCurrentWalletID,
        setNetworkState,
        networkState,
        fiatRate,
        updateFiatRate,
    } = useContext(AppStorageContext);

    const [initFiatRate, setInitFiatRate] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Subscribe
    NetInfo.addEventListener(state => {
        // Limit updates to when connection drops or re-established
        // or initial load
        if (state.isConnected !== networkState?.isConnected || !networkState) {
            setNetworkState(state);
        }
    });

    // Get all transactions across wallets
    const txs: TransactionType[] = [];

    // iterate over all wallets and push transactions to txs
    wallets.forEach((wallet: BaseWallet) => {
        wallet.transactions.forEach(tx => {
            txs.push(tx);
        });
    });

    // add the total balances of the wallets
    const totalBalance: BalanceType = wallets.reduce(
        (accumulator: BalanceType, currentValue: BaseWallet) =>
            accumulator.plus(currentValue.balance),
        new BigNumber(0),
    );

    // Refresh control
    const onRefresh = useCallback(async () => {
        // Set refreshing
        setRefreshing(true);

        // Only attempt load if connected to network
        if (!networkState?.isConnected) {
            setRefreshing(false);
            return;
        }

        const triggered = await fetchFiatRate(
            appFiatCurrency.short,
            fiatRate,
            (rate: BalanceType) => {
                // Then fetch fiat rate
                updateFiatRate({
                    ...fiatRate,
                    rate: rate,
                    lastUpdated: new Date(),
                });

                // Kill loading
                setRefreshing(false);
            },
        );

        // Kill loading if fiat rate fetch not triggered
        if (!triggered) {
            setRefreshing(false);
            // setLoadingBalance(false);
        }
    }, [
        setRefreshing,
        fiatRate,
        appFiatCurrency,
        updateFiatRate,
        networkState?.isConnected,
    ]);

    // Fetch the fiat rate on initial load
    useEffect(() => {
        // Avoid fiat rate update call when offline
        if (!networkState?.isConnected) {
            return;
        }

        if (!initFiatRate) {
            fetchFiatRate(
                appFiatCurrency.short,
                fiatRate,
                (rate: BalanceType) => {
                    updateFiatRate({
                        ...fiatRate,
                        rate: rate,
                        lastUpdated: new Date(),
                    });
                },
            );
            setInitFiatRate(true);
        }
    });

    // Fetch the fiat rate on currency change
    useEffect(() => {
        // Avoid fiat rate update call when offline
        if (!networkState?.isConnected) {
            return;
        }

        fetchFiatRate(
            appFiatCurrency.short,
            fiatRate,
            (rate: BalanceType) => {
                updateFiatRate({
                    ...fiatRate,
                    rate: rate,
                    lastUpdated: new Date(),
                });
            },
            true,
        );
    }, [appFiatCurrency]);

    const renderCard = ({item}: {item: BaseWallet}) => {
        return (
            <View style={[tailwind('w-full absolute -top-24')]}>
                <WalletCard
                    id={item.id}
                    isWatchOnly={item.isWatchOnly}
                    label={item.name}
                    walletBalance={item.balance}
                    walletType={item.type}
                    hideBalance={hideTotalBalance}
                    unit={item.units}
                    navCallback={() => {
                        // Set the current wallet ID
                        setCurrentWalletID(item.id);

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
                                        CommonActions.navigate('AddWalletRoot'),
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
                                                fiatRate.rate,
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

                        {txs.length === 0 ? (
                            <View
                                style={[
                                    tailwind(
                                        'flex justify-around text-justify h-4/6 items-center justify-center',
                                    ),
                                ]}>
                                <Box
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
                                    displayed here
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                scrollEnabled={true}
                                style={tailwind('w-full mb-12')}
                                data={txs}
                                renderItem={item => (
                                    <TransactionListItem
                                        fiatRate={fiatRate}
                                        tx={item.item}
                                    />
                                )}
                                keyExtractor={item => item.txid}
                                initialNumToRender={25}
                                contentInsetAdjustmentBehavior="automatic"
                            />
                        )}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Home;
