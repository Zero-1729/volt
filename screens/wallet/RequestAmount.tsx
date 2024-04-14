/* eslint-disable react-native/no-inline-styles */
// TODO: probably merge into one Amount screen that routes to request screen and send screen, accordingly.
import React, {useContext, useState} from 'react';
import {useColorScheme, View, Text} from 'react-native';

import {useNavigation, CommonActions} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';

import {useTranslation} from 'react-i18next';

import BigNumber from 'bignumber.js';

import Color from '../../constants/Color';

import {AppStorageContext} from '../../class/storageContext';

import Close from '../../assets/svg/x-24.svg';

import bottomOffset from '../../constants/NativeWindowMetrics';

import {
    SATS_TO_BTC_RATE,
    capitalizeFirst,
    formatFiat,
} from '../../modules/transform';
import {openChannelFee} from '@breeztech/react-native-breez-sdk';

type DisplayUnit = {
    value: BigNumber;
    symbol: string;
    name: string;
};

import {PlainButton} from '../../components/button';
import {AmountNumpad} from '../../components/input';
import {
    DisplayFiatAmount,
    DisplaySatsAmount,
    DisplayBTCAmount,
} from '../../components/balance';
import Toast from 'react-native-toast-message';

const RequestAmount = () => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const navigation = useNavigation();

    const {t} = useTranslation('wallet');
    const {t: e} = useTranslation('errors');

    const {fiatRate, appFiatCurrency, getWalletData, currentWalletID} =
        useContext(AppStorageContext);

    const wallet = getWalletData(currentWalletID);
    const walletType = wallet.type;

    const [amount, setAmount] = useState<string>('');
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
    const [satsAmount, setSatsAmount] = useState<DisplayUnit>({
        value: new BigNumber(0),
        symbol: 'sats',
        name: 'sats',
    });
    const [fiatAmount, setFiatAmount] = useState<BigNumber>(new BigNumber(0));

    const updateAmount = (value: string) => {
        // When newly swapped, the value is reset to new number from user
        // We reset instead of preserve previous top unit value
        // because we assume the user changes unit to get a new value
        // in the new bottom unit and not to preserve the previous value

        // I.e. if the previous bottom was $20, and the user swaps to sats
        // we assume the user wants to set a different value in sats
        setAmount(value);

        setSatsAmount({
            value:
                bottomUnit.name === 'sats'
                    ? new BigNumber(value || 0)
                    : new BigNumber(calculateSatsEquivalent(value)),
            symbol: 'sats',
            name: 'sats',
        });

        setFiatAmount(
            bottomUnit.name !== 'sats'
                ? new BigNumber(value || 0)
                : calculateFiatEquivalent(value),
        );
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

    const handleRoute = async () => {
        if (walletType === 'unified') {
            const feeMsat = await openChannelFee({
                amountMsat: satsAmount.value.multipliedBy(1_000).toNumber(),
            });

            const firstTx = wallet.transactions.length === 0;

            // TODO: probably move these as info displayed somewhere in the app
            // Warn user for first tx that amount will be deducted for channel open
            // first open channel
            if (firstTx && (feeMsat.feeMsat as number) > 0) {
                Toast.show({
                    topOffset: 54,
                    type: 'Liberal',
                    text1: capitalizeFirst(t('warning')),
                    text2: e('new_channel_open_warn', {
                        n: feeMsat.feeMsat ?? 1_000 / 1_000,
                    }),
                    visibilityTime: 2000,
                });
            }

            // Warn user that amount will trigger a new channel open
            if (!firstTx && (feeMsat.feeMsat as number) > 0) {
                Toast.show({
                    topOffset: 54,
                    type: 'Liberal',
                    text1: capitalizeFirst(t('warning')),
                    text2: e('new_channel_open_warn', {
                        n: (feeMsat.feeMsat as number) / 1_000,
                    }),
                    visibilityTime: 2000,
                });
            }
        }

        navigation.dispatch(
            CommonActions.navigate({
                name: 'Receive',
                params: {
                    sats: satsAmount.value.toString(),
                    fiat: fiatAmount.toString(),
                    amount: amount,
                },
            }),
        );
    };

    // If we are in LN we shouldn't attempt to show skip since we are forcing
    // user to add an amount before generating an invoice
    const skipText =
        walletType === 'unified'
            ? capitalizeFirst(t('continue'))
            : capitalizeFirst(t('skip'));

    return (
        <SafeAreaView
            edges={['bottom', 'right', 'left']}
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View
                style={[tailwind('w-full h-full items-center justify-center')]}>
                <View
                    style={[
                        tailwind(
                            'w-5/6 items-center justify-center flex-row absolute top-6 flex',
                        ),
                    ]}>
                    <PlainButton
                        style={[tailwind('absolute left-0 z-10')]}
                        onPress={() => {
                            navigation.dispatch(CommonActions.goBack());
                        }}>
                        <Close fill={ColorScheme.SVG.Default} width={32} />
                    </PlainButton>
                    <Text
                        style={[
                            tailwind('text-sm text-center w-full font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {capitalizeFirst(t('receive'))}
                    </Text>
                </View>

                {/* Screen for amount */}
                <View
                    style={[
                        tailwind(
                            'w-full items-center flex justify-center flex -mt-48',
                        ),
                    ]}>
                    {/* Top unit */}
                    <View style={[tailwind('opacity-40 mb-2')]}>
                        {!(topUnit?.name === 'sats')
                            ? renderFiatAmount('text-base')
                            : renderSatAmount('text-base')}
                    </View>

                    {/* Bottom unit */}
                    <View>
                        <PlainButton
                            onPress={() => {
                                swapPolarity();
                            }}>
                            {bottomUnit?.name === 'sats'
                                ? renderSatAmount('text-4xl')
                                : renderFiatAmount('text-4xl')}
                        </PlainButton>
                    </View>
                </View>

                {/* Number pad for input amount */}
                <AmountNumpad
                    amount={amount}
                    onAmountChange={updateAmount}
                    isSats={bottomUnit.name === 'sats'}
                />

                {/* Continue button */}
                <View
                    style={[
                        tailwind(
                            `absolute ${
                                walletType === 'unified' &&
                                satsAmount.value.isZero()
                                    ? 'opacity-40'
                                    : ''
                            }`,
                        ),
                        {bottom: bottomOffset.bottom},
                    ]}>
                    <PlainButton
                        disabled={
                            satsAmount.value.isZero() &&
                            walletType === 'unified'
                        }
                        onPress={handleRoute}>
                        <View
                            style={[
                                tailwind(
                                    'rounded-full items-center flex-row justify-center px-6 py-3',
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
                                {satsAmount.value.isZero()
                                    ? skipText
                                    : capitalizeFirst(t('continue'))}
                            </Text>
                        </View>
                    </PlainButton>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default RequestAmount;
