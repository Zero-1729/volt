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

import {useTailwind} from 'tailwind-rn';

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

    const tailwind = useTailwind();

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
                style={[
                    tailwind('w-full h-full'),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <View
                    style={[
                        tailwind('w-full h-full mt-4 items-center'),
                        styles.flexed,
                    ]}>
                    <View style={tailwind('w-5/6 mb-16')}>
                        <PlainButton
                            style={tailwind('items-center flex-row -ml-1')}
                            onPress={() => {
                                navigation.dispatch(CommonActions.goBack());
                            }}>
                            <Back
                                style={tailwind('mr-2')}
                                fill={ColorScheme.SVG.Default}
                            />
                            <VText
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {capitalizeFirst(t('settings'))}
                            </VText>
                        </PlainButton>
                    </View>

                    <View
                        style={tailwind('justify-center w-full items-center')}>
                        <VText
                            style={[
                                tailwind('text-2xl mb-4 w-5/6 font-medium'),
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            {capitalizeFirst(t('manage_pin'))}
                        </VText>

                        <View style={[tailwind('w-full'), HeadingBar]} />

                        {/* Show PIN mode enabled */}
                        <View
                            style={tailwind(
                                'justify-center w-5/6 items-center flex mt-8 mb-6',
                            )}>
                            <View
                                style={tailwind(
                                    `w-full ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } items-center mb-2`,
                                )}>
                                <VText
                                    style={[
                                        tailwind('text-sm font-medium'),
                                        {
                                            color: ColorScheme.Text.DescText,
                                        },
                                    ]}>
                                    {t('enabled_pin_mode')}
                                </VText>
                            </View>
                        </View>

                        {/* Toggle Biometrics mode */}
                        {/* Reset PIN */}
                        <PlainButton
                            onPress={changePin}
                            style={tailwind(
                                'justify-center w-full items-center flex-row mb-10',
                            )}>
                            <View style={tailwind('w-5/6')}>
                                <View
                                    style={tailwind(
                                        `items-center ${
                                            langDir === 'right'
                                                ? 'flex-row-reverse'
                                                : 'flex-row'
                                        } justify-between mb-2`,
                                    )}>
                                    <VText
                                        style={[
                                            tailwind('text-sm font-medium'),
                                            {
                                                color: ColorScheme.Text.Default,
                                            },
                                        ]}>
                                        {t('change_pin')}
                                    </VText>
                                    <View
                                        style={[
                                            tailwind(
                                                'flex-row justify-between items-center',
                                            ),
                                        ]}>
                                        {langDir === 'right' && (
                                            <Left
                                                style={[tailwind('mr-2')]}
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

                                <View style={tailwind('w-full')}>
                                    <VText
                                        style={[
                                            tailwind('text-xs'),
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
                            style={tailwind(
                                'justify-center w-full items-center flex-row mb-10',
                            )}>
                            <PlainButton
                                style={tailwind('w-5/6')}
                                onPress={handleBiometrics}>
                                <View
                                    style={tailwind(
                                        `w-full ${
                                            langDir === 'right'
                                                ? 'flex-row-reverse'
                                                : 'flex-row'
                                        } items-center mb-2`,
                                    )}>
                                    <VText
                                        style={[
                                            tailwind('text-sm font-medium'),
                                            {
                                                color: ColorScheme.Text.Default,
                                            },
                                        ]}>
                                        {t('enable_biometrics_mode')}
                                    </VText>
                                    <Checkbox
                                        onPress={handleBiometrics}
                                        fillColor={
                                            ColorScheme.Background
                                                .CheckBoxFilled
                                        }
                                        unfillColor={
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
                                        style={[
                                            tailwind(
                                                'flex-row absolute -right-4',
                                            ),
                                        ]}
                                        disableBuiltInState={true}
                                    />
                                </View>

                                <View style={tailwind('w-full')}>
                                    <VText
                                        style={[
                                            tailwind('text-xs'),
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
