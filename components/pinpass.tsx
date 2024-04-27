/* eslint-disable react-hooks/exhaustive-deps */
import React, {useMemo, useContext, useEffect, useState} from 'react';
import {View, Text, useColorScheme, Platform, StyleSheet} from 'react-native';

import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {BottomModal} from './bmodal';
import Color from '../constants/Color';

import {useTailwind} from 'tailwind-rn';
import {useTranslation} from 'react-i18next';

import {AppStorageContext} from '../class/storageContext';

import {PinNumpad} from './input';

import RNBiometrics from '../modules/biometrics';
import {getKeychainItem} from '../class/keychainContext';

import Toast, {ToastConfig} from 'react-native-toast-message';
import {toastConfig} from './toast';
import NativeWindowMetrics from '../constants/NativeWindowMetrics';

type PinPassProps = {
    pinPassRef: React.RefObject<BottomSheetModal>;
    triggerSuccess: () => void;
    onSelectPinPass: (idx: number) => void;
    pinMode: boolean;
    idx: number;
};

const PinPass = (props: PinPassProps) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const snapPoints = useMemo(() => ['70'], []);

    const {isBiometricsActive} = useContext(AppStorageContext);
    const [tmpPIN, setTmpPIN] = useState<string>('');
    const [validPin, setValidPin] = useState<string>('');

    const {t} = useTranslation('wallet');

    const updatePIN = async (pin: string): Promise<void> => {
        setTmpPIN(pin);
    };

    const biometricAuth = async () => {
        const {available} = await RNBiometrics.isSensorAvailable();

        if (!available) {
            return;
        }

        RNBiometrics.simplePrompt({
            promptMessage: `Confirm ${
                Platform.OS === 'ios' ? 'FaceID' : 'Biometrics'
            }`,
        })
            .then(({success}) => {
                if (success) {
                    props.triggerSuccess();
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
        if (tmpPIN.length === 4) {
            if (tmpPIN === validPin) {
                props.triggerSuccess();
                setTmpPIN('');
            }

            setTmpPIN('');
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

    useEffect(() => {
        if (props.idx === 0) {
            if (!props.pinMode && isBiometricsActive && props.idx === 0) {
                biometricAuth();
            }
        }
    }, [props.idx]);

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
                            tailwind('text-center text-lg mt-4'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {t('lock_screen_message')}
                    </Text>

                    <View
                        style={[tailwind('flex-row items-center mt-12 mb-4')]}>
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
                            showBiometrics={false}
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
