/* eslint-disable react-native/no-inline-styles */
import {StyleSheet, Text, View, useColorScheme} from 'react-native';
import React, {useEffect, useState} from 'react';

import {useTailwind} from 'tailwind-rn';
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

const SetPIN = () => {
    const [tmpPIN, setTmpPIN] = useState<string>('');

    const navigation = useNavigation();
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const [validPin, setValidPin] = useState<string>('');
    const [firstWrong, setFirstWrong] = useState<boolean>(false);

    const initValidPin = async () => {
        const storedPIN = await getKeychainItem('pin');
        setValidPin(storedPIN.data);
    };

    const {t} = useTranslation('settings');

    const updateTmpPIN = (pin: string): void => {
        setTmpPIN(pin);

        if (pin.length === 4 && validPin.length === 4) {
            if (validPin === pin) {
                // Route to pin setup
                moveToSetup();
            } else {
                // show forgot
                setFirstWrong(true);
                setTmpPIN('');
            }
        }
    };

    const moveToSetup = () => {
        navigation.dispatch(
            CommonActions.navigate({
                name: 'SetPIN',
                params: {isChangePIN: true},
            }),
        );
    };

    useEffect(() => {
        initValidPin();
    }, []);

    return (
        <SafeAreaView
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View style={[tailwind('w-full h-full items-center')]}>
                <View style={[tailwind('items-center h-full w-full')]}>
                    <View
                        style={[
                            tailwind('w-5/6 absolute top-0'),
                            {zIndex: 9999},
                        ]}>
                        <PlainButton
                            style={tailwind('items-center flex-row -ml-1')}
                            onPress={() => {
                                navigation.dispatch(CommonActions.goBack());
                            }}>
                            <Back
                                style={tailwind('mr-2')}
                                fill={ColorScheme.SVG.Default}
                            />
                            <Text
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {capitalizeFirst(t('back'))}
                            </Text>
                        </PlainButton>
                    </View>

                    <View
                        style={[
                            tailwind('h-1/2 w-5/6 justify-center items-center'),
                        ]}>
                        <Text
                            style={[
                                tailwind('text-base mb-4 font-bold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('type_4_digit_pin')}
                        </Text>
                        <Text
                            style={[
                                tailwind('text-base text-center mb-6'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {t('type_4_digit_pin_desc')}
                        </Text>

                        <View style={[tailwind('flex mt-12')]}>
                            {/* TODO: navigate to screen to reset PIN */}
                            {firstWrong && (
                                <PlainButton>
                                    <View
                                        style={[
                                            tailwind(
                                                'items-center rounded-full py-1 px-4 mb-6',
                                            ),
                                            {
                                                backgroundColor:
                                                    ColorScheme.Background
                                                        .Greyed,
                                            },
                                        ]}>
                                        <Text
                                            style={[
                                                tailwind('text-base'),
                                                {
                                                    color: ColorScheme.Text
                                                        .DescText,
                                                },
                                            ]}>
                                            {t('forgot_pin')}
                                        </Text>
                                    </View>
                                </PlainButton>
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
                        style={[
                            tailwind('w-full absolute'),
                            {bottom: NativeWindowMetrics.bottom + 32},
                        ]}>
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

export default SetPIN;

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
