import React, {useContext, useState} from 'react';
import {Text, View} from 'react-native';

import {useTailwind} from 'tailwind-rn';

import BigNumber from 'bignumber.js';

import {PlainButton} from './button';

import {AppStorageContext} from '../class/storageContext';

import Font from '../constants/Font';

import {formatSats, formatBTC} from '../modules/transform';

import {normalizeFiat} from '../modules/transform';

import {BalanceProps, TxBalanceProps} from '../types/props';
import {BalanceType} from '../types/wallet';

export const TXBalance = (props: TxBalanceProps) => {
    const tailwind = useTailwind();

    const {useSatSymbol, hideTotalBalance} = useContext(AppStorageContext);

    const getBalance = (balance: BalanceType) => {
        return formatSats(balance);
    };

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
                        {getBalance(props.balance)}
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
        updateWalletUnit,
        getWalletData,
        appFiatCurrency,
    } = useContext(AppStorageContext);

    const walletData = getWalletData(props.id);

    // Use this temporarily from wallet data
    const [unit, setUnit] = useState(walletData.units);

    // Whether we are displaying fiat or not
    const isFiat =
        !(unit.name === 'BTC') &&
        !(unit.name === 'sats') &&
        !props.disableFiat &&
        props.fiatRate;

    // Toggle between BTC and sats
    // and fiat if enabled
    const toggleUnit = () => {
        if (unit.name === 'sats' && !props.disableFiat) {
            // NOTE: we do not set the unit to fiat here, as we want to keep the unit as BTC or sats
            // fiat is an exception, and is only used for display purposes
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
            updateWalletUnit(props.id, {name: 'sats', symbol: 's'});
        } else {
            setUnit({name: 'BTC', symbol: '₿'});
            updateWalletUnit(props.id, {name: 'BTC', symbol: '₿'});
        }
    };

    const getBalance = () => {
        if (unit.name === 'sats') {
            return formatSats(new BigNumber(walletData.balance));
        }

        if (unit.name === 'BTC') {
            return formatBTC(new BigNumber(walletData.balance));
        }

        if (!props.disableFiat && props.fiatRate) {
            return normalizeFiat(
                new BigNumber(walletData.balance),
                props.fiatRate.rate,
            );
        } else {
            console.error(
                '[Balance Component] No fiat rate provided for fiat balance',
            );
        }
    };

    return (
        <View>
            {!hideTotalBalance ? (
                <PlainButton onPress={toggleUnit}>
                    <View style={[tailwind('flex-row items-center')]}>
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
                            {getBalance()}
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
