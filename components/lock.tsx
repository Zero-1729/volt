/* eslint-disable react-hooks/exhaustive-deps */
import React, {useContext, useEffect, useState, useRef} from 'react';

import {View, useColorScheme, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';

import Color from '../constants/Color';
import AppIcon from '../assets/svg/volt-text.svg';

import NativeWindowMetrics from '../constants/NativeWindowMetrics';

import {PinNumpad} from './input';
import {useTranslation} from 'react-i18next';

import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import ResetPINModal from '../components/resetpin';

import {getKeychainItem} from '../class/keychainContext';
import {AppStorageContext} from '../class/storageContext';
import RNBiometrics from '../modules/biometrics';

import {toastConfig} from './toast';
import Toast, {ToastConfig} from 'react-native-toast-message';

import {MAX_PIN_ATTEMPTS} from '../modules/wallet-defaults';
import {PlainButton} from './button';

type lockProps = {
    onSuccess: () => void;
};

const LockScreen = (props: lockProps) => {
    const ColorScheme = Color(useColorScheme());
    const tailwind = useTailwind();

    const {isBiometricsActive, pinAttempts, setPINAttempts, resetAppData} =
        useContext(AppStorageContext);

    const {t} = useTranslation('wallet');
    const [pin, setPin] = useState('');
    const [validPin, setValidPin] = useState('');

    const [openModal, setOpenModal] = useState(-1);
    const bottomModalRef = useRef<BottomSheetModal>(null);

    const openPINModal = () => {
        if (openModal !== 1) {
            bottomModalRef.current?.present();
        } else {
            bottomModalRef.current?.close();
        }
    };

    const handleResetSuccess = () => {
        props.onSuccess();
    };

    const fetchPin = async () => {
        const storedPIN = await getKeychainItem('pin');
        setValidPin(storedPIN.data);
    };

    const updatePin = (value: string) => {
        setPin(value);
    };

    const onSuccessRoute = () => {
        setPINAttempts(0);
        props.onSuccess();
    };

    const requestBiometrics = () => {
        RNBiometrics.simplePrompt({
            promptMessage: 'Confirm fingerprint',
        })
            .then(({success}) => {
                if (success) {
                    onSuccessRoute();
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
    };

    useEffect(() => {
        fetchPin();
    }, []);

    useEffect(() => {
        // Only check if valid pin loaded
        if (pin.length === 4) {
            if (pinAttempts === MAX_PIN_ATTEMPTS) {
                // WARNING: Reset wallet data
                resetAppData();
            }

            if (validPin.length === 4 && pin === validPin) {
                // reset pin attempts
                onSuccessRoute();
                setPin('');
                return;
            }

            // keep bumping attempts
            setPin('');
            setPINAttempts(pinAttempts + 1);
        }
    }, [pin]);

    return (
        <SafeAreaView edges={['top', 'left', 'right', 'bottom']}>
            <BottomSheetModalProvider>
                <View style={[tailwind('w-full h-full justify-center')]}>
                    <View
                        style={[
                            tailwind(
                                'items-center justify-center w-full h-full',
                            ),
                        ]}>
                        <View
                            style={[
                                tailwind(
                                    'h-1/2 w-full absolute top-0 items-center justify-center',
                                ),
                            ]}>
                            <View style={[tailwind('h-1/2 justify-center')]}>
                                <AppIcon fill={ColorScheme.SVG.Default} />
                            </View>

                            <View
                                style={[
                                    tailwind(
                                        'h-1/2 w-full justify-center items-center',
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind('text-base mb-4'),
                                        {color: ColorScheme.Text.GrayedText},
                                    ]}>
                                    {t('lock_screen_message')}
                                </Text>

                                {pinAttempts > 0 && (
                                    <>
                                        <View
                                            style={[
                                                tailwind(
                                                    'items-center mb-4 w-5/6',
                                                ),
                                            ]}>
                                            {pinAttempts ===
                                            MAX_PIN_ATTEMPTS - 1 ? (
                                                <Text
                                                    style={[
                                                        tailwind(
                                                            'text-sm text-center',
                                                        ),
                                                        {
                                                            color: ColorScheme
                                                                .Text.Default,
                                                        },
                                                    ]}>
                                                    {t('last_attempt_warning')}
                                                </Text>
                                            ) : (
                                                <Text
                                                    style={[
                                                        tailwind('text-sm'),
                                                        {
                                                            color: ColorScheme
                                                                .Text.Default,
                                                        },
                                                    ]}>
                                                    {t('pin_attempts', {
                                                        attempts:
                                                            MAX_PIN_ATTEMPTS -
                                                            pinAttempts,
                                                    })}
                                                </Text>
                                            )}
                                        </View>

                                        <PlainButton onPress={openPINModal}>
                                            <View
                                                style={[
                                                    tailwind(
                                                        'rounded-full px-4 py-1 mb-12',
                                                    ),
                                                    {
                                                        backgroundColor:
                                                            ColorScheme
                                                                .Background
                                                                .Greyed,
                                                    },
                                                ]}>
                                                <Text
                                                    style={[
                                                        tailwind('text-sm'),
                                                        {
                                                            color: ColorScheme
                                                                .Text.DescText,
                                                        },
                                                    ]}>
                                                    {t('forgot_pin')}
                                                </Text>
                                            </View>
                                        </PlainButton>
                                    </>
                                )}

                                <View
                                    style={[
                                        tailwind('flex-row items-center mb-4'),
                                    ]}>
                                    {Array(4)
                                        .fill(null)
                                        .map((_, i) => (
                                            <View
                                                key={i}
                                                style={[
                                                    styles.dot,
                                                    tailwind('rounded-full'),
                                                    {
                                                        borderColor:
                                                            ColorScheme
                                                                .Background
                                                                .Inverted,
                                                        backgroundColor:
                                                            pin[i] === undefined
                                                                ? ColorScheme
                                                                      .Background
                                                                      .Primary
                                                                : ColorScheme
                                                                      .Background
                                                                      .Inverted,
                                                    },
                                                ]}
                                            />
                                        ))}
                                </View>
                            </View>
                        </View>

                        <View
                            style={[
                                tailwind('w-full absolute'),
                                {bottom: NativeWindowMetrics.bottom + 32},
                            ]}>
                            <PinNumpad
                                pin={pin}
                                onPinChange={updatePin}
                                triggerBiometrics={requestBiometrics}
                                pinLimit={4}
                                showBiometrics={isBiometricsActive}
                            />
                        </View>
                    </View>

                    <Toast config={toastConfig as ToastConfig} />
                </View>

                <ResetPINModal
                    pinPassRef={bottomModalRef}
                    triggerSuccess={handleResetSuccess}
                    onSelectPinPass={idx => setOpenModal(idx)}
                    pinMode={true}
                    idx={openModal}
                />
            </BottomSheetModalProvider>
        </SafeAreaView>
    );
};

export default LockScreen;

const styles = StyleSheet.create({
    dot: {
        width: 20,
        height: 20,
        borderWidth: 1,
        marginHorizontal: 6,
    },
});
