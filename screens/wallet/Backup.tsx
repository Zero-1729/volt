/* eslint-disable react-native/no-inline-styles */
import React, {useContext, useState} from 'react';

import {Text, View, useColorScheme, Platform} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import Clipboard from '@react-native-clipboard/clipboard';

import {useNavigation, CommonActions} from '@react-navigation/core';

import QRCodeStyled from 'react-native-qrcode-styled';
import Checkbox from 'react-native-bouncy-checkbox';

import {useTailwind} from 'tailwind-rn';

import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import Color from '../../constants/Color';

import {PlainButton} from '../../components/button';

import {AppStorageContext} from '../../class/storageContext';

import {WalletTypeDetails} from '../../modules/wallet-defaults';

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../../constants/Haptic';

import CloseIcon from '../../assets/svg/x-24.svg';
import ShareIcon from '../../assets/svg/share-24.svg';

import NativeWindowMetrics from '../../constants/NativeWindowMetrics';

import {EBackupMaterial} from '../../types/enums';
import {conservativeAlert} from '../../components/alert';

const Backup = () => {
    const navigation = useNavigation();
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {currentWalletID, getWalletData, isAdvancedMode} =
        useContext(AppStorageContext);

    const walletData = getWalletData(currentWalletID);
    const walletType = WalletTypeDetails[walletData.type];
    const walletTypeName =
        walletType[0] + ` (${WalletTypeDetails[walletData.type][1]})`;

    const [showPrivateDescriptor, setShowPrivateDescriptor] = useState(false);

    // Key material currently stored in wallet
    const isSingleMaterial = walletData.mnemonic === '';
    const walletAvailMaterial: string =
        walletData.mnemonic !== ''
            ? EBackupMaterial.Mnemonic
            : walletData.externalDescriptor !== ''
            ? EBackupMaterial.Descriptor
            : 'Extended Public Key (XPUB)';

    const togglePrivateDescriptor = () => {
        if (showPrivateDescriptor) {
            RNHapticFeedback.trigger('impactLight', RNHapticFeedbackOptions);

            setShowPrivateDescriptor(false);

            setBackupData(walletData.externalDescriptor);
        } else {
            setShowPrivateDescriptor(true);

            setBackupData(walletData.privateDescriptor);
        }
    };

    const getQRData = (material: string) => {
        // Only show mnemonic if mnemonic available and toggled
        if (
            material === EBackupMaterial.Mnemonic &&
            walletData.mnemonic !== ''
        ) {
            return walletData.mnemonic;
        }

        // Shows descriptor if available or toggled
        if (
            walletData.externalDescriptor ||
            material === EBackupMaterial.Descriptor
        ) {
            return showPrivateDescriptor
                ? walletData.privateDescriptor
                : walletData.externalDescriptor;
        }

        // Fallback to xpub, assuming first two unavailable (i.e., in case only watch only xpub restore)
        return walletData.xpub;
    };

    const [backupMaterial, setBackupMaterial] =
        useState<string>(walletAvailMaterial);
    const [backupData, setBackupData] = useState<string>(
        getQRData(walletAvailMaterial),
    );

    // Write public descriptor file to device
    const writeDescriptorToFile = async () => {
        let pathData =
            RNFS.TemporaryDirectoryPath +
            `/${walletData.name}-wallet_descriptor_backup.txt`;

        const fileBackupData = getQRData(EBackupMaterial.Descriptor);

        if (Platform.OS === 'ios') {
            await RNFS.writeFile(pathData, fileBackupData, 'utf8').catch(e => {
                conservativeAlert('Error', e.message);
            });
            await Share.open({
                url: 'file://' + pathData,
                type: 'text/plain',
                title: 'Volt Wallet Descriptor Backup',
            })
                .catch(e => {
                    if (e.message !== 'User did not share') {
                        conservativeAlert('Error', e.message);
                    }
                })
                .finally(() => {
                    RNFS.unlink(pathData);
                });
        } else {
            console.log(
                '[Backup Descriptor to file] not yet implemented on Android',
            );
        }
    };

    // Update the displayed backup data and current backup material type
    const updateData = (material: string) => {
        // Clear the Private Descriptor toggle
        // It's super sensitive and should be reset
        if (material !== EBackupMaterial.Descriptor) {
            setShowPrivateDescriptor(false);
        }

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

    const info =
        'Keep your wallet safe to protect your funds. Please, write down and secure this backup material.';
    const warning = 'Do not screenshot or share with anyone.';

    return (
        <SafeAreaView edges={['bottom', 'right', 'left']}>
            <View style={[tailwind('w-full h-full items-center')]}>
                <View style={tailwind('w-5/6 h-full justify-center')}>
                    {/* Top panel */}
                    <View style={[tailwind('absolute top-6  w-full left-0')]}>
                        {/* Allow exporting public descriptor to file */}
                        {backupMaterial === EBackupMaterial.Descriptor &&
                        !showPrivateDescriptor ? (
                            <PlainButton
                                style={[tailwind('absolute left-0')]}
                                onPress={() => {
                                    writeDescriptorToFile();
                                }}>
                                <ShareIcon
                                    width={32}
                                    fill={ColorScheme.SVG.Default}
                                />
                            </PlainButton>
                        ) : (
                            <></>
                        )}
                    </View>

                    <View style={[tailwind('absolute top-6 right-0')]}>
                        <PlainButton
                            onPress={() => {
                                navigation.dispatch(CommonActions.goBack());
                            }}>
                            <CloseIcon
                                width={32}
                                fill={ColorScheme.SVG.Default}
                            />
                        </PlainButton>
                    </View>

                    {/* Display wallet name */}
                    <View
                        style={tailwind(
                            'absolute top-14 justify-center w-full',
                        )}>
                        <Text
                            style={[
                                tailwind(
                                    'mb-1 font-bold self-center text-center text-xl w-5/6',
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
                                tailwind('text-base self-center mb-10'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {isAdvancedMode ? walletTypeName : 'Backup'}
                        </Text>
                    </View>

                    {/* Display wallet seed */}
                    <View
                        style={[
                            tailwind(
                                'flex-row self-center items-center justify-center rounded-full p-2 px-6 mb-4 bg-blue-800',
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
                                        backupMaterial ===
                                            EBackupMaterial.Mnemonic ||
                                        walletData.mnemonic === ''
                                    }
                                    onPress={() => {
                                        updateData(EBackupMaterial.Mnemonic);
                                    }}>
                                    <Text
                                        style={[
                                            tailwind(
                                                `text-sm ${
                                                    backupMaterial ===
                                                    EBackupMaterial.Mnemonic
                                                        ? 'font-bold'
                                                        : ''
                                                }`,
                                            ),
                                            {
                                                color:
                                                    backupMaterial ===
                                                    EBackupMaterial.Mnemonic
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
                                    disabled={
                                        backupMaterial ===
                                        EBackupMaterial.Descriptor
                                    }
                                    onPress={() => {
                                        updateData(EBackupMaterial.Descriptor);
                                    }}>
                                    <Text
                                        style={[
                                            tailwind(
                                                `text-sm ${
                                                    backupMaterial ===
                                                    EBackupMaterial.Descriptor
                                                        ? 'font-bold'
                                                        : ''
                                                }`,
                                            ),
                                            {
                                                color:
                                                    backupMaterial ===
                                                    EBackupMaterial.Descriptor
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
                    <View
                        style={[
                            tailwind('rounded self-center mb-4'),
                            {
                                borderWidth: 2,
                                borderColor: ColorScheme.Background.Inverted,
                            },
                        ]}>
                        <QRCodeStyled
                            style={{
                                backgroundColor:
                                    ColorScheme.Background.Inverted,
                            }}
                            data={getQRData(backupMaterial)}
                            pieceSize={
                                backupMaterial !== EBackupMaterial.Descriptor
                                    ? 7
                                    : 5
                            }
                            padding={10}
                            color={ColorScheme.Background.Default}
                            pieceCornerType={'rounded'}
                            isPiecesGlued={true}
                            pieceBorderRadius={2}
                        />
                    </View>

                    {/* Display either seed or descriptor */}
                    <PlainButton
                        style={[tailwind('items-center mb-4')]}
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
                                backupMaterial === EBackupMaterial.Mnemonic
                                    ? 2
                                    : 1
                            }
                            ellipsizeMode={'middle'}>
                            {backupData}
                        </Text>
                    </PlainButton>

                    {/* Toggle with private key version */}
                    {/* Only available if not watch-only */}
                    {!walletData.isWatchOnly &&
                        backupMaterial === EBackupMaterial.Descriptor && (
                            <View
                                style={[
                                    tailwind(
                                        'mb-4 self-center w-11/12 flex-row',
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        {
                                            color: showPrivateDescriptor
                                                ? ColorScheme.Text.Default
                                                : ColorScheme.Text.GrayedText,
                                        },
                                    ]}>
                                    {!showPrivateDescriptor
                                        ? 'Display'
                                        : 'Hide'}{' '}
                                    Extended Private Key Descriptor
                                </Text>
                                {/* btn */}
                                <Checkbox
                                    fillColor={
                                        ColorScheme.Background.CheckBoxFilled
                                    }
                                    unfillColor={
                                        ColorScheme.Background.CheckBoxUnfilled
                                    }
                                    size={18}
                                    isChecked={showPrivateDescriptor}
                                    iconStyle={{
                                        borderWidth: 1,
                                        borderRadius: 2,
                                    }}
                                    innerIconStyle={{
                                        borderWidth: 1,
                                        borderColor: showPrivateDescriptor
                                            ? ColorScheme.Background
                                                  .CheckBoxOutline
                                            : 'grey',
                                        borderRadius: 2,
                                    }}
                                    style={[
                                        tailwind('flex-row absolute -right-4'),
                                    ]}
                                    onPress={() => {
                                        RNHapticFeedback.trigger(
                                            'rigid',
                                            RNHapticFeedbackOptions,
                                        );

                                        togglePrivateDescriptor();
                                    }}
                                    disableBuiltInState={true}
                                />
                            </View>
                        )}

                    <View
                        style={[
                            tailwind('absolute flex w-full'),
                            {bottom: NativeWindowMetrics.bottom},
                        ]}>
                        <Text
                            style={[
                                tailwind('text-sm text-center mb-4'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {info}
                        </Text>

                        <Text
                            style={[
                                tailwind('text-sm text-center'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            <Text>{warning}</Text>
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Backup;
