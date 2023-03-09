import React, {useContext, useState} from 'react';
import {Text, View} from 'react-native';

import {useTailwind} from 'tailwind-rn';

import {PlainButton} from './button';

import {AppStorageContext} from '../class/storageContext';

import Font from '../constants/Font';

import {formatSats, formatBTC} from '../modules/transform';

import {BalanceProps} from '../types/props';
import {Unit} from '../types/wallet';

export const Balance = (props: BalanceProps) => {
    const tailwind = useTailwind();

    const {useSatSymbol, hideTotalBalance} = useContext(AppStorageContext);
    const [unit, setUnit] = useState<Unit>(props.unit);

    const toggleUnit = () => {
        if (unit.name === 'BTC') {
            setUnit({name: 'sats', symbol: 's'});
        } else {
            setUnit({name: 'BTC', symbol: '₿'});
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
                        {useSatSymbol || unit.name === 'BTC' ? (
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
                                    Font.SatSymbol,
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
                            {balance}
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
