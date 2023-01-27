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

const Network = () => {
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
    const [IsTestnet, setTestnet] = useState(true);

    // Retrieve whether app connect to Testnet or Mainnet
    const getIsTestnet = async (item: string) => {
        try {
            const value = await AsyncStorage.getItem(item);

            // We only want to set the state if the value exists
            // Need to convert value back to Boolean
            if (value !== null) {
                setTestnet(JSON.parse(value));
            }
        } catch (e) {
            console.error(
                `[AsyncStorage] (Network settings) Error saving data: ${e}`,
            );
        }
    };

    // Set whether app connect to Testnet or not
    const setIsTestnet = async (value: Boolean) => {
        try {
            // Must transform value to string before saving in AsyncStore
            await AsyncStorage.setItem('isTestnet', JSON.stringify(value));

            // State already in Boolean, so no need to transform
            setTestnet(value);
        } catch (e) {
            console.error(
                `[AsyncStorage] (Network settings) Error saving data: ${e}`,
            );
        }
    };

    // Load the current value of 'isTestnet' on mount
    useEffect(() => {
        getIsTestnet('isTestnet');
    }, [IsTestnet]);

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
                            Network
                        </Text>

                        <View style={[tailwind('w-full'), HeadingBar]} />
                    </View>

                    {/* Highlight current network here */}
                    <View
                        style={tailwind(
                            'justify-center w-full items-center flex-row mt-8 mb-8',
                        )}>
                        {/* Testnet Option */}
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
                                    Connect to Testnet
                                </Text>
                                <Checkbox
                                    fillColor={ColorScheme.Background.Secondary}
                                    unfillColor={
                                        ColorScheme.Background.Secondary
                                    }
                                    size={18}
                                    isChecked={IsTestnet}
                                    style={tailwind(
                                        'flex-row absolute -right-4',
                                    )}
                                    onPress={() => {
                                        RNHapticFeedback.trigger(
                                            'rigid',
                                            RNHapticFeedbackOptions,
                                        );

                                        setIsTestnet(!IsTestnet);
                                    }}
                                    disableBuiltInState={true}
                                />
                            </View>

                            <Text
                                style={[
                                    tailwind('text-xs'),
                                    {color: ColorScheme.Text.DescText},
                                ]}>
                                Testnet is a network for testing.
                            </Text>
                        </View>

                        {/* TODO: Connect to custom node */}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Network;

const styles = StyleSheet.create({
    PaddedTop: {
        paddingTop: 16,
    },
    Flexed: {
        flex: 1,
    },
});
