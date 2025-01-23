/* eslint-disable react-native/no-inline-styles */
import React, {useContext} from 'react';

import {StyleSheet, View, useColorScheme} from 'react-native';
import VText from '../../../components/text';

import {CommonActions} from '@react-navigation/native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import RNHapticFeedback from 'react-native-haptic-feedback';

import {RNHapticFeedbackOptions} from '../../../constants/Haptic';

import Checkbox from 'react-native-bouncy-checkbox';

import {useTranslation} from 'react-i18next';

import {PlainButton} from '../../../components/button';

import Back from './../../../assets/svg/arrow-left-24.svg';

import {AppStorageContext} from '../../../class/storageContext';

import Font from '../../../constants/Font';
import Color from '../../../constants/Color';

import {capitalizeFirst} from '../../../modules/transform';

import RNBiometrics from '../../../modules/biometrics';

import Right from './../../../assets/svg/chevron-right-24.svg';
import Left from './../../../assets/svg/chevron-left-24.svg';

const PIN = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const {t, i18n} = useTranslation('settings');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const HeadingBar = {
        height: 2,
        backgroundColor: ColorScheme.HeadingBar,
    };

    const {isBiometricsActive, setBiometricsActive} =
        useContext(AppStorageContext);

    const requestBiometrics = async () => {
        const {available} = await RNBiometrics.isSensorAvailable();

        if (!available) {
            return;
        }

        RNBiometrics.simplePrompt({
            promptMessage: 'Confirm fingerprint',
        }).then(({success}) => {
            if (success) {
                setBiometricsActive(false);
                return;
            }
        });
    };

    const handleBiometrics = () => {
        if (isBiometricsActive) {
            requestBiometrics();
        }

        if (!isBiometricsActive) {
            RNHapticFeedback.trigger('rigid', RNHapticFeedbackOptions);

            navigation.dispatch(
                CommonActions.navigate({
                    name: 'SetBiometrics',
                    params: {
                        standalone: true,
                    },
                }),
            );
        }
    };

    const changePin = () => {
        RNHapticFeedback.trigger('rigid', RNHapticFeedbackOptions);

        navigation.dispatch(
            CommonActions.navigate({
                name: 'ChangePIN',
            }),
        );
    };

    return (
        <SafeAreaView>
            <View
                className="w-full h-full"
                style={{backgroundColor: ColorScheme.Background.Primary}}>
                <View
                    className="w-full h-full mt-4 items-center"
                    style={styles.flexed}>
                    <View className="w-5/6 mb-16">
                        <PlainButton
                            className="items-center flex-row -ml-1"
                            onPress={() => {
                                navigation.dispatch(CommonActions.goBack());
                            }}>
                            <Back
                                className="mr-2"
                                fill={ColorScheme.SVG.Default}
                            />
                            <VText
                                className="text-sm font-medium"
                                style={[
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {capitalizeFirst(t('settings'))}
                            </VText>
                        </PlainButton>
                    </View>

                    <View
                        className="justify-center w-full items-center">
                        <VText
                            className="text-2xl mb-4 w-5/6 font-medium"
                            style={[
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            {capitalizeFirst(t('manage_pin'))}
                        </VText>

                        <View className="w-full" style={[HeadingBar]} />

                        {/* Show PIN mode enabled */}
                        <View
                            className="justify-center w-5/6 items-center flex mt-8 mb-6">
                            <View
                                className={
                                    `w-full ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } items-center mb-2`
                                }>
                                <VText
                                    className="text-sm font-medium"
                                    style={{
                                            color: ColorScheme.Text.DescText,
                                        }}>
                                    {t('enabled_pin_mode')}
                                </VText>
                            </View>
                        </View>

                        {/* Toggle Biometrics mode */}
                        {/* Reset PIN */}
                        <PlainButton
                            onPress={changePin}
                            className="justify-center w-full items-center flex-row mb-10">
                            <View className="w-5/6">
                                <View
                                    className={
                                        `items-center ${
                                            langDir === 'right'
                                                ? 'flex-row-reverse'
                                                : 'flex-row'
                                        } justify-between mb-2`
                                    }>
                                    <VText
                                        className="text-sm font-medium"
                                        style={{
                                                color: ColorScheme.Text.Default,
                                            }}>
                                        {t('change_pin')}
                                    </VText>
                                    <View
                                        className="flex-row justify-between items-center">
                                        {langDir === 'right' && (
                                            <Left
                                                className="mr-2"
                                                width={16}
                                                stroke={
                                                    ColorScheme.SVG.GrayFill
                                                }
                                                fill={ColorScheme.SVG.GrayFill}
                                            />
                                        )}

                                        {langDir === 'left' && (
                                            <Right
                                                width={16}
                                                stroke={
                                                    ColorScheme.SVG.GrayFill
                                                }
                                                fill={ColorScheme.SVG.GrayFill}
                                            />
                                        )}
                                    </View>
                                </View>

                                <View className="w-full">
                                    <VText
                                        className="text-xs"
                                        style={[
                                            {
                                                color: ColorScheme.Text
                                                    .DescText,
                                            },
                                        ]}>
                                        {t('change_pin_desc')}
                                    </VText>
                                </View>
                            </View>
                        </PlainButton>

                        <View
                            className="justify-center w-full items-center flex-row mb-10">
                            <PlainButton
                                className="w-5/6"
                                onPress={handleBiometrics}>
                                <View
                                    className={
                                        `w-full ${
                                            langDir === 'right'
                                                ? 'flex-row-reverse'
                                                : 'flex-row'
                                        } items-center mb-2`
                                    }>
                                    <VText
                                        className="text-sm font-medium"
                                        style={{
                                                color: ColorScheme.Text.Default,
                                            }}>
                                        {t('enable_biometrics_mode')}
                                    </VText>
                                    <Checkbox
                                        onPress={handleBiometrics}
                                        fillColor={
                                            ColorScheme.Background
                                                .CheckBoxFilled
                                        }
                                        unFillColor={
                                            ColorScheme.Background
                                                .CheckBoxUnfilled
                                        }
                                        size={18}
                                        isChecked={isBiometricsActive}
                                        iconStyle={{
                                            borderWidth: 1,
                                            borderRadius: 2,
                                        }}
                                        innerIconStyle={{
                                            borderWidth: 1,
                                            borderColor:
                                                ColorScheme.Background
                                                    .CheckBoxOutline,
                                            borderRadius: 2,
                                        }}
                                        className="flex-row absolute -right-4"
                                        useBuiltInState={false}
                                    />
                                </View>

                                <View className="w-full">
                                    <VText
                                        className="text-xs"
                                        style={[
                                            {
                                                color: ColorScheme.Text
                                                    .DescText,
                                            },
                                        ]}>
                                        {t(
                                            'enable_biometrics_mode_description',
                                        )}
                                    </VText>
                                </View>
                            </PlainButton>
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default PIN;

const styles = StyleSheet.create({
    flexed: {
        flex: 1,
    },
});
