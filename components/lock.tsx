/* eslint-disable react-hooks/exhaustive-deps */
import React, {useContext, useEffect, useState, useRef} from 'react';

import {View, useColorScheme, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

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

import {Toasts} from '@backpackapp-io/react-native-toast';
import {LiberalToast} from './toast';

import {MAX_PIN_ATTEMPTS} from '../modules/wallet-defaults';
import {PlainButton} from './button';

type lockProps = {
    onSuccess: () => void;
};

const LockScreen = (props: lockProps) => {
    const ColorScheme = Color(useColorScheme());

    const {
        isBiometricsActive,
        pinAttempts,
        setPINAttempts,
        resetAppData,
        getWalletData,
        currentWalletID,
    } = useContext(AppStorageContext);

    const walletData = getWalletData(currentWalletID);

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
                LiberalToast(t('Biometrics'), error.message, {
                    duration: 3000,
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
                <View className="w-full h-full justify-center" style={{backgroundColor: ColorScheme.Background.Primary}}>
                    <View  className="items-center justify-center w-full h-full">
                        <View className="h-1/2 w-full absolute top-0 items-center justify-center">
                            <View className="h-2/3">
                                <AppIcon fill={ColorScheme.SVG.Default} />
                            </View>

                            <View className="h-2/3 w-full justify-center bottom-0 absolute items-center">
                                <Text
                                    className="text-base mb-4"
                                    style={{color: ColorScheme.Text.GrayedText}}>
                                    {t('lock_screen_message')}
                                </Text>

                                {pinAttempts > 0 && (
                                    <>
                                        <View className="items-center mb-4 w-5/6">
                                            {pinAttempts ===
                                            MAX_PIN_ATTEMPTS - 1 ? (
                                                <Text
                                                className="text-sm text-center"
                                                    style={{
                                                            color: ColorScheme
                                                                .Text.Default,
                                                        }}>
                                                    {t('last_attempt_warning')}
                                                </Text>
                                            ) : (
                                                <Text
                                                    className="text-sm"
                                                    style={{
                                                            color: ColorScheme
                                                                .Text.Default,
                                                        }}>
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
                                                className="rounded-full px-4 py-1 mb-12"
                                                style={{
                                                        backgroundColor:
                                                            ColorScheme
                                                                .Background
                                                                .Greyed,
                                                    }}>
                                                <Text
                                                    className="text-sm"
                                                    style={{
                                                            color: ColorScheme
                                                                .Text.DescText,
                                                        }}>
                                                    {t('forgot_pin')}
                                                </Text>
                                            </View>
                                        </PlainButton>
                                    </>
                                )}

                                <View className="flex-row items-center mb-4">
                                    {Array(4)
                                        .fill(null)
                                        .map((_, i) => (
                                            <View
                                                key={i}
                                                className="rounded-full"
                                                style={[
                                                    styles.dot,
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
                            className="w-full absolute"
                            style={[
                                {bottom: NativeWindowMetrics.bottom + NativeWindowMetrics.height * 0.05},
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

                    <Toasts extraInsets={
                        {
                            top: NativeWindowMetrics.height * -0.075,
                        }
                    } />
                </View>

                <ResetPINModal
                    pinPassRef={bottomModalRef}
                    triggerSuccess={handleResetSuccess}
                    onSelectPinPass={idx => setOpenModal(idx)}
                    pinMode={true}
                    idx={openModal}
                    testInfo={{
                        mnemonic: walletData.mnemonic.length > 0,
                        isWatchOnly: walletData.isWatchOnly,
                    }}
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
