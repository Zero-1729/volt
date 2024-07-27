/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
} from 'react';

import {
    Platform,
    useColorScheme,
    View,
    Dimensions,
    StyleSheet,
    ActivityIndicator,
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

import netInfo, {useNetInfo} from '@react-native-community/netinfo';

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

import Gear from '../assets/svg/gear-24.svg';
import Bell from '../assets/svg/bell-fill-24.svg';
import BoltIcon from '../assets/svg/bolt-mono.svg';
import ScanIcon from '../assets/svg/scan.svg';
import LightningBoltIcon from '../assets/svg/zap.svg';
import BackupIcon from '../assets/svg/backup.svg';

import Color from '../constants/Color';
import Font from '../constants/Font';

import {PlainButton} from '../components/button';
import {WalletCard} from '../components/shared';

import {BaseWallet} from '../class/wallet/base';
import {TBalance, TTransaction} from '../types/wallet';

import {FiatBalance} from '../components/balance';

import ArrowUpIcon from '../assets/svg/chevron-up-24.svg';

import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import PINPass from '../components/pinpass';

import {biometricAuth} from '../modules/shared';

import {
    getUniqueTXs,
    checkNetworkIsReachable,
    getLNPayments,
    getMiniWallet,
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
    const topPlatformOffset = 6 + (Platform.OS === 'android' ? 12 : 0);
    const networkState = useNetInfo();
    const isNetOn = checkNetworkIsReachable(networkState);

    const {
        wallets,
        hideTotalBalance,
        currentWalletID,
        setCurrentWalletID,
        getWalletData,
        updateWalletTransactions,
        updateWalletPayments,
        updateWalletBalance,
        isWalletInitialized,
        electrumServerURL,
        isAdvancedMode,
        isBiometricsActive,
    } = useContext(AppStorageContext);

    const [refreshing, setRefreshing] = useState(false);
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [bdkWallet, setBdkWallet] = useState<BDK.Wallet>();

    // Set current wallet data
    const wallet = getWalletData(currentWalletID);

    const isLightning = wallet.type === 'unified';

    const AppScreenWidth = Dimensions.get('window').width;

    const bottomPINPassRef = useRef<BottomSheetModal>(null);
    const [pinIdx, setPINIdx] = useState(-1);

    const togglePINPassModal = () => {
        if (pinIdx !== 1) {
            bottomPINPassRef.current?.present();
        } else {
            bottomPINPassRef.current?.close();
        }
    };

    const handlePINSuccess = async () => {
        triggerBackupFlow();
        bottomPINPassRef.current?.close();
    };

    const handleBackupRoute = () => {
        if (isBiometricsActive) {
            biometricAuth(
                success => {
                    if (success) {
                        triggerBackupFlow();
                    }
                },
                // prompt response callback
                () => {
                    togglePINPassModal();
                },
                // prompt error callback
                error => {
                    Toast.show({
                        topOffset: 54,
                        type: 'Liberal',
                        text1: t('Biometrics'),
                        text2: error.message,
                        visibilityTime: 1750,
                    });
                },
            );

            return;
        }

        // IF no biometrics, just call on PIN modal
        togglePINPassModal();
    };

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

    // Refresh control
    const refreshWallet = useCallback(async () => {
        const w = await initWallet();

        // Check net again, just in case there is a drop mid execution
        const _netInfo = await netInfo.fetch();
        if (!checkNetworkIsReachable(_netInfo)) {
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
    }, [setRefreshing, networkState]);

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
        const _netInfo = await netInfo.fetch();
        if (!checkNetworkIsReachable(_netInfo)) {
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
        if (!checkNetworkIsReachable(_netInfo)) {
            setRefreshing(false);
            return;
        }

        // fetch onchain
        refreshWallet();

        // Also call Breez if LN wallet
        if (wallet.type === 'unified') {
            await getBalance();
            await fetchPayments();
        }
    };

    const gotToTransactions = useCallback(() => {
        navigation.dispatch(CommonActions.navigate('TransactionList'));
    }, []);

    const navigateToBoltNFC = useCallback(() => {
        navigation.dispatch(
            CommonActions.navigate('WalletRoot', {
                screen: 'RequestAmount',
                params: {
                    boltNFCMode: true,
                },
            }),
        );
    }, []);

    const goToLNPay = useCallback(() => {
        navigation.dispatch(
            CommonActions.navigate('WalletRoot', {
                screen: 'SendLN',
            }),
        );
    }, []);

    const goToScan = useCallback(() => {
        const miniWallet = getMiniWallet(wallet);

        navigation.dispatch(
            CommonActions.navigate('ScanRoot', {
                screen: 'Scan',
                params: {
                    screen: 'home',
                    wallet: miniWallet,
                },
            }),
        );
    }, []);

    const triggerBackupFlow = useCallback(() => {
        navigation.dispatch(
            CommonActions.navigate({
                name: 'Mnemonic',
            }),
        );
    }, []);

    const initWalletSync = useCallback(async () => {
        const _netInfo = await netInfo.fetch();

        if (
            isWalletInitialized &&
            !checkNetworkIsReachable(_netInfo) &&
            wallet.type !== 'unified'
        ) {
            jointSync();
        }
    }, []);

    const handleWalletRestore = useCallback(async () => {
        const _netInfo = await netInfo.fetch();

        if (route.params?.restoreMeta) {
            if (
                route.params?.restoreMeta.load &&
                checkNetworkIsReachable(_netInfo)
            ) {
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
    }, []);

    // Sync wallet on initial load
    useEffect(() => {
        initWalletSync();

        () => {
            setRefreshing(false);
            setLoadingBalance(false);
        };
    }, []);

    useEffect(() => {
        handleWalletRestore();
    }, [route.params?.restoreMeta]);

    return (
        <SafeAreaView
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <BottomSheetModalProvider>
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
                        <PlainButton onPress={() => {}}>
                            <Bell
                                fill={ColorScheme.Background.Inverted}
                                width={24}
                                height={24}
                                style={tailwind('-ml-1')}
                            />
                        </PlainButton>

                        <PlainButton
                            onPress={() =>
                                navigation.dispatch(
                                    CommonActions.navigate('SettingsRoot', {
                                        screen: 'Settings',
                                    }),
                                )
                            }>
                            <View
                                style={[
                                    tailwind(
                                        'flex-row justify-between items-center -mr-1',
                                    ),
                                ]}>
                                <Gear
                                    width={32}
                                    fill={ColorScheme.SVG.Default}
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
                                            tailwind(
                                                'text-base font-medium mb-1',
                                            ),
                                            {
                                                color: isNetOn
                                                    ? ColorScheme.Text.Default
                                                    : ColorScheme.Text
                                                          .GrayedText,
                                            },
                                            Font.RobotoText,
                                        ]}>
                                        {!isNetOn
                                            ? t('offline_balance')
                                            : t('balance')}
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

                        {/* Quick Actions */}
                        <View
                            style={[tailwind('flex-row w-5/6 justify-around')]}>
                            {isLightning && (
                                <PlainButton
                                    onPress={navigateToBoltNFC}
                                    style={[
                                        tailwind(
                                            'flex justify-center items-center',
                                        ),
                                    ]}>
                                    <View
                                        style={[
                                            tailwind(
                                                'rounded-full items-center justify-center mb-2',
                                            ),
                                            {
                                                height: 54,
                                                width: 54,
                                                backgroundColor:
                                                    ColorScheme.Background
                                                        .QuickActionsButton,
                                            },
                                        ]}>
                                        <BoltIcon
                                            style={[{marginTop: 3}]}
                                            width={30}
                                            height={30}
                                            fill={ColorScheme.SVG.Default}
                                        />
                                    </View>
                                    <VText
                                        style={[
                                            tailwind('text-sm'),
                                            {color: ColorScheme.Text.Default},
                                        ]}>
                                        {t('bolt_nfc')}
                                    </VText>
                                </PlainButton>
                            )}

                            <PlainButton
                                onPress={goToScan}
                                style={[
                                    tailwind(
                                        'flex justify-center items-center',
                                    ),
                                ]}>
                                <View
                                    style={[
                                        tailwind(
                                            'rounded-full items-center justify-center mb-2',
                                        ),
                                        {
                                            height: 54,
                                            width: 54,
                                            backgroundColor:
                                                ColorScheme.Background
                                                    .QuickActionsButton,
                                        },
                                    ]}>
                                    <ScanIcon
                                        width={24}
                                        fill={ColorScheme.SVG.Default}
                                    />
                                </View>
                                <VText
                                    style={[
                                        tailwind('text-sm'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    {capitalizeFirst(t('scan'))}
                                </VText>
                            </PlainButton>

                            {isLightning && (
                                <PlainButton
                                    onPress={goToLNPay}
                                    style={[
                                        tailwind(
                                            'flex justify-center items-center',
                                        ),
                                    ]}>
                                    <View
                                        style={[
                                            tailwind(
                                                'rounded-full items-center justify-center mb-2',
                                            ),
                                            {
                                                height: 54,
                                                width: 54,
                                                backgroundColor:
                                                    ColorScheme.Background
                                                        .QuickActionsButton,
                                            },
                                        ]}>
                                        <LightningBoltIcon
                                            width={20}
                                            fill={ColorScheme.SVG.Default}
                                        />
                                    </View>
                                    <VText
                                        style={[
                                            tailwind('text-sm'),
                                            {color: ColorScheme.Text.Default},
                                        ]}>
                                        {capitalizeFirst(t('address'))}
                                    </VText>
                                </PlainButton>
                            )}

                            <PlainButton
                                onPress={handleBackupRoute}
                                style={[
                                    tailwind(
                                        'flex justify-center items-center',
                                    ),
                                ]}>
                                <View
                                    style={[
                                        tailwind(
                                            'rounded-full items-center justify-center mb-2',
                                        ),
                                        {
                                            height: 54,
                                            width: 54,
                                            backgroundColor:
                                                ColorScheme.Background
                                                    .QuickActionsButton,
                                        },
                                    ]}>
                                    <BackupIcon
                                        width={20}
                                        fill={ColorScheme.SVG.Default}
                                    />
                                </View>
                                <VText
                                    style={[
                                        tailwind('text-sm'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    {capitalizeFirst(t('backup'))}
                                </VText>
                            </PlainButton>
                        </View>

                        <PlainButton
                            onPress={gotToTransactions}
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
                            {extractAllTransactions().filtered.length !== 0 && (
                                <ArrowUpIcon
                                    width={24}
                                    height={24}
                                    fill={ColorScheme.SVG.GrayFill}
                                    style={[tailwind('mr-2')]}
                                />
                            )}
                            <VText style={[tailwind('text-sm'), DarkGrayText]}>
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
                    </View>
                </View>

                <PINPass
                    pinPassRef={bottomPINPassRef}
                    triggerSuccess={handlePINSuccess}
                    onSelectPinPass={setPINIdx}
                    pinMode={false}
                />
            </BottomSheetModalProvider>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    CardContainer: {
        height: 230,
    },
});

export default Home;
