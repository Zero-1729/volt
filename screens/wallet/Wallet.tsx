/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
    useColorScheme,
    View,
    Text,
    StatusBar,
    StyleSheet,
    VirtualizedList,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, CommonActions} from '@react-navigation/native';

import VText from '../../components/text';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

import BigNumber from 'bignumber.js';

import netInfo, {useNetInfo} from '@react-native-community/netinfo';

import {useTranslation} from 'react-i18next';

import Color from '../../constants/Color';

import Dots from '../../assets/svg/kebab-horizontal-24.svg';
import Box from '../../assets/svg/inbox-24.svg';
import HomeIcon from '../../assets/svg/home-fill-24.svg';

import {
    getMiniWallet,
    checkNetworkIsReachable,
} from '../../modules/wallet-utils';

import {PlainButton} from '../../components/button';

import {AppStorageContext} from '../../class/storageContext';

import {Balance} from '../../components/balance';

import {UnifiedTransactionListItem} from '../../components/transaction';

import {
    TBalance,
    TTransaction,
    TRateResponse,
    TRateObject,
} from '../../types/wallet';

import {capitalizeFirst} from '../../modules/transform';

import {fetchFiatRate} from '../../modules/currency';
import {TRate} from '../../types/settings';

import {Toasts} from '@backpackapp-io/react-native-toast';
import {LiberalToast} from '../../components/toast';
import NativeWindowMetrics from '../../constants/NativeWindowMetrics';
import { SdkEvent, SdkEvent_Tags } from '@breeztech/breez-sdk-spark-react-native';
import { useWallet } from '../../contexts/walletContext';

type Props = NativeStackScreenProps<WalletParamList, 'WalletView'>;

const Wallet = ({route}: Props) => {
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const networkState = useNetInfo();
    const isNetOn = checkNetworkIsReachable(networkState);

    // Get current wallet ID and wallet data
    const {
        setLoadLock,
        currentWalletID,
        getWalletData,
        updateWalletBalance,
        updateWalletPayments,
        hideTotalBalance,
        isAdvancedMode,
        appFiatCurrency,
        updateFiatRate,
        fiatRate,
        setCachedRates,
        rates,
        setAppFiatCurrency,
    } = useContext(AppStorageContext);

    // For loading effect on balance
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Breez wallet
    const _wallet = useWallet();
    // Get current wallet data
    const walletData = getWalletData(currentWalletID);

    // Get card color from wallet type
    const CardColor =
        ColorScheme.WalletColors[walletData.type][walletData.network];
    const CardAccent = ColorScheme.WalletColors[walletData.type].accent;

    const walletName = walletData.name;
    // TODO: handle BDK wallet

    const walletTxs =
        walletData.type === 'unified'
            ? [...walletData.transactions, ...walletData?.payments]
            : walletData.transactions;
    const walletBalance =
        walletData.type !== 'unified'
            ? walletData.balance.onchain
            : walletData.balance.onchain.plus(walletData.balance.lightning);
    const isLNWallet = walletData.type === 'unified';

    const getBalance = async () => {
        try {
            const nodeInfo = await _wallet.walletInfo();
            const balanceLn = Number(nodeInfo?.balanceSats);

            // Update balance after converting to sats
            updateWalletBalance(currentWalletID, {
                onchain: new BigNumber(0),
                lightning: new BigNumber(balanceLn),
            });
        } catch (error: any) {
            if (process.env.NODE_ENV === 'development' && isAdvancedMode) {
                LiberalToast(t('Breez SDK'), error.message, {
                    duration: 2000,
                });
            }

            return;
        }
    };

    const fetchPayments = async () => {
        try {
            const txs = await _wallet.listPayments();

            // Update transactions
            updateWalletPayments(currentWalletID, txs);
        } catch (error: any) {
            if (process.env.NODE_ENV === 'development' && isAdvancedMode) {
                LiberalToast(t('Breez SDK'), error.message, {
                    duration: 2000,
                });
            }

            return;
        }
    };

    const jointSync = async () => {
        // Avoid duplicate loading and
        if (refreshing || loadingBalance) {
            return;
        }

        const _netInfo = await netInfo.fetch();
        if (!checkNetworkIsReachable(_netInfo)) {
            return;
        }

        // Lock load to avoid deleting wallet while loading
        setLoadLock(true);

        // Set refreshing
        setRefreshing(true);
        setLoadingBalance(true);

        // Get Fiat rate
        fetchAndUpdateFiatRate();

        // Call Breez if LN wallet
        if (isLNWallet) {
            await getBalance();
            await fetchPayments();
        }

        // TODO: fetch onchain
        // Kill loading
        setRefreshing(false);
        setLoadingBalance(false);
    };

    const navigateScanScreen = () => {
        const miniwallet = getMiniWallet(walletData);

        navigation.dispatch(
            CommonActions.navigate('ScanRoot', {
                screen: 'Scan',
                params: {
                    screen: 'send',
                    wallet: miniwallet,
                },
            }),
        );
    };

    const fetchAndUpdateFiatRate = useCallback(async () => {
        let response: TRateResponse;

        // Check Internet connection
        // Only fetch if online
        const _netInfo = await netInfo.fetch();
        if (
            checkNetworkIsReachable(_netInfo) ||
            checkNetworkIsReachable(networkState)
        ) {
            response = await fetchFiatRate(appFiatCurrency.short, fiatRate);

            if (response?.success) {
                const rateObj = response.rate as TRateObject;

                updateFiatRate({
                    ...fiatRate,
                    rate: rateObj.rate,
                    lastUpdated: rateObj.lastUpdated,
                    dailyChange: rateObj.dailyChange,
                });

                // Set app fiat currency
                setAppFiatCurrency(appFiatCurrency);
                // refresh cached rates
                setCachedRates(response.rates as TRate);
            } else {
                if (isAdvancedMode) {
                    LiberalToast(capitalizeFirst(t('network')), response.error, {
                        duration: 2500,
                    });
                }

                // If online and hit cool down limit,
                // update from cache if not refreshed
                updateFiatRate({
                    ...fiatRate,
                    rate: new BigNumber(
                        rates[appFiatCurrency.short.toLowerCase()],
                    ),
                    lastUpdated: fiatRate.lastUpdated,
                });
            }
        } else {
            // Otherwise
            // Load cached rate
            updateFiatRate({
                ...fiatRate,
                rate: new BigNumber(rates[appFiatCurrency.short.toLowerCase()]),
                lastUpdated: fiatRate.lastUpdated,
            });
            setAppFiatCurrency(appFiatCurrency);
        }
    }, [
        appFiatCurrency,
        fiatRate,
        isAdvancedMode,
        networkState,
        rates,
        setAppFiatCurrency,
        setCachedRates,
        t,
        updateFiatRate,
    ]);

    // Check if wallet balance is empty
    const isWalletBroke = (balance: TBalance) => {
        return new BigNumber(0).eq(balance.onchain.plus(balance.lightning));
    };

    const hideSendButton =
        walletData.isWatchOnly || isWalletBroke(walletData.balance);

    const routeToReceive = useCallback(async () => {
        const _netInfo = await netInfo.fetch();

        if (!checkNetworkIsReachable(_netInfo)) {
            navigation.dispatch(
                CommonActions.navigate({
                    name: 'Receive',
                    params: {
                        sats: '',
                        fiat: '',
                        amount: '',
                        lnDescription: null,
                    },
                }),
            );
            return;
        }

        navigation.dispatch(
            CommonActions.navigate({
                name: 'RequestAmount',
            }),
        );
    }, [navigation]);

    useEffect(() => {
        // Always assume this is the case for breez events
        if (route.params?.reload) {
            jointSync();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route.params?.reload]);

    // Receive Wallet ID and fetch wallet data to display
    // Include functions to change individual wallet settings
    return (
        <SafeAreaView
            style={[
                styles.root,
                {backgroundColor: ColorScheme.Background.Primary},
            ]}>
            {/* status bar filler */}
            <StatusBar barStyle={'light-content'} backgroundColor={CardColor} />
            <View
                className="absolute w-full h-16 top-0"
                style={{backgroundColor: CardColor}}
            />
            <View
                className="w-full h-full -mt-2"
                style={{backgroundColor: CardColor}}>
                {/* Top panel */}
                <View
                    className={
                        `relative ${
                            walletData.type === 'unified'
                                ? 'h-1/2'
                                : 'h-1/2'
                        } items-center justify-center`
                    }
                    style={{backgroundColor: CardColor}}>
                    <View
                        className="absolute w-full top-2 flex-row items-center justify-between">
                        <PlainButton
                            className="items-center flex-row left-6"
                            onPress={() => {
                                const nav = navigation.getState();
                                if (nav?.index === 0 && nav?.routes.length === 1) {
                                    navigation.goBack();
                                } else {
                                    navigation.dispatch(
                                        CommonActions.reset({
                                            index: 0,
                                            routes: [{name: 'HomeScreen'}],
                                        })
                                    );
                                }
                            }}>
                            <HomeIcon className="mr-2" fill={'white'} />
                        </PlainButton>

                        <Text
                            className="text-white self-center text-center w-1/2 font-bold"
                            numberOfLines={1}
                            ellipsizeMode={'middle'}>
                            {walletName}
                        </Text>

                        <PlainButton
                            className="right-6"
                            onPress={() => {
                                navigation.dispatch(
                                    CommonActions.navigate({
                                        name: 'WalletInfo',
                                    }),
                                );
                            }}>
                            <Dots width={32} fill={'white'} />
                        </PlainButton>
                    </View>

                    {/* Watch-only */}
                    {walletData.isWatchOnly && (
                        <View
                            className="absolute top-11 rounded-full bg-black opacity-50">
                            <Text
                                className="text-sm py-1 px-6 text-white font-bold">
                                {t('watch_only')}
                            </Text>
                        </View>
                    )}

                    {/* Balance */}
                    <View
                        className={
                            `items-center w-5/6 ${
                                    hideTotalBalance
                                        ? '-mt-20'
                                        : isAdvancedMode &&
                                          walletData.type === 'unified'
                                        ? '-mt-8'
                                        : ''
                                }`
                        }>
                        {/* Balance component */}
                        <View
                            className={
                                `${
                                        hideTotalBalance
                                            ? 'absolute mt-8'
                                            : 'items-center'
                                    } w-full`
                            }
                            style={{
                                    marginTop:
                                        walletData.type === 'unified' &&
                                        walletTxs.length > 0
                                            ? -86
                                            : 0,
                            }}>
                            <Text
                                className="text-sm text-white opacity-60 mb-1">
                                {!isNetOn
                                    ? t('offline_balance')
                                    : t('balance')}
                            </Text>
                            <Balance
                                fontColor={'white'}
                                balance={
                                    walletData.type === 'unified'
                                        ? walletBalance
                                        : walletData.balance.onchain
                                }
                                balanceFontSize={'text-3xl'}
                                disableFiat={false}
                                loading={loadingBalance}
                            />
                        </View>
                    </View>

                    {/* Combined balance for unified wallets */}
                    {walletData.type === 'unified' &&
                        walletTxs.length > 0 && (
                            <>
                                <View
                                    className="absolute w-5/6"
                                    style={{
                                            bottom: hideTotalBalance
                                                ? 98 + 24
                                                : 98,
                                    }}>
                                    <View
                                        className="w-full items-start">
                                        <View
                                            className={
                                                `w-full ${
                                                        langDir === 'right'
                                                            ? 'flex-row-reverse'
                                                            : 'flex-row'
                                                    } items-center justify-between opacity-60`
                                            }>
                                            <Text
                                                className="text-sm text-white">
                                                Lightning
                                            </Text>

                                            <Balance
                                                    disabled={true}
                                                    fontColor={'white'}
                                                    balance={
                                                        walletData.balance
                                                            .lightning
                                                    }
                                                    balanceFontSize={
                                                        'text-lg'
                                                    }
                                                    disableFiat={false}
                                                    loading={loadingBalance}
                                                />
                                        </View>
                                    </View>

                                    <View
                                        className="w-full flex-row items-center justify-between">
                                        <View
                                            className="w-full opacity-20 my-4"
                                            style={[
                                                styles.divider,
                                            ]}
                                        />
                                    </View>

                                    <View
                                        className="w-full items-start">
                                        <View
                                            className={
                                                `w-full ${
                                                        langDir === 'right'
                                                            ? 'flex-row-reverse'
                                                            : 'flex-row'
                                                    } items-center justify-between opacity-60`
                                            }>
                                            <Text
                                                className="text-sm text-white">
                                                On-chain
                                            </Text>

                                            <Balance
                                                disabled={true}
                                                fontColor={'white'}
                                                balance={
                                                    walletData.balance
                                                        .onchain
                                                }
                                                balanceFontSize={
                                                    'text-lg'
                                                }
                                                disableFiat={false}
                                                loading={loadingBalance}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </>
                        )}

                        {/* Send and receive */}
                        <View
                            className="absolute bottom-6 w-full items-center px-4 justify-center flex-row">
                            {/* Hide send if Balance is empty or it is a watch-only wallet */}
                            {!hideSendButton && (
                                <View
                                    className="rounded-full py-3 mr-6 w-2/5"
                                    style={{
                                            backgroundColor: CardAccent,
                                    }}>
                                    <PlainButton onPress={navigateScanScreen}>
                                        <Text
                                            className="text-base text-white text-center font-bold">
                                            {capitalizeFirst(t('send'))}
                                        </Text>
                                    </PlainButton>
                                </View>
                            )}
                            <View
                                className={
                                    `rounded-full py-3 ${
                                        hideSendButton ? 'w-full' : 'w-2/5'
                                    }`
                                }
                                style={{
                                        backgroundColor: CardAccent,
                                }}>
                                <PlainButton onPress={routeToReceive}>
                                    <Text
                                        className="text-base text-white text-center font-bold">
                                        {capitalizeFirst(t('receive'))}
                                    </Text>
                                </PlainButton>
                            </View>
                        </View>
                    </View>

                {/* Transactions List */}
                <View
                    className={
                        `${
                            walletData.type === 'unified'
                                ? 'h-1/2'
                                : 'h-1/2'
                        } w-full items-center z-10`
                    }
                    style={[
                        styles.transactionList,
                        {
                            backgroundColor: ColorScheme.Background.Primary,
                        },
                    ]}>
                    <View className="mt-6 w-11/12">
                        <VText
                            className={
                                `${
                                        langDir === 'right'
                                            ? 'mr-4'
                                            : 'ml-4'
                                    } text-base font-bold`
                            }
                            style={{color: ColorScheme.Text.Default}}>
                            {capitalizeFirst(t('transactions'))}
                        </VText>
                    </View>

                    <View
                        className="w-full h-full items-center pb-10">
                        <VirtualizedList
                            maxToRenderPerBatch={50}
                            updateCellsBatchingPeriod={2500}
                            refreshing={refreshing}
                            onRefresh={jointSync}
                            scrollEnabled={true}
                            getItem={(data, index) => data[index]}
                            getItemCount={data => data.length}
                            className={
                                `${
                                        walletTxs.length > 0
                                            ? 'w-11/12'
                                        : 'w-full'
                                    } mt-2 z-30`
                            }
                            contentContainerStyle={[
                                styles.listStyle,
                                walletTxs.length ? {height: '100%'} : {},
                            ]}
                            data={walletTxs.sort(
                                (a: TTransaction, b: TTransaction) => {
                                    return +Number(b.timestamp) - +Number(a.timestamp);
                                },
                            )}
                            renderItem={item => {
                                return (
                                    <UnifiedTransactionListItem
                                        callback={() => {
                                            navigation.dispatch(
                                                CommonActions.navigate({
                                                    name: 'TransactionDetails',
                                                    params: {
                                                        tx: {...item.item},
                                                        source: 'conservative',
                                                        walletId:
                                                            currentWalletID,
                                                    },
                                                }),
                                            );
                                        }}
                                        tx={item.item}
                                    />
                                );
                            }}
                            keyExtractor={(item: TTransaction) =>
                                item.id ? item.id : item.id
                            }
                            initialNumToRender={25}
                            contentInsetAdjustmentBehavior="automatic"
                            ListEmptyComponent={
                                <View
                                    className="w-4/5 h-5/6 items-center justify-center">
                                    <Box
                                        width={32}
                                        fill={ColorScheme.SVG.GrayFill}
                                        className="mb-4 -mt-6"
                                    />
                                    <Text
                                        className="w-full text-center"
                                        style={{
                                                color: ColorScheme.Text
                                                    .GrayedText,
                                        }}>
                                        {t('no_transactions_text')}
                                    </Text>
                                </View>
                            }
                        />
                    </View>
                </View>

                <Toasts extraInsets={{top: NativeWindowMetrics.height * -0.075}} />
            </View>
        </SafeAreaView>
    );
};

export default Wallet;

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    transactionList: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    emptyBalance: {
        backgroundColor: 'darkgrey',
    },
    divider: {
        height: 1,
        backgroundColor: 'black',
    },
    listStyle: {
        alignItems: 'center',
    },
});
