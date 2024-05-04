/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useMemo, useEffect, useState, useContext} from 'react';
import {View, Text, useColorScheme, StyleSheet} from 'react-native';

import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {BottomModal} from './bmodal';
import Color from '../constants/Color';

import {PlainButton} from './button';

import {useTailwind} from 'tailwind-rn';
import {useTranslation} from 'react-i18next';

import {CommonActions, useNavigation} from '@react-navigation/native';

import {PinNumpad} from './input';

import {getKeychainItem} from '../class/keychainContext';

import Toast, {ToastConfig} from 'react-native-toast-message';
import {toastConfig} from './toast';
import NativeWindowMetrics from '../constants/NativeWindowMetrics';

import {MAX_PIN_ATTEMPTS} from '../modules/wallet-defaults';

import {AppStorageContext} from '../class/storageContext';
import {biometricAuth} from '../modules/shared';

type PinPassProps = {
    pinPassRef: React.RefObject<BottomSheetModal>;
    triggerSuccess: () => void;
    onSelectPinPass: (idx: number) => void;
    pinMode: boolean;
};

const PinPass = (props: PinPassProps) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const {setPINAttempts, pinAttempts, resetAppData, isBiometricsActive} =
        useContext(AppStorageContext);

    const snapPoints = useMemo(() => ['75'], []);

    const [tmpPIN, setTmpPIN] = useState<string>('');
    const [validPin, setValidPin] = useState<string>('');

    const {t} = useTranslation('wallet');

    const updatePIN = async (pin: string): Promise<void> => {
        setTmpPIN(pin);
    };

    const routeToResetPIN = () => {
        navigation.dispatch(
            CommonActions.navigate('SettingsRoot', {
                screen: 'ResetPIN',
                params: {isPINReset: true},
            }),
        );
    };

    const triggerBiometrics = () => {
        biometricAuth(
            success => {
                if (success) {
                    setPINAttempts(0);
                    props.triggerSuccess();
                }
            },
            // prompt response callback
            () => {},
            // prompt error callback
            error => {
                Toast.show({
                    topOffset: 54,
                    type: 'Liberal',
                    text1: t('Biometrics'),
                    text2: error.message,
                    visibilityTime: 1750,
                });
            },
        );
    };

    useEffect(() => {
        if (tmpPIN.length === 4) {
            if (pinAttempts === MAX_PIN_ATTEMPTS) {
                // WARNING: Reset wallet data
                resetAppData();
            }

            if (tmpPIN === validPin) {
                setTmpPIN('');
                setPINAttempts(0);
                props.triggerSuccess();
                return;
            }

            setTmpPIN('');
            setPINAttempts(pinAttempts + 1);
        }
    }, [tmpPIN]);

    const init = async () => {
        const vpResp = await getKeychainItem('pin');

        if (!vpResp.error) {
            setValidPin(vpResp.data);
        }
    };

    useEffect(() => {
        init();
    }, []);

    return (
        <BottomModal
            snapPoints={snapPoints}
            ref={props.pinPassRef}
            onUpdate={props.onSelectPinPass}
            backgroundColor={ColorScheme.Background.Primary}
            handleIndicatorColor={'#64676E'}
            backdrop={true}>
            <View
                style={[
                    tailwind('w-full h-full items-center relative'),
                    {
                        backgroundColor: ColorScheme.Background.Primary,
                    },
                ]}>
                <View style={[tailwind('w-full px-2 h-full items-center')]}>
                    <Text
                        style={[
                            tailwind('text-center text-lg font-bold mt-4'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {t('lock_screen_message')}
                    </Text>

                    {pinAttempts > 0 && (
                        <>
                            <View
                                style={[
                                    tailwind('items-center mt-6 mb-4 w-5/6'),
                                ]}>
                                {pinAttempts === MAX_PIN_ATTEMPTS - 1 ? (
                                    <Text
                                        style={[
                                            tailwind('text-sm text-center'),
                                            {
                                                color: ColorScheme.Text.Default,
                                            },
                                        ]}>
                                        {t('last_attempt_warning')}
                                    </Text>
                                ) : (
                                    <Text
                                        style={[
                                            tailwind('text-sm'),
                                            {
                                                color: ColorScheme.Text.Default,
                                            },
                                        ]}>
                                        {t('pin_attempts', {
                                            attempts:
                                                MAX_PIN_ATTEMPTS - pinAttempts,
                                        })}
                                    </Text>
                                )}
                            </View>

                            <PlainButton onPress={routeToResetPIN}>
                                <View
                                    style={[
                                        tailwind('rounded-full px-4 py-1 mb-8'),
                                        {
                                            backgroundColor:
                                                ColorScheme.Background.Greyed,
                                        },
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm'),
                                            {
                                                color: ColorScheme.Text
                                                    .DescText,
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
                            tailwind('flex-row items-center'),
                            {marginTop: pinAttempts > 0 ? 0 : 98},
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
                                                ColorScheme.Background.Inverted,
                                            backgroundColor:
                                                tmpPIN[i] === undefined
                                                    ? ColorScheme.Background
                                                          .Primary
                                                    : ColorScheme.Background
                                                          .Inverted,
                                        },
                                    ]}
                                />
                            ))}
                    </View>

                    <View
                        style={[
                            tailwind('justify-end absolute'),
                            {bottom: NativeWindowMetrics.bottom + 64},
                        ]}>
                        <PinNumpad
                            pin={tmpPIN}
                            onPinChange={updatePIN}
                            pinLimit={4}
                            showBiometrics={isBiometricsActive}
                            triggerBiometrics={triggerBiometrics}
                        />
                    </View>
                </View>

                <Toast config={toastConfig as ToastConfig} />
            </View>
        </BottomModal>
    );
};

export default PinPass;

const styles = StyleSheet.create({
    dot: {
        width: 20,
        height: 20,
        borderWidth: 1,
        marginHorizontal: 6,
    },
});
