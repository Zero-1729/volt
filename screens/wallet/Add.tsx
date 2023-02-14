/* eslint-disable react-native/no-inline-styles */
import {StyleSheet, Text, View, useColorScheme} from 'react-native';

import {CommonActions} from '@react-navigation/native';

import React from 'react';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';

import {PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';
import InfoIcon from './../../assets/svg/info-16.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

const Add = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    return (
        <SafeAreaView>
            <View
                style={[
                    tailwind('w-full h-full items-center'),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <View style={tailwind('w-5/6 mt-4 mb-16')}>
                    <PlainButton
                        style={tailwind('items-center flex-row -ml-1')}
                        onPress={() => {
                            navigation.goBack();
                        }}>
                        <Back
                            style={tailwind('mr-2')}
                            fill={ColorScheme.SVG.Default}
                        />
                        <Text
                            style={[
                                tailwind('text-sm font-medium'),
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            Back
                        </Text>
                    </PlainButton>

                    <View style={[tailwind('mt-20')]}>
                        <Text
                            style={[
                                tailwind('font-bold text-2xl'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Add Wallet
                        </Text>
                        <Text
                            style={[
                                tailwind('text-sm'),
                                {color: ColorScheme.Text.GrayText},
                            ]}>
                            Create a new wallet or restore from a backup
                        </Text>
                    </View>

                    {/* Create a new Wallet */}
                    <View
                        style={[
                            tailwind('mt-6 rounded-md p-5 flex'),
                            {
                                backgroundColor:
                                    ColorScheme.MiscCardColor.ImportAltCard,
                            },
                            styles.cardShadow,
                        ]}>
                        <Text
                            style={[
                                tailwind('font-bold mt-2'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            New
                        </Text>

                        <Text
                            style={[
                                tailwind('mt-4 text-xs'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            Create a new wallet with a new seed.
                        </Text>

                        <View style={[tailwind('items-end')]}>
                            <PlainButton
                                onPress={() => {
                                    navigation.dispatch(
                                        CommonActions.navigate({
                                            name: 'CreateActions',
                                        }),
                                    );
                                }}>
                                <View
                                    style={[
                                        tailwind(
                                            'px-4 py-2 bg-black rounded-sm mt-4',
                                        ),
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind(
                                                'text-xs text-white font-medium',
                                            ),
                                            Font.RobotoText,
                                        ]}>
                                        Create
                                    </Text>
                                </View>
                            </PlainButton>
                        </View>
                    </View>

                    {/* Import an existing Wallet */}
                    <View
                        style={[
                            tailwind('mt-8 rounded-md p-5'),
                            {backgroundColor: '#8b8b8b'},
                        ]}>
                        <Text style={[tailwind('font-bold mt-2 text-white')]}>
                            Restore
                        </Text>

                        <Text style={[tailwind('mt-4 text-white text-xs')]}>
                            Import wallet from seed or other material.
                            {'\n'}Select if you want to import an existing
                            wallet.
                        </Text>

                        <View style={[tailwind('items-end')]}>
                            <PlainButton
                                onPress={() => {
                                    navigation.dispatch(
                                        CommonActions.navigate({
                                            name: 'RestoreActions',
                                        }),
                                    );
                                }}>
                                <View
                                    style={[
                                        tailwind(
                                            'px-4 py-2 bg-black rounded-sm mt-4',
                                        ),
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind(
                                                'text-xs text-white font-medium',
                                            ),
                                            Font.RobotoText,
                                        ]}>
                                        Import
                                    </Text>
                                </View>
                            </PlainButton>
                        </View>
                    </View>

                    <View style={[tailwind('mt-8 flex-row')]}>
                        <InfoIcon width={30} fill={ColorScheme.SVG.Default} />
                        <Text
                            style={[
                                tailwind('text-xs'),
                                {color: ColorScheme.Text.GrayText},
                            ]}>
                            Supported HD account types: BIP44, BIP46, BIP84
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Add;

const styles = StyleSheet.create({
    cardShadow: {
        shadowColor: '#0000002e',
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 5,
    },
});
