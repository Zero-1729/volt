/* eslint-disable react-hooks/exhaustive-deps */
import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text, View, useColorScheme} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {getFeeRates} from '../../modules/mempool';
import {TMempoolFeeRates} from '../../types/wallet';

import {FiatBalance, Balance} from '../../components/balance';

import {BottomSheetModal} from '@gorhom/bottom-sheet';
import FeeModal from '../../components/fee';

import {
    useNavigation,
    StackActions,
    CommonActions,
} from '@react-navigation/native';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import {PlainButton, LongBottomButton} from '../../components/button';

import Close from '../../assets/svg/x-24.svg';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {conservativeAlert} from '../../components/alert';

type Props = NativeStackScreenProps<WalletParamList, 'Send'>;

const SendView = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const [feeRates, setFeeRates] = useState<TMempoolFeeRates>({
        fastestFee: 2,
        halfHourFee: 1,
        hourFee: 1,
        economyFee: 1,
        minimumFee: 1,
    });
    const [selectedFeeRate, setSelectedFeeRate] = useState<number>();

    const sats = route.params.invoiceData.options?.amount || 0;

    const isMax =
        route.params.invoiceData.options?.amount?.toString() ===
        route.params.wallet.balance.toString();

    const createTransaction = async () => {
        // Navigate to status screen
        navigation.dispatch(
            CommonActions.navigate({
                name: 'TransactionStatus',
                params: {
                    payload: {
                        addressAmounts: [
                            {
                                address: route.params.invoiceData.address,
                                amount: route.params.invoiceData.options
                                    ?.amount,
                            },
                        ],
                        feeRate: selectedFeeRate,
                    },
                    wallet: route.params.wallet,
                    network: route.params.wallet.network,
                },
            }),
        );
    };

    const bottomFeeRef = React.useRef<BottomSheetModal>(null);
    const [openModal, setOpenModal] = useState(-1);

    const openFeeModal = () => {
        if (openModal !== 1) {
            bottomFeeRef.current?.present();
        } else {
            bottomFeeRef.current?.close();
        }
    };

    const fetchFeeRates = async () => {
        let rates = feeRates;

        try {
            const fetchedRates = await getFeeRates(route.params.wallet.network);

            rates = fetchedRates as TMempoolFeeRates;
        } catch (e: any) {
            // Error assumed to be 503; mempool unavailable due to sync
            conservativeAlert(
                'Fee rate',
                'Error fetching fee rates, service unavailable.',
            );
        }

        // Set the fee rate from modal or use fastest
        setSelectedFeeRate(rates.fastestFee);
        setFeeRates(rates);
    };

    useEffect(() => {
        fetchFeeRates();
    }, []);

    const updateFeeRate = (fee: number) => {
        setSelectedFeeRate(fee);

        bottomFeeRef.current?.close();
    };

    const memoizedUpdateFeeRate = useCallback(updateFeeRate, []);

    return (
        <SafeAreaView edges={['bottom', 'left', 'right']}>
            <View
                style={[tailwind('w-full h-full items-center justify-center')]}>
                <BottomSheetModalProvider>
                    <View
                        style={[
                            tailwind(
                                'absolute top-6 w-full flex-row items-center justify-center',
                            ),
                        ]}>
                        <PlainButton
                            onPress={() =>
                                navigation.dispatch(StackActions.popToTop())
                            }
                            style={[tailwind('absolute z-10 left-6')]}>
                            <Close fill={ColorScheme.SVG.Default} />
                        </PlainButton>
                        <Text
                            style={[
                                tailwind('text-sm font-bold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Transaction Summary
                        </Text>
                    </View>

                    <View
                        style={[
                            tailwind(
                                '-mt-12 items-center w-full h-4/6 relative',
                            ),
                        ]}>
                        <View style={[tailwind('items-center')]}>
                            <View style={[tailwind('items-center flex-row')]}>
                                <Text
                                    style={[
                                        tailwind('text-base mb-1'),
                                        {
                                            color: ColorScheme.Text.GrayedText,
                                        },
                                    ]}>
                                    Amount
                                </Text>
                            </View>
                            {isMax && (
                                <Text
                                    style={[
                                        tailwind('text-4xl'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    Max
                                </Text>
                            )}
                            {!isMax && (
                                <FiatBalance
                                    balance={sats}
                                    loading={false}
                                    balanceFontSize={'text-4xl'}
                                    fontColor={ColorScheme.Text.Default}
                                />
                            )}
                            {!isMax && (
                                <Balance
                                    loading={false}
                                    disableFiat={true}
                                    balance={sats}
                                    balanceFontSize={'text-sm'}
                                    fontColor={ColorScheme.Text.DescText}
                                />
                            )}
                        </View>

                        <View style={[tailwind('mt-12 w-4/5')]}>
                            <PlainButton onPress={() => {}}>
                                <View
                                    style={[
                                        tailwind('items-center flex-row mb-1'),
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm mr-2'),
                                            {
                                                color: ColorScheme.Text
                                                    .GrayedText,
                                            },
                                        ]}>
                                        Address
                                    </Text>
                                </View>
                            </PlainButton>
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {route.params.invoiceData.address}
                            </Text>
                        </View>

                        {selectedFeeRate ? (
                            <View
                                style={[
                                    tailwind(
                                        'mt-6 items-center justify-between w-4/5 flex-row',
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind('text-sm font-bold'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    Fee rate
                                </Text>

                                <PlainButton
                                    style={[
                                        tailwind('items-center justify-center'),
                                    ]}
                                    onPress={openFeeModal}>
                                    <View
                                        style={[
                                            tailwind('rounded-full px-4 py-1'),
                                            {
                                                backgroundColor:
                                                    ColorScheme.Background
                                                        .Inverted,
                                            },
                                        ]}>
                                        <Text
                                            style={[
                                                tailwind('text-sm'),
                                                {
                                                    color: ColorScheme.Text.Alt,
                                                },
                                            ]}>
                                            {`${selectedFeeRate} sat/vB`}
                                        </Text>
                                    </View>
                                </PlainButton>
                            </View>
                        ) : (
                            <></>
                        )}

                        {route.params.invoiceData.options?.label ? (
                            <View
                                style={[
                                    tailwind('justify-between w-4/5 mt-4'),
                                ]}>
                                {route.params.invoiceData.options.label ? (
                                    <View
                                        style={[
                                            tailwind(
                                                'flex-row justify-between',
                                            ),
                                        ]}>
                                        <Text
                                            style={[
                                                tailwind('text-sm font-bold'),
                                                {
                                                    color: ColorScheme.Text
                                                        .Default,
                                                },
                                            ]}>
                                            Label
                                        </Text>

                                        <Text
                                            numberOfLines={1}
                                            ellipsizeMode={'middle'}
                                            style={[
                                                tailwind(
                                                    'text-sm w-3/5 text-right',
                                                ),
                                                {
                                                    color: ColorScheme.Text
                                                        .DescText,
                                                },
                                            ]}>
                                            {
                                                route.params.invoiceData.options
                                                    ?.label
                                            }
                                        </Text>
                                    </View>
                                ) : (
                                    <></>
                                )}

                                {route.params.invoiceData.options.message ? (
                                    <View
                                        style={[
                                            styles.invoiceMessage,
                                            tailwind('w-full mt-6'),
                                        ]}>
                                        <Text
                                            style={[
                                                tailwind(
                                                    'text-sm mb-4 font-bold',
                                                ),
                                                {
                                                    color: ColorScheme.Text
                                                        .Default,
                                                },
                                            ]}>
                                            Message
                                        </Text>
                                        <Text
                                            numberOfLines={4}
                                            ellipsizeMode={'middle'}
                                            style={[
                                                tailwind('text-sm'),
                                                {
                                                    color: ColorScheme.Text
                                                        .DescText,
                                                },
                                            ]}>
                                            {
                                                route.params.invoiceData.options
                                                    ?.message
                                            }
                                        </Text>
                                    </View>
                                ) : (
                                    <></>
                                )}
                            </View>
                        ) : (
                            <></>
                        )}
                    </View>

                    <LongBottomButton
                        disabled={selectedFeeRate === undefined}
                        onPress={createTransaction}
                        title={'Send'}
                        textColor={ColorScheme.Text.Alt}
                        backgroundColor={ColorScheme.Background.Inverted}
                    />

                    {/* Fee Modal */}
                    <View style={[tailwind('absolute bottom-0')]}>
                        <FeeModal
                            feeRef={bottomFeeRef}
                            feeRates={feeRates}
                            setFeeRate={memoizedUpdateFeeRate}
                            onUpdate={idx => {
                                setOpenModal(idx);
                            }}
                        />
                    </View>
                </BottomSheetModalProvider>
            </View>
        </SafeAreaView>
    );
};

export default SendView;

const styles = StyleSheet.create({
    invoiceMessage: {
        height: 128,
    },
});
