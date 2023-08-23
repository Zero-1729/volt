/* eslint-disable react-native/no-inline-styles */
import React, {useContext, useState} from 'react';
import {Text, View, useColorScheme} from 'react-native';

import {useTailwind} from 'tailwind-rn';

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
import {FiatRate, Unit} from '../types/wallet';

const _getBalance = (
    balance: BigNumber,
    unit: Unit,
    fiatRate: FiatRate,
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

    return (
        <>
            <View style={[tailwind('flex-row items-center')]}>
                {/* Display Satoshi symbol or Bitcoin symbol */}
                <Text
                    numberOfLines={1}
                    style={[
                        tailwind(
                            `${props.BalanceFontSize} font-bold self-start mr-2`,
                        ),
                        {color: props.fontColor},
                        {marginTop: appUnit.name === 'sats' ? 1 : 0},
                        Font.SatSymbol,
                    ]}>
                    {appUnit.symbol}
                </Text>

                {/* Display balance in sats */}
                <Text
                    numberOfLines={1}
                    style={[
                        tailwind(
                            `${props.BalanceFontSize} font-bold text-white self-baseline`,
                        ),
                        {color: props.fontColor},
                    ]}>
                    {_getBalance(props.balance, appUnit, fiatRate, false)}
                </Text>
            </View>
        </>
    );
};

export const Balance = (props: BalanceProps) => {
    const tailwind = useTailwind();

    const {
        hideTotalBalance,
        getWalletData,
        appFiatCurrency,
        appUnit,
        updateAppUnit,
        fiatRate,
    } = useContext(AppStorageContext);
    const [unit, setUnit] = useState(appUnit);

    const walletData = getWalletData(props.id);

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
                        ]}>
                        {/* Satoshi Symbol */}
                        <Text
                            numberOfLines={1}
                            style={[
                                tailwind(
                                    `${
                                        props.BalanceFontSize
                                            ? props.BalanceFontSize
                                            : 'text-2xl'
                                    } self-center ${
                                        appUnit.name === 'sats' ? 'mt-0.5' : ''
                                    } mr-2 text-white`,
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
                                        props.BalanceFontSize
                                            ? props.BalanceFontSize
                                            : 'text-2xl'
                                    } text-white self-center`,
                                ),
                            ]}>
                            {_getBalance(
                                new BigNumber(walletData.balance),
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
                        tailwind(
                            'rounded-sm flex-row self-center rounded w-full h-12',
                        ),
                        {
                            opacity: props.loading ? 0.15 : 0.3,
                            backgroundColor: 'darkgrey',
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

    const unit = {name: appFiatCurrency.short, symbol: appFiatCurrency.symbol};

    return (
        <View>
            {!hideTotalBalance ? (
                <View
                    style={[
                        tailwind(
                            `flex-row items-center ${
                                props.loading ? 'opacity-20' : ''
                            }`,
                        ),
                    ]}>
                    {/* Display fiat symbol */}
                    <Text
                        numberOfLines={1}
                        style={[
                            tailwind(
                                `${
                                    props.BalanceFontSize
                                        ? props.BalanceFontSize
                                        : 'text-2xl'
                                } self-baseline mr-2`,
                            ),
                            {color: props.fontColor},
                        ]}>
                        {(props.showMinus ? '- ' : '') + unit.symbol}
                    </Text>

                    {/* Display balance in sats or BTC */}
                    <Text
                        numberOfLines={1}
                        style={[
                            tailwind(
                                `${
                                    props.BalanceFontSize
                                        ? props.BalanceFontSize
                                        : 'text-2xl'
                                } self-baseline`,
                            ),
                            {color: props.fontColor},
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

    return (
        <View style={[tailwind('flex-row')]}>
            {props.isApprox ? (
                <Text
                    style={[
                        tailwind('self-center'),
                        {color: ColorScheme.Text.Default},
                    ]}>
                    ~{' '}
                </Text>
            ) : (
                <></>
            )}
            <Text
                numberOfLines={1}
                style={[
                    tailwind(
                        `${props.fontSize} font-bold self-center mt-0.5 mr-2`,
                    ),
                    {color: ColorScheme.Text.Default},
                    Font.SatSymbol,
                ]}>
                s
            </Text>

            <Text
                style={[
                    tailwind(`${props.fontSize} self-center font-bold`),
                    {color: ColorScheme.Text.Default},
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
