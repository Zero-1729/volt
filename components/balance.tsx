/* eslint-disable react-native/no-inline-styles */
import React, {useContext, useState} from 'react';
import {Text, View, useColorScheme, StyleSheet} from 'react-native';

import {useTailwind} from 'tailwind-rn';

import VText, {VTextSingle} from './text';

import BigNumber from 'bignumber.js';

import {PlainButton} from './button';

import {AppStorageContext} from '../class/storageContext';

import Color from '../constants/Color';
import Font from '../constants/Font';

import {formatSats, formatBTC} from '../modules/transform';

import {normalizeFiat} from '../modules/transform';

import {
    BalanceProps,
    TxBalanceProps,
    FiatBalanceProps,
    DisplaySatsAmountProps,
    DisplayFiatAmountProps,
} from '../types/props';
import {TFiatRate, TUnit} from '../types/wallet';
import {useTranslation} from 'react-i18next';

const _getBalance = (
    balance: BigNumber,
    unit: TUnit,
    fiatRate: TFiatRate,
    disableFiat: boolean,
) => {
    if (unit.name === 'sats') {
        return formatSats(balance);
    }

    if (unit.name === 'BTC') {
        return formatBTC(balance);
    }

    if (!disableFiat && fiatRate) {
        return normalizeFiat(balance, fiatRate.rate);
    }
};

export const TXBalance = (props: TxBalanceProps) => {
    const tailwind = useTailwind();

    const {appUnit, fiatRate} = useContext(AppStorageContext);

    const {i18n} = useTranslation('common');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    return (
        <>
            <View
                style={[
                    tailwind(
                        `${
                            langDir === 'right'
                                ? 'flex-row-reverse'
                                : 'flex-row'
                        } items-center`,
                    ),
                ]}>
                <View style={[tailwind('flex-row')]}>
                    {/* Display Satoshi symbol or Bitcoin symbol */}
                    <VTextSingle
                        style={[
                            tailwind(
                                `${props.balanceFontSize} self-start mr-2`,
                            ),
                            {
                                color: props.fontColor,
                                marginTop: appUnit.name === 'sats' ? 1.5 : 0,
                            },
                            {...Font.SatSymbol},
                        ]}>
                        {appUnit.symbol}
                    </VTextSingle>

                    {/* Display balance in sats */}
                    <VText
                        style={[
                            tailwind(
                                `${props.balanceFontSize} font-bold text-white self-baseline`,
                            ),
                            {color: props.fontColor},
                        ]}>
                        {_getBalance(props.balance, appUnit, fiatRate, false)}
                    </VText>
                </View>
            </View>
        </>
    );
};

export const Balance = (props: BalanceProps) => {
    const tailwind = useTailwind();

    const {
        hideTotalBalance,
        appFiatCurrency,
        appUnit,
        updateAppUnit,
        fiatRate,
    } = useContext(AppStorageContext);
    const [unit, setUnit] = useState(appUnit);

    const {i18n} = useTranslation('common');

    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    // Toggle between BTC and sats
    // and fiat if enabled
    const toggleUnit = () => {
        if (unit.name === 'sats' && !props.disableFiat) {
            // NOTE: we do not set the unit to fiat here, as we want to keep the unit as BTC or sats
            setUnit({
                name: appFiatCurrency.short,
                symbol: appFiatCurrency.symbol,
            });
        } else {
            toggleBTCtoSats();
        }
    };

    // Generic function to toggle between BTC and sats
    const toggleBTCtoSats = () => {
        if (unit.name === 'BTC') {
            setUnit({name: 'sats', symbol: 's'});
            updateAppUnit({name: 'sats', symbol: 's'});
        } else {
            setUnit({name: 'BTC', symbol: '₿'});
            updateAppUnit({name: 'BTC', symbol: '₿'});
        }
    };

    return (
        <View>
            {!hideTotalBalance ? (
                <PlainButton onPress={toggleUnit}>
                    <View
                        style={[
                            tailwind(
                                `flex-row items-center ${
                                    props.loading ? 'opacity-40' : ''
                                }`,
                            ),
                            {
                                justifyContent:
                                    langDir === 'right'
                                        ? 'flex-end'
                                        : 'flex-start',
                            },
                        ]}>
                        {/* Satoshi Symbol */}
                        <Text
                            numberOfLines={1}
                            style={[
                                {
                                    color: props.fontColor,
                                },
                                tailwind(
                                    `${
                                        props.balanceFontSize
                                            ? props.balanceFontSize
                                            : 'text-2xl'
                                    } self-center ${
                                        appUnit.name === 'sats' ? 'mt-0.5' : ''
                                    } mr-2`,
                                ),
                                unit.name === 'sats' || props.disableFiat
                                    ? Font.SatSymbol
                                    : {},
                            ]}>
                            {unit.symbol}
                        </Text>

                        {/* Display balance in sats or BTC */}
                        <Text
                            numberOfLines={1}
                            style={[
                                tailwind(
                                    `${
                                        props.balanceFontSize
                                            ? props.balanceFontSize
                                            : 'text-2xl'
                                    } self-center`,
                                ),
                                {
                                    color: props.fontColor,
                                },
                            ]}>
                            {_getBalance(
                                new BigNumber(props.balance),
                                unit,
                                fiatRate,
                                props.disableFiat,
                            )}
                        </Text>
                    </View>
                </PlainButton>
            ) : (
                /* Empty view to keep the card height consistent  */
                <View
                    style={[
                        styles.emptyCard,
                        tailwind(
                            'rounded-sm flex-row self-center rounded w-full h-12',
                        ),
                        {
                            opacity: props.loading ? 0.15 : 0.3,
                        },
                    ]}
                />
            )}
        </View>
    );
};

export const FiatBalance = (props: FiatBalanceProps) => {
    const tailwind = useTailwind();

    const {hideTotalBalance, appFiatCurrency, fiatRate} =
        useContext(AppStorageContext);

    const {i18n} = useTranslation('common');

    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';
    const langFlex = i18n.dir() === 'rtl' ? 'flex-end' : 'flex-start';

    const unit = {name: appFiatCurrency.short, symbol: appFiatCurrency.symbol};

    return (
        <View>
            {!(hideTotalBalance && !props.ignoreHideBalance) ? (
                <View
                    style={[
                        tailwind(
                            `flex-row items-center ${
                                props.loading ? 'opacity-20' : ''
                            }`,
                        ),
                        {justifyContent: langFlex},
                    ]}>
                    {/* Display fiat symbol */}
                    <Text
                        numberOfLines={1}
                        style={[
                            tailwind(
                                `${
                                    props.balanceFontSize
                                        ? props.balanceFontSize
                                        : 'text-2xl'
                                } self-baseline mr-2`,
                            ),
                            {color: props.fontColor, textAlign: langDir},
                        ]}>
                        {(props.amountSign ? props.amountSign + ' ' : '') +
                            unit.symbol}
                    </Text>

                    {/* Display balance in sats or BTC */}
                    <Text
                        numberOfLines={1}
                        style={[
                            tailwind(
                                `${
                                    props.balanceFontSize
                                        ? props.balanceFontSize
                                        : 'text-2xl'
                                } self-baseline`,
                            ),
                            {color: props.fontColor, textAlign: langDir},
                        ]}>
                        {_getBalance(
                            new BigNumber(props.balance),
                            unit,
                            fiatRate,
                            false,
                        )}
                    </Text>
                </View>
            ) : (
                /* Empty view to keep the card height consistent  */
                <View
                    style={[
                        tailwind(
                            'rounded-sm flex-row self-center w-full h-10 opacity-20 bg-black',
                        ),
                    ]}
                />
            )}
        </View>
    );
};

export const DisplaySatsAmount = (props: DisplaySatsAmountProps) => {
    const ColorScheme = Color(useColorScheme());
    const tailwind = useTailwind();

    const {i18n} = useTranslation('common');

    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    return (
        <View style={[tailwind('flex-row')]}>
            {props.isApprox && (
                <Text
                    style={[
                        tailwind('self-center'),
                        {
                            color: props.textColor
                                ? props.textColor
                                : ColorScheme.Text.Default,
                            textAlign: langDir,
                        },
                    ]}>
                    ~{' '}
                </Text>
            )}
            <Text
                numberOfLines={1}
                style={[
                    tailwind(`${props.fontSize} self-center mt-0.5 mr-2`),
                    {
                        color: props.textColor
                            ? props.textColor
                            : ColorScheme.Text.Default,
                        textAlign: langDir,
                    },
                    Font.SatSymbol,
                ]}>
                s
            </Text>

            <Text
                style={[
                    tailwind(`${props.fontSize} self-center font-bold`),
                    {
                        color: props.textColor
                            ? props.textColor
                            : ColorScheme.Text.Default,
                        textAlign: langDir,
                    },
                ]}>
                {props.amount.isZero() ? '0' : formatSats(props.amount)}
            </Text>
        </View>
    );
};

export const DisplayFiatAmount = (props: DisplayFiatAmountProps) => {
    const ColorScheme = Color(useColorScheme());
    const tailwind = useTailwind();

    return (
        <View
            style={[
                tailwind('rounded-full items-center flex-row justify-center'),
            ]}>
            <Text
                style={[
                    tailwind(`mr-2 font-bold ${props.fontSize}`),
                    {color: ColorScheme.Text.Default},
                ]}>
                {props.isApprox ? '~' : ''}
                {props.symbol}
            </Text>
            <Text
                style={[
                    tailwind(`font-bold ${props.fontSize}`),
                    {color: ColorScheme.Text.Default},
                ]}>
                {props.amount}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    emptyCard: {
        backgroundColor: 'darkgrey',
    },
});
