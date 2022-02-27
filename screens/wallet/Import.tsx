/* eslint-disable react-native/no-inline-styles */
import {
    StyleSheet,
    Text,
    View,
    useColorScheme,
    TouchableOpacity,
} from 'react-native';

import React from 'react';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import tailwind from 'tailwind-rn';

import Back from './../../assets/svg/arrow-left-24.svg';
import InfoIcon from './../../assets/svg/info-16.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

const Import = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    return (
        <SafeAreaView>
            <View
                style={[
                    tailwind('w-full h-full items-center'),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <View style={tailwind('w-5/6 mt-4 mb-16')}>
                    <TouchableOpacity
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
                                tailwind('text-sm'),
                                {color: ColorScheme.Text.Default},
                                Font.BoldText,
                            ]}>
                            Back
                        </Text>
                    </TouchableOpacity>

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
                            Select a method to add a new wallet
                        </Text>
                    </View>

                    <View
                        style={[
                            tailwind('mt-10 rounded-md p-5'),
                            {backgroundColor: '#8b8b8b'},
                        ]}>
                        <Text style={[tailwind('font-bold mt-2 text-white')]}>
                            Import Wallet
                        </Text>

                        <Text style={[tailwind('mt-4 text-white text-xs')]}>
                            Import wallet from BIP39 seed (and an optional
                            passphrase) or other methods. Use this if you are
                            coming from another wallet.
                        </Text>

                        <View style={[tailwind('items-end')]}>
                            <TouchableOpacity
                                onPress={() => {
                                    navigation.navigate('WalletRoot');
                                }}>
                                <View
                                    style={[
                                        tailwind(
                                            'px-4 py-1 bg-black rounded-sm mt-4',
                                        ),
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind('text-xs text-white'),
                                            Font.BoldText,
                                        ]}>
                                        Restore
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

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
                            New Wallet
                        </Text>

                        <Text
                            style={[
                                tailwind('mt-4 text-xs'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            Create a new wallet with a fresh BIP39 seed (and an
                            optional passphrase). Use this if you have no
                            existing wallet.
                        </Text>

                        <View style={[tailwind('items-end')]}>
                            <TouchableOpacity
                                onPress={() => {
                                    navigation.navigate('WalletRoot');
                                }}>
                                <View
                                    style={[
                                        tailwind(
                                            'px-4 py-1 bg-black rounded-sm mt-4',
                                        ),
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind('text-xs text-white'),
                                            Font.BoldText,
                                        ]}>
                                        Create
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[tailwind('mt-6 flex-row')]}>
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

export default Import;

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
