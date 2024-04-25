import React, {useState} from 'react';

import {View, useColorScheme, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {CommonActions, useNavigation} from '@react-navigation/native';

import {useTailwind} from 'tailwind-rn';

import Color from '../constants/Color';
import AppIcon from '../assets/svg/volt-text.svg';

import NativeWindowMetrics from '../constants/NativeWindowMetrics';

import {PinNumpad} from '../components/input';
import {useTranslation} from 'react-i18next';

const Lock = () => {
    const ColorScheme = Color(useColorScheme());
    const tailwind = useTailwind();
    const navigation = useNavigation();

    const {t} = useTranslation('wallet');
    const [pin, setPin] = useState('');

    const updatePin = (value: string) => {
        setPin(value);

        if (value.length === 4) {
            // TODO: handle pin validation
        }
    };

    const OpenApp = () => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{name: 'HomeScreen'}],
            }),
        );
    };

    const requestBiometrics = () => {
        OpenApp();
    };

    return (
        <SafeAreaView>
            <View style={[tailwind('w-full h-full justify-center')]}>
                <View
                    style={[
                        tailwind('items-center justify-center w-full h-full'),
                    ]}>
                    <View
                        style={[
                            tailwind(
                                'h-1/2 w-full absolute top-0 items-center justify-center',
                            ),
                        ]}>
                        <View style={[tailwind('h-1/2 justify-end')]}>
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
                                                        ColorScheme.Background
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
            </View>
        </SafeAreaView>
    );
};

export default Lock;

const styles = StyleSheet.create({
    dot: {
        width: 20,
        height: 20,
        borderWidth: 1,
        marginHorizontal: 6,
    },
});
