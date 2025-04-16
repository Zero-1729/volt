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

import {PinNumpad} from '../../../components/input';

import {setKeychainItem} from '../../../class/keychainContext';
import {SettingsParamList} from '../../../Navigation';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {PlainButton} from '../../../components/button';
import {capitalizeFirst} from '../../../modules/transform';

import Back from './../../../assets/svg/arrow-left-24.svg';
import {AppStorageContext} from '../../../class/storageContext';

type Props = NativeStackScreenProps<SettingsParamList, 'ConfirmPIN'>;

const ConfirmPIN = ({route}: Props) => {
    const [tmpPIN, setTmpPIN] = useState<string>('');
    const [showBack, setShowBack] = useState<boolean>(false);
    const setPIN = route.params.pin;

    const {setPINActive, isBiometricsActive} = useContext(AppStorageContext);

    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const {t} = useTranslation('settings');

    const isChangePIN = route.params?.isChangePIN
        ? route.params.isChangePIN
        : false;

    const updateTmpPIN = async (pin: string): Promise<void> => {
        setTmpPIN(pin);
    };

    useEffect(() => {
        if (tmpPIN.length === 4) {
            if (tmpPIN !== setPIN) {
                setTmpPIN('');
                setShowBack(true);

                return;
            }

            // Set pin
            setKeychainItem('pin', tmpPIN);
            setPINActive(true);
            setTmpPIN('');

            if (!route.params.isChangePIN && !isBiometricsActive) {
                navigation.dispatch(
                    CommonActions.navigate({
                        name: 'SetBiometrics',
                    }),
                );
            } else {
                if (!isChangePIN) {
                    navigation.dispatch(
                        CommonActions.navigate('DonePIN', {
                            isChangePIN: isChangePIN,
                            isPINReset: route.params?.isPINReset,
                        }),
                    );
                } else {
                    navigation.dispatch(
                        CommonActions.navigate('SettingsRoot', {
                            screen: 'DonePIN',
                            params: {
                                isChangePIN: isChangePIN,
                                isPINReset: route.params?.isPINReset,
                            },
                        }),
                    );
                }
            }
        }
    }, [tmpPIN]);

    return (
        <SafeAreaView
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View className="w-full h-full items-center">
                <View className="items-center h-full w-full">
                    {showBack && (
                        <View
                            className="w-5/6 absolute top-2"
                            style={{zIndex: 9999}}>
                            <PlainButton
                                className="items-center flex-row -ml-1"
                                onPress={() => {
                                    navigation.dispatch(CommonActions.goBack());
                                }}>
                                <Back
                                    fill={ColorScheme.SVG.Default}
                                />
                                <Text
                                    className="ml-2 text-sm font-medium"
                                    style={{color: ColorScheme.Text.Default}}>
                                    {capitalizeFirst(t('back'))}
                                </Text>
                            </PlainButton>
                        </View>
                    )}

                    <View
                        className="h-1/2 w-5/6 justify-center items-center">
                        <Text
                            className="text-base mb-6 font-bold"
                            style={{color: ColorScheme.Text.Default}}>
                            {t('retype_pin')}
                        </Text>
                        <Text
                            className="text-base text-center mb-6"
                            style={{color: ColorScheme.Text.DescText}}>
                            {t('retype_pin_desc')}
                        </Text>

                        <View
                            className="flex-row items-center mt-12 mb-4">
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
