/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useContext, useEffect} from 'react';
import {Text, View, useColorScheme, Platform} from 'react-native';

import {CommonActions} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/core';
import {SafeAreaView} from 'react-native-safe-area-context';

import {AppStorageContext} from './../../class/storageContext';

import {useTailwind} from 'tailwind-rn';

import {LongBottomButton, PlainButton} from '../../components/button';

const marginTopPlatform = 10 + (Platform.OS === 'android' ? 12 : 0);

import Volt from './../../assets/svg/volt-logo.svg';

import Color from '../../constants/Color';

const Intro = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {isWalletInitialized} = useContext(AppStorageContext);

    useEffect(() => {
        if (isWalletInitialized) {
            navigation.dispatch(
                CommonActions.reset({
                    index: 1,
                    routes: [{name: 'HomeScreen'}],
                }),
            );
        }
    }, []);

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
                            Skip
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
                            Welcome to Volt
                        </Text>

                        <Text
                            style={[
                                tailwind('mt-4 text-sm text-center'),
                                {color: ColorScheme.Text.GrayedText},
                            ]}>
                            A carefully crafted descriptor-based Bitcoin wallet
                            for the modern age.
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
                    title={'Next'}
                    textColor={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                />
            </View>
        </SafeAreaView>
    );
};

export default Intro;
