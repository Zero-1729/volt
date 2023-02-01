/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';

import {StyleSheet, Text, View, useColorScheme} from 'react-native';

import {CommonActions} from '@react-navigation/native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import AsyncStorage from '@react-native-async-storage/async-storage';

import RNHapticFeedback from 'react-native-haptic-feedback';

import Checkbox from 'react-native-bouncy-checkbox';

import tailwind from 'tailwind-rn';

import {PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

const Wallet = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const HeadingBar = {
        height: 2,
        backgroundColor: ColorScheme.HeadingBar,
    };

    const RNHapticFeedbackOptions = {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
    };

    // Will change to false once app in Beta version
    const [hideBalance, setHideBalance] = useState(false);

    // Retrieve whether app connect to Testnet or Mainnet
    const getHideTotalWalletBalance = async (item: string) => {
        try {
            const value = await AsyncStorage.getItem(item);

            // We only want to set the state if the value exists
            // Need to convert value back to Boolean
            if (value !== null) {
                setHideBalance(JSON.parse(value));
            }
        } catch (e) {
            console.error(
                `[AsyncStorage] (Wallet settings) Error saving data: ${e}`,
            );
        }
    };

    // Set whether app connect to Testnet or not
    const setHide = async (value: Boolean) => {
        try {
            // Must transform value to string before saving in AsyncStore
            await AsyncStorage.setItem(
                'isBalanceHidden',
                JSON.stringify(value),
            );

            // State already in Boolean, so no need to transform
            setHideBalance(value);
        } catch (e) {
            console.error(
                `[AsyncStorage] (Wallet settings) Error saving data: ${e}`,
            );
        }
    };

    // Load the current value of 'isBalanceHidden' on mount
    useEffect(() => {
        getHideTotalWalletBalance('isBalanceHidden');
    }, [hideBalance]);

    return (
        <SafeAreaView>
            <View
                style={[
                    tailwind('w-full h-full'),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <View
                    style={[
                        tailwind('w-full h-full mt-4 items-center'),
                        styles.Flexed,
                    ]}>
                    <View style={tailwind('w-5/6 mb-16')}>
                        <PlainButton
                            style={tailwind('items-center flex-row -ml-1')}
                            onPress={() => {
                                navigation.dispatch(CommonActions.goBack());
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
                                Settings
                            </Text>
                        </PlainButton>
                    </View>

                    <View
                        style={tailwind('justify-center w-full items-center')}>
                        <Text
                            style={[
                                tailwind('text-2xl mb-4 w-5/6 font-medium'),
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            Wallet
                        </Text>

                        <View style={[tailwind('w-full'), HeadingBar]} />
                    </View>

                    {/*  */}
                    <View
                        style={tailwind(
                            'justify-center w-full items-center flex-row mt-8 mb-8',
                        )}>
                        {/*  */}
                        <View style={tailwind('w-5/6')}>
                            <View
                                style={tailwind(
                                    'w-full flex-row items-center mb-2',
                                )}>
                                <Text
                                    style={[
                                        tailwind('text-sm font-medium'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    Hide Total Balance
                                </Text>
                                <Checkbox
                                    fillColor={
                                        ColorScheme.Background.CheckBoxFilled
                                    }
                                    unfillColor={
                                        ColorScheme.Background.CheckBoxUnfilled
                                    }
                                    size={18}
                                    isChecked={hideBalance}
                                    iconStyle={{
                                        borderWidth: 1,
                                        borderRadius: 2,
                                    }}
                                    innerIconStyle={{
                                        borderWidth: 1,
                                        borderColor:
                                            ColorScheme.Background
                                                .CheckBoxOutline,
                                        borderRadius: 2,
                                    }}
                                    style={[
                                        tailwind('flex-row absolute -right-4'),
                                    ]}
                                    onPress={() => {
                                        RNHapticFeedback.trigger(
                                            'rigid',
                                            RNHapticFeedbackOptions,
                                        );

                                        setHide(!hideBalance);
                                    }}
                                    disableBuiltInState={true}
                                />
                            </View>

                            <Text
                                style={[
                                    tailwind('text-xs'),
                                    {color: ColorScheme.Text.DescText},
                                ]}>
                                Conceal the total wallet balance displayed on
                                {'\n'}
                                the home page.
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Wallet;

const styles = StyleSheet.create({
    PaddedTop: {
        paddingTop: 16,
    },
    Flexed: {
        flex: 1,
    },
});
