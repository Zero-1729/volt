import React, {useContext, useState} from 'react';

import {Text, View, useColorScheme} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import Clipboard from '@react-native-clipboard/clipboard';

import {useNavigation, CommonActions} from '@react-navigation/core';

import QRCode from 'react-native-qrcode-svg';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import {PlainButton} from '../../components/button';

import {AppStorageContext} from '../../class/storageContext';

import {WalletTypeNames} from '../../modules/wallet-defaults';

import Close from '../../assets/svg/x-24.svg';

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

    // Key material currently stored in wallet
    const isSingleMaterial = walletData.secret === '';
    const walletAvailMaterial: string =
        walletData.secret !== ''
            ? 'Mnemonic'
            : walletData.externalDescriptor !== ''
            ? 'Descriptor'
            : 'Extended Public Key (XPUB)';

    const getQRData = (material: string) => {
        // Only show mnemonic if mnemonic available and toggled
        if (material === 'Mnemonic' && walletData.secret !== '') {
            return walletData.secret;
        }

        // Shows descriptor if available or toggled
        if (walletData.externalDescriptor || material === 'Descriptor') {
            return walletData.externalDescriptor;
        }

        // Fallback to xpub, assuming first two unavailable (i.e., in case only watch only xpub restore)
        return walletData.xpub;
    };

    const [backupMaterial, setBackupMaterial] =
        useState<string>(walletAvailMaterial);
    const [backupData, setBackupData] = useState<string>(
        getQRData(walletAvailMaterial),
    );

    // Update the displayed backup data and current backup material type
    const updateData = (material: string) => {
        setBackupData(getQRData(material));
        setBackupMaterial(material);
    };

    const copyDescToClipboard = () => {
        // Copy backup material to Clipboard
        // Temporarily set copied message
        // and revert after a few seconds
        Clipboard.setString(getQRData(backupMaterial));

        setBackupData('Copied to clipboard');

        setTimeout(() => {
            setBackupData(getQRData(backupMaterial));
        }, 450);
    };

    const warning =
        'This material is the only way to recover your wallet. If you lose it, you will lose your funds. Please write it down and keep it in a safe place. Do not Screenshot or share it with anyone.';

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
                                tailwind('text-lg font-bold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Backup
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
                        {/* Display the single backup material if restored non-mnemonic */}
                        {isSingleMaterial ? (
                            <>
                                <Text
                                    style={[
                                        tailwind('text-sm font-bold'),
                                        {
                                            color: ColorScheme.Text.Default,
                                        },
                                    ]}>
                                    {backupMaterial}
                                </Text>
                            </>
                        ) : (
                            <>
                                {/* Display the backup material selector if restored mnemonic */}
                                <PlainButton
                                    style={[tailwind('mr-4')]}
                                    disabled={
                                        backupMaterial === 'Mnemonic' ||
                                        walletData.secret === ''
                                    }
                                    onPress={() => {
                                        updateData('Mnemonic');
                                    }}>
                                    <Text
                                        style={[
                                            tailwind(
                                                `text-sm ${
                                                    backupMaterial ===
                                                    'Mnemonic'
                                                        ? 'font-bold'
                                                        : ''
                                                }`,
                                            ),
                                            {
                                                color:
                                                    backupMaterial ===
                                                    'Mnemonic'
                                                        ? ColorScheme.Text
                                                              .Default
                                                        : ColorScheme.Text
                                                              .GrayedText,
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
                                                ColorScheme.Background
                                                    .CardGreyed,
                                        },
                                    ]}
                                />
                                <PlainButton
                                    disabled={backupMaterial === 'Descriptor'}
                                    onPress={() => {
                                        updateData('Descriptor');
                                    }}>
                                    <Text
                                        style={[
                                            tailwind(
                                                `text-sm ${
                                                    backupMaterial ===
                                                    'Descriptor'
                                                        ? 'font-bold'
                                                        : ''
                                                }`,
                                            ),
                                            {
                                                color:
                                                    backupMaterial ===
                                                    'Descriptor'
                                                        ? ColorScheme.Text
                                                              .Default
                                                        : ColorScheme.Text
                                                              .GrayedText,
                                            },
                                        ]}>
                                        Descriptor
                                    </Text>
                                </PlainButton>
                            </>
                        )}
                    </View>

                    {/* Display QR code with seed */}
                    <View style={[tailwind('self-center mb-4')]}>
                        <QRCode value={getQRData(backupMaterial)} size={225} />
                    </View>

                    {/* Display either seed or descriptor */}
                    <PlainButton
                        style={[tailwind('items-center')]}
                        onPress={copyDescToClipboard}>
                        <Text
                            style={[
                                tailwind(
                                    'text-sm w-full p-3 text-center rounded-sm',
                                ),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                    color: ColorScheme.Text.Default,
                                },
                            ]}
                            numberOfLines={
                                backupMaterial === 'Mnemonic' ? 2 : 1
                            }
                            ellipsizeMode={'middle'}>
                            {backupData}
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
