import React, {useContext, useState} from 'react';
import {useColorScheme, View, Text, Pressable} from 'react-native';

import {useNavigation, CommonActions} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';

import BigNumber from 'bignumber.js';

import Color from '../../constants/Color';

import {AppStorageContext} from '../../class/storageContext';

import Close from '../../assets/svg/x-24.svg';

import bottomOffset from '../../constants/NativeWindowMetrics';

import Font from '../../constants/Font';

import {formatSats} from '../../modules/transform';

import {PlainButton} from '../../components/button';
import {AmountNumpad} from '../../components/numpad';

const RequestAmount = () => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const navigation = useNavigation();

    const {useSatSymbol} = useContext(AppStorageContext);

    const [amount, setAmount] = useState('');

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
                            'w-full items-center flex-row justify-center flex -mt-48',
                        ),
                    ]}>
                    {useSatSymbol ? (
                        <Text
                            numberOfLines={1}
                            style={[
                                tailwind(
                                    'text-3xl font-bold self-baseline mr-2',
                                ),
                                {color: ColorScheme.Text.Default},
                                Font.SatSymbol,
                            ]}>
                            s
                        </Text>
                    ) : (
                        <></>
                    )}
                    <Text
                        style={[
                            tailwind('text-3xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {amount.length > 0
                            ? formatSats(new BigNumber(amount))
                            : '0'}
                    </Text>
                    {!useSatSymbol ? (
                        <Text
                            style={[
                                tailwind('text-2xl font-bold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {' '}
                            sats
                        </Text>
                    ) : (
                        <></>
                    )}
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
                                    params: {amount: amount},
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
