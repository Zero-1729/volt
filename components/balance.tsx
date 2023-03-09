import React, {useContext} from 'react';
import {Text, View} from 'react-native';

import {useTailwind} from 'tailwind-rn';

import {PlainButton} from './button';

import {AppStorageContext} from '../class/storageContext';

import Font from '../constants/Font';

import {formatSats, formatBTC} from '../modules/transform';

import {BalanceProps} from '../types/props';

export const Balance = (props: BalanceProps) => {
    const tailwind = useTailwind();

    const {
        useSatSymbol,
        hideTotalBalance,
    } = useContext(AppStorageContext);

    const walletData = getWalletData(props.id);

    const toggleUnit = () => {
        if (walletData.units.name === 'BTC') {
            updateWalletUnit(props.id, {name: 'sats', symbol: 's'});
        } else if (walletData.units.name === 'sats' && !props.disableFiat) {
            // Toggle to fiat is sats
            updateWalletUnit(props.id, {
                name: appFiatCurrency.short,
                symbol: appFiatCurrency.symbol,
            });
        } else {
            // If sats, toggle to BTC
            updateWalletUnit(props.id, {name: 'BTC', symbol: '₿'});
        }
    };

    const balance =
        unit.name === 'sats'
            ? formatSats(props.walletBalance)
            : formatBTC(props.walletBalance);

    return (
        <View>
            {!hideTotalBalance ? (
                <PlainButton onPress={toggleUnit}>
                    <View style={[tailwind('flex-row items-center')]}>
                        {/* Display satSymbol if enabled in settings, otherwise default to 'BTC' symbol or just 'sats' */}
                        {useSatSymbol || walletData.units.name === 'BTC' ? (
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
                                    walletData.units.name === 'sats' ||
                                ]}>
                                {walletData.units.symbol}
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
                            {balance}
                        </Text>

                        {/* Only display 'sats' if we are set to showing sats and not using satSymbol */}
                        {!useSatSymbol && walletData.units.name === 'sats' ? (
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
