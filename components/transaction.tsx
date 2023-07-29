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
    const tailwind = useTailwind();

    const ColorScheme = Color(useColorScheme());

    const getTxTimestamp = (time: Date) => {
        const date = +time * 1000;
        const isToday = Dayjs(date).isSame(Dayjs(), 'day');

        return isToday ? Dayjs(date).calendar() : Dayjs(date).format('LLL');
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
                        'flex-row h-20 mb-1 justify-between items-center w-full px-6 py-2 rounded-md',
                    ),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <View style={[tailwind('flex-row items-center w-5/6')]}>
                    <View style={[tailwind('w-full ml-1')]}>
                        <TXBalance
                            balance={new BigNum(props.tx.value)}
                            BalanceFontSize={'text-lg'}
                            fontColor={ColorScheme.Text.Default}
                        />
                        <Text
                            style={[
                                tailwind('text-xs'),
                                {color: ColorScheme.Text.GrayedText},
                            ]}>
                            {props.tx.confirmed
                                ? getTxTimestamp(props.tx.timestamp)
                                : 'Unconfirmed'}
                        </Text>
                    </View>
                </View>
                <View
                    style={[
                        tailwind(
                            'w-10 h-10 rounded-full items-center justify-center',
                        ),
                        {
                            backgroundColor:
                                props.tx.type === 'inbound'
                                    ? ColorScheme.Background.Received
                                    : ColorScheme.Background.Sent,
                        },
                    ]}>
                    {props.tx.type === 'inbound' ? (
                        <ArrowDown
                            fill={ColorScheme.SVG.Received}
                            style={[tailwind('opacity-80')]}
                        />
                    ) : (
                        <ArrowUp
                            fill={ColorScheme.SVG.Sent}
                            style={[tailwind('opacity-80')]}
                        />
                    )}
                </View>
            </View>
        </PlainButton>
    );
};
