import React, {useContext} from 'react';

import {StyleSheet, Text, View, useColorScheme} from 'react-native';

import {StackActions} from '@react-navigation/native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';

import {AppStorageContext} from '../../class/storageContext';

import {LongButton, PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';
import InfoIcon from './../../assets/svg/info-16.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

const Add = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {isAdvancedMode} = useContext(AppStorageContext);

    return (
        <SafeAreaView edges={['left', 'bottom', 'right']}>
            <View
                style={[
                    tailwind('w-full h-full items-center'),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <View style={tailwind('w-5/6 mt-8 mb-16')}>
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

                    <View style={[tailwind('mt-20 mb-10')]}>
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

                    {/* Import an existing Wallet */}
                    <View
                        style={[
                            tailwind('mb-6 rounded-md p-5'),
                            {
                                backgroundColor:
                                    ColorScheme.MiscCardColor.ImportCard,
                            },
                            styles.cardShadow,
                        ]}>
                        <Text
                            style={[
                                tailwind('font-bold mt-2 text-white'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Import
                        </Text>

                        <Text
                            style={[
                                tailwind('mt-4 mb-2 text-white text-xs'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            Restore wallet from seed or other backup material.
                            Select if you want to restore an existing wallet.
                        </Text>

                        <View style={[tailwind('items-end')]}>
                            <PlainButton
                                onPress={() => {
                                    navigation.dispatch(
                                        StackActions.push('RestoreActions'),
                                    );
                                }}>
                                <View
                                    style={[
                                        tailwind('px-6 py-2 rounded-full mt-4'),
                                        {
                                            backgroundColor:
                                                ColorScheme.MiscCardColor
                                                    .ImportCardButton,
                                        },
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind(
                                                'text-xs text-white font-bold',
                                            ),
                                            Font.RobotoText,
                                            {color: ColorScheme.Text.GrayText},
                                        ]}>
                                        Restore
                                    </Text>
                                </View>
                            </PlainButton>
                        </View>
                    </View>

                    {/* Create a new Wallet */}
                    <LongButton
                        onPress={() => {
                            navigation.dispatch(
                                StackActions.push('CreateActions'),
                            );
                        }}
                        backgroundColor={ColorScheme.Background.Inverted}
                        textColor={ColorScheme.Text.Alt}
                        title={'Create New Wallet'}
                    />

                    {isAdvancedMode ? (
                        <View style={[tailwind('mt-6 flex-row')]}>
                            <InfoIcon
                                width={30}
                                fill={ColorScheme.SVG.Default}
                            />
                            <Text
                                style={[
                                    tailwind('text-xs'),
                                    {color: ColorScheme.Text.GrayText},
                                ]}>
                                Supported HD accounts: BIP44, BIP46, BIP84
                            </Text>
                        </View>
                    ) : (
                        <></>
                    )}
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
