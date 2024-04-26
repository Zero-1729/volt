/* eslint-disable react-native/no-inline-styles */
import {StyleSheet, Text, View, useColorScheme} from 'react-native';
import React, {useState} from 'react';

import {useTailwind} from 'tailwind-rn';
import Color from '../../../constants/Color';

import {useNavigation} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';

import NativeWindowMetrics from '../../../constants/NativeWindowMetrics';
import {CommonActions} from '@react-navigation/native';

import {useTranslation} from 'react-i18next';

import {PinNumpad} from '../../../components/input';

import {setKeychainItem} from '../../../class/keychainContext';
import {SettingsParamList} from '../../../Navigation';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {PlainButton} from '../../../components/button';
import {capitalizeFirst} from '../../../modules/transform';

import Back from './../../../assets/svg/arrow-left-24.svg';

type Props = NativeStackScreenProps<SettingsParamList, 'ConfirmPIN'>;

const ConfirmPIN = ({route}: Props) => {
    const [tmpPIN, setTmpPIN] = useState<string>('');
    const [showBack, setShowBack] = useState<boolean>(false);
    const setPIN = route.params.pin;

    const navigation = useNavigation();
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {t} = useTranslation('settings');

    const isChangePIN = route.params?.isChangePIN
        ? route.params.isChangePIN
        : false;

    const updateTmpPIN = async (pin: string): Promise<void> => {
        setTmpPIN(pin);

        if (pin.length === 4) {
            if (pin !== setPIN) {
                setTmpPIN('');
                setShowBack(true);

                return;
            }

            // Set pin
            await setKeychainItem('pin', pin);

            if (!route.params.isChangePIN) {
                navigation.dispatch(
                    CommonActions.navigate({
                        name: 'SetBiometrics',
                        params: {tmpPIN},
                    }),
                );
            } else {
                navigation.dispatch(
                    CommonActions.navigate('SettingsRoot', {
                        screen: 'DonePIN',
                        params: {isChangePIN: isChangePIN},
                    }),
                );
            }
        }
    };

    return (
        <SafeAreaView
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View style={[tailwind('w-full h-full items-center')]}>
                <View style={[tailwind('items-center h-full w-full')]}>
                    {showBack && (
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
                    )}

                    <View
                        style={[
                            tailwind('h-1/2 w-5/6 justify-center items-center'),
                        ]}>
                        <Text
                            style={[
                                tailwind('text-base mb-6 font-bold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('retype_pin')}
                        </Text>
                        <Text
                            style={[
                                tailwind('text-base text-center mb-6'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {t('retype_pin_desc')}
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

export default ConfirmPIN;

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
