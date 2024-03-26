/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {Text, View, useColorScheme} from 'react-native';

import {CommonActions} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/core';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';

import {useTranslation} from 'react-i18next';

import {capitalizeFirst} from '../../modules/transform';

import {LongBottomButton} from '../../components/button';

import BitcoinAnthIcon from './../../assets/svg/bitcoin-knight.svg';

import Color from '../../constants/Color';

const DescriptorsInfo = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {t} = useTranslation('onboarding');

    return (
        <SafeAreaView>
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
                    <BitcoinAnthIcon width={256} height={256} />

                    <View style={[tailwind('mt-6 px-8 text-center')]}>
                        <Text
                            style={[
                                tailwind('text-xl font-bold text-center'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('wallet_descriptors')}
                        </Text>

                        <Text
                            style={[
                                tailwind('mt-4 text-sm text-center'),
                                {color: ColorScheme.Text.GrayedText},
                            ]}>
                            {t('descriptors_gist')}
                        </Text>
                    </View>
                </View>

                <LongBottomButton
                    onPress={() => {
                        navigation.dispatch(
                            CommonActions.navigate({
                                name: 'MoreInfo',
                            }),
                        );
                    }}
                    title={capitalizeFirst(t('continue'))}
                    textColor={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                />
            </View>
        </SafeAreaView>
    );
};

export default DescriptorsInfo;
