/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {Text, View, useColorScheme} from 'react-native';

import {CommonActions} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/core';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useTranslation} from 'react-i18next';

import {capitalizeFirst} from '../../modules/transform';

import {LongBottomButton} from '../../components/button';

import Color from '../../constants/Color';
import BoltDarkIcon from './../../assets/svg/bolt-icon-dark.svg';
import BoltLightIcon from './../../assets/svg/bolt-icon-light.svg';

const MoreInfo = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());
    const theme = useColorScheme();

    const {t} = useTranslation('onboarding');

    const setModeAndRoute = () => {
        // Route to add PIN screen
        navigation.dispatch(CommonActions.navigate('WelcomePIN'));
    };

    return (
        <SafeAreaView
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View
                className="w-full h-full relative items-center justify-center"
                style={{
                        backgroundColor: ColorScheme.Background.Primary,
                    }}>
                <View className="items-center" style={{top: -40}}>
                    <View
                        className="justify-center items-center w-full">
                        {theme === 'dark' ? (
                            <BoltDarkIcon width={128} height={128} />
                        ) : (
                            <BoltLightIcon width={128} height={128} />
                        )}

                        <View className="mt-6 px-8 text-center">
                            <Text
                                className="text-xl font-bold text-center"
                                style={{color: ColorScheme.Text.Default}}>
                                {t('bolt_nfc_support')}
                            </Text>

                            <Text
                                className="mt-4 text-sm text-center"
                                style={{color: ColorScheme.Text.GrayedText}}>
                                {t('bolt_nfc_description')}
                            </Text>
                        </View>
                    </View>
                </View>

                <LongBottomButton
                    onPress={setModeAndRoute}
                    title={capitalizeFirst(t('continue'))}
                    textColor={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                />
            </View>
        </SafeAreaView>
    );
};

export default MoreInfo;
