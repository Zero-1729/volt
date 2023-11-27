/* eslint-disable react-native/no-inline-styles */
import React, {useContext, useState} from 'react';

import {Text, View, useColorScheme, Platform, StyleSheet} from 'react-native';
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

import CloseIcon from '../../assets/svg/x-24.svg';
import ShareIcon from '../../assets/svg/share-24.svg';

import NativeWindowMetrics from '../../constants/NativeWindowMetrics';

import {conservativeAlert} from '../../components/alert';

const Xpub = () => {
    const navigation = useNavigation();
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {currentWalletID, getWalletData} = useContext(AppStorageContext);

    const walletData = getWalletData(currentWalletID);
    const [backupData, setBackupData] = useState<string>(walletData.xpub);

    // Write public descriptor file to device
    const writeDescriptorToFile = async () => {
        let pathData =
            RNFS.TemporaryDirectoryPath +
            `/${walletData.name}-wallet_descriptor_backup.txt`;

        const fileBackupData = walletData.xpub;

        if (Platform.OS === 'ios') {
            await RNFS.writeFile(pathData, fileBackupData, 'utf8').catch(e => {
                conservativeAlert('Error', e.message);
            });
            await Share.open({
                url: 'file://' + pathData,
                type: 'text/plain',
                title: 'Volt Wallet Descriptor Xpub',
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
                '[Xpub Descriptor to file] not yet implemented on Android',
            );
        }
    };

    const copyDescToClipboard = () => {
        // Copy backup material to Clipboard
        // Temporarily set copied message
        // and revert after a few seconds
        Clipboard.setString(walletData.xpub);

        setBackupData('Copied to clipboard');

        setTimeout(() => {
            setBackupData(walletData.xpub);
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
                        {/* Allow exporting XPub */}
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
                        <>
                            <Text
                                style={[
                                    tailwind('text-sm font-bold'),
                                    {
                                        color: ColorScheme.Text.Default,
                                    },
                                ]}>
                                Xpub
                            </Text>
                        </>
                    </View>

                    {/* Display QR code with seed */}
                    <View
                        style={[
                            tailwind('rounded self-center mb-4'),
                            {
                                borderWidth: 2,
                                borderColor: ColorScheme.Background.QRBorder,
                            },
                        ]}>
                        <QRCodeStyled
                            style={{
                                backgroundColor: 'white',
                            }}
                            data={walletData.xpub}
                            pieceSize={5}
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
                            numberOfLines={1}
                            ellipsizeMode={'middle'}>
                            {backupData}
                        </Text>
                    </PlainButton>

                    <View
                        style={[
                            styles.infoContainer,
                            tailwind('absolute flex w-full'),
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

export default Xpub;

const styles = StyleSheet.create({
    infoContainer: {
        bottom: NativeWindowMetrics.bottom,
    },
});
