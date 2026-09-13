/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {Text, View, useColorScheme, Platform} from 'react-native';

import {CommonActions, useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useTranslation} from 'react-i18next';

import {capitalizeFirst} from '../../modules/transform';

import {LongBottomButton, PlainButton} from '../../components/button';

const marginTopPlatform = 10 + (Platform.OS === 'android' ? 12 : 0);

import Volt from './../../assets/svg/volt-logo.svg';

import Color from '../../constants/Color';

const Intro = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const {t} = useTranslation('onboarding');

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
                <PlainButton
                    onPress={() => {
                        // Route to add PIN screen
                        navigation.dispatch(
                            CommonActions.navigate('WelcomePIN'),
                        );
                    }}
                    className="absolute justify-center py-2 px-4 rounded-full right-6"
                    style={{top: marginTopPlatform}}>
                    <View className="'self-end">
                        <Text
                            className="text-sm font-bold"
                            style={{color: ColorScheme.Text.Default}}>
                            {capitalizeFirst(t('skip'))}
                        </Text>
                    </View>
                </PlainButton>

                <View className="items-center" style={{top: -25}}>
                    <Volt width={100} height={100} />

                    <View className="mt-12 px-8 text-center">
                        <Text
                            className="text-xl font-bold text-center"
                            style={{color: ColorScheme.Text.Default}}>
                            {t('welcome')}
                        </Text>

                        <Text
                            className="mt-4 text-sm text-center"
                            style={{
                                    color: ColorScheme.Text.GrayedText,
                                }}>
                            {t('app_description')}
                        </Text>
                    </View>
                </View>

                <LongBottomButton
                    onPress={() => {
                        navigation.dispatch(
                            CommonActions.navigate({
                                name: 'DescriptorsInfo',
                            }),
                        );
                    }}
                    title={capitalizeFirst(t('next'))}
                    textColor={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                />
            </View>
        </SafeAreaView>
    );
};

export default Intro;
