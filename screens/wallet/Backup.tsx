import React, {useContext} from 'react';

import {Text, View, useColorScheme} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation, CommonActions} from '@react-navigation/core';

import QRCode from 'react-native-qrcode-svg';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import {PlainButton} from '../../components/button';

import {AppStorageContext} from '../../class/storageContext';

import {WalletTypeNames} from '../../class/wallet/base';

import Close from '../../assets/svg/x-circle-fill-24.svg';

import NativeWindowMetrics from '../../constants/NativeWindowMetrics';

const Backup = () => {
    const navigation = useNavigation();
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {currentWalletID, getWalletData, isAdvancedMode} =
        useContext(AppStorageContext);

    const walletData = getWalletData(currentWalletID);

    const walletType = WalletTypeNames[walletData.type];
    const walletTypeName =
        walletType[0] +
        (isAdvancedMode ? ` (${WalletTypeNames[walletData.type][1]})` : '');

    const warning =
        'This seed is the only way to recover your wallet. If you lose it, you will lose your funds. Please write it down and keep it in a safe place. Do not Screenshot or share it with anyone.';

    const mnemonicData = walletData.secret;

    return (
        <SafeAreaView>
            <View style={[tailwind('w-full h-full items-center')]}>
                <View style={tailwind('w-5/6 h-full justify-center')}>
                    {/* Top panel */}
                    <View
                        style={[
                            tailwind(
                                'w-full justify-between absolute top-6 flex-row',
                            ),
                        ]}>
                        <Text
                            style={[
                                tailwind('text-2xl font-bold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Backup Material
                        </Text>
                        <PlainButton
                            onPress={() => {
                                navigation.dispatch(CommonActions.goBack());
                            }}>
                            <Close width={32} fill={ColorScheme.SVG.Default} />
                        </PlainButton>
                    </View>

                    {/* Display wallet name */}
                    <View
                        style={[tailwind('flex-row self-center -mt-16 mb-1')]}>
                        <Text
                            style={[
                                tailwind('text-2xl font-bold mr-2'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Wallet Name:
                        </Text>
                        <Text
                            style={[
                                tailwind('text-2xl'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {walletData.name}
                        </Text>
                    </View>

                    {/* Display wallet type */}
                    <Text
                        style={[
                            tailwind('text-lg self-center mb-6'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {walletTypeName}
                    </Text>

                    {/* Display QR code with seed */}
                    <View style={[tailwind('self-center mb-8')]}>
                        <QRCode value={mnemonicData} size={256} />
                    </View>

                    {/* Display wallet seed */}
                    <PlainButton style={[tailwind('items-center')]}>
                        <Text
                            style={[
                                tailwind('flex-row p-3 rounded-sm'),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                    color: ColorScheme.Text.Default,
                                },
                            ]}>
                            <Text
                                style={[tailwind('text-base font-bold mr-2')]}>
                                Seed:{' '}
                            </Text>
                            <Text
                                style={[tailwind('text-base')]}
                                numberOfLines={2}
                                lineBreakMode={'clip'}>
                                {walletData.secret}
                            </Text>
                        </Text>
                    </PlainButton>

                    <View
                        style={[
                            tailwind('absolute flex-row justify-center w-full'),
                            {bottom: NativeWindowMetrics.bottom},
                        ]}>
                        <Text
                            style={[
                                tailwind('items-center justify-center'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            <Text style={[tailwind('font-bold ml-4')]}>
                                WARNING:{' '}
                            </Text>
                            <Text style={[tailwind('text-sm')]}>{warning}</Text>
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Backup;
