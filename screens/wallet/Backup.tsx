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

import QRCode from 'react-qr-code';
import Checkbox from 'react-native-bouncy-checkbox';

import NativeDims from '../../constants/NativeWindowMetrics';

import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import Color from '../../constants/Color';

import {PlainButton} from '../../components/button';

import {useTranslation} from 'react-i18next';

import {AppStorageContext} from '../../class/storageContext';

import Carousel, {ICarouselInstance} from 'react-native-reanimated-carousel';

import CloseIcon from '../../assets/svg/x-24.svg';
import ShareIcon from '../../assets/svg/share-24.svg';

import {Toasts} from '@backpackapp-io/react-native-toast';
import {LiberalToast} from '../../components/toast';

import {capitalizeFirst} from '../../modules/transform';

import RNBiometrics from '../../modules/biometrics';

import {MnemonicDisplayCapsule, GenericSwitch} from '../../components/shared';
import Animated from 'react-native-reanimated';
import NativeWindowMetrics from '../../constants/NativeWindowMetrics';

type Slide = () => ReactElement;

const Backup = () => {
    const navigation = useNavigation();
    const ColorScheme = Color(useColorScheme());

    const {currentWalletID, getWalletData, isBiometricsActive} =
        useContext(AppStorageContext);

    const carouselRef = useRef<ICarouselInstance>(null);

    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const walletData = useMemo(() => {
        return getWalletData(currentWalletID);
    }, [getWalletData, currentWalletID]);

    const CardColor =
        ColorScheme.WalletColors[walletData.type][walletData.network];

    const [showPrivateDescriptor, setShowPrivateDescriptor] = useState(false);
    const [switchEnabled, setSwitchEnabled] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const mnemonicData = walletData.mnemonic !== '' ? walletData.mnemonic : '';
    const xprvData = walletData.xprv !== '' ? walletData.xprv : '';

    const descriptorData = useMemo(() => {
        return showPrivateDescriptor
            ? walletData.privateDescriptor
            : walletData.externalDescriptor;
    }, [
        showPrivateDescriptor,
        walletData.privateDescriptor,
        walletData.externalDescriptor,
    ]);

    // Could be either mnemonic or xprv if available
    const baseBackupTitle = mnemonicData ? 'Mnemonic' : 'Extended Key';

    // Write public descriptor file to device
    const writeDescriptorToFile = useCallback(async () => {
        let pathData =
            RNFS.TemporaryDirectoryPath +
            `/${walletData.name}-wallet_descriptor_backup.txt`;

        const fileBackupData = descriptorData;

        if (Platform.OS === 'ios') {
            await RNFS.writeFile(pathData, fileBackupData, 'utf8').catch(e => {
                LiberalToast(capitalizeFirst(t('error')), e.message, {
                    duration: 2000,
                });
            });
            await Share.open({
                url: 'file://' + pathData,
                type: 'text/plain',
                title: 'Volt Wallet Descriptor Backup',
            })
                .catch(e => {
                    if (e.message !== 'User did not share') {
                        LiberalToast(capitalizeFirst(t('error')), e.message, {
                            duration: 2000,
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
    }, [descriptorData, t, walletData.name]);

    // Copy data to clipboard
    const copyToClipboard = useCallback(
        (data: string) => {
            // Copy backup material to Clipboard
            // Temporarily set copied message
            // and revert after a few seconds
            Clipboard.setString(data);

            LiberalToast(capitalizeFirst(t('clipboard')), capitalizeFirst(t('copied_to_clipboard')), {
                duration: 1000,
            });
        },
        [t],
    );

    const warning = t('backup_clarification');

    const mainPanel = useCallback((): ReactElement => {
        const mnemonics = mnemonicData.split(' ');
        const baseBackup = mnemonicData ? mnemonicData : xprvData;

        const toggleSwitch = () => {
            setSwitchEnabled(!switchEnabled);
        };

        return (
            <View
                className="items-center justify-center h-full w-full">
                {/* Show mnemonic & QR code version or Xprv QR code */}
                {switchEnabled || !mnemonicData ? (
                    <View
                        className="rounded self-center mb-4"
                        style={{
                            borderWidth: 2,
                            borderColor: ColorScheme.Background.QRBorder,
                        }}>
                        <QRCode
                            style={{
                                backgroundColor: 'white',
                            }}
                            width={76}
                            value={baseBackup}
                            color={ColorScheme.Background.Default}
                        />
                    </View>
                ) : (
                    <View
                        className="w-5/6 flex-row justify-center items-center mb-6">
                        {/* col 0 */}
                        <View
                            className="items-center justify-center mr-4"
                            style={[
                                styles.capsuleContainer,
                            ]}>
                            {mnemonics.slice(0, 6).map((word, index) => (
                                <MnemonicDisplayCapsule
                                    key={index}
                                    word={word}
                                    index={index}
                                />
                            ))}
                        </View>

                        {/* col 1 */}
                        <View
                            className="items-center justify-center"
                            style={[
                                styles.capsuleContainer,
                            ]}>
                            {mnemonics.slice(6, 12).map((word, index) => (
                                <MnemonicDisplayCapsule
                                    key={index + 6}
                                    word={word}
                                    index={index + 6}
                                />
                            ))}
                        </View>
                    </View>
                )}

                {mnemonicData && (
                    <View
                        className="w-5/6 items-center justify-center mb-4 flex-row">
                        <Text
                            className="text-sm font-bold mr-4"
                            style={{
                                color: switchEnabled
                                    ? ColorScheme.Text.Default
                                    : ColorScheme.Text.GrayedText,
                            }}>
                            {t('display_mnemonic_qr')}
                        </Text>

                        <GenericSwitch
                            trackColor={{
                                false: ColorScheme.Background.Greyed,
                                true: CardColor,
                            }}
                            thumbColor={'white'}
                            iosBackgroundColor={ColorScheme.Background.Greyed}
                            onValueChange={toggleSwitch}
                            value={switchEnabled}
                        />
                    </View>
                )}

                <View className="mt-2 flex w-5/6">
                    <Text
                        className="text-sm text-center mb-4"
                        style={{color: ColorScheme.Text.DescText}}>
                        {baseBackupTitle === 'Mnemonic'
                            ? t('ln_mnemonic_backup_message')
                            : t('xprv_backup_message')}
                    </Text>

                    <Text
                        className="text-sm text-center"
                        style={{color: ColorScheme.Text.Default}}>
                        {warning}
                    </Text>
                </View>
            </View>
        );
    }, [
        mnemonicData,
        xprvData,
        ColorScheme.Text.Default,
        ColorScheme.Text.GrayedText,
        ColorScheme.Text.DescText,
        ColorScheme.Background.QRBorder,
        ColorScheme.Background.Default,
        ColorScheme.Background.Greyed,
        switchEnabled,
        t,
        CardColor,
        baseBackupTitle,
        warning,
    ]);

    const descriptorPanel = useCallback((): ReactElement => {
        const copyDescriptor = () => {
            copyToClipboard(descriptorData);
        };

        const togglePrivateDescriptor = () => {
            if (showPrivateDescriptor) {
                setShowPrivateDescriptor(false);
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
                            }
                        })
                        .catch((error: any) => {
                            LiberalToast(t('Biometrics'), error.message, {
                                duration: 3000,
                            });
                        });
                } else {
                    setShowPrivateDescriptor(true);
                }
            }
        };

        return (
            <View
                className="items-center justify-center h-full w-full">
                {/* Display QR code with seed */}
                <View
                    className="rounded self-center mb-4"
                    style={{
                        borderWidth: 2,
                        borderColor: ColorScheme.Background.QRBorder,
                    }}>
                    <QRCode
                        style={{
                        backgroundColor: 'white',
                        }}
                        value={descriptorData}
                        color={ColorScheme.Background.Default}
                        width={78}
                    />
                </View>

                {/* Display either seed or descriptor */}
                <PlainButton
                    className="items-center mb-6 w-5/6"
                    onPress={copyDescriptor}>
                    <Text
                        className="text-sm w-full p-3 text-center rounded-sm"
                        style={{
                            backgroundColor: ColorScheme.Background.Greyed,
                            color: ColorScheme.Text.Default,
                        }}
                        numberOfLines={1}
                        ellipsizeMode={'middle'}>
                        {descriptorData}
                    </Text>
                </PlainButton>

                {/* Toggle with private key version */}
                {/* Only available if not watch-only */}
                {!walletData.isWatchOnly && (
                    <PlainButton
                        onPress={() => {
                            togglePrivateDescriptor();
                        }}
                        className={
                            `mb-4 self-center w-4/5 ${
                                    langDir === 'right'
                                        ? 'flex-row-reverse'
                                        : 'flex-row'
                                }`
                        }>
                        <VText
                            className="text-sm"
                            style={{
                                color: showPrivateDescriptor
                                    ? ColorScheme.Text.Default
                                    : ColorScheme.Text.GrayedText,
                            }}>
                            {!showPrivateDescriptor
                                ? t('display_priv_descriptor')
                                : t('display_pub_descriptor')}
                        </VText>
                        {/* btn */}
                        <Checkbox
                            fillColor={ColorScheme.Background.CheckBoxFilled}
                            unFillColor={
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
                            onPress={() => {
                                togglePrivateDescriptor();
                            }}
                            className={
                                `flex-row absolute ${
                                    langDir === 'right'
                                        ? 'right-0'
                                        : '-right-4'
                                }`
                            }
                            useBuiltInState={false}
                        />
                    </PlainButton>
                )}

                <View className="mt-6 flex w-5/6">
                    <Text
                        className="text-sm text-center mb-4"
                        style={{color: ColorScheme.Text.DescText}}>
                        {t('descriptor_backup_message')}
                    </Text>

                    <Text
                        className="text-sm text-center"
                        style={{color: ColorScheme.Text.Default}}>
                        {warning}
                    </Text>
                </View>

                <Toasts extraInsets={{top: NativeWindowMetrics.height * -0.075}} />
            </View>
        );
    }, [
        ColorScheme.Text.Default,
        ColorScheme.Text.GrayedText,
        ColorScheme.Text.DescText,
        ColorScheme.Background.QRBorder,
        ColorScheme.Background.Default,
        ColorScheme.Background.Greyed,
        ColorScheme.Background.CheckBoxFilled,
        ColorScheme.Background.CheckBoxUnfilled,
        ColorScheme.Background.CheckBoxOutline,
        walletData.isWatchOnly,
        descriptorData,
        langDir,
        showPrivateDescriptor,
        t,
        warning,
        copyToClipboard,
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
            <Animated.View className="w-full h-full items-center">
                <Animated.View className="w-5/6 h-full justify-center">
                    {/* Top panel */}
                    <Animated.View
                        className="absolute w-full flex-row justify-center items-center top-6">
                        {/* Allow exporting public descriptor to file */}
                        {currentIndex === 1 &&
                            Platform.OS === 'ios' &&
                            !showPrivateDescriptor && (
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
                        {/* Display wallet seed selector */}
                        <Animated.View
                            className="flex-row justify-center items-center rounded-full p-2 px-6"
                            style={{
                                backgroundColor:
                                    ColorScheme.Background.Greyed,
                            }}>
                            <PlainButton
                                className="mr-4"
                                onPress={() => {
                                    if (
                                        carouselRef.current &&
                                        currentIndex !== 0
                                    ) {
                                        carouselRef.current.scrollTo({
                                            index: 0,
                                        });
                                    }
                                }}>
                                <Text
                                    className={
                                        `text-sm ${
                                            currentIndex === 0
                                                ? 'font-bold'
                                                : ''
                                        }`
                                    }
                                    style={{
                                        color:
                                            currentIndex === 0
                                                ? ColorScheme.Text.Default
                                                : ColorScheme.Text
                                                        .GrayedText,
                                    }}>
                                    {baseBackupTitle}
                                </Text>
                            </PlainButton>
                            <View
                                className="h-6 w-0.5 mr-4 rounded-full"
                                style={{
                                    backgroundColor:
                                        ColorScheme.Background.CardGreyed,
                                }}
                            />
                            <PlainButton
                                onPress={() => {
                                    if (
                                        carouselRef.current &&
                                        currentIndex !== 1
                                    ) {
                                        carouselRef.current.scrollTo({
                                            index: 1,
                                        });
                                    }
                                }}>
                                <Text
                                    className={
                                        `text-sm ${
                                            currentIndex === 1
                                                ? 'font-bold'
                                                : ''
                                        }`
                                    }
                                    style={{
                                        color:
                                            currentIndex === 1
                                                ? ColorScheme.Text.Default
                                                : ColorScheme.Text
                                                        .GrayedText,
                                    }}>
                                    Descriptor
                                </Text>
                            </PlainButton>
                        </Animated.View>
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
                    </Animated.View>

                    {/* Main Carousel */}
                    <Animated.View
                        className="justify-center"
                        style={[styles.carouselContainer]}>
                        <Carousel
                            ref={carouselRef}
                            data={panels}
                            enabled={true}
                            width={NativeDims.width}
                            // Adjust height for iOS
                            // to account for top stack height
                            height={
                                Platform.OS === 'ios'
                                    ? NativeDims.height -
                                      NativeDims.navBottom * 3.2
                                    : NativeDims.height
                            }
                            loop={false}
                            renderItem={({index}): ReactElement => {
                                const Slide = panels[index];
                                return <Slide key={index} />;
                            }}
                            onProgressChange={(_, absProg) => {
                                const cI = Math.round(absProg) % 2;
                                setCurrentIndex(cI);
                            }}
                            snapEnabled={true}
                        />
                    </Animated.View>
                </Animated.View>

                <Toasts extraInsets={{top: NativeWindowMetrics.height * -0.075}} />
            </Animated.View>
        </SafeAreaView>
    );
};

export default Backup;

const styles = StyleSheet.create({
    capsuleContainer: {
        width: '46%',
    },
    carouselContainer: {
        flex: 1,
        zIndex: -9,
        justifyContent: 'center',
        width: '100%',
        alignItems: 'center',
    },
    qrCodContainer: {
        borderWidth: 2,
    },
});
