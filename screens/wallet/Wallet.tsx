/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useContext, useEffect, useState} from 'react';
import {useColorScheme, View, Text, FlatList, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, CommonActions} from '@react-navigation/native';

import BigNumber from 'bignumber.js';
import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';

Dayjs.extend(calendar);
Dayjs.extend(LocalizedFormat);

import {getTxData} from '../../modules/mempool';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import Dots from '../../assets/svg/kebab-horizontal-24.svg';
import Back from '../../assets/svg/arrow-left-24.svg';
import Box from '../../assets/svg/inbox-24.svg';

import {getWalletBalance} from '../../modules/bdk';

import {PlainButton} from '../../components/button';

import {AppStorageContext} from '../../class/storageContext';

import {fetchFiatRate} from '../../modules/currency';

import {Balance} from '../../components/balance';

import {liberalAlert} from '../../components/alert';
import {TransactionListItem} from '../../components/transaction';

import {BalanceType, TransactionType} from '../../types/wallet';

const Wallet = () => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    // Get current wallet ID and wallet data
    const {
        setLoadLock,
        currentWalletID,
        getWalletData,
        networkState,
        fiatRate,
        appFiatCurrency,
        updateFiatRate,
        updateWalletBalance,
        updateWalletTransactions,
        updateWalletUTXOs,
        hideTotalBalance,
        updateWalletAddress,
        electrumServerURL,
    } = useContext(AppStorageContext);

    // For loading effect on balance
    const [loadingBalance, setLoadingBalance] = useState(false);

    const [singleLoadLock, setSingleLoadLock] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Get current wallet data
    const walletData = getWalletData(currentWalletID);

    // Get card color from wallet type
    const CardColor = ColorScheme.WalletColors[walletData.type];

    const walletName = walletData.name;

    // Refresh control
    const refreshWallet = useCallback(async () => {
        // Avoid duplicate loading
        if (refreshing || loadingBalance) {
            return;
        }

        // Only attempt load if connected to network
        if (!networkState?.isConnected) {
            setRefreshing(false);
            return;
        }

        // Lock load to avoid deleting wallet while loading
        setLoadLock(true);

        // Set refreshing
        setRefreshing(true);
        setLoadingBalance(true);

        try {
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
                console.log('[Fiat Rate] Did not fetch fiat rate');
            }
        } catch (e: any) {
            liberalAlert('Network', `${e.message}`, 'OK');

            setLoadingBalance(false);
            setRefreshing(false);
            return;
        }

        if (!loadingBalance) {
            // Update wallet balance first
            const {balance, transactions, updated} = await getWalletBalance(
                walletData,
                electrumServerURL,
            );

            // update wallet balance
            updateWalletBalance(currentWalletID, balance);

            try {
                // Store newly formatted transactions from mempool.space data
                const newTxs = [];

                // Store newly fetched UTXOs
                const newUTXOs = [];

                const addressLock = !updated;

                // Only attempt wallet address update if wallet balance is updated
                if (updated) {
                    // iterate over all the transactions and include the missing optional fields for the TransactionType
                    for (let i = 0; i < transactions.length; i++) {
                        const tmp: TransactionType = {
                            ...transactions[i],
                            address: '',
                            outputs: [],
                            rbf: false,
                            size: 0,
                            weight: 0,
                        };

                        const TxData = await getTxData(
                            transactions[i].txid,
                            walletData.network,
                        );

                        // Transaction inputs (remote owned addresses)
                        for (let j = 0; j < TxData.vin.length; j++) {
                            // Add address we own based on whether we sent
                            // the transaction and the value received matches
                            if (
                                transactions[i].value.eq(
                                    TxData.vin[j].prevout.value,
                                ) &&
                                transactions[i].type === 'outbound'
                            ) {
                                tmp.address =
                                    TxData.vin[j].prevout.scriptpubkey_address;
                            }

                            // Check if receive address is used
                            // Then push tx index
                            if (
                                TxData.vin[j].prevout.scriptpubkey_address ===
                                walletData.address.address
                            ) {
                                walletData.generateNewAddress();
                            }

                            // Set if transaction an RBF
                            if (TxData.vin[j].sequence === '4294967293') {
                                tmp.rbf = true;
                            }
                        }

                        // Transaction outputs (local owned addresses)
                        for (let k = 0; k < TxData.vout.length; k++) {
                            // Add address we own based on whether we received
                            // the transaction and the value received matches
                            if (
                                transactions[i].value.eq(
                                    TxData.vout[k].value,
                                ) &&
                                transactions[i].type === 'inbound'
                            ) {
                                tmp.address =
                                    TxData.vout[k].scriptpubkey_address;

                                // Update tmp address
                                if (
                                    !addressLock &&
                                    walletData.address.address ===
                                        TxData.vout[k].scriptpubkey_address
                                ) {
                                    const newAddress =
                                        walletData.generateNewAddress();
                                    updateWalletAddress(
                                        currentWalletID,
                                        newAddress,
                                    );
                                }

                                // Update transaction UTXOs that we own
                                newUTXOs.push({
                                    txid: transactions[i].txid,
                                    vout: k,
                                    value: new BigNumber(TxData.vout[k].value),
                                    address:
                                        TxData.vout[k].scriptpubkey_address,
                                    scriptpubkey: TxData.vout[k].scriptpubkey,
                                    scriptpubkey_asm:
                                        TxData.vout[k].scriptpubkey_asm,
                                    scriptpubkey_type:
                                        TxData.vout[k].scriptpubkey_type,
                                });
                            }
                        }

                        // Update new transactions list
                        newTxs.push({
                            ...tmp,
                            size: TxData.size,
                            weight: TxData.weight,
                        });
                    }

                    // update wallet transactions
                    updateWalletTransactions(currentWalletID, newTxs);

                    // update wallet UTXOs
                    updateWalletUTXOs(currentWalletID, newUTXOs);
                }

                setLoadLock(false);
            } catch (e: any) {
                liberalAlert('Network', `${e.message}`, 'OK');

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
    }, [
        appFiatCurrency.short,
        currentWalletID,
        fiatRate,
        loadingBalance,
        networkState?.isConnected,
        refreshing,
        updateFiatRate,
        updateWalletBalance,
        updateWalletTransactions,
        walletData,
    ]);

    // Check if wallet balance is empty
    const isWalletBroke = (balance: BigNumber) => {
        return new BigNumber(0).eq(balance);
    };

    const hideSendButton =
        walletData.isWatchOnly || isWalletBroke(walletData.balance);

    useEffect(() => {
        // Attempt to sync balance
        if (!singleLoadLock) {
            refreshWallet();
            setSingleLoadLock(true);
        }
    }, []);

    // Receive Wallet ID and fetch wallet data to display
    // Include functions to change individual wallet settings
    return (
        <SafeAreaView
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            {/* Fake status bar filler */}
            <StatusBar barStyle={'light-content'} />
            <View
                style={[
                    tailwind('absolute w-full h-16 top-0'),
                    {backgroundColor: CardColor},
                ]}
            />
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
                        tailwind('relative h-1/2 items-center justify-center'),
                        {backgroundColor: CardColor},
                    ]}>
                    <View
                        style={[
                            tailwind(
                                'absolute w-full top-2 flex-row items-center justify-between',
                            ),
                        ]}>
                        <PlainButton
                            style={[tailwind('items-center flex-row left-6')]}
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
                    {walletData.isWatchOnly ? (
                        <View style={[tailwind('absolute top-10 right-6')]}>
                            <Text
                                style={[
                                    tailwind(
                                        'text-sm py-1 px-2 self-center text-white font-bold bg-black rounded opacity-40',
                                    ),
                                ]}>
                                Watch-only
                            </Text>
                        </View>
                    ) : (
                        <></>
                    )}

                    {/* Balance */}
                    <View
                        style={[
                            tailwind(
                                `items-center w-5/6 ${
                                    hideTotalBalance ? '-mt-20' : '-mt-8'
                                }`,
                            ),
                        ]}>
                        <Text
                            style={[
                                tailwind('text-sm text-white opacity-60 mb-2'),
                            ]}>
                            Current{' '}
                            {!networkState?.isConnected ? 'Offline ' : ''}
                            Balance
                        </Text>

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
                            ]}>
                            <Balance
                                id={currentWalletID}
                                BalanceFontSize={'text-4xl'}
                                disableFiat={false}
                                loading={loadingBalance}
                            />
                        </View>
                    </View>

                    {/* Send and receive */}
                    <View
                        style={[
                            tailwind(
                                'absolute bottom-6 w-full items-center px-4 justify-around flex-row',
                            ),
                        ]}>
                        {/* Hide send if Balance is empty or it is a watch-only wallet */}
                        {!hideSendButton ? (
                            <View
                                style={[
                                    tailwind(
                                        'rounded-full py-3 mr-4 w-1/2 opacity-60',
                                    ),
                                    {
                                        backgroundColor:
                                            ColorScheme.Background.Inverted,
                                    },
                                ]}>
                                <PlainButton>
                                    <Text
                                        style={[
                                            tailwind(
                                                'text-base text-center font-bold',
                                            ),
                                            {color: ColorScheme.Text.Alt},
                                        ]}>
                                        Send
                                    </Text>
                                </PlainButton>
                            </View>
                        ) : (
                            <></>
                        )}
                        <View
                            style={[
                                tailwind(
                                    `rounded-full py-3 ${
                                        hideSendButton ? 'w-full' : 'w-1/2'
                                    } opacity-60`,
                                ),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Inverted,
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
                                            'text-base text-center font-bold',
                                        ),
                                        {color: ColorScheme.Text.Alt},
                                    ]}>
                                    Receive
                                </Text>
                            </PlainButton>
                        </View>
                    </View>
                </View>

                {/* Transactions List */}
                <View
                    style={[
                        tailwind('h-1/2 w-full items-center z-10'),
                        {
                            backgroundColor: ColorScheme.Background.Primary,
                            borderTopLeftRadius: 32,
                            borderTopRightRadius: 32,
                        },
                    ]}>
                    <View style={[tailwind('mt-6 w-11/12')]}>
                        <Text
                            style={[
                                tailwind('ml-4 text-base font-bold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Transactions
                        </Text>
                    </View>

                    <View
                        style={[tailwind('w-full h-full items-center pb-10')]}>
                        <FlatList
                            refreshing={refreshing}
                            onRefresh={refreshWallet}
                            scrollEnabled={true}
                            style={[
                                tailwind(
                                    `${
                                        walletData.transactions.length > 0
                                            ? 'w-11/12'
                                            : 'w-full'
                                    } mt-2 z-30`,
                                ),
                            ]}
                            contentContainerStyle={[
                                tailwind(
                                    `${
                                        walletData.transactions.length > 0
                                            ? ''
                                            : 'h-full'
                                    } items-center`,
                                ),
                            ]}
                            data={walletData.transactions}
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
                                        A list of all transactions for this
                                        wallet be displayed here
                                    </Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Wallet;
