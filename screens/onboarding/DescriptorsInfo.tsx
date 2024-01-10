/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {Text, View, useColorScheme} from 'react-native';

import {CommonActions} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/core';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';

import {LongBottomButton} from '../../components/button';

import Volt from './../../assets/svg/btc.svg';

import Color from '../../constants/Color';

const DescriptorsInfo = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

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
                <View style={[tailwind('items-center'), {top: -25}]}>
                    <Volt
                        width={100}
                        height={100}
                        fill={ColorScheme.SVG.Default}
                    />

                    <View style={[tailwind('mt-12 px-8 text-center')]}>
                        <Text
                            style={[
                                tailwind('text-xl font-bold text-center'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Wallet Descriptors
                        </Text>

                        <Text
                            style={[
                                tailwind('mt-4 text-sm text-center'),
                                {color: ColorScheme.Text.GrayedText},
                            ]}>
                            Wallet descriptors allow you to export your bitcoin
                            wallet with more precision and guarantee of accurate
                            backups
                        </Text>
                    </View>
                </View>

                <LongBottomButton
                    onPress={() => {
                        navigation.dispatch(
                            CommonActions.navigate({
                                name: 'SelectMode',
                            }),
                        );
                    }}
                    title={'Continue'}
                    textColor={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                />
            </View>
        </SafeAreaView>
    );
};

export default DescriptorsInfo;
