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

import {useTailwind} from 'tailwind-rn';

import NativeDims from '../../constants/NativeWindowMetrics';

import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import Color from '../../constants/Color';

import {PlainButton} from '../../components/button';

import {useTranslation} from 'react-i18next';

import {AppStorageContext} from '../../class/storageContext';

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../../constants/Haptic';

import Carousel, {ICarouselInstance} from 'react-native-reanimated-carousel';

import CloseIcon from '../../assets/svg/x-24.svg';
import ShareIcon from '../../assets/svg/share-24.svg';

import Toast, {ToastConfig} from 'react-native-toast-message';
import {toastConfig} from '../../components/toast';

import {capitalizeFirst} from '../../modules/transform';

import RNBiometrics from '../../modules/biometrics';

import {MnemonicDisplayCapsule, GenericSwitch} from '../../components/shared';
import Animated from 'react-native-reanimated';

type Slide = () => ReactElement;

const Backup = () => {
    const navigation = useNavigation();
    const tailwind = useTailwind();
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
    }, [descriptorData, t, walletData.name]);

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
        const mnemonics = mnemonicData.split(' ');
        const baseBackup = mnemonicData ? mnemonicData : xprvData;

        const toggleSwitch = () => {
            if (switchEnabled) {
                RNHapticFeedback.trigger(
                    'impactLight',
                    RNHapticFeedbackOptions,
                );
            }

            setSwitchEnabled(!switchEnabled);
        };

        return (
            <View
                style={[tailwind('items-center justify-center h-full w-full')]}>
                {/* Show mnemonic & QR code version or Xprv QR code */}
                {switchEnabled || !mnemonicData ? (
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
                ) : (
                    <View
                        style={[
                            tailwind(
                                'w-5/6 flex-row justify-center items-center mb-6',
                            ),
                        ]}>
                        {/* col 0 */}
                        <View
                            style={[
                                tailwind('items-center justify-center mr-4'),
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
                            style={[
                                tailwind('items-center justify-center'),
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
                        style={[
                            tailwind(
                                'w-5/6 items-center justify-center mb-4 flex-row',
                            ),
                        ]}>
                        <Text
                            style={[
                                tailwind('text-sm font-bold mr-4'),
                                {
                                    color: switchEnabled
                                        ? ColorScheme.Text.Default
                                        : ColorScheme.Text.GrayedText,
                                },
                            ]}>
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
        mnemonicData,
        xprvData,
        tailwind,
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
                RNHapticFeedback.trigger(
                    'impactLight',
                    RNHapticFeedbackOptions,
                );

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
                }
            }
        };

        return (
            <View
                style={[tailwind('items-center justify-center h-full w-full')]}>
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
                    style={[tailwind('items-center mb-6 w-5/6')]}
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
                    <PlainButton
                        onPress={() => {
                            RNHapticFeedback.trigger(
                                'rigid',
                                RNHapticFeedbackOptions,
                            );

                            togglePrivateDescriptor();
                        }}
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
                            onPress={() => {
                                RNHapticFeedback.trigger(
                                    'rigid',
                                    RNHapticFeedbackOptions,
                                );

                                togglePrivateDescriptor();
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
                            disableBuiltInState={true}
                        />
                    </PlainButton>
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
            <Animated.View style={[tailwind('w-full h-full items-center')]}>
                <Animated.View style={tailwind('w-5/6 h-full justify-center')}>
                    {/* Top panel */}
                    <Animated.View
                        style={[
                            tailwind(
                                'absolute w-full flex-row justify-center items-center top-6',
                            ),
                        ]}>
                        {/* Allow exporting public descriptor to file */}
                        {currentIndex === 1 &&
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
                        {/* Display wallet seed selector */}
                        <Animated.View
                            style={[
                                tailwind(
                                    'flex-row justify-center items-center rounded-full p-2 px-6',
                                ),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                },
                            ]}>
                            <PlainButton
                                style={[tailwind('mr-4')]}
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
                                    style={[
                                        tailwind(
                                            `text-sm ${
                                                currentIndex === 0
                                                    ? 'font-bold'
                                                    : ''
                                            }`,
                                        ),
                                        {
                                            color:
                                                currentIndex === 0
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
                                    style={[
                                        tailwind(
                                            `text-sm ${
                                                currentIndex === 1
                                                    ? 'font-bold'
                                                    : ''
                                            }`,
                                        ),
                                        {
                                            color:
                                                currentIndex === 1
                                                    ? ColorScheme.Text.Default
                                                    : ColorScheme.Text
                                                          .GrayedText,
                                        },
                                    ]}>
                                    Descriptor
                                </Text>
                            </PlainButton>
                        </Animated.View>
                        <PlainButton
                            style={[tailwind('absolute right-0')]}
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
                        style={[
                            styles.carouselContainer,
                            tailwind('justify-center'),
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

                <Toast config={toastConfig as ToastConfig} />
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
    },
    qrCodContainer: {
        borderWidth: 2,
    },
});
