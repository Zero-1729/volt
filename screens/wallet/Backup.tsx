/* eslint-disable react-native/no-inline-styles */
import React, {
    ReactElement,
    useCallback,
    useContext,
    useState,
    useRef,
    useMemo,
} from 'react';

import {Text, View, useColorScheme, Platform, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import VText from '../../components/text';

import Clipboard from '@react-native-clipboard/clipboard';

import {useNavigation, CommonActions} from '@react-navigation/core';

import QRCodeStyled from 'react-native-qrcode-styled';
import Checkbox from 'react-native-bouncy-checkbox';
import {runOnJS} from 'react-native-reanimated';

import {useTailwind} from 'tailwind-rn';

import NativeDims from '../../constants/NativeWindowMetrics';

import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import Color from '../../constants/Color';

import {PlainButton} from '../../components/button';

import {useTranslation} from 'react-i18next';

import {AppStorageContext} from '../../class/storageContext';

import {WalletTypeDetails} from '../../modules/wallet-defaults';

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../../constants/Haptic';

import Carousel, {ICarouselInstance} from 'react-native-reanimated-carousel';

import CloseIcon from '../../assets/svg/x-24.svg';
import ShareIcon from '../../assets/svg/share-24.svg';

import {EBackupMaterial} from '../../types/enums';
import Toast, {ToastConfig} from 'react-native-toast-message';
import {toastConfig} from '../../components/toast';

import {capitalizeFirst} from '../../modules/transform';
import {useSharedValue} from 'react-native-reanimated';

import RNBiometrics from '../../modules/biometrics';

type Slide = () => ReactElement;

const Backup = () => {
    const navigation = useNavigation();
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {currentWalletID, getWalletData, isAdvancedMode, isBiometricsActive} =
        useContext(AppStorageContext);

    const carouselRef = useRef<ICarouselInstance>(null);
    const progressValue = useSharedValue(0);

    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const walletData = getWalletData(currentWalletID);
    const walletType = WalletTypeDetails[walletData.type];
    const walletTypeName =
        walletType[0] + ` (${WalletTypeDetails[walletData.type][1]})`;

    const [showPrivateDescriptor, setShowPrivateDescriptor] = useState(false);

    const getQRData = useCallback(
        (material: string) => {
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

            return walletData.externalDescriptor;
        },
        [walletData, showPrivateDescriptor],
    );

    // Could be either mnemonic or xprv if available
    const baseBackupTitle =
        walletData.mnemonic !== '' ? 'Mnemonic' : 'Extended Key';

    // Key material currently stored in wallet
    const [currentBackup, setCurrentBackup] = useState<string>(
        EBackupMaterial.Mnemonic,
    );

    const [descriptorData, setupDescriptorData] = useState<string>(
        getQRData(EBackupMaterial.Descriptor),
    );

    // Write public descriptor file to device
    const writeDescriptorToFile = async () => {
        let pathData =
            RNFS.TemporaryDirectoryPath +
            `/${walletData.name}-wallet_descriptor_backup.txt`;

        const fileBackupData = getQRData(EBackupMaterial.Descriptor);

        if (Platform.OS === 'ios') {
            await RNFS.writeFile(pathData, fileBackupData, 'utf8').catch(e => {
                Toast.show({
                    topOffset: 54,
                    type: 'Liberal',
                    text1: capitalizeFirst(t('error')),
                    text2: e.message,
                    visibilityTime: 2000,
                });
            });
            await Share.open({
                url: 'file://' + pathData,
                type: 'text/plain',
                title: 'Volt Wallet Descriptor Backup',
            })
                .catch(e => {
                    if (e.message !== 'User did not share') {
                        Toast.show({
                            topOffset: 54,
                            type: 'Liberal',
                            text1: capitalizeFirst(t('error')),
                            text2: e.message,
                            visibilityTime: 2000,
                        });
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

    // Copy data to clipboard
    const copyToClipboard = useCallback(
        (data: string) => {
            // Copy backup material to Clipboard
            // Temporarily set copied message
            // and revert after a few seconds
            Clipboard.setString(data);

            Toast.show({
                topOffset: 24,
                type: 'Liberal',
                text1: capitalizeFirst(t('clipboard')),
                text2: capitalizeFirst(t('copied_to_clipboard')),
                visibilityTime: 1000,
                position: 'top',
            });
        },
        [t],
    );

    const warning = t('backup_clarification');

    const mainPanel = useCallback((): ReactElement => {
        const baseBackup =
            walletData.mnemonic !== ''
                ? getQRData(EBackupMaterial.Mnemonic)
                : getQRData(EBackupMaterial.Xprv);

        const copyMainData = () => {
            copyToClipboard(baseBackup);
        };

        return (
            <View
                style={[
                    tailwind('items-center justify-center h-full w-full'),
                    styles.infoContainer,
                ]}>
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
                        data={baseBackup}
                        pieceSize={7}
                        padding={10}
                        color={ColorScheme.Background.Default}
                        pieceCornerType={'rounded'}
                        isPiecesGlued={true}
                        pieceBorderRadius={2}
                    />
                </View>

                {/* Display either seed or ext key */}
                <PlainButton
                    style={[tailwind('items-center mb-4 w-5/6')]}
                    onPress={copyMainData}>
                    <Text
                        style={[
                            tailwind(
                                'text-sm w-full p-3 text-center rounded-sm',
                            ),
                            {
                                backgroundColor: ColorScheme.Background.Greyed,
                                color: ColorScheme.Text.Default,
                            },
                        ]}
                        numberOfLines={2}
                        ellipsizeMode={'middle'}>
                        {baseBackup}
                    </Text>
                </PlainButton>

                <View style={[tailwind('mt-2 flex w-5/6')]}>
                    <Text
                        style={[
                            tailwind('text-sm text-center mb-4'),
                            {color: ColorScheme.Text.DescText},
                        ]}>
                        {baseBackupTitle === 'Mnemonic'
                            ? t('ln_mnemonic_backup_message')
                            : t('xprv_backup_message')}
                    </Text>

                    <Text
                        style={[
                            tailwind('text-sm text-center'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {warning}
                    </Text>
                </View>
            </View>
        );
    }, [
        walletData.mnemonic,
        getQRData,
        tailwind,
        ColorScheme,
        baseBackupTitle,
        t,
        warning,
        copyToClipboard,
    ]);

    const descriptorPanel = useCallback((): ReactElement => {
        const copyDescriptor = () => {
            copyToClipboard(getQRData(EBackupMaterial.Descriptor));
        };

        const togglePrivateDescriptor = () => {
            if (showPrivateDescriptor) {
                RNHapticFeedback.trigger(
                    'impactLight',
                    RNHapticFeedbackOptions,
                );

                setShowPrivateDescriptor(false);

                setupDescriptorData(walletData.externalDescriptor);
            } else {
                if (isBiometricsActive) {
                    RNBiometrics.simplePrompt({
                        promptMessage: `Confirm ${
                            Platform.OS === 'ios' ? 'FaceID' : 'Biometrics'
                        }`,
                    })
                        .then(({success}) => {
                            if (success) {
                                setShowPrivateDescriptor(true);
                                setupDescriptorData(
                                    walletData.privateDescriptor,
                                );
                            }
                        })
                        .catch((error: any) => {
                            Toast.show({
                                topOffset: 54,
                                type: 'Liberal',
                                text1: t('Biometrics'),
                                text2: error.message,
                                visibilityTime: 1750,
                            });
                        });
                } else {
                    setShowPrivateDescriptor(true);
                    setupDescriptorData(walletData.privateDescriptor);
                }
            }
        };

        return (
            <View
                style={[
                    tailwind('items-center justify-center h-full w-full'),
                    styles.infoContainer,
                ]}>
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
                        data={descriptorData}
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
                    style={[tailwind('items-center mb-4 w-5/6')]}
                    onPress={copyDescriptor}>
                    <Text
                        style={[
                            tailwind(
                                'text-sm w-full p-3 text-center rounded-sm',
                            ),
                            {
                                backgroundColor: ColorScheme.Background.Greyed,
                                color: ColorScheme.Text.Default,
                            },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode={'middle'}>
                        {descriptorData}
                    </Text>
                </PlainButton>

                {/* Toggle with private key version */}
                {/* Only available if not watch-only */}
                {!walletData.isWatchOnly && (
                    <View
                        style={[
                            tailwind(
                                `mb-4 self-center w-4/5 ${
                                    langDir === 'right'
                                        ? 'flex-row-reverse'
                                        : 'flex-row'
                                }`,
                            ),
                        ]}>
                        <VText
                            style={[
                                tailwind('text-sm'),
                                {
                                    color: showPrivateDescriptor
                                        ? ColorScheme.Text.Default
                                        : ColorScheme.Text.GrayedText,
                                },
                            ]}>
                            {!showPrivateDescriptor
                                ? t('display_priv_descriptor')
                                : t('display_pub_descriptor')}
                        </VText>
                        {/* btn */}
                        <Checkbox
                            fillColor={ColorScheme.Background.CheckBoxFilled}
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
                                    ? ColorScheme.Background.CheckBoxOutline
                                    : 'grey',
                                borderRadius: 2,
                            }}
                            style={[
                                tailwind(
                                    `flex-row absolute ${
                                        langDir === 'right'
                                            ? 'right-0'
                                            : '-right-4'
                                    }`,
                                ),
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

                <View style={[tailwind('mt-6 flex w-5/6')]}>
                    <Text
                        style={[
                            tailwind('text-sm text-center mb-4'),
                            {color: ColorScheme.Text.DescText},
                        ]}>
                        {t('descriptor_backup_message')}
                    </Text>

                    <Text
                        style={[
                            tailwind('text-sm text-center'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {warning}
                    </Text>
                </View>
            </View>
        );
    }, [
        tailwind,
        ColorScheme,
        descriptorData,
        walletData.isWatchOnly,
        walletData.externalDescriptor,
        walletData.privateDescriptor,
        langDir,
        showPrivateDescriptor,
        t,
        warning,
        copyToClipboard,
        getQRData,
        isBiometricsActive,
    ]);

    const panels = useMemo(
        (): Slide[] => [mainPanel, descriptorPanel],
        [mainPanel, descriptorPanel],
    );

    return (
        <SafeAreaView
            edges={['bottom', 'right', 'left']}
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View style={[tailwind('w-full h-full items-center')]}>
                <View style={tailwind('w-5/6 h-full justify-center')}>
                    {/* Top panel */}
                    <View style={[tailwind('absolute top-6  w-full left-0')]}>
                        {/* Allow exporting public descriptor to file */}
                        {currentBackup === EBackupMaterial.Descriptor &&
                            Platform.OS === 'ios' &&
                            !showPrivateDescriptor && (
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
                            'absolute top-16 justify-center w-full',
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

                        {/* Display wallet type (advanced mode) */}
                        <Text
                            style={[
                                tailwind('text-base self-center mb-6'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {isAdvancedMode
                                ? walletTypeName
                                : capitalizeFirst(t('backup'))}
                        </Text>

                        {/* Display wallet seed selector */}
                        <View
                            style={[
                                tailwind(
                                    'flex-row self-center items-center justify-center rounded-full p-2 px-6 mb-4 bg-blue-800',
                                ),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                },
                            ]}>
                            {/* Display the single backup material if restored non-mnemonic */}
                            {/* Display the backup material selector if restored mnemonic */}
                            <PlainButton
                                style={[tailwind('mr-4')]}
                                onPress={() => {
                                    carouselRef.current?.prev();
                                    runOnJS(setCurrentBackup)(
                                        EBackupMaterial.Mnemonic,
                                    );
                                }}>
                                <Text
                                    style={[
                                        tailwind(
                                            `text-sm ${
                                                currentBackup ===
                                                EBackupMaterial.Mnemonic
                                                    ? 'font-bold'
                                                    : ''
                                            }`,
                                        ),
                                        {
                                            color:
                                                currentBackup ===
                                                EBackupMaterial.Mnemonic
                                                    ? ColorScheme.Text.Default
                                                    : ColorScheme.Text
                                                          .GrayedText,
                                        },
                                    ]}>
                                    {baseBackupTitle}
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
                                onPress={() => {
                                    carouselRef.current?.next();
                                    runOnJS(setCurrentBackup)(
                                        EBackupMaterial.Descriptor,
                                    );
                                }}>
                                <Text
                                    style={[
                                        tailwind(
                                            `text-sm ${
                                                currentBackup ===
                                                EBackupMaterial.Descriptor
                                                    ? 'font-bold'
                                                    : ''
                                            }`,
                                        ),
                                        {
                                            color:
                                                currentBackup ===
                                                EBackupMaterial.Descriptor
                                                    ? ColorScheme.Text.Default
                                                    : ColorScheme.Text
                                                          .GrayedText,
                                        },
                                    ]}>
                                    Descriptor
                                </Text>
                            </PlainButton>
                        </View>
                    </View>

                    {/* Main Carousel */}
                    <View
                        style={[
                            styles.carouselContainer,
                            tailwind('h-full w-full'),
                            {zIndex: -9},
                        ]}>
                        <Carousel
                            ref={carouselRef}
                            style={[
                                tailwind(
                                    'items-center justify-center absolute bottom-0 w-full',
                                ),
                            ]}
                            data={panels}
                            enabled={false}
                            width={NativeDims.width}
                            // Adjust height for iOS
                            // to account for top stack height
                            height={
                                Platform.OS === 'ios'
                                    ? NativeDims.height -
                                      NativeDims.navBottom * 3.2
                                    : NativeDims.height
                            }
                            defaultIndex={
                                currentBackup === EBackupMaterial.Descriptor
                                    ? 1
                                    : 0
                            }
                            loop={false}
                            panGestureHandlerProps={{
                                activeOffsetX: [-10, 10],
                            }}
                            testID="ReceiveSlider"
                            renderItem={({index}): ReactElement => {
                                const Slide = panels[index];
                                return <Slide key={index} />;
                            }}
                            onProgressChange={(_, absoluteProgress): void => {
                                progressValue.value = absoluteProgress;
                            }}
                        />
                    </View>
                </View>

                <Toast config={toastConfig as ToastConfig} />
            </View>
        </SafeAreaView>
    );
};

export default Backup;

const styles = StyleSheet.create({
    infoContainer: {
        marginTop: 56,
    },
    carouselContainer: {
        flex: 1,
    },
    qrCodContainer: {
        borderWidth: 2,
    },
});
