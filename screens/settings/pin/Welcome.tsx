/* eslint-disable react-native/no-inline-styles */
import {Text, View, useColorScheme} from 'react-native';
import React from 'react';

import {useTailwind} from 'tailwind-rn';
import Color from '../../../constants/Color';

import {useNavigation} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {CommonActions} from '@react-navigation/native';

import {capitalizeFirst} from '../../../modules/transform';

import {LongBottomButton, PlainButton} from '../../../components/button';
import {useTranslation} from 'react-i18next';

import Back from './../../../assets/svg/arrow-left-24.svg';
import BitcoinVault from './../../../assets/svg/bitcoin-vault.svg';

const Welcome = () => {
    const navigation = useNavigation();
    const tailwind = useTailwind();
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
            <View style={[tailwind('w-full h-full items-center')]}>
                <View
                    style={[
                        tailwind('items-center h-full w-full justify-center'),
                    ]}>
                    <View style={[tailwind('w-5/6 absolute top-0')]}>
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
                            tailwind('items-center w-5/6'),
                            {marginTop: -64},
                        ]}>
                        <BitcoinVault height={256} width={256} />

                        <Text
                            style={[
                                tailwind('text-xl font-bold text-white mb-4'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('setup_pin_security')}
                        </Text>

                        <Text
                            style={[
                                tailwind('text-base text-center'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
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
