/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {Text, View, useColorScheme} from 'react-native';

import {CommonActions} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/core';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useTranslation} from 'react-i18next';

import {capitalizeFirst} from '../../modules/transform';

import {useTailwind} from 'tailwind-rn';

import {LongBottomButton} from '../../components/button';

import Color from '../../constants/Color';
import BoltDarkIcon from './../../assets/svg/bolt-icon-dark.svg';
import BoltLightIcon from './../../assets/svg/bolt-icon-light.svg';

const MoreInfo = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());
    const theme = useColorScheme();

    const tailwind = useTailwind();

    const {t} = useTranslation('onboarding');

    const setModeAndRoute = () => {
        // Route to add wallet screen
        navigation.dispatch(
            CommonActions.navigate('AddWalletRoot', {
                screen: 'Add',
                params: {onboarding: true},
            }),
        );
    };

    return (
        <SafeAreaView
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View
                style={[
                    tailwind(
                        'w-full h-full relative items-center justify-center',
                    ),
                    {
                        backgroundColor: ColorScheme.Background.Primary,
                    },
                ]}>
                <View style={[tailwind('items-center'), {top: -40}]}>
                    <View
                        style={[
                            tailwind('justify-center items-center w-full'),
                        ]}>
                        {theme === 'dark' ? (
                            <BoltDarkIcon width={128} height={128} />
                        ) : (
                            <BoltLightIcon width={128} height={128} />
                        )}

                        <View style={[tailwind('mt-6 px-8 text-center')]}>
                            <Text
                                style={[
                                    tailwind('text-xl font-bold text-center'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {t('bolt_nfc_support')}
                            </Text>

                            <Text
                                style={[
                                    tailwind('mt-4 text-sm text-center'),
                                    {color: ColorScheme.Text.GrayedText},
                                ]}>
                                {t('bolt_nfc_description')}
                            </Text>
                        </View>
                    </View>
                </View>

                <LongBottomButton
                    onPress={setModeAndRoute}
                    title={capitalizeFirst(t('done'))}
                    textColor={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                />
            </View>
        </SafeAreaView>
    );
};

export default MoreInfo;
