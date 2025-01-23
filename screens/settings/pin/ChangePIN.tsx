/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import {StyleSheet, Text, View, useColorScheme} from 'react-native';
import React, {useContext, useEffect, useState} from 'react';

import Color from '../../../constants/Color';

import {useNavigation} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';

import NativeWindowMetrics from '../../../constants/NativeWindowMetrics';
import {CommonActions} from '@react-navigation/native';

import {useTranslation} from 'react-i18next';

import Back from '../../../assets/svg/arrow-left-24.svg';

import {PinNumpad} from '../../../components/input';
import {getKeychainItem} from '../../../class/keychainContext';
import {PlainButton} from '../../../components/button';
import {capitalizeFirst} from '../../../modules/transform';

import {AppStorageContext} from '../../../class/storageContext';
import {MAX_PIN_ATTEMPTS} from '../../../modules/wallet-defaults';

const ChangePIN = () => {
    const [tmpPIN, setTmpPIN] = useState<string>('');

    const navigation = useNavigation();
    const ColorScheme = Color(useColorScheme());

    const {pinAttempts, setPINAttempts} = useContext(AppStorageContext);

    const [validPin, setValidPin] = useState<string>('');
    const [firstWrong, setFirstWrong] = useState<boolean>(false);

    const initValidPin = async () => {
        const storedPIN = await getKeychainItem('pin');
        setValidPin(storedPIN.data);
    };

    const {t} = useTranslation('settings');

    const updateTmpPIN = (pin: string): void => {
        setTmpPIN(pin);
    };

    const moveToSetup = () => {
        navigation.dispatch(
            CommonActions.navigate({
                name: 'SetPIN',
                params: {isChangePIN: true},
            }),
        );
    };

    const routeToResetPIN = () => {
        navigation.dispatch(
            CommonActions.navigate('SettingsRoot', {
                screen: 'ResetPIN',
                params: {isPINReset: true, isChangePIN: true},
            }),
        );
    };

    useEffect(() => {
        initValidPin();
    }, []);

    useEffect(() => {
        if (tmpPIN.length === 4) {
            if (tmpPIN === validPin) {
                moveToSetup();
                return;
            }

            setTmpPIN('');
            setFirstWrong(true);
            setPINAttempts(pinAttempts + 1);
        }
    }, [tmpPIN]);

    return (
        <SafeAreaView
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View className="w-full h-full items-center">
                <View className="items-center h-full w-full">
                    <View
                        className="w-5/6 absolute top-0"
                        style={{zIndex: 9999}}>
                        <PlainButton
                            className="items-center flex-row -ml-1"
                            onPress={() => {
                                navigation.dispatch(CommonActions.goBack());
                            }}>
                            <Back
                                className="mr-2"
                                fill={ColorScheme.SVG.Default}
                            />
                            <Text
                                className="text-sm font-medium"
                                style={{color: ColorScheme.Text.Default}}>
                                {capitalizeFirst(t('back'))}
                            </Text>
                        </PlainButton>
                    </View>

                    <View
                        className="h-1/2 w-5/6 justify-center items-center">
                        <Text
                            className="text-base mb-4 font-bold"
                            style={{color: ColorScheme.Text.Default}}>
                            {t('type_4_digit_pin')}
                        </Text>
                        <Text
                            className="text-base text-center mb-6"
                            style={{color: ColorScheme.Text.DescText}}>
                            {t('type_4_digit_pin_desc')}
                        </Text>

                        <View className="flex mt-12 items-center">
                            {firstWrong && (
                                <>
                                    <View
                                        className="items-center mb-4 w-5/6">
                                        {pinAttempts ===
                                        MAX_PIN_ATTEMPTS - 1 ? (
                                            <Text
                                                className="text-sm text-center"
                                                style={{
                                                        color: ColorScheme.Text
                                                            .Default,
                                                    }}>
                                                {t('last_attempt_warning')}
                                            </Text>
                                        ) : (
                                            <Text
                                                className="text-sm"
                                                style={{
                                                        color: ColorScheme.Text
                                                            .Default,
                                                    }}>
                                                {t('pin_attempts', {
                                                    attempts:
                                                        MAX_PIN_ATTEMPTS -
                                                        pinAttempts,
                                                })}
                                            </Text>
                                        )}
                                    </View>
                                    <PlainButton onPress={routeToResetPIN}>
                                        <View
                                            className="items-center rounded-full py-1 px-4 mb-6"
                                            style={[{
                                                    backgroundColor:
                                                        ColorScheme.Background
                                                            .Greyed,
                                                },
                                            ]}>
                                            <Text
                                                className="text-base"
                                                style={{
                                                        color: ColorScheme.Text
                                                            .DescText,
                                                    }}>
                                                {t('forgot_pin')}
                                            </Text>
                                        </View>
                                    </PlainButton>
                                </>
                            )}

                            <View
                                className="flex-row items-center mb-4">
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
                                                        ColorScheme.Background
                                                            .Inverted,
                                                    backgroundColor:
                                                        tmpPIN[i] === undefined
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
                        style={{bottom: NativeWindowMetrics.bottom + 32}}>
                        <PinNumpad
                            pin={tmpPIN}
                            onPinChange={updateTmpPIN}
                            pinLimit={4}
                            showBiometrics={false}
                        />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default ChangePIN;

const styles = StyleSheet.create({
    carouselContainer: {
        flex: 1,
    },
    dot: {
        width: 20,
        height: 20,
        borderWidth: 1,
        marginHorizontal: 6,
    },
});
