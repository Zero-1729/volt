import {Text, View, Pressable, useColorScheme} from 'react-native';
import React from 'react';

import {useTailwind} from 'tailwind-rn';

import {PlainButton} from './button';

import bottomOffset from '../constants/NativeWindowMetrics';

import Color from '../constants/Color';

import LeftArrow from '../assets/svg/chevron-left-24.svg';

import {NumpadRequestInputProps} from '../types/props';

export const AmountNumpad = (props: NumpadRequestInputProps) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const addDecimalPoint = (text: string) => {
        // Do not allow decimal point to be added if amount in sats
        if (props.isSats) {
            return text;
        }

        // Do not allow decimal point to be added if it already exists
        if (text.includes('.')) {
            return text;
        }

        return text + '.';
    };

    const safelyConcat = (text: string, char: string) => {
        // Can't go beyond 8 decimal places
        if (text.split('.')[1]?.length >= 8) {
            return text;
        }

        return text + char;
    };

    return (
        <View
            style={[
                tailwind('absolute w-full items-center justify-center flex'),
                {bottom: bottomOffset.bottomButtonOffset + 68},
            ]}>
            {/* Row 0 */}
            <View style={[tailwind('w-full flex-row mb-4')]}>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyConcat(props.amount, '1'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        1
                    </Text>
                </PlainButton>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyConcat(props.amount, '2'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        2
                    </Text>
                </PlainButton>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyConcat(props.amount, '3'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        3
                    </Text>
                </PlainButton>
            </View>

            {/* Row 1 */}
            <View style={[tailwind('w-full flex-row mb-4')]}>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyConcat(props.amount, '4'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        4
                    </Text>
                </PlainButton>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyConcat(props.amount, '5'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        5
                    </Text>
                </PlainButton>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyConcat(props.amount, '6'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        6
                    </Text>
                </PlainButton>
            </View>

            {/* Row 2 */}
            <View style={[tailwind('w-full flex-row mb-4')]}>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyConcat(props.amount, '7'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        7
                    </Text>
                </PlainButton>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyConcat(props.amount, '8'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        8
                    </Text>
                </PlainButton>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyConcat(props.amount, '9'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        9
                    </Text>
                </PlainButton>
            </View>

            {/* Row 3 */}
            <View style={[tailwind('w-full flex-row')]}>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(addDecimalPoint(props.amount));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        .
                    </Text>
                </PlainButton>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyConcat(props.amount, '0'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        0
                    </Text>
                </PlainButton>
                <Pressable
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(props.amount.slice(0, -1));
                    }}
                    onLongPress={() => {
                        props.onAmountChange('');
                    }}>
                    <LeftArrow fill={ColorScheme.SVG.Default} />
                </Pressable>
            </View>
        </View>
    );
};
