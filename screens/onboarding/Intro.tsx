/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {Text, View, useColorScheme, Platform} from 'react-native';

import {CommonActions, useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useTranslation} from 'react-i18next';

import {capitalizeFirst} from '../../modules/transform';

import {useTailwind} from 'tailwind-rn';

import {LongBottomButton, PlainButton} from '../../components/button';

const marginTopPlatform = 10 + (Platform.OS === 'android' ? 12 : 0);

import Volt from './../../assets/svg/volt-logo.svg';

import Color from '../../constants/Color';

const Intro = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {t} = useTranslation('onboarding');

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
                <View
                    style={[
                        tailwind('w-5/6 absolute justify-center'),
                        {top: marginTopPlatform},
                    ]}>
                    <PlainButton
                        onPress={() => {
                            // Route to add wallet screen
                            navigation.dispatch(
                                CommonActions.navigate('AddWalletRoot', {
                                    screen: 'Add',
                                    params: {onboarding: true},
                                }),
                            );
                        }}
                        style={[tailwind('self-end')]}>
                        <Text
                            style={[
                                tailwind('text-sm font-bold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('skip')}
                        </Text>
                    </PlainButton>
                </View>

                <View style={[tailwind('items-center'), {top: -25}]}>
                    <Volt width={100} height={100} />

                    <View style={[tailwind('mt-12 px-8 text-center')]}>
                        <Text
                            style={[
                                tailwind('text-xl font-bold text-center'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('welcome')}
                        </Text>

                        <Text
                            style={[
                                tailwind('mt-4 text-sm text-center'),
                                {
                                    color: ColorScheme.Text.GrayedText,
                                },
                            ]}>
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
