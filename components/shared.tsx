/* eslint-disable react-native/no-inline-styles */
import React, {useContext} from 'react';
import {StyleSheet, Text, View, Switch, useColorScheme} from 'react-native';

import {useTailwind} from 'tailwind-rn';

import {PlainButton} from './button';

import {Balance} from './balance';

import {
    WalletCardProps,
    MnemonicDisplayProps,
    genericSwitchProps,
} from '../types/props';

import {AppStorageContext} from '../class/storageContext';

import {i18nNumber} from './../modules/transform';
import {useTranslation} from 'react-i18next';

import Font from '../constants/Font';
import Color from '../constants/Color';

import BITCOIN from '../assets/svg/btc.svg';
import SIM from '../assets/svg/sim.svg';

export const WalletCard = (props: WalletCardProps) => {
    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const mxPositionBTC =
        langDir === 'right'
            ? {left: props.hideBalance ? -34 : -24}
            : {right: props.hideBalance ? -34 : -24};

    const mxPositionSim = langDir === 'right' ? {right: 24} : {left: 24};

    return (
        <PlainButton
            onPress={() => {
                if (props.navCallback) {
                    props.navCallback();
                }
            }}
            activeOpacity={1}>
            <View
                style={[
                    tailwind('w-full relative items-center'),
                    {height: 206},
                ]}>
                <View
                    style={[
                        styles.overflowHidden,
                        tailwind('w-full rounded-md z-50 px-6'),
                        {
                            height: 206,
                            backgroundColor:
                                ColorScheme.WalletColors[props.walletType][
                                    props.network
                                ],
                        },
                    ]}>
                    <View
                        style={[
                            tailwind(
                                'absolute right-0 z-50 h-full rounded-br opacity-60',
                            ),
                            {width: 6},
                        ]}>
                        <View
                            style={[
                                tailwind(
                                    'h-4/6 rounded-tr rounded-bl rounded-br-none absolute right-0',
                                ),
                                {width: 10},
                            ]}
                        />
                    </View>

                    <View
                        style={[
                            tailwind('absolute h-auto w-auto opacity-40 z-0'),
                            {
                                top: props.hideBalance ? -34 : -16,
                                ...mxPositionBTC,
                            },
                        ]}>
                        <BITCOIN fill={'black'} width={148} height={148} />
                    </View>

                    {!props.isWatchOnly && (
                        <View
                            style={[
                                {
                                    top: 18,
                                    ...mxPositionSim,
                                },
                                tailwind('absolute opacity-80 h-auto w-auto'),
                            ]}>
                            <SIM fill={'white'} width={42} height={42} />
                        </View>
                    )}

                    <Text
                        numberOfLines={1}
                        ellipsizeMode="middle"
                        style={[
                            styles.label,
                            tailwind(
                                'absolute pt-4 mt-1 text-base w-full text-left text-white opacity-60',
                            ),
                            {
                                bottom: props.hideBalance ? 72 : 54,
                                textAlign: langDir,
                            },
                            Font.RobotoText,
                        ]}>
                        {props.label}
                    </Text>

                    {props.isWatchOnly && (
                        <View
                            style={[
                                langDir === 'right'
                                    ? styles.watchOnlyRTL
                                    : styles.watchOnlyLTR,
                                tailwind(
                                    'bg-black absolute rounded-full opacity-60',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind(
                                        'text-xs text-white font-bold px-4 py-1',
                                    ),
                                    Font.RobotoText,
                                ]}>
                                Watch only
                            </Text>
                        </View>
                    )}

                    {/* Show Balance or Maxed card */}
                    {!props.maxedCard || props.hideBalance ? (
                        <View style={tailwind('w-full absolute mx-6 bottom-5')}>
                            <Balance
                                fontColor={'white'}
                                balance={props.balance}
                                balanceFontSize={'text-2xl'}
                                disableFiat={false}
                                loading={props.loading}
                                hideColor={
                                    ColorScheme.WalletColors[props.walletType]
                                        .accent
                                }
                            />
                        </View>
                    ) : (
                        <View
                            style={[
                                tailwind(
                                    'bg-black absolute rounded opacity-60',
                                ),
                                {
                                    bottom: 20,
                                    left: langDir === 'right' ? undefined : 24,
                                    right: langDir === 'right' ? 24 : undefined,
                                },
                            ]}>
                            <Text
                                style={[
                                    tailwind(
                                        'text-xs text-white font-bold px-4 py-1',
                                    ),
                                    {textAlign: langDir},
                                    Font.RobotoText,
                                ]}>
                                {t('wallet_empty_balance')}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </PlainButton>
    );
};

export const MnemonicDisplayCapsule = (props: MnemonicDisplayProps) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {appLanguage} = useContext(AppStorageContext);

    return (
        <View
            style={[
                tailwind('flex-row items-center justify-center w-full'),
                {
                    marginTop: 6,
                    marginBottom: 6,
                },
            ]}>
            <View
                style={[
                    tailwind('items-center justify-center'),
                    {
                        backgroundColor: ColorScheme.Background.CardGreyed,
                        borderTopLeftRadius: 32,
                        borderBottomLeftRadius: 32,
                        marginRight: 2,
                        height: 40,
                        width: '25%',
                    },
                ]}>
                <Text
                    style={[
                        tailwind('text-sm font-bold'),
                        {
                            color: ColorScheme.Text.Default,
                        },
                    ]}>
                    {i18nNumber(props.index, appLanguage.code)}
                </Text>
            </View>

            <View
                style={[
                    tailwind('justify-center'),
                    {
                        height: 40,
                        width: '75%',
                        borderTopRightRadius: 32,
                        borderBottomRightRadius: 32,
                        backgroundColor: ColorScheme.Background.Greyed,
                        paddingLeft: 8,
                        paddingRight: 8,
                    },
                ]}>
                <Text
                    style={[
                        tailwind('text-sm font-bold'),
                        {
                            color: ColorScheme.Text.Default,
                        },
                    ]}>
                    {props.word}
                </Text>
            </View>
        </View>
    );
};

export const GenericSwitch = (props: genericSwitchProps) => {
    return (
        <Switch
            {...props}
            style={{transform: [{scaleX: 0.8}, {scaleY: 0.8}]}}
            thumbColor={props.thumbColor}
            trackColor={props.trackColor}
            ios_backgroundColor={props.iosBackgroundColor}
            onValueChange={props.onValueChange}
            value={props.value}
        />
    );
};

const styles = StyleSheet.create({
    darkGrayCard: {
        backgroundColor: '#B5B5B5',
    },
    overflowHidden: {
        overflow: 'hidden',
    },
    label: {
        left: 24,
        fontWeight: '100',
    },
    watchOnlyLTR: {
        top: 24,
        left: 20,
    },
    watchOnlyRTL: {
        top: 24,
        right: 20,
    },
});
