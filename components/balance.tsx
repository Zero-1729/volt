/* eslint-disable react-native/no-inline-styles */
import React, {useContext} from 'react';
import {Text, View, useColorScheme} from 'react-native';

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
import {TRateObject, TUnit} from '../types/wallet';
import {useTranslation} from 'react-i18next';

const _getBalance = (
    balance: BigNumber,
    unit: TUnit,
    fiatRate: TRateObject,
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
    const {appUnit, fiatRate} = useContext(AppStorageContext);

    const {i18n} = useTranslation('common');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';
    const fontFamily = appUnit.name === 'sats' ? {...Font.SatSymbol} : {};

    return (
        <>
            <View
                className={`${langDir === 'right' ? 'flex-row-reverse' : 'flex-row'} items-center`}>
                <View className="flex-row">
                    {/* Display Satoshi symbol or Bitcoin symbol */}
                    <VTextSingle
                        className={`${props.balanceFontSize} self-start mr-2`}
                        style={[
                            {
                                color: props.fontColor,
                                marginTop: appUnit.name === 'sats' ? 1.5 : 0,
                            },
                            fontFamily,
                        ]}>
                        {appUnit.symbol}
                    </VTextSingle>

                    {/* Display balance in sats */}
                    <VText
                        className={`${props.balanceFontSize} font-bold text-white self-baseline`}
                        style={[
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
    const {
        hideTotalBalance,
        appFiatCurrency,
        appUnit,
        updateAppUnit,
        fiatRate,
    } = useContext(AppStorageContext);

    const {i18n} = useTranslation('common');

    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    // Toggle between BTC and sats
    // and fiat if enabled
    const toggleUnit = () => {
        if (props.disabled) {
            return;
        }

        if (appUnit.name === 'sats') {
            updateAppUnit({
                name: appFiatCurrency.short,
                symbol: appFiatCurrency.symbol,
            });
        } else {
            // Toggle between BTC and sats
            if (appUnit.name === 'BTC') {
                updateAppUnit({name: 'sats', symbol: 's'});
            } else {
                updateAppUnit({name: 'BTC', symbol: '₿'});
            }
        }
    };

    return (
        <View>
            <PlainButton onPress={toggleUnit} disabled={props.disabled}>
                    <View
                        className={`flex-row items-center ${
                                props.loading ? 'opacity-40' : ''
                            }`}
                        style={[
                            {
                                justifyContent:
                                    langDir === 'right'
                                        ? 'flex-end'
                                        : 'flex-start',
                            },
                        ]}>
                        {/* Satoshi Symbol */}
                        {!hideTotalBalance && <Text
                            className={`${
                                    props.balanceFontSize
                                        ? props.balanceFontSize
                                        : 'text-2xl'
                                } self-center ${
                                    appUnit.name === 'sats' ? 'mt-0.5' : ''
                                } mr-2`}
                            numberOfLines={1}
                            style={[
                                {
                                    color: props.fontColor,
                                },
                                appUnit.name === 'sats' ? Font.SatSymbol : {},
                            ]}>
                            {appUnit.symbol}
                        </Text>}

                        {/* Display balance in sats or BTC */}
                        <Text
                            className={`${
                                    props.balanceFontSize
                                        ? props.balanceFontSize
                                        : 'text-2xl'
                                } self-center`}
                            numberOfLines={1}
                            style={[
                                {
                                    color: props.fontColor,
                                },
                            ]}>
                            {hideTotalBalance ? '****' : _getBalance(
                                new BigNumber(props.balance),
                                appUnit,
                                fiatRate,
                                props.disableFiat,
                            )}
                        </Text>
                    </View>
                </PlainButton>
        </View>
    );
};

export const FiatBalance = (props: FiatBalanceProps) => {
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
                    className={`flex-row items-center ${
                            props.loading ? 'opacity-20' : ''
                        }`}
                    style={[
                        {justifyContent: langFlex},
                    ]}>
                    {/* Display fiat symbol */}
                    <Text
                        className={`${
                                props.balanceFontSize
                                    ? props.balanceFontSize
                                    : 'text-2xl'
                            } self-baseline mr-2`}
                        numberOfLines={1}
                        style={[
                            {color: props.fontColor, textAlign: langDir},
                        ]}>
                        {(props.amountSign ? props.amountSign + ' ' : '') +
                            unit.symbol}
                    </Text>

                    {/* Display balance in sats or BTC */}
                    <Text
                        className={`${
                                props.balanceFontSize
                                    ? props.balanceFontSize
                                    : 'text-2xl'
                            } self-baseline`}
                        numberOfLines={1}
                        style={[
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
                <View className="rounded-sm flex-row self-center w-full h-10 opacity-20 bg-black"/>
            )}
        </View>
    );
};

export const DisplayBTCAmount = (props: DisplaySatsAmountProps) => {
    const ColorScheme = Color(useColorScheme());
    const {i18n} = useTranslation('common');

    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    return (
        <View className="flex-row">
            {props.isApprox && (
                <Text
                    className="self-center"
                    style={{
                            color: props.textColor
                                ? props.textColor
                                : ColorScheme.Text.Default,
                            textAlign: langDir,
                        }}>
                    ~{' '}
                </Text>
            )}
            <Text
                className={`${props.fontSize} self-center mt-0.5 mr-2`}
                numberOfLines={1}
                style={{
                        color: props.textColor
                            ? props.textColor
                            : ColorScheme.Text.Default,
                        textAlign: langDir,
                    }}>
                ₿
            </Text>

            <Text
                className={`${props.fontSize} self-center font-bold`}
                style={{
                        color: props.textColor
                            ? props.textColor
                            : ColorScheme.Text.Default,
                        textAlign: langDir,
                    }}>
                {props.amount.isZero() ? '0' : formatBTC(props.amount)}
            </Text>
        </View>
    );
};

export const DisplaySatsAmount = (props: DisplaySatsAmountProps) => {
    const ColorScheme = Color(useColorScheme());
    const {i18n} = useTranslation('common');

    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    return (
        <View className="flex-row">
            {props.isApprox && (
                <Text
                    className="self-center"
                    style={{
                            color: props.textColor
                                ? props.textColor
                                : ColorScheme.Text.Default,
                            textAlign: langDir,
                        }}>
                    ~{' '}
                </Text>
            )}
            <Text
                className={`${props.fontSize} self-center mt-0.5 mr-2`}
                numberOfLines={1}
                style={[
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
                className={`${props.fontSize} self-center font-bold`}
                style={{
                        color: props.textColor
                            ? props.textColor
                            : ColorScheme.Text.Default,
                        textAlign: langDir,
                    }}>
                {props.amount.isZero() ? '0' : formatSats(props.amount)}
            </Text>
        </View>
    );
};

export const DisplayFiatAmount = (props: DisplayFiatAmountProps) => {
    const ColorScheme = Color(useColorScheme());

    const {appFiatCurrency} = useContext(AppStorageContext);

    return (
        <View className="rounded-full items-center flex-row justify-center">
            <Text
                className={`mr-2 font-bold ${props.fontSize}`}
                style={{
                        color: props.textColor
                            ? props.textColor
                            : ColorScheme.Text.Default,
                    }}>
                {props.isApprox ? '~' : ''}
                {appFiatCurrency.symbol}
            </Text>
            <Text
                className={`font-bold ${props.fontSize}`}
                style={{
                        color: props.textColor
                            ? props.textColor
                            : ColorScheme.Text.Default,
                    }}>
                {props.amount}
            </Text>
        </View>
    );
};
