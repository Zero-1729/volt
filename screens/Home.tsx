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

import {_BREEZ_SDK_API_KEY_, _BREEZ_INVITE_CODE_} from './../modules/env';

import {
    BreezEvent,
    mnemonicToSeed,
    NodeConfig,
    nodeInfo,
    NodeConfigVariant,
    defaultConfig,
    EnvironmentType,
    connect,
    BreezEventVariant,
} from '@breeztech/react-native-breez-sdk';

import {runOnJS} from 'react-native-reanimated';

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
import {WalletCard} from '../components/card';
import {UnifiedTransactionListItem} from '../components/transaction';

import {BaseWallet} from '../class/wallet/base';
import {TBalance, TTransaction} from '../types/wallet';

import {FiatBalance} from '../components/balance';

import {fetchFiatRate} from '../modules/currency';
import {liberalAlert, conservativeAlert} from '../components/alert';

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
        updateWalletBalance,
        isWalletInitialized,
        electrumServerURL,
        walletsIndex,
        updateWalletsIndex,
        walletMode,
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
            // Don't want user tot think their testnet money
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

    let BreezSub!: any;

    // Init Breez node
    const initNode = useCallback(async () => {
        // Get node info
        try {
            const info = await nodeInfo();
            if (info?.id) {
                console.log('[Breez SDK] Node already initialized');
                return;
            }
        } catch (e) {
            console.log('[Breez SDK] Error initializing Breez node:', e);
        }

        // SDK events listener
        const onBreezEvent = (event: BreezEvent) => {
            if (event.type === BreezEventVariant.NEW_BLOCK) {
                console.log('[Breez SDK] New Block');
            }

            if (event.type === BreezEventVariant.SYNCED) {
                console.log('[Breez SDK] Synced');
            }

            if (event.type === BreezEventVariant.BACKUP_STARTED) {
                console.log('[Breez SDK] Backup started');
            }

            if (event.type === BreezEventVariant.BACKUP_SUCCEEDED) {
                console.log('[Breez SDK] Backup succeeded');
            }

            if (event.type === BreezEventVariant.BACKUP_FAILED) {
                console.log('[Breez SDK] Backup failed');
                console.log('[Breez SDK] Event details: ', event.details);
            }

            if (event.type === BreezEventVariant.INVOICE_PAID) {
                console.log('[Breez SDK] Invoice paid');
                console.log('[Breez SDK] Payment details: ', event.details);

                // Route to LN payment status screen
                navigation.dispatch(
                    CommonActions.navigate('WalletRoot', {
                        screen: 'LNTransactionStatus',
                        params: {
                            status: true,
                            details: event.details,
                            detailsType: 'received',
                        },
                    }),
                );
            }

            if (event.type === BreezEventVariant.PAYMENT_FAILED) {
                console.log('[Breez SDK] Payment failed');
                console.log('[Breez SDK] Event details: ', event.details);

                // Route to LN payment status screen
                navigation.dispatch(
                    CommonActions.navigate('WalletRoot', {
                        screen: 'LNTransactionStatus',
                        params: {
                            status: false,
                            details: event.details,
                            detailsType: 'failed',
                        },
                    }),
                );
            }

            if (event.type === BreezEventVariant.PAYMENT_SUCCEED) {
                console.log('[Breez SDK] Payment sent');
                console.log('[Breez SDK] Event details: ', event.details);

                // Route to LN payment status screen
                navigation.dispatch(
                    CommonActions.navigate('WalletRoot', {
                        screen: 'LNTransactionStatus',
                        params: {
                            status: true,
                            details: event.details,
                            detailsType: 'success',
                        },
                    }),
                );
            }
        };

        // Create the default config
        const seed = await mnemonicToSeed(wallet.mnemonic);

        const nodeConfig: NodeConfig = {
            type: NodeConfigVariant.GREENLIGHT,
            config: {
                inviteCode: _BREEZ_INVITE_CODE_,
            },
        };

        const config = await defaultConfig(
            EnvironmentType.PRODUCTION,
            _BREEZ_SDK_API_KEY_,
            nodeConfig,
        );

        // handle error
        // "BreezServices already initialized"

        // Connect to the Breez SDK make it ready for use
        BreezSub = await connect(config, seed, onBreezEvent);
    }, [_BREEZ_INVITE_CODE_, _BREEZ_SDK_API_KEY_, wallet.mnemonic]);

    // List out all transactions across all wallets
    const extractAllTransactions = (): TTransaction[] => {
        let transactions: TTransaction[] = [];

        // Filter and show only transactions from current wallet
        // if in single wallet mode
        // else show all transactions across wallets
        if (walletMode === 'multi') {
            for (const w of wallets) {
                transactions = transactions.concat(w?.transactions);
            }
        } else {
            transactions = wallet
                ? transactions.concat(wallet.transactions)
                : transactions;
        }

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
                console.log('[BDK] synced wallet', status);
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
                    liberalAlert(
                        capitalizeFirst(t('network')),
                        `${e.message}`,
                        capitalizeFirst(t('ok')),
                    );

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
        if (!checkNetworkIsReachable(networkState)) {
            setRefreshing(false);
            setLoadingBalance(false);
            return;
        }

        // start loading
        setLoadingBalance(true);

        // Set refreshing
        setRefreshing(true);

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
            lightning: wallet.balance.lightning,
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
        const nodeState = await nodeInfo();
        const balanceLn = nodeState.channelsBalanceMsat;

        // Update balance after converting to sats
        updateWalletBalance(currentWalletID, {
            onchain: wallet.balance.onchain,
            lightning: new BigNumber(balanceLn / 1000),
        });
    };

    const fetchPayments = async () => {
        const txs = await getLNPayments(wallet.transactions.length);

        // Update transactions
        updateWalletTransactions(currentWalletID, txs);
    };

    const jointSync = async () => {
        if (wallet.type === 'unified') {
            // Check network available
            if (!checkNetworkIsReachable(networkState)) {
                setRefreshing(false);
                setLoadingBalance(false);
                return;
            }

            // create node init if not already
            await initNode();

            setLoadingBalance(true);
            setRefreshing(true);

            await getBalance();
            await fetchPayments();

            setLoadingBalance(false);
            setRefreshing(false);
        } else {
            refreshWallet();
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

        if (wallet.type === 'unified') {
            runOnJS(initNode)();
        }

        () => {
            BreezSub.remove();
            setRefreshing(false);
            setLoadingBalance(false);
        };
    }, []);

    useEffect(() => {
        if (route.params?.restoreMeta) {
            if (route.params?.restoreMeta.load) {
                // set loading
                setLoadingBalance(true);

                // Reload the wallet
                jointSync();
            }

            // Simple helper to show successful import and navigate back home
            conservativeAlert(
                route.params.restoreMeta.title,
                route.params.restoreMeta.message,
                capitalizeFirst(t('ok')),
            );

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
                        {marginTop: topPlatformOffset},
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
