/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */

import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
    useColorScheme,
    View,
    Text,
    FlatList,
    StatusBar,
    StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, CommonActions} from '@react-navigation/native';

import VText from '../../components/text';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

import {nodeInfo} from '@breeztech/react-native-breez-sdk';

import BDK from 'bdk-rn';

import BigNumber from 'bignumber.js';

import {useNetInfo} from '@react-native-community/netinfo';

import {useTranslation} from 'react-i18next';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import Dots from '../../assets/svg/kebab-horizontal-24.svg';
import Back from '../../assets/svg/arrow-left-24.svg';
import Box from '../../assets/svg/inbox-24.svg';
import SwapIcon from '../../assets/svg/arrow-switch-16.svg';

import {getBdkWalletBalance, createBDKWallet} from '../../modules/bdk';
import {syncBDKWallet, fetchOnchainTransactions} from '../../modules/shared';
import {
    getMiniWallet,
    checkNetworkIsReachable,
    getLNPayments,
} from '../../modules/wallet-utils';

import {PlainButton} from '../../components/button';

import {AppStorageContext} from '../../class/storageContext';

import {fetchFiatRate} from '../../modules/currency';

import {Balance} from '../../components/balance';

import {UnifiedTransactionListItem} from '../../components/transaction';

import {TBalance, TTransaction} from '../../types/wallet';

import {capitalizeFirst} from '../../modules/transform';

import Swap from './../../components/swap';
import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import {SwapType} from '../../types/enums';

type Props = NativeStackScreenProps<WalletParamList, 'WalletView'>;

const Wallet = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const [bdkWallet, setBdkWallet] = useState<BDK.Wallet>();
    const networkState = useNetInfo();

    // Get current wallet ID and wallet data
    const {
        setLoadLock,
        currentWalletID,
        getWalletData,
        fiatRate,
        appFiatCurrency,
        updateFiatRate,
        updateWalletBalance,
        updateWalletTransactions,
        updateWalletPayments,
        updateWalletUTXOs,
        hideTotalBalance,
        updateWalletAddress,
        electrumServerURL,
        isAdvancedMode,
    } = useContext(AppStorageContext);

    // For loading effect on balance
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Get current wallet data
    const walletData = getWalletData(currentWalletID);

    // Get card color from wallet type
    const CardColor =
        ColorScheme.WalletColors[walletData.type][walletData.network];
    const CardAccent = ColorScheme.WalletColors[walletData.type].accent;

    const walletName = walletData.name;

    const initWallet = useCallback(async () => {
        const w = await createBDKWallet(walletData);

        return w;
    }, []);

    const bottomSwapRef = React.useRef<BottomSheetModal>(null);
    const [openSwap, setOpenSwap] = useState(-1);

    const openSwapModal = () => {
        if (openSwap !== 1) {
            bottomSwapRef.current?.present();
        } else {
            bottomSwapRef.current?.close();
        }
    };

    const walletTxs =
        walletData.type === 'unified'
            ? [...walletData.transactions, ...walletData?.payments]
            : walletData.transactions;
    const walletBalance =
        walletData.type !== 'unified'
            ? walletData.balance.onchain
            : walletData.balance.onchain.plus(walletData.balance.lightning);

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
                    autoHide: false,
                });
            }

            return;
        }
    };

    const fetchPayments = async () => {
        try {
            const txs = await getLNPayments(walletData.payments.length);

            // Update transactions
            updateWalletPayments(currentWalletID, txs);
        } catch (error: any) {
            if (process.env.NODE_ENV === 'development' && isAdvancedMode) {
                Toast.show({
                    topOffset: 54,
                    type: 'Liberal',
                    text1: t('Breez SDK'),
                    text2: error.message,
                    autoHide: false,
                });
            }

            return;
        }
    };

    const jointSync = async () => {
        // Avoid duplicate loading
        if (refreshing || loadingBalance) {
            return;
        }

        // Only attempt load if connected to network
        if (!checkNetworkIsReachable(networkState)) {
            setRefreshing(false);
            return;
        }

        // Lock load to avoid deleting wallet while loading
        setLoadLock(true);

        // Set refreshing
        setRefreshing(true);
        setLoadingBalance(true);

        // fetch fiat rate
        fetchFiat();

        // fetch onchain
        refreshWallet();

        // Also call Breez if LN wallet
        if (walletData.type === 'unified') {
            await getBalance();
            await fetchPayments();
        }
    };

    const handleSwap = async (swapType: SwapType) => {
        // Close the modal
        bottomSwapRef.current?.close();

        navigation.dispatch(
            CommonActions.navigate('WalletRoot', {
                screen: 'SwapAmount',
                params: {
                    swapType: swapType,
                },
            }),
        );
    };

    const syncWallet = useCallback(async () => {
        // initWallet only called one time
        // subsequent call is from 'bdkWallet' state
        // set in Balance fetch
        const w = bdkWallet ? bdkWallet : await initWallet();

        return await syncBDKWallet(w, walletData.network, electrumServerURL);
    }, []);

    // Fetch fiat rate
    const fetchFiat = async () => {
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
            console.log('[Fiat Rate] Did not fetch fiat rate');
        }
    };

    // Refresh control
    const refreshWallet = useCallback(async () => {
        const w = await syncWallet();

        if (!loadingBalance) {
            // Update wallet balance first
            const {balance, updated} = await getBdkWalletBalance(
                w,
                walletData.balance.onchain,
            );

            // update wallet balance
            updateWalletBalance(currentWalletID, {
                onchain: balance,
                lightning: new BigNumber(0),
            });

            try {
                const {txs, address, utxo} = await fetchOnchainTransactions(
                    w,
                    walletData,
                    updated,
                    electrumServerURL,
                );

                // update wallet address
                updateWalletAddress(currentWalletID, address);

                // We make this update in case of pending txs
                // and because we already have this data from the balance update BDK call
                // update wallet transactions
                updateWalletTransactions(currentWalletID, txs);

                // update wallet UTXOs
                updateWalletUTXOs(currentWalletID, utxo);

                setLoadLock(false);
            } catch (err: any) {
                Toast.show({
                    topOffset: 54,
                    type: 'Liberal',
                    text1: capitalizeFirst(t('network')),
                    text2: t('error_fetching_txs'),
                    visibilityTime: 2000,
                });

                setLoadingBalance(false);
                setRefreshing(false);
                setLoadLock(false);
                return;
            }
        }

        // Kill loading if fiat rate fetch not triggered
        setRefreshing(false);
        setLoadingBalance(false);
        setLoadLock(false);

        // Update wallet, so we avoid wallet creation
        // for every call to this function
        if (!bdkWallet) {
            setBdkWallet(w);
        }
    }, [
        appFiatCurrency.short,
        currentWalletID,
        fiatRate,
        loadingBalance,
        networkState,
        refreshing,
        updateFiatRate,
        updateWalletBalance,
        updateWalletTransactions,
        walletData,
    ]);

    // Check if wallet balance is empty
    const isWalletBroke = (balance: TBalance) => {
        return new BigNumber(0).eq(balance.onchain.plus(balance.lightning));
    };

    const hideSendButton =
        walletData.isWatchOnly || isWalletBroke(walletData.balance);

    useEffect(() => {
        // Kill all loading effects
        () => {
            setRefreshing(false);
            setLoadingBalance(false);
            setLoadLock(false);
        };
    }, []);

    useEffect(() => {
        // Attempt to sync balance when reload triggered
        // E.g. from completed transaction
        if (route.params?.reload) {
            jointSync();
        }
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
                style={[
                    tailwind('absolute w-full h-16 top-0'),
                    {backgroundColor: CardColor},
                ]}
            />
            <BottomSheetModalProvider>
                {/* adjust styling below to ensure content in View covers entire screen */}
                {/* Adjust styling below to ensure it covers entire app height */}
                <View
                    style={[
                        tailwind('w-full h-full'),
                        {backgroundColor: CardColor},
                    ]}>
                    {/* Top panel */}
                    <View
                        style={[
                            tailwind(
                                `relative ${
                                    walletData.type === 'unified'
                                        ? 'h-1/2'
                                        : 'h-1/2'
                                } items-center justify-center`,
                            ),
                            {backgroundColor: CardColor},
                        ]}>
                        <View
                            style={[
                                tailwind(
                                    'absolute w-full top-2 flex-row items-center justify-between',
                                ),
                            ]}>
                            <PlainButton
                                style={[
                                    tailwind('items-center flex-row left-6'),
                                ]}
                                onPress={() => {
                                    navigation.dispatch(
                                        CommonActions.navigate('HomeScreen'),
                                    );
                                }}>
                                <Back style={tailwind('mr-2')} fill={'white'} />
                            </PlainButton>

                            <Text
                                style={[
                                    tailwind(
                                        'text-white self-center text-center w-1/2 font-bold',
                                    ),
                                ]}
                                numberOfLines={1}
                                ellipsizeMode={'middle'}>
                                {walletName}
                            </Text>

                            <PlainButton
                                style={[tailwind('right-6')]}
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
                                style={[
                                    tailwind(
                                        'absolute top-11 rounded-full bg-black opacity-50',
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind(
                                            'text-sm py-1 px-6 text-white font-bold',
                                        ),
                                    ]}>
                                    {t('watch_only')}
                                </Text>
                            </View>
                        )}

                        {/* Balance */}
                        <View
                            style={[
                                tailwind(
                                    `items-center w-5/6 ${
                                        hideTotalBalance
                                            ? '-mt-20'
                                            : isAdvancedMode &&
                                              walletData.type === 'unified'
                                            ? '-mt-8'
                                            : 'mt-12'
                                    }`,
                                ),
                            ]}>
                            {/* Balance component */}
                            <View
                                style={[
                                    tailwind(
                                        `${
                                            hideTotalBalance
                                                ? 'absolute mt-8'
                                                : 'items-center'
                                        } w-full`,
                                    ),
                                    {
                                        marginTop:
                                            walletData.type === 'unified'
                                                ? -86
                                                : 0,
                                    },
                                ]}>
                                <Text
                                    style={[
                                        tailwind(
                                            'text-sm text-white opacity-60',
                                        ),
                                    ]}>
                                    {!checkNetworkIsReachable(networkState)
                                        ? t('offline_balance')
                                        : t('current_balance')}
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
                        {walletData.type === 'unified' && isAdvancedMode && (
                            <>
                                <View
                                    style={[
                                        tailwind('absolute w-5/6'),
                                        styles.bottomConverter,
                                    ]}>
                                    <View
                                        style={[
                                            tailwind('w-full items-start'),
                                        ]}>
                                        <View
                                            style={[
                                                tailwind(
                                                    'w-full flex-row items-center justify-between opacity-60',
                                                ),
                                            ]}>
                                            <Text
                                                style={[
                                                    tailwind(
                                                        'text-sm text-white',
                                                    ),
                                                ]}>
                                                Lightning
                                            </Text>
                                            <Balance
                                                disabled={true}
                                                fontColor={'white'}
                                                balance={
                                                    walletData.balance.lightning
                                                }
                                                balanceFontSize={'text-lg'}
                                                disableFiat={false}
                                                loading={loadingBalance}
                                            />
                                        </View>
                                    </View>

                                    <View
                                        style={[
                                            tailwind(
                                                'w-full flex-row items-center justify-between',
                                            ),
                                        ]}>
                                        <View
                                            style={[
                                                tailwind('w-1/3 opacity-20'),
                                                styles.divider,
                                            ]}
                                        />

                                        <View
                                            style={[
                                                tailwind(
                                                    'rounded-full items-center px-6 py-2',
                                                ),
                                                {
                                                    backgroundColor: CardAccent,
                                                },
                                            ]}>
                                            <PlainButton
                                                onPress={openSwapModal}>
                                                <SwapIcon fill={'white'} />
                                            </PlainButton>
                                        </View>

                                        <View
                                            style={[
                                                tailwind('w-1/3 opacity-20'),
                                                styles.divider,
                                            ]}
                                        />
                                    </View>

                                    <View
                                        style={[
                                            tailwind('w-full items-start'),
                                        ]}>
                                        <View
                                            style={[
                                                tailwind(
                                                    'w-full flex-row items-center justify-between opacity-60',
                                                ),
                                            ]}>
                                            <Text
                                                style={[
                                                    tailwind(
                                                        'text-sm text-white',
                                                    ),
                                                ]}>
                                                On-chain
                                            </Text>

                                            <Balance
                                                disabled={true}
                                                fontColor={'white'}
                                                balance={
                                                    walletData.balance.onchain
                                                }
                                                balanceFontSize={'text-lg'}
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
                            style={[
                                tailwind(
                                    'absolute bottom-6 w-full items-center px-4 justify-around flex-row',
                                ),
                            ]}>
                            {/* Hide send if Balance is empty or it is a watch-only wallet */}
                            {!hideSendButton && (
                                <View
                                    style={[
                                        tailwind(
                                            'rounded-full py-3 mr-4 w-1/2',
                                        ),
                                        {
                                            backgroundColor: CardAccent,
                                        },
                                    ]}>
                                    <PlainButton
                                        onPress={() => {
                                            const miniwallet =
                                                getMiniWallet(walletData);

                                            navigation.dispatch(
                                                CommonActions.navigate(
                                                    'ScanRoot',
                                                    {
                                                        screen: 'Scan',
                                                        params: {
                                                            screen: 'send',
                                                            wallet: miniwallet,
                                                        },
                                                    },
                                                ),
                                            );
                                        }}>
                                        <Text
                                            style={[
                                                tailwind(
                                                    'text-base text-white text-center font-bold',
                                                ),
                                            ]}>
                                            {capitalizeFirst(t('send'))}
                                        </Text>
                                    </PlainButton>
                                </View>
                            )}
                            <View
                                style={[
                                    tailwind(
                                        `rounded-full py-3 ${
                                            hideSendButton ? 'w-full' : 'w-1/2'
                                        }`,
                                    ),
                                    {
                                        backgroundColor: CardAccent,
                                    },
                                ]}>
                                <PlainButton
                                    onPress={() => {
                                        navigation.dispatch(
                                            CommonActions.navigate({
                                                name: 'RequestAmount',
                                            }),
                                        );
                                    }}>
                                    <Text
                                        style={[
                                            tailwind(
                                                'text-base text-white text-center font-bold',
                                            ),
                                        ]}>
                                        {capitalizeFirst(t('receive'))}
                                    </Text>
                                </PlainButton>
                            </View>
                        </View>
                    </View>

                    {/* Transactions List */}
                    <View
                        style={[
                            styles.transactionList,
                            tailwind(
                                `${
                                    walletData.type === 'unified'
                                        ? 'h-1/2'
                                        : 'h-1/2'
                                } w-full items-center z-10`,
                            ),
                            {
                                backgroundColor: ColorScheme.Background.Primary,
                            },
                        ]}>
                        <View style={[tailwind('mt-6 w-11/12')]}>
                            <VText
                                style={[
                                    tailwind(
                                        `${
                                            langDir === 'right'
                                                ? 'mr-4'
                                                : 'ml-4'
                                        } text-base font-bold`,
                                    ),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {capitalizeFirst(t('transactions'))}
                            </VText>
                        </View>

                        <View
                            style={[
                                tailwind('w-full h-full items-center pb-10'),
                            ]}>
                            <FlatList
                                refreshing={refreshing}
                                onRefresh={jointSync}
                                scrollEnabled={true}
                                style={[
                                    tailwind(
                                        `${
                                            walletTxs.length > 0
                                                ? 'w-11/12'
                                                : 'w-full'
                                        } mt-2 z-30`,
                                    ),
                                ]}
                                contentContainerStyle={[
                                    tailwind(
                                        `${
                                            walletTxs.length > 0 ? '' : 'h-full'
                                        } items-center`,
                                    ),
                                ]}
                                data={walletTxs.sort(
                                    (a: TTransaction, b: TTransaction) => {
                                        return +b.timestamp - +a.timestamp;
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
                                keyExtractor={item =>
                                    item.txid ? item.txid : item.id
                                }
                                initialNumToRender={25}
                                contentInsetAdjustmentBehavior="automatic"
                                ListEmptyComponent={
                                    <View
                                        style={[
                                            tailwind(
                                                'w-4/5 h-5/6 items-center justify-center',
                                            ),
                                        ]}>
                                        <Box
                                            width={32}
                                            fill={ColorScheme.SVG.GrayFill}
                                            style={tailwind('mb-4 -mt-6')}
                                        />
                                        <Text
                                            style={[
                                                tailwind('w-full text-center'),
                                                {
                                                    color: ColorScheme.Text
                                                        .GrayedText,
                                                },
                                            ]}>
                                            {t('no_transactions_text')}
                                        </Text>
                                    </View>
                                }
                            />
                        </View>

                        {walletData.type === 'unified' && (
                            <View style={[tailwind('absolute bottom-0')]}>
                                <Swap
                                    lightningBalance={
                                        walletData.balance.lightning
                                    }
                                    onchainBalance={walletData.balance.onchain}
                                    swapRef={bottomSwapRef}
                                    triggerSwap={handleSwap}
                                    onSelectSwap={idx => {
                                        setOpenSwap(idx);
                                    }}
                                />
                            </View>
                        )}
                    </View>
                </View>
            </BottomSheetModalProvider>
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
    bottomConverter: {
        bottom: 98,
    },
    divider: {
        height: 1,
        backgroundColor: 'black',
    },
});
