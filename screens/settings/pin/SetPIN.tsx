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

import {PinNumpad} from '../../../components/input';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SettingsParamList} from '../../../Navigation';

type Props = NativeStackScreenProps<SettingsParamList, 'SetPIN'>;

const SetPIN = ({route}: Props) => {
    const [tmpPIN, setTmpPIN] = useState<string>('');

    const navigation = useNavigation();
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {t} = useTranslation('settings');

    const isChangePIN = route.params?.isChangePIN
        ? route.params.isChangePIN
        : false;

    const updateTmpPIN = (pin: string): void => {
        setTmpPIN(pin);
    };

    const moveToConfirm = (pin: string) => {
        navigation.dispatch(
            CommonActions.navigate({
                name: 'ConfirmPIN',
                params: {pin: pin, isChangePIN: isChangePIN},
            }),
        );
    };

    useEffect(() => {
        if (tmpPIN.length === 4) {
            setTmpPIN('');
            moveToConfirm(tmpPIN);
        }
    }, [tmpPIN]);

    return (
        <SafeAreaView
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View style={[tailwind('w-full h-full items-center')]}>
                <View style={[tailwind('items-center h-full w-full')]}>
                    <View
                        style={[
                            tailwind('h-1/2 w-5/6 justify-center items-center'),
                        ]}>
                        <Text
                            style={[
                                tailwind('text-base mb-6 font-bold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('choose_4_digit_pin')}
                        </Text>
                        <Text
                            style={[
                                tailwind('text-base text-center mb-6'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {t('choose_4_digit_pin_desc')}
                        </Text>

                        <View
                            style={[
                                tailwind('flex-row items-center mt-12 mb-4'),
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
                                                        ? ColorScheme.Background
                                                              .Primary
                                                        : ColorScheme.Background
                                                              .Inverted,
                                            },
                                        ]}
                                    />
                                ))}
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
