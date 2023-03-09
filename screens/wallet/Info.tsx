/* eslint-disable react-native/no-inline-styles */
import React, {useContext} from 'react';
import {Text, View, useColorScheme} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, CommonActions} from '@react-navigation/native';

import {PlainButton, LongBottomButton} from '../../components/button';
import {TextSingleInput} from '../../components/input';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import Back from '../../assets/svg/arrow-left-24.svg';
import Right from './../../assets/svg/chevron-right-24.svg';

import {AppStorageContext} from '../../class/storageContext';
const Info = () => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    // Get advacned mode flag, current wallet ID and wallet data
    const {isAdvancedMode, currentWalletID, getWalletData} =
        useContext(AppStorageContext);

    const walletData = getWalletData(currentWalletID);

    const HeadingBar = {
        height: 2,
        backgroundColor: ColorScheme.HeadingBar,
    };

    // TODO: grab from Wallet store data
    const walletPath = "m/44'/0'/0'/0/0";
    const walletType = 'SegWit (Bech32)';
    const walletTypeName =
    const walletFingerprint = walletData.masterFingerprint;
    const walletName = 'Wallet Name';
    const walletDescriptor = walletData.descriptor;

    return (
        <SafeAreaView edges={['bottom', 'right', 'left']}>
            {/* Display Wallet Info, addresses, and other related data / settings */}
            <View style={[tailwind('w-full h-full items-center relative')]}>
                <PlainButton
                    style={[tailwind('items-center mt-6 flex-row w-5/6')]}
                    onPress={() => {
                        navigation.dispatch(CommonActions.goBack());
                    }}>
                    <Back
                        style={tailwind('mr-2')}
                        fill={ColorScheme.SVG.Default}
                    />
                    {/* Wallet name */}
                    <Text
                        style={[
                            tailwind('text-white font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Back
                    </Text>
                </PlainButton>

                {/* Allow user to change wallet name */}
                <PlainButton style={[tailwind('w-5/6 mt-12')]}>
                    <View>
                        <Text
                            style={[
                                tailwind('text-sm text-left mb-2'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Name
                        </Text>
                        <View
                            style={[
                                tailwind('border-gray-400 px-4 w-full'),
                                {borderWidth: 1, borderRadius: 6},
                            ]}>
                            <TextSingleInput
                                placeholder={walletName}
                                onChangeText={() => {}}
                                onBlur={() => {}}
                                color={ColorScheme.Text.Default}
                            />
                        </View>
                    </View>
                </PlainButton>

                {/* Wallet Info */}
                {/* Wallet Type Path and Derivation Path */}
                <View style={[tailwind('w-5/6 flex-row mt-6 justify-start')]}>
                    <View>
                        <Text
                            style={[
                                tailwind('text-sm mr-16 mb-2'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Derivation Path
                        </Text>

                        <PlainButton>
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    {color: ColorScheme.Text.GrayedText},
                                ]}>
                                {walletPath}
                            </Text>
                        </PlainButton>
                    </View>

                    <View>
                        <Text
                            style={[
                                tailwind('text-sm mb-2'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Type
                        </Text>

                        <PlainButton>
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    {color: ColorScheme.Text.GrayedText},
                                ]}>
                                {walletType}
                            </Text>
                        </PlainButton>
                    </View>
                </View>

                {/* Wallet Fingerprint */}
                <View style={[tailwind('w-5/6 mt-6')]}>
                    <Text
                        style={[
                            tailwind('text-sm mb-2'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Master Fingerprint
                    </Text>

                    <PlainButton>
                        <Text
                            style={[
                                tailwind('text-sm'),
                                {color: ColorScheme.Text.GrayedText},
                            ]}>
                            {walletFingerprint}
                        </Text>
                    </PlainButton>
                </View>

                {/* Wallet Descriptor */}
                <View style={[tailwind('w-5/6 mt-6')]}>
                    <Text
                        style={[
                            tailwind('text-sm mb-2'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Descriptor
                    </Text>

                    {/* TODO: Allow to be copied to clipboard */}
                    <PlainButton>
                        <Text
                            numberOfLines={1}
                            ellipsizeMode="middle"
                            style={[
                                tailwind('text-sm'),
                                {color: ColorScheme.Text.GrayedText},
                            ]}>
                            {walletDescriptor}
                        </Text>
                    </PlainButton>
                </View>

                {/* View Divider */}
                <View style={[tailwind('w-full mt-8 mb-8'), HeadingBar]} />

                {/* Wallet Addresses */}
                <PlainButton style={[tailwind('w-5/6 mb-6')]}>
                    <View
                        style={[
                            tailwind('items-center flex-row justify-between'),
                        ]}>
                        <Text
                            style={[
                                tailwind('text-sm'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Addresses List
                        </Text>

                        <View style={[tailwind('items-center')]}>
                            <Right
                                width={16}
                                stroke={ColorScheme.SVG.GrayFill}
                                fill={ColorScheme.SVG.GrayFill}
                            />
                        </View>
                    </View>
                </PlainButton>

                {/* Backup / Export material - Seed, X/Y/ZPUB, X/Y/ZPUB, etc. */}
                <PlainButton style={[tailwind('w-5/6')]}>
                    <View
                        style={[
                            tailwind(
                                'items-center flex-row justify-between mb-6',
                            ),
                        ]}>
                        <Text
                            style={[
                                tailwind('text-sm'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Export / Backup
                        </Text>

                        <View style={[tailwind('items-center')]}>
                            <Right
                                width={16}
                                stroke={ColorScheme.SVG.GrayFill}
                                fill={ColorScheme.SVG.GrayFill}
                            />
                        </View>
                    </View>
                </PlainButton>

                {/* Wallet Tools */}
                <PlainButton style={[tailwind('w-5/6')]}>
                    <View
                        style={[
                            tailwind(
                                'items-center flex-row justify-between mb-6',
                            ),
                        ]}>
                        <Text
                            style={[
                                tailwind('text-sm'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Tools
                        </Text>

                        <View style={[tailwind('items-center')]}>
                            <Right
                                width={16}
                                stroke={ColorScheme.SVG.GrayFill}
                                fill={ColorScheme.SVG.GrayFill}
                            />
                        </View>
                    </View>
                </PlainButton>

                {/* Delete Wallet btn */}
                <LongBottomButton
                    title="Delete"
                    onPress={() => {
                        console.info('[Action] Delete Wallet');
                    }}
                    textColor={'red'}
                    backgroundColor={ColorScheme.Background.Greyed}
                    style={[tailwind('font-bold')]}
                />
            </View>
        </SafeAreaView>
    );
};

export default Info;
