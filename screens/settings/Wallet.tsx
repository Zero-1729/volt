/* eslint-disable react-native/no-inline-styles */
import React, {useContext} from 'react';

import {StyleSheet, Text, View, useColorScheme} from 'react-native';

import {CommonActions} from '@react-navigation/native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import RNHapticFeedback from 'react-native-haptic-feedback';

import {RNHapticFeedbackOptions} from '../../constants/Haptic';

import Checkbox from 'react-native-bouncy-checkbox';

import {useTailwind} from 'tailwind-rn';

import {PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';

import {AppStorageContext} from '../../class/storageContext';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

const Wallet = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const HeadingBar = {
        height: 2,
        backgroundColor: ColorScheme.HeadingBar,
    };

    const {
        useSatSymbol,
        setSatSymbol,
        isAdvancedMode,
        setIsAdvancedMode,
        hideTotalBalance,
        setTotalBalanceHidden,
    } = useContext(AppStorageContext);

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

                        {/* Use Sats Symbol */}
                        <View
                            style={tailwind(
                                'justify-center w-full items-center flex-row mt-8 mb-10',
                            )}>
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
                                        Use Sat Symbol
                                    </Text>
                                    <Checkbox
                                        fillColor={
                                            ColorScheme.Background
                                                .CheckBoxFilled
                                        }
                                        unfillColor={
                                            ColorScheme.Background
                                                .CheckBoxUnfilled
                                        }
                                        size={18}
                                        isChecked={useSatSymbol}
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
                                            tailwind(
                                                'flex-row absolute -right-4',
                                            ),
                                        ]}
                                        onPress={() => {
                                            RNHapticFeedback.trigger(
                                                'rigid',
                                                RNHapticFeedbackOptions,
                                            );

                                            setSatSymbol(!useSatSymbol);
                                        }}
                                        disableBuiltInState={true}
                                    />
                                </View>

                                <View style={tailwind('w-full')}>
                                    <Text
                                        style={[
                                            tailwind('text-xs'),
                                            {color: ColorScheme.Text.DescText},
                                        ]}>
                                        Display the sat symbol (
                                        <Text style={[Font.SatSymbol]}>S</Text>){' '}
                                        for wallet{'\n'}balance in satoshis.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Toggle advanced mode */}
                        <View
                            style={tailwind(
                                'justify-center w-full items-center flex-row mb-10',
                            )}>
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
                                        Advanced Mode
                                    </Text>
                                    <Checkbox
                                        fillColor={
                                            ColorScheme.Background
                                                .CheckBoxFilled
                                        }
                                        unfillColor={
                                            ColorScheme.Background
                                                .CheckBoxUnfilled
                                        }
                                        size={18}
                                        isChecked={isAdvancedMode}
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
                                            tailwind(
                                                'flex-row absolute -right-4',
                                            ),
                                        ]}
                                        onPress={() => {
                                            RNHapticFeedback.trigger(
                                                'rigid',
                                                RNHapticFeedbackOptions,
                                            );

                                            setIsAdvancedMode(!isAdvancedMode);
                                        }}
                                        disableBuiltInState={true}
                                    />
                                </View>

                                <View style={tailwind('w-full')}>
                                    <Text
                                        style={[
                                            tailwind('text-xs'),
                                            {color: ColorScheme.Text.DescText},
                                        ]}>
                                        Expose more advanced options. Only turn
                                        {'\n'}
                                        this on if you know what you are doing.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Hide wallet balance */}
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
                                    isChecked={hideTotalBalance}
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

                                        setTotalBalanceHidden(
                                            !hideTotalBalance,
                                        );
                                    }}
                                    disableBuiltInState={true}
                                />
                            </View>

                            <Text
                                style={[
                                    tailwind('text-xs'),
                                    {color: ColorScheme.Text.DescText},
                                ]}>
                                Conceal the total and current wallet balances
                                {'\n'}
                                displayed on the home page.
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
