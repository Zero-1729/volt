import React, {useContext} from 'react';
import {Text, View} from 'react-native';

import {useTailwind} from 'tailwind-rn';

import BigNumber from 'bignumber.js';

import {PlainButton} from './button';

import {AppStorageContext} from '../class/storageContext';

import Font from '../constants/Font';

import {formatSats, formatBTC} from '../modules/transform';

import {normalizeFiat} from '../modules/transform';

import {BalanceProps, TxBalanceProps, FiatBalanceProps} from '../types/props';
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

    const walletData = getWalletData(props.id);

    // Whether we are displaying fiat or not
    const isFiat =
        !(appUnit.name === 'BTC') &&
        !(appUnit.name === 'sats') &&
        !props.disableFiat &&
        fiatRate;

    // Toggle between BTC and sats
    // and fiat if enabled
    const toggleUnit = () => {
        if (appUnit.name === 'sats' && !props.disableFiat) {
            // NOTE: we do not set the unit to fiat here, as we want to keep the unit as BTC or sats
            // fiat is an exception, and is only used for display purposes
            updateAppUnit({
                name: appFiatCurrency.short,
                symbol: appFiatCurrency.symbol,
            });
        } else {
            toggleBTCtoSats();
        }
    };

    // Generic function to toggle between BTC and sats
    const toggleBTCtoSats = () => {
        if (appUnit.name === 'BTC') {
            updateAppUnit({name: 'sats', symbol: 's'});
        } else {
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
                        {useSatSymbol || isFiat || appUnit.name === 'BTC' ? (
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
                                    appUnit.name === 'sats' || props.disableFiat
                                        ? Font.SatSymbol
                                        : {},
                                ]}>
                                {appUnit.symbol}
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
                                appUnit,
                                fiatRate,
                                props.disableFiat,
                            )}
                        </Text>

                        {/* Only display 'sats' if we are set to showing sats and not using satSymbol */}
                        {!useSatSymbol && appUnit.name === 'sats' ? (
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
