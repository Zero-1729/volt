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

    const {useSatSymbol, hideTotalBalance, appUnit, fiatRate} =
        useContext(AppStorageContext);

    return (
        <>
            {!hideTotalBalance ? (
                <View style={[tailwind('flex-row items-center')]}>
                    {/* Display satSymbol if enabled in settings.
                    Hide and fallback to 'sats' below if satSymbol is disabled in settings */}
                    {useSatSymbol ? (
                        <Text
                            numberOfLines={1}
                            style={[
                                tailwind(
                                    `${props.BalanceFontSize} font-bold self-baseline mr-2`,
                                ),
                                {color: props.fontColor},
                                Font.SatSymbol,
                            ]}>
                            s
                        </Text>
                    ) : (
                        <></>
                    )}

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

                    {/* Only display 'sats' if we are using satSymbol */}
                    {!useSatSymbol ? (
                        <Text
                            style={[
                                tailwind('text-xl self-baseline text-white'),
                            ]}>
                            {' '}
                            sats
                        </Text>
                    ) : (
                        <></>
                    )}
                </View>
            ) : (
                /* Empty view to keep the card height consistent  */
                <View
                    style={[
                        tailwind(
                            'rounded flex-row self-center w-full h-6 opacity-10 bg-black mb-1',
                        ),
                    ]}
                />
            )}
        </>
    );
};

export const Balance = (props: BalanceProps) => {
    const tailwind = useTailwind();

    const {
        useSatSymbol,
        hideTotalBalance,
        getWalletData,
        appFiatCurrency,
        appUnit,
        updateAppUnit,
        fiatRate,
    } = useContext(AppStorageContext);
    const [unit, setUnit] = useState(appUnit);

    const walletData = getWalletData(props.id);

    // Whether we are displaying fiat or not
    const isFiat =
        !(unit.name === 'BTC') &&
        !(unit.name === 'sats') &&
        !props.disableFiat &&
        fiatRate;

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
                        {/* Display satSymbol if enabled in settings, otherwise display BTC or Fiat symbol (if enabled).
                        Hide and fallback to 'sats' below if unit is sats and satSymbol is disabled in settings */}
                        {useSatSymbol || isFiat || unit.name === 'BTC' ? (
                            <Text
                                numberOfLines={1}
                                style={[
                                    tailwind(
                                        `${
                                            props.BalanceFontSize
                                                ? props.BalanceFontSize
                                                : 'text-2xl'
                                        } self-baseline mr-2 text-white`,
                                    ),
                                    unit.name === 'sats' || props.disableFiat
                                        ? Font.SatSymbol
                                        : {},
                                ]}>
                                {unit.symbol}
                            </Text>
                        ) : (
                            <></>
                        )}

                        {/* Display balance in sats or BTC */}
                        <Text
                            numberOfLines={1}
                            style={[
                                tailwind(
                                    `${
                                        props.BalanceFontSize
                                            ? props.BalanceFontSize
                                            : 'text-2xl'
                                    } text-white self-baseline`,
                                ),
                            ]}>
                            {_getBalance(
                                new BigNumber(walletData.balance),
                                unit,
                                fiatRate,
                                props.disableFiat,
                            )}
                        </Text>

                        {/* Only display 'sats' if we are set to showing sats and not using satSymbol */}
                        {!useSatSymbol && unit.name === 'sats' ? (
                            <Text
                                style={[
                                    tailwind(
                                        'text-xl self-baseline text-white',
                                    ),
                                ]}>
                                {' '}
                                sats
                            </Text>
                        ) : (
                            <></>
                        )}
                    </View>
                </PlainButton>
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

    const {useSatSymbol} = useContext(AppStorageContext);

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
            {useSatSymbol ? (
                <Text
                    numberOfLines={1}
                    style={[
                        tailwind(
                            `${props.fontSize} font-bold self-baseline mr-2`,
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
                    tailwind(`${props.fontSize} font-bold`),
                    {color: ColorScheme.Text.Default},
                ]}>
                {props.amount.isZero() ? '0' : formatSats(props.amount)}
            </Text>
            {!useSatSymbol ? (
                <Text
                    style={[
                        tailwind(`${props.fontSize} font-bold`),
                        {color: ColorScheme.Text.Default},
                    ]}>
                    {' '}
                    sats
                </Text>
            ) : (
                <></>
            )}
        </View>
    );
};
