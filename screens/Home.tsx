/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useContext, useEffect, useState, useCallback} from 'react';

import {
    Platform,
    useColorScheme,
    View,
    FlatList,
    Dimensions,
    StyleSheet,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation, CommonActions} from '@react-navigation/native';
import Carousel from 'react-native-reanimated-carousel';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {InitStackParamList} from '../Navigation';

import Toast from 'react-native-toast-message';

import {nodeInfo} from '@breeztech/react-native-breez-sdk';

import VText from '../components/text';

import {useTranslation} from 'react-i18next';

import BDK from 'bdk-rn';
import BigNumber from 'bignumber.js';

import {useNetInfo} from '@react-native-community/netinfo';

import {useTailwind} from 'tailwind-rn';

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../constants/Haptic';

import {AppStorageContext} from '../class/storageContext';

import {
    createBDKWallet,
    getBdkWalletBalance,
    getBdkWalletTransactions,
    syncBdkWallet,
} from '../modules/bdk';

import Dots from '../assets/svg/kebab-horizontal-24.svg';
import Add from '../assets/svg/plus-32.svg';

import Box from '../assets/svg/inbox-24.svg';

import Color from '../constants/Color';
import Font from '../constants/Font';

import {PlainButton} from '../components/button';
import {WalletCard} from '../components/shared';
import {UnifiedTransactionListItem} from '../components/transaction';

import {BaseWallet} from '../class/wallet/base';
import {TBalance, TTransaction} from '../types/wallet';

import {FiatBalance} from '../components/balance';

import {fetchFiatRate} from '../modules/currency';

import {
    getUniqueTXs,
    checkNetworkIsReachable,
    getLNPayments,
} from '../modules/wallet-utils';
import {capitalizeFirst} from '../modules/transform';

import {ENet} from '../types/enums';

type Props = NativeStackScreenProps<InitStackParamList, 'HomeScreen'>;

const Home = ({route}: Props) => {
    const ColorScheme = Color(useColorScheme());
    const tailwind = useTailwind();

    const {t} = useTranslation('wallet');

    const DarkGrayText = {
        color: ColorScheme.isDarkMode ? '#B8B8B8' : '#656565',
    };

    const DarkGreyText = {
        color: ColorScheme.isDarkMode ? '#4b4b4b' : '#DADADA',
    };

    const svgGrayFill = ColorScheme.isDarkMode ? '#4b4b4b' : '#DADADA';

    const topPlatformOffset = 6 + (Platform.OS === 'android' ? 12 : 0);

    const navigation = useNavigation();

    const networkState = useNetInfo();

    const {
        wallets,
        hideTotalBalance,
        appFiatCurrency,
        currentWalletID,
        setCurrentWalletID,
        getWalletData,
        fiatRate,
        updateFiatRate,
        updateWalletTransactions,
        updateWalletPayments,
        updateWalletBalance,
        isWalletInitialized,
        electrumServerURL,
        walletsIndex,
        updateWalletsIndex,
        walletMode,
        isAdvancedMode,
    } = useContext(AppStorageContext);

    const [refreshing, setRefreshing] = useState(false);
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [bdkWallet, setBdkWallet] = useState<BDK.Wallet>();

    // Set current wallet data
    const wallet = getWalletData(currentWalletID);

    const AppScreenWidth = Dimensions.get('window').width;

    // Locked wallet for single wallet mode
    const singleWallet = [wallets[walletsIndex]];
    const walletModeIndex = walletMode === 'multi' ? walletsIndex : 0;

    // add the total balances of the wallets
    const totalBalance: TBalance = wallets.reduce(
        (accumulator: TBalance, currentValue: BaseWallet) =>
            // Only show balances from bitcoin mainnet
            // Don't want user to think their testnet money
            // is spendable
            ({
                onchain: accumulator.onchain.plus(
                    currentValue.network === ENet.Bitcoin
                        ? currentValue.balance.onchain
                        : new BigNumber(0),
                ),
                lightning: accumulator.lightning.plus(
                    currentValue.network === ENet.Bitcoin
                        ? currentValue.balance.lightning
                        : new BigNumber(0),
                ),
            }),
        {onchain: new BigNumber(0), lightning: new BigNumber(0)},
    );

    // List out all transactions across all wallets
    const extractAllTransactions = (): TTransaction[] => {
        let transactions: TTransaction[] = [];

        // Filter and show only transactions from current wallet
        // if in single wallet mode
        // else show all transactions across wallets
        transactions = wallet
            ? transactions.concat(wallet.transactions).concat(wallet.payments)
            : transactions;

        const txs =
            wallets.length > 0 ? getUniqueTXs(transactions) : transactions;

        // Sort by timestamp
        return txs.sort((a: TTransaction, b: TTransaction) => {
            return (
                +(b?.isLightning ? b.paymentTime : b.timestamp) -
                +(a?.isLightning ? a.paymentTime : a.timestamp)
            );
        });
    };

    const initWallet = useCallback(async () => {
        const w = bdkWallet ? bdkWallet : await createBDKWallet(wallet);

        await syncBdkWallet(
            w,
            (status: boolean) => {
                if (process.env.NODE_ENV === 'development' && !status) {
                    Toast.show({
                        topOffset: 54,
                        type: 'Liberal',
                        text1: t('BDK'),
                        text2: t('Failed to sync'),
                        visibilityTime: 1750,
                    });
                }
            },
            wallet.network,
            electrumServerURL,
        );

        return w;
    }, []);

    // Fiat fetch
    const singleSyncFiatRate = useCallback(
        async (ticker: string, violate: boolean = false) => {
            // Only proceed if initial load or if user select new currency in settings
            if (violate) {
                try {
                    await fetchFiatRate(
                        ticker,
                        fiatRate,
                        (rate: BigNumber) => {
                            updateFiatRate({
                                ...fiatRate,
                                rate: rate,
                                lastUpdated: new Date(),
                            });
                        },
                        violate,
                    );
                } catch (e: any) {
                    // Report network error
                    Toast.show({
                        topOffset: 54,
                        type: 'Liberal',
                        text1: capitalizeFirst(t('network')),
                        text2: e.message,
                        visibilityTime: 2000,
                    });

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
        const w = await initWallet();

        const triggered = await fetchFiatRate(
            appFiatCurrency.short,
            fiatRate,
            (rate: BigNumber) => {
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
        if (!checkNetworkIsReachable(networkState)) {
            setRefreshing(false);
            setLoadingBalance(false);
            return;
        }

        // Sync wallet
        const {balance} = await getBdkWalletBalance(w, wallet.balance.onchain);
        const {transactions} = await getBdkWalletTransactions(
            w,
            wallet.network === 'testnet'
                ? electrumServerURL.testnet
                : electrumServerURL.bitcoin,
        );

        // Kill refreshing
        setRefreshing(false);

        // Update wallet balance
        updateWalletBalance(currentWalletID, {
            onchain: balance,
            lightning: new BigNumber(0),
        });

        // Update wallet transactions
        updateWalletTransactions(currentWalletID, transactions);

        // Kill loading
        setLoadingBalance(false);

        // set bdk wallet
        setBdkWallet(w);
    }, [
        setRefreshing,
        fiatRate,
        appFiatCurrency,
        updateFiatRate,
        networkState,
    ]);

    const getBalance = async () => {
        try {
            const nodeState = await nodeInfo();
            const balanceLn = nodeState.channelsBalanceMsat;

            // Update balance after converting to sats
            updateWalletBalance(currentWalletID, {
                onchain: new BigNumber(0),
                lightning: new BigNumber(balanceLn / 1000),
            });
        } catch (error: any) {
            if (process.env.NODE_ENV === 'development' && isAdvancedMode) {
                Toast.show({
                    topOffset: 54,
                    type: 'Liberal',
                    text1: t('Breez SDK'),
                    text2: error.message,
                    visibilityTime: 2000,
                });
            }

            return;
        }
    };

    const fetchPayments = async () => {
        try {
            const txs = await getLNPayments(wallet.payments.length);

            // Update transactions
            updateWalletPayments(currentWalletID, txs);
        } catch (error: any) {
            if (process.env.NODE_ENV === 'development' && isAdvancedMode) {
                Toast.show({
                    topOffset: 54,
                    type: 'Liberal',
                    text1: t('Breez SDK'),
                    text2: error.message,
                    visibilityTime: 2000,
                });
            }

            return;
        }
    };

    const jointSync = async () => {
        // Abort load if no wallets yet
        if (!isWalletInitialized) {
            return;
        }

        // Only attempt load if connected to network
        if (!checkNetworkIsReachable(networkState)) {
            setRefreshing(false);
            setLoadingBalance(false);
            return;
        }

        // start loading
        // Set refreshing
        setLoadingBalance(true);
        setRefreshing(true);

        // Avoid duplicate loading
        if (refreshing || loadingBalance) {
            return;
        }

        // Only attempt load if connected to network
        if (!checkNetworkIsReachable(networkState)) {
            setRefreshing(false);
            return;
        }

        // fetch fiat rate
        singleSyncFiatRate(appFiatCurrency.short, true);

        // fetch onchain
        refreshWallet();

        // Also call Breez if LN wallet
        if (wallet.type === 'unified') {
            await getBalance();
            await fetchPayments();
        }
    };

    // Fetch the fiat rate on currency change
    useEffect(() => {
        // Avoid fiat rate update call when offline
        // or when newly loaded screen to avoid dup call
        if (!checkNetworkIsReachable(networkState)) {
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
        if (wallets.length > 0) {
            // Avoid fiat rate update call when offline
            if (!checkNetworkIsReachable(networkState)) {
                return;
            }

            // Begin loading
            setLoadingBalance(true);

            // Single shot call to update fiat rate
            singleSyncFiatRate(appFiatCurrency.short);
        }

        () => {
            setRefreshing(false);
            setLoadingBalance(false);
        };
    }, []);

    useEffect(() => {
        if (!checkNetworkIsReachable(networkState)) {
            return;
        }
    }, [currentWalletID]);

    useEffect(() => {
        if (route.params?.restoreMeta) {
            if (route.params?.restoreMeta.load) {
                // set loading
                setLoadingBalance(true);

                // Reload the wallet
                jointSync();
            }

            // Simple helper to show successful import and navigate back home
            Toast.show({
                topOffset: 54,
                type: 'Liberal',
                text1: route.params.restoreMeta.title,
                text2: route.params.restoreMeta.message,
                visibilityTime: 1750,
            });

            // Vibrate to let user know the action was successful
            RNHapticFeedback.trigger('impactLight', RNHapticFeedbackOptions);
        }
    }, [route.params?.restoreMeta]);

    const renderCard = ({item}: {item: BaseWallet}) => {
        return (
            <View style={[tailwind('w-full absolute')]}>
                {/* Avoid gesture handler triggering click event */}
                <WalletCard
                    // This is for onchain behaviour only
                    maxedCard={
                        wallet.type !== 'unified' &&
                        item.balance.onchain.isZero() &&
                        item.transactions.length > 0
                    }
                    // Combine the balances
                    balance={item.balance.lightning.plus(item.balance.onchain)}
                    network={item.network}
                    isWatchOnly={item.isWatchOnly}
                    label={item.name}
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
        <SafeAreaView
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
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
                        {marginTop: topPlatformOffset},
                    ]}>
                    <PlainButton
                        onPress={() =>
                            navigation.dispatch(
                                CommonActions.navigate('SettingsRoot', {
                                    screen: 'Settings',
                                }),
                            )
                        }>
                        <Dots
                            width={32}
                            fill={ColorScheme.SVG.Default}
                            style={tailwind('-ml-1')}
                        />
                    </PlainButton>

                    {wallets.length > 0 && walletMode === 'multi' && (
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
                            style={tailwind('justify-around mt-2 w-full mb-3')}>
                            {wallets.length > 0 && (
                                <>
                                    <VText
                                        style={[
                                            tailwind(
                                                'text-base font-medium mb-1',
                                            ),
                                            {color: ColorScheme.Text.Default},
                                            Font.RobotoText,
                                        ]}>
                                        {t('total_balance')}
                                    </VText>

                                    {!hideTotalBalance ? (
                                        <FiatBalance
                                            balance={totalBalance.onchain
                                                .plus(totalBalance.lightning)
                                                .toNumber()}
                                            loading={loadingBalance}
                                            balanceFontSize={'text-3xl'}
                                            fontColor={ColorScheme.Text.Default}
                                        />
                                    ) : (
                                        <View
                                            style={[
                                                tailwind(
                                                    'rounded-sm w-full mt-1 opacity-80 h-8 flex-row',
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
                            )}
                        </View>

                        {/** Carousel for 'BaseCard */}
                        {wallets.length > 0 && (
                            <View style={[styles.CardContainer]}>
                                <Carousel
                                    enabled={
                                        walletMode === 'multi' &&
                                        wallets.length > 1
                                    }
                                    vertical={true}
                                    autoPlay={false}
                                    width={AppScreenWidth * 0.92}
                                    height={styles.CardContainer.height}
                                    data={
                                        walletMode === 'multi'
                                            ? [...wallets]
                                            : singleWallet
                                    }
                                    renderItem={renderCard}
                                    pagingEnabled={true}
                                    mode={'vertical-stack'}
                                    modeConfig={{
                                        snapDirection: 'left',
                                        stackInterval: 8,
                                    }}
                                    onScrollEnd={index => {
                                        updateWalletsIndex(index);
                                    }}
                                    defaultIndex={walletModeIndex}
                                />
                            </View>
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
                        <VText
                            style={[
                                tailwind('w-5/6 font-medium self-center'),
                                DarkGrayText,
                                Font.RobotoText,
                            ]}>
                            {capitalizeFirst(t('latest_transactions_text'))}
                        </VText>

                        {wallets.length > 0 && (
                            <View
                                style={[
                                    tailwind(
                                        'w-full h-full items-center pb-20',
                                    ),
                                ]}>
                                <FlatList
                                    refreshing={refreshing}
                                    onRefresh={jointSync}
                                    scrollEnabled={true}
                                    style={tailwind('w-full')}
                                    contentContainerStyle={[
                                        tailwind(
                                            `${
                                                extractAllTransactions()
                                                    .length > 0
                                                    ? 'w-11/12 self-center'
                                                    : 'w-full h-full'
                                            } items-center`,
                                        ),
                                    ]}
                                    data={extractAllTransactions()}
                                    renderItem={item => {
                                        return (
                                            <UnifiedTransactionListItem
                                                callback={() => {
                                                    navigation.dispatch(
                                                        CommonActions.navigate(
                                                            'WalletRoot',
                                                            {
                                                                screen: 'TransactionDetails',
                                                                params: {
                                                                    tx: {
                                                                        ...item.item,
                                                                    },
                                                                    source: 'liberal',
                                                                    walletId:
                                                                        currentWalletID,
                                                                },
                                                            },
                                                        ),
                                                    );
                                                }}
                                                tx={item.item}
                                            />
                                        );
                                    }}
                                    keyExtractor={item =>
                                        item.id ? item.id : item.txid
                                    }
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
                                            <VText
                                                style={[
                                                    tailwind(
                                                        'w-5/6 text-center',
                                                    ),
                                                    DarkGreyText,
                                                    Font.RobotoText,
                                                ]}>
                                                {t('no_transactions_text')}
                                            </VText>
                                        </View>
                                    }
                                />
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    CardContainer: {
        height: 230,
    },
});

export default Home;
