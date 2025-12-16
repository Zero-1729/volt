/* eslint-disable react-native/no-inline-styles */
import React, {useContext} from 'react';
import {StyleSheet, Text, View, Switch, useColorScheme} from 'react-native';

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

import Unhide from '../assets/svg/unhide.svg';
import Hide from '../assets/svg/hide.svg';

import VText from './text';

export const WalletCard = (props: WalletCardProps) => {
    const ColorScheme = Color(useColorScheme());
    const {
        hideTotalBalance,
        setTotalBalanceHidden,
    } = useContext(AppStorageContext);

    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    return (
        <PlainButton
            onPress={() => {
                if (props.navCallback) {
                    props.navCallback();
                }
            }}
            activeOpacity={1}>
            <View
                className="w-full relative items-center"
                style={{height: 206}}>
                <View
                    className="w-full relative rounded-md px-6"
                    style={[
                        styles.overflowHidden,
                        {
                            height: 206,
                            backgroundColor:
                                ColorScheme.WalletColors[props.walletType][
                                    props.network
                                ],
                        },
                    ]}>
                    <View
                        className="absolute right-0 h-full rounded-br opacity-60"
                        style={{width: 6}}>
                        <View
                            className="h-4/6 rounded-tr rounded-bl rounded-br-none absolute right-0"
                            style={{width: 10}}
                        />
                    </View>
                    <View className="w-full relative top-6">
                            <VText
                            className="text-xl font-medium w-full"
                            style={[
                                {
                                    color: ColorScheme.Text
                                                  .Default,
                                    marginLeft: langDir === 'left' ? 0 : 0,
                                    marginRight: langDir === 'right' ? 0 : 0,
                                    },
                                    Font.RobotoText,
                                ]}>
                                {props.label}
                            </VText>
                            <PlainButton
                                className={`absolute top-0 ${langDir === 'right' ? "left-0": "right-0"} rounded-full items-center flex-row p-1 -mt-1`}
                                onPress={() => {setTotalBalanceHidden(!hideTotalBalance)}}
                                >                                
                                    {hideTotalBalance ? 
                                        <Hide fill={ColorScheme.SVG.Default} width={20} height={20} /> : 
                                        <Unhide style={{opacity: 0.8}} fill={ColorScheme.SVG.Default} width={20} height={20} /> }
                            </PlainButton>
                    </View>

                    <View className="w-full absolute mx-6 bottom-6">
                            {!hideTotalBalance && <VText
                                className="text-base font-medium opacity-60"
                                style={[
                                    {
                                        color: ColorScheme.Text
                                                      .Default,
                                        marginLeft: langDir === 'left' ? 0 : 0,
                                        marginRight: langDir === 'right' ? 0 : 0,
                                    },
                                    Font.RobotoText,
                                ]}>
                                {t('balance')}
                            </VText>}

                            <Balance
                                fontColor={'white'}
                                balance={props.balance}
                                balanceFontSize={'text-3xl'}
                                disableFiat={false}
                                loading={props.loading}
                                hideColor={
                                    ColorScheme.WalletColors[props.walletType]
                                        .accent
                                }
                            />
                        </View>
                </View>
            </View>
        </PlainButton>
    );
};

export const MnemonicDisplayCapsule = (props: MnemonicDisplayProps) => {
    const ColorScheme = Color(useColorScheme());

    const {appLanguage} = useContext(AppStorageContext);

    return (
        <View
            className="flex-row items-center justify-center w-full"
            style={{
                    marginTop: 6,
                    marginBottom: 6,
                }}>
            <View
                className="items-center justify-center"
                style={{
                        backgroundColor: ColorScheme.Background.CardGreyed,
                        borderTopLeftRadius: 32,
                        borderBottomLeftRadius: 32,
                        marginRight: 2,
                        height: 40,
                        width: '25%',
                    }}>
                <Text
                    className="text-sm font-bold"
                    style={{
                            color: ColorScheme.Text.Default,
                        }}>
                    {i18nNumber(props.index, appLanguage.code)}
                </Text>
            </View>

            <View
                className="justify-center"
                style={{
                        height: 40,
                        width: '75%',
                        borderTopRightRadius: 32,
                        borderBottomRightRadius: 32,
                        backgroundColor: ColorScheme.Background.Greyed,
                        paddingLeft: 8,
                        paddingRight: 8,
                    }}>
                <Text
                    className="text-sm font-bold"
                    style={{
                            color: ColorScheme.Text.Default,
                        }}>
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
