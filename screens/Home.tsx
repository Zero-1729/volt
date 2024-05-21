/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useContext, useEffect, useState, useCallback} from 'react';

import {
    Platform,
    useColorScheme,
    View,
    Dimensions,
    StyleSheet,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation, CommonActions} from '@react-navigation/native';

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

import Dots from '../assets/svg/gear-24.svg';
import Bell from '../assets/svg/bell-fill-24.svg';

import Box from '../assets/svg/inbox-24.svg';

import Color from '../constants/Color';
import Font from '../constants/Font';

import {PlainButton} from '../components/button';
import {WalletCard} from '../components/shared';

import {BaseWallet} from '../class/wallet/base';
import {TBalance, TTransaction} from '../types/wallet';

import {FiatBalance} from '../components/balance';

import {fetchFiatRate} from '../modules/currency';

import ArrowUpIcon from '../assets/svg/chevron-up-24.svg';

import {
    getUniqueTXs,
    checkNetworkIsReachable,
    getLNPayments,
} from '../modules/wallet-utils';
import {capitalizeFirst} from '../modules/transform';

import {ENet} from '../types/enums';
import NativeWindowMetrics from '../constants/NativeWindowMetrics';

type Props = NativeStackScreenProps<InitStackParamList, 'HomeScreen'>;

const Home = ({route}: Props) => {
    const ColorScheme = Color(useColorScheme());
    const tailwind = useTailwind();
    const navigation = useNavigation();

    const {t} = useTranslation('wallet');

    const DarkGrayText = {
        color: ColorScheme.isDarkMode ? '#B8B8B8' : '#656565',
    };

    const DarkGreyText = {
        color: ColorScheme.isDarkMode ? '#4b4b4b' : '#DADADA',
    };

    const svgGrayFill = ColorScheme.isDarkMode ? '#4b4b4b' : '#DADADA';
    const topPlatformOffset = 6 + (Platform.OS === 'android' ? 12 : 0);
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
        isAdvancedMode,
    } = useContext(AppStorageContext);

    const [refreshing, setRefreshing] = useState(false);
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [bdkWallet, setBdkWallet] = useState<BDK.Wallet>();

    // Set current wallet data
    const wallet = getWalletData(currentWalletID);

    const AppScreenWidth = Dimensions.get('window').width;

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
    const extractAllTransactions = () => {
        let transactions: TTransaction[] = [];

        // Filter and show only transactions from current wallet
        // if in single wallet mode
        // else show all transactions across wallets
        transactions = wallet
            ? transactions.concat(wallet.transactions).concat(wallet.payments)
            : transactions;

        const txs =
            wallets.length > 0 ? getUniqueTXs(transactions) : transactions;

        // Filter the txs below based on whether their timestamp is from today or not
        const filtered = txs.filter((a: TTransaction) => {
            const today = new Date();
            const date = new Date(a.timestamp * 1_000);

            return (
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear()
            );
        });

        return {allCount: txs.length, filtered: filtered};
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

    const triggerBackupFlow = () => {
        // TODO: make sure to add if backed up flag in storage context
        navigation.dispatch(
            CommonActions.navigate('WalletRoot', {
                screen: 'Mnemonic',
            }),
        );
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

                    <PlainButton onPress={() => {}}>
                        <View
                            style={[
                                tailwind(
                                    'flex-row justify-between items-center -mr-1',
                                ),
                            ]}>
                            <Bell
                                fill={ColorScheme.Background.Inverted}
                                width={24}
                                height={24}
                            />
                        </View>
                    </PlainButton>
                </View>

                <View style={[tailwind('w-full h-full mt-2 items-center')]}>
                    <View
                        style={tailwind(
                            'justify-around items-center w-full mb-6',
                        )}>
                        {wallets.length > 0 && (
                            <>
                                <VText
                                    style={[
                                        tailwind('text-base font-medium mb-1'),
                                        {color: ColorScheme.Text.Default},
                                        Font.RobotoText,
                                    ]}>
                                    {t('balance')}
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
                                                'rounded-sm w-5/6 mt-1 opacity-80 h-8 flex-row',
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

                    {/** Wallet Card */}
                    <View
                        style={[
                            {
                                height: styles.CardContainer.height,
                                width: AppScreenWidth * 0.92,
                            },
                        ]}>
                        <WalletCard
                            // This is for onchain behaviour only
                            maxedCard={
                                wallet.type !== 'unified' &&
                                wallet.balance.onchain.isZero() &&
                                wallet.transactions.length > 0
                            }
                            // Combine the balances
                            balance={wallet.balance.lightning.plus(
                                wallet.balance.onchain,
                            )}
                            network={wallet.network}
                            isWatchOnly={wallet.isWatchOnly}
                            label={wallet.name}
                            walletType={wallet.type}
                            loading={loadingBalance}
                            hideBalance={hideTotalBalance}
                            unit={wallet.units}
                            navCallback={() => {
                                // Set the current wallet ID
                                setCurrentWalletID(wallet.id);

                                navigation.dispatch(
                                    CommonActions.navigate('WalletRoot', {
                                        screen: 'WalletView',
                                    }),
                                );
                            }}
                        />
                    </View>

                    <PlainButton
                        onPress={triggerBackupFlow}
                        style={[
                            tailwind('rounded-md py-4 px-4 w-5/6'),
                            {
                                backgroundColor: ColorScheme.Background.Greyed,
                            },
                        ]}>
                        <VText
                            style={[
                                tailwind('text-base font-bold mb-1'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('backup_mnemonic')}
                        </VText>
                        <VText
                            style={[
                                tailwind('text-sm'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {t('backup_mnemonic_text')}
                        </VText>
                    </PlainButton>

                    {extractAllTransactions().allCount > 0 ? (
                        <PlainButton
                            onPress={() => {}}
                            style={[
                                tailwind(
                                    'w-5/6 absolute flex-row items-center justify-center',
                                ),
                                {
                                    bottom:
                                        NativeWindowMetrics.bottomButtonOffset +
                                        32,
                                },
                            ]}>
                            {extractAllTransactions().filtered.length === 0 ? (
                                <Box
                                    width={16}
                                    fill={svgGrayFill}
                                    style={tailwind('mr-2')}
                                />
                            ) : (
                                <ArrowUpIcon
                                    width={24}
                                    height={24}
                                    fill={ColorScheme.SVG.GrayFill}
                                    style={[tailwind('mr-2')]}
                                />
                            )}
                            <VText style={[DarkGrayText]}>
                                {extractAllTransactions().filtered.length === 0
                                    ? t('no_transactions_today')
                                    : extractAllTransactions().filtered
                                          .length === 1
                                    ? t('transaction_today')
                                    : t('transactions_today', {
                                          count: extractAllTransactions()
                                              .filtered.length,
                                      })}
                            </VText>

                            {loadingBalance && (
                                <ActivityIndicator
                                    color={ColorScheme.Background.Greyed}
                                    style={tailwind('ml-2')}
                                />
                            )}
                        </PlainButton>
                    ) : (
                        <View
                            style={[
                                tailwind('w-5/6 items-center'),
                                {
                                    marginTop: -(
                                        NativeWindowMetrics.height * 0.15
                                    ),
                                },
                            ]}>
                            <Box
                                width={32}
                                fill={svgGrayFill}
                                style={tailwind('mb-4')}
                            />
                            <VText
                                style={[
                                    tailwind('w-5/6 text-center'),
                                    DarkGreyText,
                                    Font.RobotoText,
                                ]}>
                                {t('no_transactions_text')}
                            </VText>
                        </View>
                    )}
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
