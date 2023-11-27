// TODO: probably merge into one Amount screen that routes to request screen and send screen, accordingly.
import React, {useContext, useState} from 'react';
import {useColorScheme, View, Text} from 'react-native';

import {useNavigation, CommonActions} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

import {useTailwind} from 'tailwind-rn';

import BigNumber from 'bignumber.js';

import Color from '../../constants/Color';

import {AppStorageContext} from '../../class/storageContext';

import Close from '../../assets/svg/x-24.svg';

import bottomOffset from '../../constants/NativeWindowMetrics';

import {formatFiat, normalizeFiat} from '../../modules/transform';

type DisplayUnit = {
    value: BigNumber;
    symbol: string;
    name: string;
};

import {PlainButton} from '../../components/button';
import {AmountNumpad} from '../../components/input';
import {DisplayFiatAmount, DisplaySatsAmount} from '../../components/balance';

type Props = NativeStackScreenProps<WalletParamList, 'SendAmount'>;

const SendAmount = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const navigation = useNavigation();

    const {fiatRate, appFiatCurrency} = useContext(AppStorageContext);

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
    const [fiatAmount, setFiatAmount] = useState<DisplayUnit>({
        value: new BigNumber(0),
        symbol: appFiatCurrency.symbol,
        name: appFiatCurrency.short,
    });

    const isMax = amount === route.params.wallet.balance.toString();

    const isOverBalance = new BigNumber(satsAmount.value).gt(
        route.params.wallet.balance,
    );

    const triggerMax = () => {
        const maxSats = route.params.wallet.balance.toString();

        setAmount(maxSats);

        setSatsAmount({
            value: new BigNumber(maxSats),
            symbol: 'sats',
            name: 'sats',
        });

        setFiatAmount({
            value: calculateFiatEquivalent(maxSats),
            symbol: appFiatCurrency.symbol,
            name: appFiatCurrency.short,
        });
    };

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

        setFiatAmount({
            value:
                bottomUnit.name !== 'sats'
                    ? new BigNumber(value || 0)
                    : calculateFiatEquivalent(value),
            symbol: appFiatCurrency.symbol,
            name: appFiatCurrency.short,
        });
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
                    amount={formatFiat(fiatAmount.value)}
                    isApprox={topUnit?.name !== 'sats' && amount.length > 0}
                    fontSize={fontSize}
                    symbol={fiatAmount?.symbol}
                />
            </>
        );
    };

    const renderSatAmount = (fontSize: string) => {
        return (
            <DisplaySatsAmount
                amount={satsAmount.value}
                fontSize={fontSize}
                isApprox={bottomUnit.name !== 'sats' && amount.length > 0}
            />
        );
    };

    const displayBalance = (fontSize: string) => {
        const bottomUnitSats = bottomUnit?.name === 'sats';
        const rawBalance = new BigNumber(route.params.wallet.balance); // sats
        const fiatBalance = normalizeFiat(rawBalance, fiatRate.rate);

        return bottomUnitSats ? (
            <DisplaySatsAmount
                amount={rawBalance}
                fontSize={fontSize}
                isApprox={bottomUnit.name !== 'sats' && amount.length > 0}
            />
        ) : (
            <DisplayFiatAmount
                amount={fiatBalance}
                fontSize={fontSize}
                isApprox={topUnit?.name !== 'sats' && amount.length > 0}
                symbol={fiatAmount?.symbol}
            />
        );
    };

    return (
        <SafeAreaView edges={['bottom', 'right', 'left']}>
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
                        Send
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
                                Max
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
                    {!isMax && (
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
                                    route.params.wallet.balance.toString() ===
                                    satsAmount.value.toString()
                                }
                                onPress={triggerMax}>
                                <Text
                                    style={[
                                        tailwind('text-sm font-bold mr-2'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    Use Max
                                </Text>
                                <View style={[tailwind('justify-center')]}>
                                    {displayBalance('text-sm')}
                                </View>
                            </PlainButton>
                        </View>
                    )}
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
                        tailwind('absolute'),
                        {bottom: bottomOffset.bottom},
                    ]}>
                    <PlainButton
                        disabled={amount === '' || isOverBalance}
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate('WalletRoot', {
                                    screen: 'Send',
                                    params: {
                                        invoiceData: {
                                            ...route.params.invoiceData,
                                            options: {
                                                amount: satsAmount.value.toString(),
                                            },
                                        },
                                        wallet: route.params.wallet,
                                    },
                                }),
                            );
                        }}>
                        <View
                            style={[
                                tailwind(
                                    `rounded-full items-center flex-row justify-center px-6 py-3 ${
                                        amount === '' || isOverBalance
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
                                {'Continue'}
                            </Text>
                        </View>
                    </PlainButton>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default SendAmount;
