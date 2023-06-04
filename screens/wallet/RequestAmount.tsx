import React, {useContext, useState} from 'react';
import {useColorScheme, View, Text} from 'react-native';

import {useNavigation, CommonActions} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';

import BigNumber from 'bignumber.js';

import Color from '../../constants/Color';

import {AppStorageContext} from '../../class/storageContext';

import Close from '../../assets/svg/x-24.svg';

import bottomOffset from '../../constants/NativeWindowMetrics';

import {formatFiat} from '../../modules/transform';

type DisplayUnit = {
    value: BigNumber;
    symbol: string;
    name: string;
};

import {PlainButton} from '../../components/button';
import {AmountNumpad} from '../../components/numpad';
import {DisplayFiatAmount, DisplaySatsAmount} from '../../components/balance';

const RequestAmount = () => {
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

    const [amount, setAmount] = useState('');

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
                        Request Amount
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

                {/* Numerpad for input amount */}
                <AmountNumpad amount={amount} onAmountChange={setAmount} />

                {/* Continue button */}
                <View
                    style={[
                        tailwind('absolute'),
                        {bottom: bottomOffset.bottom},
                    ]}>
                    <PlainButton
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate({
                                    name: 'Receive',
                                    params: {
                                        sats: satsAmount.value.toString(),
                                        fiat: fiatAmount.value.toString(),
                                        amount: amount,
                                    },
                                }),
                            );
                        }}>
                        <View
                            style={[
                                tailwind(
                                    `rounded-full items-center flex-row justify-center px-6 py-3 ${
                                        amount === '' ? 'opacity-40' : ''
                                    }`,
                                ),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Inverted,
                                },
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm mr-2 font-bold'),
                                    {
                                        color: ColorScheme.Text.Alt,
                                    },
                                ]}>
                                Continue
                            </Text>
                        </View>
                    </PlainButton>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default RequestAmount;
