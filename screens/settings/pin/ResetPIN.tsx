/* eslint-disable react-native/no-inline-styles */
import {Text, View, useColorScheme} from 'react-native';
import React, {useContext} from 'react';

import Color from '../../../constants/Color';

import {useNavigation} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {CommonActions} from '@react-navigation/native';

import {capitalizeFirst} from '../../../modules/transform';

import {LongBottomButton, PlainButton} from '../../../components/button';
import {useTranslation} from 'react-i18next';

import Back from './../../../assets/svg/arrow-left-24.svg';
import BitcoinBob from './../../../assets/svg/bitcoin-construction.svg';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SettingsParamList} from '../../../Navigation';
import {AppStorageContext} from '../../../class/storageContext';

type Props = NativeStackScreenProps<SettingsParamList, 'ResetPIN'>;

const ResetPIN = ({route}: Props) => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const {t} = useTranslation('settings');

    const {currentWalletID, getWalletData} = useContext(AppStorageContext);

    const walletData = getWalletData(currentWalletID);

    const hasMnemonic = walletData.mnemonic.length > 0;

    const moveToReset = () => {
        if (hasMnemonic) {
            navigation.dispatch(
                CommonActions.navigate({
                    name: 'MnemonicTest',
                    params: {
                        isPINReset: route.params?.isPINReset,
                        isChangePIN: route.params?.isChangePIN,
                    },
                }),
            );
        } else {
            // Handle if xprv / xpub
            navigation.dispatch(
                CommonActions.navigate({
                    name: 'ExtKeyTest',
                    params: {
                        isPINReset: route.params?.isPINReset,
                        isChangePIN: route.params?.isChangePIN,
                    },
                }),
            );
        }
    };

    return (
        <SafeAreaView
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View className="w-full h-full items-center">
                <View
                    className="items-center h-full w-full justify-center">
                    <View className="w-5/6 absolute top-6">
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
                        className="items-center w-5/6"
                        style={{marginTop: -64}}>
                        <View
                            style={[
                                {
                                    width: 256,
                                    height: 256,
                                    position: 'relative',
                                },
                            ]}>
                            <View
                                style={[
                                    {
                                        position: 'absolute',
                                        left: 16,
                                    },
                                ]}>
                                <BitcoinBob height={320} width={320} />
                            </View>
                        </View>

                        <Text
                            className="text-xl font-bold text-white mb-4"
                            style={{color: ColorScheme.Text.Default}}>
                            {t('reset_pin')}
                        </Text>

                        <Text
                            className="text-base text-center"
                            style={{color: ColorScheme.Text.DescText}}>
                            {walletData.isWatchOnly
                                ? t('reset_pin_e_desc')
                                : t('reset_pin_m_desc')}
                        </Text>
                    </View>

                    <LongBottomButton
                        title={capitalizeFirst(t('continue'))}
                        textColor={ColorScheme.Text.Alt}
                        backgroundColor={ColorScheme.Background.Inverted}
                        onPress={moveToReset}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

export default ResetPIN;
