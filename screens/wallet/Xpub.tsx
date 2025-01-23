/* eslint-disable react-native/no-inline-styles */
import React, {useContext, useMemo} from 'react';

import {Text, View, useColorScheme, Platform} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import Clipboard from '@react-native-clipboard/clipboard';

import {useNavigation, CommonActions} from '@react-navigation/core';

import QRCodeStyled from 'react-native-qrcode-styled';

import {useTranslation} from 'react-i18next';

import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import Color from '../../constants/Color';

import {PlainButton} from '../../components/button';

import {AppStorageContext} from '../../class/storageContext';

import CloseIcon from '../../assets/svg/x-24.svg';
import ShareIcon from '../../assets/svg/share-24.svg';

import {Toasts} from '@backpackapp-io/react-native-toast';
import {LiberalToast} from '../../components/toast';

import {capitalizeFirst} from '../../modules/transform';
import NativeWindowMetrics from '../../constants/NativeWindowMetrics';

const Xpub = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const {currentWalletID, getWalletData} =
        useContext(AppStorageContext);

    const {t} = useTranslation('wallet');
    const {t: e} = useTranslation('errors');

    const walletData = getWalletData(currentWalletID);
    const backupData = useMemo(() => walletData.xpub, [walletData.xpub]);

    // Write public descriptor file to device
    const writeDescriptorToFile = async () => {
        let pathData =
            RNFS.TemporaryDirectoryPath +
            `/${walletData.name}-wallet_descriptor_backup.txt`;

        const fileBackupData = walletData.xpub;

        if (Platform.OS === 'ios') {
            await RNFS.writeFile(pathData, fileBackupData, 'utf8').catch(
                err => {
                    LiberalToast(capitalizeFirst(t('error')), e('failed_to_write_file'), {
                        duration: 3000,
                    });

                    console.log('[Export] Failed to write file: ', err.message);
                },
            );
            await Share.open({
                url: 'file://' + pathData,
                type: 'text/plain',
                title: 'Volt Wallet Descriptor Xpub',
            })
                .catch(err => {
                    if (err.message !== 'User did not share') {
                        LiberalToast(capitalizeFirst(t('error')), e('failed_to_share_file'), {
                            duration: 3000,
                        });

                        console.log(
                            '[Share] Failed to share file: ',
                            err.message,
                        );
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

        LiberalToast(capitalizeFirst(t('clipboard')), capitalizeFirst(t('copied_to_clipboard')), {
            duration: 1000,
        });
    };

    const info = t('backup_description');
    const warning = t('backup_clarification');

    return (
        <SafeAreaView
            edges={['bottom', 'right', 'left']}
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View className="w-full h-full items-center">
                <View className="w-5/6 h-full justify-center">
                    <View
                        className="w-full absolute top-6 flex-row justify-center items-center">
                        {/* Top panel */}
                        {/* Allow exporting XPub */}
                        {Platform.OS === 'ios' && (
                            <PlainButton
                                className="absolute left-0"
                                onPress={() => {
                                    writeDescriptorToFile();
                                }}>
                                <ShareIcon
                                    width={32}
                                    fill={ColorScheme.SVG.Default}
                                />
                            </PlainButton>
                        )}
                        <Text
                            className="text-lg font-bold"
                            style={{
                                    color: ColorScheme.Text.Default,
                            }}>
                            Xpub
                        </Text>
                        <PlainButton
                            className="absolute right-0"
                            onPress={() => {
                                navigation.dispatch(CommonActions.goBack());
                            }}>
                            <CloseIcon
                                width={32}
                                fill={ColorScheme.SVG.Default}
                            />
                        </PlainButton>
                    </View>

                    {/* Display QR code with seed */}
                    <View
                        className="rounded self-center mb-4"
                        style={{
                                borderWidth: 2,
                                borderColor: ColorScheme.Background.QRBorder,
                        }}>
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
                        className="items-center mb-4"
                        onPress={copyDescToClipboard}>
                        <Text
                            className="text-sm w-full p-3 text-center rounded-sm"
                            style={{
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                    color: ColorScheme.Text.Default,
                            }}
                            numberOfLines={1}
                            ellipsizeMode={'middle'}>
                            {backupData}
                        </Text>
                    </PlainButton>

                    <View className="mt-6 flex w-full">
                        <Text
                            className="text-sm text-center mb-4"
                            style={{color: ColorScheme.Text.DescText}}>
                            {info}
                        </Text>

                        <Text
                            className="text-sm text-center"
                            style={{color: ColorScheme.Text.Default}}>
                            {warning}
                        </Text>
                    </View>
                </View>

                <Toasts extraInsets={{top: NativeWindowMetrics.height * -0.075}} />
            </View>
        </SafeAreaView>
    );
};

export default Xpub;
