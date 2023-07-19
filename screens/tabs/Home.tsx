/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useContext, useEffect, useState, useCallback} from 'react';

import {Platform, Text, useColorScheme, View, FlatList} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation, CommonActions} from '@react-navigation/native';

import BigNumber from 'bignumber.js';

import {useTailwind} from 'tailwind-rn';

import {AppStorageContext} from '../../class/storageContext';

import {getWalletBalance} from '../../modules/bdk';

import Dots from '../../assets/svg/kebab-horizontal-24.svg';
import Add from '../../assets/svg/plus-32.svg';

import Box from '../../assets/svg/inbox-24.svg';

import Color from '../../constants/Color';
import Font from '../../constants/Font';

import {PlainButton} from '../../components/button';
import {EmptyCard, WalletCard} from '../../components/card';
import {TransactionListItem} from '../../components/transaction';

import {BaseWallet} from '../../class/wallet/base';
import {BalanceType, TransactionType} from '../../types/wallet';

import NetInfo from '@react-native-community/netinfo';

import {FiatBalance} from '../../components/balance';

import {fetchFiatRate} from '../../modules/currency';
import {liberalAlert} from '../../components/alert';

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
        marginTop: 6 + (Platform.OS === 'android' ? 12 : 0),
    };

    const navigation = useNavigation();

    const {
        wallets,
        hideTotalBalance,
        appFiatCurrency,
        currentWalletID,
        setCurrentWalletID,
        getWalletData,
        setNetworkState,
        networkState,
        fiatRate,
        updateFiatRate,
        updateWalletTransactions,
        updateWalletBalance,
        isWalletInitialized,
        electrumServerURL,
    } = useContext(AppStorageContext);

    const [initFiatRate, setInitFiatRate] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingBalance, setLoadingBalance] = useState(false);

    // Set current wallet data
    const wallet = getWalletData(currentWalletID);

    // Subscribe
    NetInfo.addEventListener(state => {
        // Limit updates to when connection drops or re-established
        // or initial load
        if (state.isConnected !== networkState?.isConnected || !networkState) {
            setNetworkState(state);
        }
    });

    // add the total balances of the wallets
    const totalBalance: BalanceType = wallets.reduce(
        (accumulator: BalanceType, currentValue: BaseWallet) =>
            accumulator.plus(currentValue.balance),
        new BigNumber(0),
    );

    // List out all transactions across all wallets
    const extractAllTransactions = (): TransactionType[] => {
        let transactions: TransactionType[] = [];

        for (const w of wallets) {
            transactions = transactions.concat(w.transactions);
        }

        return transactions;
    };

    // Fiat fetch
    const singleSyncFiatRate = useCallback(
        async (ticker: string, violate: boolean = false) => {
            // Only proceed if initial load or if user select new currency in settings
            if (!initFiatRate || violate) {
                try {
                    await fetchFiatRate(
                        ticker,
                        fiatRate,
                        (rate: BalanceType) => {
                            updateFiatRate({
                                ...fiatRate,
                                rate: rate,
                                lastUpdated: new Date(),
                            });
                        },
                        violate,
                    );
                } catch (e) {
                    // Report network error
                    liberalAlert('Network', `${e.message}`, 'OK');

                    // Kill loading
                    setLoadingBalance(false);
                }

                // Kill loading
                setLoadingBalance(false);
            }
        },
        [],
    );

    // Refresh control
    const refreshWallet = useCallback(async () => {
        // Abort load if no wallets yet
        if (!isWalletInitialized) {
            return;
        }

        // Only attempt load if connected to network
        if (!networkState?.isConnected) {
            setRefreshing(false);
            return;
        }

        // start loading
        setLoadingBalance(true);

        // Set refreshing
        setRefreshing(true);

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
            },
        );

        if (!triggered) {
            console.info('[Fiat Rate] Did not fetch fiat rate');
        }

        // Check net again, just in case there is a drop mid execution
        if (!networkState?.isConnected) {
            setRefreshing(false);
            return;
        }

        // Sync wallet
        const {transactions, balance} = await getWalletBalance(
            wallet,
            electrumServerURL,
        );

        // Kill refreshing
        setRefreshing(false);

        // Update wallet balance
        updateWalletBalance(currentWalletID, balance);

        // Update wallet transactions
        updateWalletTransactions(currentWalletID, transactions);

        // Kill loading
        setLoadingBalance(false);
    }, [
        setRefreshing,
        fiatRate,
        appFiatCurrency,
        updateFiatRate,
        networkState?.isConnected,
    ]);

    // Fetch the fiat rate on currency change
    useEffect(() => {
        // Avoid fiat rate update call when offline
        // or when newly loaded screen to avoid dup call
        if (!networkState?.isConnected || !initFiatRate) {
            return;
        }

        // Only call on each change to fiat currency in settings
        setLoadingBalance(true);
        singleSyncFiatRate(appFiatCurrency.short, true);
    }, [appFiatCurrency]);

    // Fetch the fiat rate on initial load
    useEffect(() => {
        // Only attempt update when initial fiat rate update call
        // and wallets exists
        if (!initFiatRate && wallets.length > 0) {
            // Avoid fiat rate update call when offline
            if (!networkState?.isConnected) {
                return;
            }

            // Begin loading
            setLoadingBalance(true);

            // Single shot call to update fiat rate
            singleSyncFiatRate(appFiatCurrency.short);

            // Kill initial load lock
            setInitFiatRate(true);
        }
    });

    const renderCard = ({item}: {item: BaseWallet}) => {
        return (
            <View style={[tailwind('w-full absolute -top-24')]}>
                <WalletCard
                    id={item.id}
                    isWatchOnly={item.isWatchOnly}
                    label={item.name}
                    walletBalance={item.balance}
                    walletType={item.type}
                    loading={loadingBalance}
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

                    {wallets.length > 0 ? (
                        <View
                            style={tailwind(
                                'flex-row justify-between items-center -mr-1',
                            )}>
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

                <View style={[tailwind('w-full h-full justify-around mt-2')]}>
                    <View
                        style={[
                            tailwind(
                                `w-5/6 self-center items-center justify-between ${
                                    !(wallets.length > 0) ? 'mb-4' : ''
                                }`,
                            ),
                        ]}>
                        <View
                            style={tailwind('justify-around w-full mt-2 mb-4')}>
                            {wallets.length > 0 ? (
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
                                        <FiatBalance
                                            balance={totalBalance}
                                            loading={loadingBalance}
                                            BalanceFontSize={'text-3xl'}
                                            fontColor={ColorScheme.Text.Default}
                                        />
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
                        {wallets.length > 0 ? (
                            <FlatList
                                style={[tailwind('w-full h-48 mb-4')]}
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
                                    wallets.length > 0 ? 'h-3/5' : 'h-4/6'
                                } mt-4`,
                            ),
                        ]}>
                        <Text
                            style={[
                                tailwind('w-5/6 mb-2 font-medium self-center'),
                                DarkGrayText,
                                Font.RobotoText,
                            ]}>
                            Latest Transactions
                        </Text>

                        <View
                            style={[
                                tailwind('w-full h-full items-center pb-16'),
                            ]}>
                            <FlatList
                                refreshing={refreshing}
                                onRefresh={refreshWallet}
                                scrollEnabled={true}
                                style={tailwind('w-full')}
                                contentContainerStyle={[
                                    tailwind(
                                        `${
                                            extractAllTransactions().length > 0
                                                ? 'w-11/12 self-center'
                                                : 'w-full h-full'
                                        } items-center`,
                                    ),
                                ]}
                                data={extractAllTransactions()}
                                renderItem={item => (
                                    <TransactionListItem tx={item.item} />
                                )}
                                keyExtractor={item => item.txid}
                                initialNumToRender={25}
                                contentInsetAdjustmentBehavior="automatic"
                                ListEmptyComponent={
                                    <View
                                        style={[
                                            tailwind(
                                                'w-5/6 h-5/6 items-center justify-center -mt-12',
                                            ),
                                        ]}>
                                        <Box
                                            width={32}
                                            fill={svgGrayFill}
                                            style={tailwind('mb-4')}
                                        />
                                        <Text
                                            style={[
                                                tailwind('w-5/6 text-center'),
                                                DarkGreyText,
                                                Font.RobotoText,
                                            ]}>
                                            A list of all latest transactions
                                            will be displayed here
                                        </Text>
                                    </View>
                                }
                            />
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Home;
