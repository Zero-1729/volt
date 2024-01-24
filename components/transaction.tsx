/* eslint-disable react-native/no-inline-styles */
import React, {useContext} from 'react';
import {View, useColorScheme} from 'react-native';

import {useTailwind} from 'tailwind-rn';

import VText from './text';

import BigNum from 'bignumber.js';

import {AppStorageContext} from '../class/storageContext';

import {PlainButton} from './button';

import {TXBalance} from './balance';

import {TxListItemProps} from '../types/props';

import Color from '../constants/Color';

import ArrowUp from '../assets/svg/arrow-up-right-24.svg';
import ArrowDown from '../assets/svg/arrow-down-left-24.svg';
import {useTranslation} from 'react-i18next';

import {capitalizeFirst, formatLocaleDate} from '../modules/transform';

export const TransactionListItem = (props: TxListItemProps) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const {isAdvancedMode} = useContext(AppStorageContext);

    const getTxTimestamp = (time: Date) => {
        return formatLocaleDate(i18n.language, time);
    };

    return (
        <PlainButton
            onPress={() => {
                props.callback ? props.callback() : null;
            }}>
            <View
                style={[
                    tailwind(
                        `${
                            langDir === 'right'
                                ? 'flex-row-reverse'
                                : 'flex-row'
                        } h-20 mb-1 justify-between items-center w-full px-6 py-2 rounded-md`,
                    ),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <View
                    style={[
                        tailwind(
                            `flex-row items-center ${
                                props.tx.isSelfOrBoost ? 'w-full' : 'w-5/6'
                            }`,
                        ),
                        {
                            marginLeft: props.tx.isSelfOrBoost ? -12 : 0,
                        },
                    ]}>
                    <View style={[tailwind('w-full ml-1')]}>
                        {props.tx.isSelfOrBoost ? (
                            <View style={[tailwind('')]}>
                                <VText
                                    style={[
                                        tailwind('text-lg font-bold'),
                                        {color: ColorScheme.Text.GrayedText},
                                    ]}>
                                    {isAdvancedMode
                                        ? 'RBF Fee Boost'
                                        : 'Fee Boost'}
                                </VText>
                            </View>
                        ) : (
                            <TXBalance
                                balance={new BigNum(props.tx.value)}
                                balanceFontSize={'text-lg'}
                                fontColor={ColorScheme.Text.Default}
                            />
                        )}
                        <VText
                            style={[
                                tailwind('text-xs'),
                                {color: ColorScheme.Text.GrayedText},
                            ]}>
                            {props.tx.confirmed
                                ? getTxTimestamp(props.tx.timestamp)
                                : capitalizeFirst(t('unconfirmed'))}
                        </VText>
                    </View>
                </View>
                {!props.tx.isSelfOrBoost ? (
                    <View
                        style={[
                            tailwind(
                                'w-10 h-10 rounded-full items-center justify-center opacity-80',
                            ),
                            {
                                backgroundColor:
                                    ColorScheme.Background.Secondary,
                            },
                        ]}>
                        {props.tx.type === 'inbound' ? (
                            <ArrowDown fill={ColorScheme.SVG.Received} />
                        ) : (
                            <ArrowUp fill={ColorScheme.SVG.Sent} />
                        )}
                    </View>
                ) : (
                    <></>
                )}
            </View>
        </PlainButton>
    );
};
