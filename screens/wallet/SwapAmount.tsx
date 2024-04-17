/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useContext, useState, useEffect, ReactElement} from 'react';
import {useColorScheme, View, Text} from 'react-native';

import {useNavigation, CommonActions} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

import {useTailwind} from 'tailwind-rn';
import Color from '../../constants/Color';
import Close from '../../assets/svg/x-24.svg';

import {
    capitalizeFirst,
    formatFiat,
    normalizeFiat,
    SATS_TO_BTC_RATE,
} from '../../modules/transform';

import {PlainButton} from '../../components/button';
import {AmountNumpad} from '../../components/input';
import {DisplayUnit} from '../../types/wallet';
import {SwapType} from '../../types/enums';

import {
    ReverseSwapPairInfo,
    receiveOnchain,
    fetchReverseSwapFees,
    maxReverseSwapAmount,
} from '@breeztech/react-native-breez-sdk';

import {
    DisplayFiatAmount,
    DisplaySatsAmount,
    DisplayBTCAmount,
} from '../../components/balance';

import BigNumber from 'bignumber.js';
import {AppStorageContext} from '../../class/storageContext';
import {useTranslation} from 'react-i18next';
import NativeWindowMetrics from '../../constants/NativeWindowMetrics';

import Toast, {ToastConfig} from 'react-native-toast-message';
import {toastConfig} from '../../components/toast';

type Props = NativeStackScreenProps<WalletParamList, 'SwapAmount'>;

const SwapAmount = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const {fiatRate, getWalletData, currentWalletID, appFiatCurrency} =
        useContext(AppStorageContext);
    const {t} = useTranslation('wallet');

    const wallet = getWalletData(currentWalletID);
    const balance = new BigNumber(
        route.params.swapType === SwapType.SwapOut
            ? wallet.balance.lightning
            : wallet.balance.onchain,
    );
    const isSwapOut = route.params.swapType === SwapType.SwapOut;

    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState<string>('');
    const [loadingFeeText, setFeeLoadingText] = useState('');
    const [showMinText, setShowMinText] = useState<boolean>(false);
    const [fiatAmount, setFiatAmount] = useState<BigNumber>(new BigNumber(0));
    const [bottomText, setBottomText] = useState<string>(
        isSwapOut ? t('get_swap_fees') : t('get_limits'),
    );
    const [swapFees, setSwapFees] = useState<ReverseSwapPairInfo>();
    const [minimumSwapAmount, setMinimumSwapAmount] = useState<BigNumber>(
        new BigNumber(isSwapOut ? balance.multipliedBy(0.1) : 0),
    );
    const [maximumSwapAmount, setMaximumSwapAmount] = useState<BigNumber>(
        new BigNumber(isSwapOut ? balance : 0),
    );
    const [satsAmount, setSatsAmount] = useState<DisplayUnit>({
        value: new BigNumber(0),
        symbol: 'sats',
        name: 'sats',
    });
    const [topUnit, setTopUnit] = useState<DisplayUnit>({
        value: new BigNumber(0),
        symbol: 'sats',
        name: 'sats',
    });
    const [bottomUnit, setBottomUnit] = useState<DisplayUnit>({
        value: new BigNumber(0),
        symbol: appFiatCurrency.symbol,
        name: appFiatCurrency.short,
    });

    const isMax = amount === balance.toString();
    const isBeyondMax = satsAmount.value.gt(maximumSwapAmount);

    const handleCloseButton = () => {
        navigation.dispatch(CommonActions.goBack());
    };

    const handleSwapRoute = async () => {
        if (isSwapOut) {
            if (!swapFees?.totalEstimatedFees) {
                getFeeInfo(true);
                return;
            }

            let maxSwapAmount;

            if (isMax) {
                maxSwapAmount = (await maxReverseSwapAmount()).totalSat;
            }

            navigation.dispatch(
                CommonActions.navigate('SwapOut', {
                    lnBalance: route.params.lnBalance,
                    onchainBalance: route.params.onchainBalance,
                    satsAmount: maxSwapAmount ? maxSwapAmount : satsAmount,
                    fees: swapFees,
                    maxed: isMax,
                }),
            );
        } else {
            if (maximumSwapAmount.isZero()) {
                handleFetchLimits();
                return;
            }

            navigation.dispatch(
                CommonActions.navigate('SwapIn', {
                    lnBalance: route.params.lnBalance,
                    onchainBalance: route.params.onchainBalance,
                    satsAmount: satsAmount,
                }),
            );
        }
    };

    const triggerMax = () => {
        const maxSats = balance.toString();

        setAmount(maxSats);

        setSatsAmount({
            value: new BigNumber(maxSats),
            symbol: 'sats',
            name: 'sats',
        });

        setFiatAmount(calculateFiatEquivalent(maxSats));
    };

    const updateAmount = (value: string) => {
        // When newly swapped, the value is reset to new number from user
        // We reset instead of preserve previous top unit value
        // because we assume the user changes unit to get a new value
        // in the new bottom unit and not to preserve the previous value
        const fiatToSatsEqv = new BigNumber(calculateSatsEquivalent(value));
        const satsToFiatEqv = calculateFiatEquivalent(value);
        const maxSwapFiatAmount = calculateFiatEquivalent(
            maximumSwapAmount.toString(),
        );

        const isMaxing =
            bottomUnit.name === 'sats'
                ? fiatToSatsEqv.isEqualTo(maximumSwapAmount)
                : satsToFiatEqv.isEqualTo(maxSwapFiatAmount);

        const isLarger =
            bottomUnit.name === 'sats'
                ? maximumSwapAmount.lt(value)
                : satsToFiatEqv.gt(maxSwapFiatAmount);

        // clear swap
        if (swapFees?.totalEstimatedFees) {
            setSwapFees({} as ReverseSwapPairInfo);
            setBottomText(t('get_swap_fees'));
        }

        // clear loading text
        if (loadingFeeText) {
            setFeeLoadingText('');
        }

        // If maximum manually entered, auto set to max
        if (isMaxing) {
            triggerMax();
            return;
        }

        // If new input about to be larger, stop input
        if (isLarger) {
            return;
        }

        // I.e. if the previous bottom was $20, and the user swaps to sats
        // we assume the user wants to set a different value in sats
        setAmount(value);

        setSatsAmount({
            value:
                bottomUnit.name === 'sats'
                    ? new BigNumber(value || 0)
                    : fiatToSatsEqv,
            symbol: 'sats',
            name: 'sats',
        });

        setFiatAmount(
            bottomUnit.name !== 'sats'
                ? new BigNumber(value || 0)
                : satsToFiatEqv,
        );

        if (value === '') {
            setSwapFees({} as ReverseSwapPairInfo);
        }
    };

    const calculateSatsEquivalent = (value: string): string => {
        if (value.length > 0) {
            const fiat = new BigNumber(value);

            // Remember we don't want to handle sub-sats
            return fiat
                .dividedBy(fiatRate.rate.multipliedBy(0.00000001))
                .toFixed(0);
        }

        return '0';
    };

    const calculateFiatEquivalent = (value: string): BigNumber => {
        if (value.length > 0) {
            const satoshis = new BigNumber(value);

            return new BigNumber(
                satoshis
                    .multipliedBy(0.00000001)
                    .multipliedBy(fiatRate.rate)
                    .toFixed(2),
            );
        }

        return new BigNumber(0);
    };

    const swapPolarity = () => {
        let tU = topUnit;
        let bU = bottomUnit;

        // Swap top with bottom values
        updateAmount(amount);

        // Swap top with bottom units
        if (bottomUnit?.name === 'sats') {
            setTopUnit(bU);
            setBottomUnit(tU);

            // Update amounts
            // Ensure we aren't prepending a 0
            setAmount(tU.value.toString() === '0' ? '' : tU.value.toString());
        } else {
            // Swap top with bottom units
            setTopUnit(bU);
            setBottomUnit(tU);

            // Update amounts
            // Ensure we aren't prepending a 0
            setAmount(bU.value.toString() === '0' ? '' : bU.value.toString());
        }
    };

    const renderFiatAmount = (fontSize: string) => {
        return (
            <>
                <DisplayFiatAmount
                    amount={formatFiat(fiatAmount)}
                    isApprox={topUnit?.name !== 'sats' && amount.length > 0}
                    fontSize={fontSize}
                />
            </>
        );
    };

    const renderSatAmount = (fontSize: string) => {
        return satsAmount.value.gte(SATS_TO_BTC_RATE) ? (
            <DisplayBTCAmount
                amount={satsAmount.value}
                fontSize={fontSize}
                isApprox={bottomUnit.name !== 'sats' && amount.length > 0}
            />
        ) : (
            <DisplaySatsAmount
                amount={satsAmount.value}
                fontSize={fontSize}
                isApprox={bottomUnit.name !== 'sats' && amount.length > 0}
            />
        );
    };

    const displayBalance = (fontSize: string) => {
        const bottomUnitSats = bottomUnit?.name === 'sats';
        const rawBalance = balance; // sats
        const fBalance = normalizeFiat(rawBalance, fiatRate.rate);

        return bottomUnitSats ? (
            <DisplaySatsAmount
                amount={rawBalance}
                fontSize={fontSize}
                isApprox={bottomUnit.name !== 'sats' && amount.length > 0}
            />
        ) : (
            <DisplayFiatAmount
                amount={fBalance}
                fontSize={fontSize}
                isApprox={topUnit?.name !== 'sats' && amount.length > 0}
            />
        );
    };

    const displayFees = (fontSize: string) => {
        const bottomUnitSats = bottomUnit?.name === 'sats';
        const rawFeeSats = new BigNumber(
            swapFees?.totalEstimatedFees as number,
        );
        const feeAmount = normalizeFiat(rawFeeSats, fiatRate.rate);

        return bottomUnitSats ? (
            <DisplaySatsAmount
                textColor={ColorScheme.Text.DescText}
                amount={rawFeeSats}
                fontSize={fontSize}
                isApprox={bottomUnit.name !== 'sats' && amount.length > 0}
            />
        ) : (
            <DisplayFiatAmount
                textColor={ColorScheme.Text.DescText}
                amount={feeAmount}
                fontSize={fontSize}
                isApprox={topUnit?.name !== 'sats' && amount.length > 0}
            />
        );
    };

    const displayMinimum = (fontSize: string) => {
        const bottomUnitSats = bottomUnit?.name === 'sats';
        const rawMin = new BigNumber(minimumSwapAmount);
        const minAmount = normalizeFiat(rawMin, fiatRate.rate);

        return bottomUnitSats ? (
            <DisplaySatsAmount
                textColor={ColorScheme.Text.DescText}
                amount={rawMin}
                fontSize={fontSize}
                isApprox={bottomUnit.name !== 'sats' && amount.length > 0}
            />
        ) : (
            <DisplayFiatAmount
                textColor={ColorScheme.Text.DescText}
                amount={minAmount}
                fontSize={fontSize}
                isApprox={topUnit?.name !== 'sats' && amount.length > 0}
            />
        );
    };

    const handleFetchLimits = async () => {
        const swapInfo = await receiveOnchain({});

        setMinimumSwapAmount(new BigNumber(swapInfo.minAllowedDeposit));
        setMaximumSwapAmount(new BigNumber(swapInfo.maxAllowedDeposit));

        if (!isSwapOut) {
            setBottomText(t('continue'));
        }
    };

    const getFeeInfo = async (set?: boolean) => {
        setLoading(true);

        if (set) {
            await handleFetchSwapFees();
            setLoading(false);
        } else {
            const _feeInfo = await fetchReverseSwapFees({
                sendAmountSat: balance.toNumber(),
            });

            setMinimumSwapAmount(new BigNumber(_feeInfo.min));
            setLoading(false);
        }
    };

    const handleFetchSwapFees = async () => {
        try {
            setFeeLoadingText('Fetching fee...');

            const fees = await fetchReverseSwapFees({
                sendAmountSat: satsAmount.value.toNumber(),
            });

            setSwapFees(fees);
            setBottomText(t('continue'));
            setFeeLoadingText('');
        } catch (e: any) {
            if (e.message.includes('too low')) {
                Toast.show({
                    topOffset: 54,
                    type: 'Liberal',
                    text1: t('continue'),
                    text2: t('swap_amount_too_low'),
                    visibilityTime: 1750,
                });

                setFeeLoadingText('');
            } else {
                Toast.show({
                    topOffset: 54,
                    type: 'Liberal',
                    text1: t('continue'),
                    text2: e.message,
                    visibilityTime: 2000,
                });

                setFeeLoadingText('');
            }
        }
    };

    const displayFeeText = (fontSize: string): ReactElement => {
        if (loadingFeeText.length !== 0) {
            return (
                <View
                    style={[
                        tailwind('items-center justify-center flex-row mt-6'),
                    ]}>
                    <Text
                        style={[
                            tailwind(`items-center ${fontSize}`),
                            {color: ColorScheme.Text.DescText},
                        ]}>
                        {loadingFeeText}
                    </Text>
                </View>
            );
        }

        if (swapFees?.totalEstimatedFees) {
            return (
                <View
                    style={[
                        tailwind('items-center justify-center flex-row mt-6'),
                    ]}>
                    <Text
                        style={[
                            tailwind(`${fontSize} font-bold mr-2`),
                            {color: ColorScheme.Text.DescText},
                        ]}>
                        {t('swap_fees')}
                    </Text>
                    <View style={[tailwind('items-center')]}>
                        {displayFees(fontSize)}
                    </View>
                </View>
            );
        }

        return <></>;
    };

    useEffect(() => {
        // Load fees and onchain limits
        // TODO: show loading if for onchain
        if (!isSwapOut) {
            handleFetchLimits();
        } else {
            getFeeInfo();
        }
    }, []);

    useEffect(() => {
        if (!minimumSwapAmount.isZero()) {
            Toast.show({
                topOffset: 54,
                type: 'Liberal',
                text1: t('continue'),
                text2: t('swap_amount_too_low'),
                visibilityTime: 2000,
                onHide: () => {
                    setShowMinText(true);
                },
            });
        } else {
            setShowMinText(false);
        }
    }, [minimumSwapAmount]);

    return (
        <SafeAreaView
            edges={['left', 'right', 'bottom']}
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View
                style={[tailwind('w-full h-full items-center justify-center')]}>
                {/* Screen header */}
                <View
                    style={[
                        tailwind(
                            'absolute top-6 z-10 w-full flex-row items-center justify-center',
                        ),
                    ]}>
                    <PlainButton
                        onPress={handleCloseButton}
                        style={[tailwind('absolute z-10 left-6')]}>
                        <Close fill={ColorScheme.SVG.Default} />
                    </PlainButton>
                    <Text
                        style={[
                            tailwind('text-base font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {capitalizeFirst(t('continue'))}
                    </Text>
                </View>

                <View
                    style={[
                        tailwind(
                            'absolute items-center justify-center flex-row rounded-md py-1 px-4',
                        ),
                        {
                            top: 72,
                            backgroundColor: ColorScheme.Background.Greyed,
                        },
                    ]}>
                    <Text
                        style={[
                            tailwind('text-base font-bold mr-2'),
                            {color: ColorScheme.Text.DescText},
                        ]}>
                        {t('balance')}
                    </Text>
                    <View style={[tailwind('items-center')]}>
                        {displayBalance('text-base')}
                    </View>
                </View>

                {/* Minimum Sats warn */}
                {showMinText && (
                    <View style={[tailwind('absolute flex-row'), {top: 120}]}>
                        <Text
                            style={[
                                tailwind('text-sm mr-2'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {t('minimum_amount')}
                        </Text>
                        {displayMinimum('text-sm')}
                    </View>
                )}

                {/* Screen for amount */}
                <View
                    style={[
                        tailwind(
                            'w-full items-center flex justify-center flex -mt-48',
                        ),
                    ]}>
                    {/* Top unit */}
                    {!isMax && (
                        <View style={[tailwind('opacity-40 mb-2')]}>
                            {!(topUnit?.name === 'sats')
                                ? renderFiatAmount('text-base')
                                : renderSatAmount('text-base')}
                        </View>
                    )}

                    {/* Bottom unit */}
                    <View>
                        {isMax && (
                            <Text
                                style={[
                                    tailwind('text-4xl font-bold'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {capitalizeFirst(t('max'))}
                            </Text>
                        )}
                        {!isMax && (
                            <PlainButton
                                onPress={() => {
                                    swapPolarity();
                                }}>
                                {bottomUnit?.name === 'sats'
                                    ? renderSatAmount('text-4xl')
                                    : renderFiatAmount('text-4xl')}
                            </PlainButton>
                        )}
                    </View>

                    {/* Set maximum */}
                    {!loading && balance.gt(minimumSwapAmount) && (
                        <View
                            style={[
                                tailwind('rounded-full px-4 py-1 mt-6'),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                },
                            ]}>
                            <PlainButton
                                style={[
                                    tailwind(
                                        'flex-row items-center justify-center',
                                    ),
                                ]}
                                disabled={
                                    balance.toString() === satsAmount.toString()
                                }
                                onPress={triggerMax}>
                                <Text
                                    style={[
                                        tailwind('text-sm font-bold'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    {t('swap balance')}
                                </Text>
                            </PlainButton>
                        </View>
                    )}
                </View>

                {isSwapOut && displayFeeText('text-sm')}

                {/* Number pad for input amount */}
                <AmountNumpad
                    amount={amount}
                    onAmountChange={updateAmount}
                    isSats={bottomUnit.name === 'sats'}
                    maxAmount={balance.toString()}
                />

                {/* Continue button */}
                <View
                    style={[
                        tailwind('absolute'),
                        {bottom: NativeWindowMetrics.bottom},
                    ]}>
                    <PlainButton
                        disabled={
                            amount === '' ||
                            isBeyondMax ||
                            loading ||
                            balance.lt(minimumSwapAmount)
                        }
                        onPress={handleSwapRoute}>
                        <View
                            style={[
                                tailwind(
                                    `rounded-full items-center flex-row justify-center px-6 py-3 ${
                                        amount === '' ||
                                        isBeyondMax ||
                                        loading ||
                                        balance.lt(minimumSwapAmount)
                                            ? 'opacity-20'
                                            : ''
                                    }`,
                                ),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Inverted,
                                },
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm font-bold'),
                                    {
                                        color: ColorScheme.Text.Alt,
                                    },
                                ]}>
                                {bottomText}
                            </Text>
                        </View>
                    </PlainButton>
                </View>

                <Toast config={toastConfig as ToastConfig} />
            </View>
        </SafeAreaView>
    );
};

export default SwapAmount;
