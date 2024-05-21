/* eslint-disable react-native/no-inline-styles */
import {
    Text,
    View,
    useColorScheme,
    StyleSheet,
    StatusBar,
    FlatList,
} from 'react-native';
import React, {useContext, useState} from 'react';

import {useNavigation, CommonActions} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';
import {AppStorageContext} from '../../class/storageContext';

import {useTranslation} from 'react-i18next';

import {useTailwind} from 'tailwind-rn';
import Color from '../../constants/Color';

import NativeWindowMetrics from '../../constants/NativeWindowMetrics';
import {
    SWAP_IN_LN_DESCRIPTION,
    SWAP_OUT_LN_DESCRIPTION,
} from '../../modules/wallet-defaults';
import {UnifiedTransactionListItem} from '../../components/transaction';
import {TTransaction} from '../../types/wallet';

import Box from '../../assets/svg/inbox-24.svg';
import CloseIcon from '../../assets/svg/x-24.svg';
import {capitalizeFirst} from '../../modules/transform';
import {PlainButton} from '../../components/button';

enum ETransactionKind {
    ALL = 'all',
    RECEIVED = 'received',
    SENT = 'sent',
    SWAPs = 'swaps',
}

const TransactionList = () => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const {getWalletData, currentWalletID} = useContext(AppStorageContext);
    const wallet = getWalletData(currentWalletID);

    const [filteredKind, setFilteredKind] = useState<ETransactionKind>(
        ETransactionKind.ALL,
    );
    const [refreshing, setRefreshing] = useState(false);

    const {t} = useTranslation('wallet');

    const walletTxs = () => {
        const allTxs = wallet.transactions.concat(wallet.payments);

        switch (filteredKind) {
            case ETransactionKind.ALL:
                return allTxs;
            case ETransactionKind.RECEIVED:
                return allTxs.filter(
                    tx =>
                        tx.paymentType === 'received' &&
                        !(
                            tx.description === SWAP_OUT_LN_DESCRIPTION ||
                            tx.description === SWAP_IN_LN_DESCRIPTION
                        ),
                );
            case ETransactionKind.SENT:
                return allTxs.filter(
                    tx =>
                        tx.paymentType === 'sent' &&
                        !(
                            tx.description === SWAP_OUT_LN_DESCRIPTION ||
                            tx.description === SWAP_IN_LN_DESCRIPTION
                        ),
                );
            case ETransactionKind.SWAPs:
                return allTxs.filter(
                    tx =>
                        tx.description === SWAP_OUT_LN_DESCRIPTION ||
                        tx.description === SWAP_IN_LN_DESCRIPTION,
                );
            default:
                return allTxs;
        }
    };

    return (
        <SafeAreaView
            edges={['right', 'bottom', 'right']}
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <StatusBar barStyle={ColorScheme.BarStyle.Inverted} />
            <View
                style={[
                    styles.statusContainer,
                    tailwind('w-full h-full justify-center'),
                    {
                        backgroundColor: ColorScheme.Background.Primary,
                    },
                ]}>
                <View style={[tailwind('h-full items-center justify-center')]}>
                    <View
                        style={[
                            tailwind(
                                'flex rounded-md absolute font-bold text-center w-full top-6 px-4',
                            ),
                            {backgroundColor: ColorScheme.Background.Default},
                        ]}>
                        <View
                            style={[
                                tailwind(
                                    'flex-row items-center justify-center mb-8',
                                ),
                            ]}>
                            <PlainButton
                                onPress={() => {
                                    navigation.dispatch(CommonActions.goBack());
                                }}
                                style={[tailwind('absolute left-0')]}>
                                <CloseIcon
                                    width={32}
                                    fill={ColorScheme.SVG.Default}
                                />
                            </PlainButton>

                            <Text
                                style={[
                                    tailwind('text-lg font-bold'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {capitalizeFirst(t('transactions'))}
                            </Text>
                        </View>

                        <View
                            style={[
                                tailwind(
                                    'flex-row justify-between self-center',
                                ),
                                {
                                    paddingVertical: 5,
                                    paddingHorizontal: 5,
                                    borderRadius: 4,
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                    width: NativeWindowMetrics.width * 0.9,
                                },
                            ]}>
                            <PlainButton
                                style={tailwind('w-1/4')}
                                onPress={() => {
                                    setFilteredKind(ETransactionKind.ALL);
                                }}>
                                <View
                                    style={[
                                        tailwind(
                                            'flex-row items-center justify-center',
                                        ),
                                        {
                                            borderRadius: 4,
                                            paddingVertical: 2,
                                            backgroundColor:
                                                filteredKind === 'all'
                                                    ? ColorScheme.Background
                                                          .CardGreyed
                                                    : 'transparent',
                                        },
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm'),
                                            {
                                                color:
                                                    filteredKind === 'all'
                                                        ? ColorScheme.Text
                                                              .Default
                                                        : ColorScheme.Text
                                                              .GrayedText,
                                            },
                                        ]}>
                                        {capitalizeFirst(t('all'))}
                                    </Text>
                                </View>
                            </PlainButton>

                            <PlainButton
                                style={tailwind('w-1/4')}
                                onPress={() => {
                                    setFilteredKind(ETransactionKind.RECEIVED);
                                }}>
                                <View
                                    style={[
                                        tailwind(
                                            'flex-row items-center rounded-md justify-center',
                                        ),
                                        {
                                            paddingVertical: 2,
                                            backgroundColor:
                                                filteredKind === 'received'
                                                    ? ColorScheme.Background
                                                          .CardGreyed
                                                    : 'transparent',
                                        },
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm'),
                                            {
                                                color:
                                                    filteredKind === 'received'
                                                        ? ColorScheme.Text
                                                              .Default
                                                        : ColorScheme.Text
                                                              .GrayedText,
                                            },
                                        ]}>
                                        {capitalizeFirst(t('received'))}
                                    </Text>
                                </View>
                            </PlainButton>

                            <PlainButton
                                style={tailwind('w-1/4')}
                                onPress={() => {
                                    setFilteredKind(ETransactionKind.SENT);
                                }}>
                                <View
                                    style={[
                                        tailwind(
                                            'flex-row items-center rounded-md justify-center',
                                        ),
                                        {
                                            paddingVertical: 2,
                                            backgroundColor:
                                                filteredKind === 'sent'
                                                    ? ColorScheme.Background
                                                          .CardGreyed
                                                    : 'transparent',
                                        },
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm'),
                                            {
                                                color:
                                                    filteredKind === 'sent'
                                                        ? ColorScheme.Text
                                                              .Default
                                                        : ColorScheme.Text
                                                              .GrayedText,
                                            },
                                        ]}>
                                        {capitalizeFirst(t('sent'))}
                                    </Text>
                                </View>
                            </PlainButton>

                            <PlainButton
                                style={tailwind('w-1/4')}
                                onPress={() => {
                                    setFilteredKind(ETransactionKind.SWAPs);
                                }}>
                                <View
                                    style={[
                                        tailwind(
                                            'flex-row items-center rounded-md justify-center',
                                        ),
                                        {
                                            paddingVertical: 2,
                                            backgroundColor:
                                                filteredKind === 'swaps'
                                                    ? ColorScheme.Background
                                                          .CardGreyed
                                                    : 'transparent',
                                        },
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm'),
                                            {
                                                color:
                                                    filteredKind === 'swaps'
                                                        ? ColorScheme.Text
                                                              .Default
                                                        : ColorScheme.Text
                                                              .GrayedText,
                                            },
                                        ]}>
                                        {capitalizeFirst(t('swaps'))}
                                    </Text>
                                </View>
                            </PlainButton>
                        </View>
                    </View>

                    {/* Transactions */}
                    <View
                        style={[
                            tailwind(
                                'w-full justify-center px-4 items-center absolute',
                            ),
                            {
                                height: NativeWindowMetrics.height * 0.9 - 148,
                                bottom: 0,
                            },
                        ]}>
                        <FlatList
                            maxToRenderPerBatch={50}
                            updateCellsBatchingPeriod={2500}
                            refreshing={refreshing}
                            onRefresh={() => {}}
                            scrollEnabled={true}
                            style={[tailwind('w-full mt-2 z-30')]}
                            contentContainerStyle={[
                                tailwind(
                                    `${
                                        walletTxs().length > 0 ? '' : 'h-full'
                                    } items-center`,
                                ),
                            ]}
                            data={walletTxs().sort(
                                (a: TTransaction, b: TTransaction) => {
                                    return +b.timestamp - +a.timestamp;
                                },
                            )}
                            renderItem={item => {
                                return (
                                    <UnifiedTransactionListItem
                                        callback={() => {}}
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
                </View>
            </View>
        </SafeAreaView>
    );
};

export default TransactionList;

const styles = StyleSheet.create({
    statusContainer: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
});
