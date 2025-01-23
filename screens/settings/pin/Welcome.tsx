/* eslint-disable react-native/no-inline-styles */
import {Text, View, useColorScheme} from 'react-native';
import React from 'react';

import Color from '../../../constants/Color';

import {useNavigation} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {CommonActions} from '@react-navigation/native';

import {LongBottomButton} from '../../../components/button';
import {useTranslation} from 'react-i18next';

import BitcoinVault from './../../../assets/svg/bitcoin-vault.svg';

const Welcome = () => {
    const navigation = useNavigation();
    const ColorScheme = Color(useColorScheme());

    const {t} = useTranslation('settings');

    const moveToSetup = () => {
        navigation.dispatch(CommonActions.navigate({name: 'SetPIN'}));
    };

    return (
        <SafeAreaView
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View className="w-full h-full items-center">
                <View
                    className="items-center h-full w-full justify-center">
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
                                        left: 0,
                                        top: 0,
                                    },
                                ]}>
                                <BitcoinVault height={320} width={320} />
                            </View>
                        </View>

                        <Text
                            className="text-xl font-bold text-white mb-4"
                            style={{color: ColorScheme.Text.Default}}>
                            {t('setup_pin_security')}
                        </Text>

                        <Text
                            className="text-base text-center"
                            style={{color: ColorScheme.Text.DescText}}>
                            {t('setup_pin_security_desc')}
                        </Text>
                    </View>

                    <LongBottomButton
                        title={t('setup_pin')}
                        textColor={ColorScheme.Text.Alt}
                        backgroundColor={ColorScheme.Background.Inverted}
                        onPress={moveToSetup}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Welcome;
