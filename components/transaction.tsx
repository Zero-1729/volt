import React from 'react';
import {Text, View, Linking, useColorScheme} from 'react-native';

import {useTailwind} from 'tailwind-rn';

import BigNum from 'bignumber.js';
import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';

Dayjs.extend(calendar);
Dayjs.extend(LocalizedFormat);

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../constants/Haptic';

import {PlainButton} from './button';

import {TXBalance} from './balance';

import {TxListItemProps} from '../types/props';

import Color from '../constants/Color';

import ArrowUp from '../assets/svg/arrow-up-right-24.svg';
import ArrowDown from '../assets/svg/arrow-down-left-24.svg';

export const TransactionListItem = (props: TxListItemProps) => {
    console.info('info: ', props);
    const tailwind = useTailwind();

    const ColorScheme = Color(useColorScheme());

    const getTxTimestamp = (time: Date) => {
        const date = +new Date() - +time;

        return `${Dayjs(date).calendar()} ${Dayjs(date).format('LT')}`;
    };

    // Get hex color code
    const getHexColorCode = (v: string) => {
        return `#${v}`;
    };

    // Get URL for mempool.space
    const getURL = (txid: string) => {
        return `https://mempool.space/${
            props.tx.network === 'testnet' ? 'testnet/' : ''
        }tx/${txid}`;
    };

    return (
        <PlainButton
            onPress={() => {
                RNHapticFeedback.trigger(
                    'impactLight',
                    RNHapticFeedbackOptions,
                );

                const URL = getURL(props.tx.txid);

                Linking.openURL(URL);
            }}>
            <View
                style={[
                    tailwind(
                        'flex-row h-20 my-1 justify-between items-center w-full px-4 py-2 rounded-md',
                    ),
                    {backgroundColor: ColorScheme.Background.Greyed},
                ]}>
                <View style={[tailwind('flex-row items-center w-5/6')]}>
                    <View style={[tailwind('w-full ml-1')]}>
                        <TXBalance
                            balance={new BigNum(props.tx.value)}
                            BalanceFontSize={'text-lg'}
                            fiatRate={props.fiatRate}
                            fontColor={ColorScheme.Text.Default}
                        />
                        <Text
                            style={[
                                tailwind('text-xs'),
                                {color: ColorScheme.Text.GrayedText},
                            ]}>
                            {getTxTimestamp(props.tx.timestamp)}
                        </Text>
                    </View>
                </View>
                <View
                    style={[
                        tailwind(
                            'w-10 h-10 rounded-full items-center justify-center',
                        ),
                        {backgroundColor: ColorScheme.Background.Secondary},
                    ]}>
                    {props.tx.type === 'inbound' ? (
                        <ArrowDown
                            fill={ColorScheme.SVG.Default}
                            style={[tailwind('opacity-60')]}
                        />
                    ) : (
                        <ArrowUp
                            fill={ColorScheme.SVG.Default}
                            style={[tailwind('opacity-60')]}
                        />
                    )}
                </View>

                {/* TXID in colored string */}
                <View
                    style={[
                        tailwind(
                            'text-xs w-full items-start flex w-full absolute left-0',
                        ),
                    ]}>
                    <View
                        style={[
                            tailwind('h-1 w-1'),
                            {
                                backgroundColor: getHexColorCode(
                                    props.tx.txid.toString().slice(0, 2),
                                ),
                            },
                        ]}
                    />
                    <View
                        style={[
                            tailwind('h-1 w-1'),
                            {
                                backgroundColor: getHexColorCode(
                                    props.tx.txid.toString().slice(2, 8),
                                ),
                            },
                        ]}
                    />
                    <View
                        style={[
                            tailwind('h-1 w-1'),
                            {
                                backgroundColor: getHexColorCode(
                                    props.tx.txid.toString().slice(8, 14),
                                ),
                            },
                        ]}
                    />
                    <View
                        style={[
                            tailwind('h-1 w-1'),
                            {
                                backgroundColor: getHexColorCode(
                                    props.tx.txid.toString().slice(14, 20),
                                ),
                            },
                        ]}
                    />
                    <View
                        style={[
                            tailwind('h-1 w-1'),
                            {
                                backgroundColor: getHexColorCode(
                                    props.tx.txid.toString().slice(20, 26),
                                ),
                            },
                        ]}
                    />
                    <View
                        style={[
                            tailwind('h-1 w-1'),
                            {
                                backgroundColor: getHexColorCode(
                                    props.tx.txid.toString().slice(26, 32),
                                ),
                            },
                        ]}
                    />
                    <View
                        style={[
                            tailwind('h-1 w-1'),
                            {
                                backgroundColor: getHexColorCode(
                                    props.tx.txid.toString().slice(32, 38),
                                ),
                            },
                        ]}
                    />
                    <View
                        style={[
                            tailwind('h-1 w-1'),
                            {
                                backgroundColor: getHexColorCode(
                                    props.tx.txid.toString().slice(38, 44),
                                ),
                            },
                        ]}
                    />
                    <View
                        style={[
                            tailwind('h-1 w-1'),
                            {
                                backgroundColor: getHexColorCode(
                                    props.tx.txid.toString().slice(44, 50),
                                ),
                            },
                        ]}
                    />
                    <View
                        style={[
                            tailwind('h-1 w-1'),
                            {
                                backgroundColor: getHexColorCode(
                                    props.tx.txid.toString().slice(50, 54),
                                ),
                            },
                        ]}
                    />
                    <View
                        style={[
                            tailwind('h-1 w-1'),
                            {
                                backgroundColor: getHexColorCode(
                                    props.tx.txid.toString().slice(54, 56),
                                ),
                            },
                        ]}
                    />
                    <View
                        style={[
                            tailwind('h-1 w-1'),
                            {
                                backgroundColor: getHexColorCode(
                                    props.tx.txid.toString().slice(56, 62),
                                ),
                            },
                        ]}
                    />
                    <View
                        style={[
                            tailwind('h-1 w-1'),
                            {
                                backgroundColor: getHexColorCode(
                                    props.tx.txid.toString().slice(-2),
                                ),
                            },
                        ]}
                    />
                </View>
            </View>
        </PlainButton>
    );
};
