import React, {useContext, useState} from 'react';

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

    const [backupMaterial, setBackupMaterial] = useState<string>('mnemonic');

    const {currentWalletID, getWalletData, isAdvancedMode} =
        useContext(AppStorageContext);

    const walletData = getWalletData(currentWalletID);

    const walletType = WalletTypeNames[walletData.type];
    const walletTypeName =
        walletType[0] +
        (isAdvancedMode ? ` (${WalletTypeNames[walletData.type][1]})` : '');

    const warning =
        'This material is the only way to recover your wallet. If you lose it, you will lose your funds. Please write it down and keep it in a safe place. Do not Screenshot or share it with anyone.';

    const getMnemonicData = () => {
        return backupMaterial === 'mnemonic'
            ? walletData.secret
            : walletData.descriptor;
    };

    return (
        <SafeAreaView edges={['bottom', 'right', 'left']}>
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
                                tailwind('text-xl font-bold'),
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
                    <Text
                        style={[
                            tailwind(
                                '-mt-20 mb-1 font-bold self-center text-center text-xl w-5/6',
                            ),
                            {color: ColorScheme.Text.Default},
                        ]}
                        numberOfLines={1}
                        ellipsizeMode={'middle'}>
                        {walletData.name}
                    </Text>

                    {/* Display wallet type */}
                    <Text
                        style={[
                            tailwind('text-base self-center mb-6'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {walletTypeName}
                    </Text>

                    {/* Display wallet seed */}
                    <View
                        style={[
                            tailwind(
                                'flex-row self-center items-center justify-center rounded-sm p-2 px-4 mb-4 bg-blue-800',
                            ),
                            {backgroundColor: ColorScheme.Background.Greyed},
                        ]}>
                        <PlainButton
                            style={[tailwind('mr-4')]}
                            disabled={backupMaterial === 'mnemonic'}
                            onPress={() => {
                                setBackupMaterial('mnemonic');
                            }}>
                            <Text
                                style={[
                                    tailwind(
                                        `text-sm ${
                                            backupMaterial === 'mnemonic'
                                                ? 'font-bold'
                                                : ''
                                        }`,
                                    ),
                                    {
                                        color:
                                            backupMaterial === 'mnemonic'
                                                ? ColorScheme.Text.Default
                                                : ColorScheme.Text.GrayText,
                                    },
                                ]}>
                                Mnemonic
                            </Text>
                        </PlainButton>
                        <View
                            style={[
                                tailwind('h-6 w-0.5 mr-4 rounded-full'),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.CardGreyed,
                                },
                            ]}
                        />
                        <PlainButton
                            disabled={backupMaterial === 'descriptor'}
                            onPress={() => {
                                setBackupMaterial('descriptor');
                            }}>
                            <Text
                                style={[
                                    tailwind(
                                        `text-sm ${
                                            backupMaterial === 'descriptor'
                                                ? 'font-bold'
                                                : ''
                                        }`,
                                    ),
                                    {
                                        color:
                                            backupMaterial === 'descriptor'
                                                ? ColorScheme.Text.Default
                                                : ColorScheme.Text.GrayedText,
                                    },
                                ]}>
                                Descriptor
                            </Text>
                        </PlainButton>
                    </View>

                    {/* Display QR code with seed */}
                    <View style={[tailwind('self-center mb-4')]}>
                        <QRCode value={getMnemonicData()} size={225} />
                    </View>

                    {/* Display either seed or descriptor */}
                    <PlainButton style={[tailwind('items-center')]}>
                        <Text
                            style={[
                                tailwind('text-sm p-3 text-center rounded-sm'),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                    color: ColorScheme.Text.Default,
                                },
                            ]}
                            numberOfLines={
                                backupMaterial === 'mnemonic' ? 2 : 1
                            }
                            ellipsizeMode={'middle'}>
                            {backupMaterial === 'mnemonic'
                                ? walletData.secret
                                : walletData.descriptor}
                        </Text>
                    </PlainButton>

                    <View
                        style={[
                            tailwind('absolute flex-row justify-center w-full'),
                            {bottom: NativeWindowMetrics.bottom},
                        ]}>
                        <Text
                            style={[
                                tailwind('items-center text-sm justify-center'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            <Text style={[tailwind('font-bold ml-4')]}>
                                WARNING:{' '}
                            </Text>
                            <Text>{warning}</Text>
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Backup;
