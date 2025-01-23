/* eslint-disable react-native/no-inline-styles */
import React, {useContext} from 'react';

import {StyleSheet, View, useColorScheme} from 'react-native';
import VText from '../../components/text';

import {CommonActions} from '@react-navigation/native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import RNHapticFeedback from 'react-native-haptic-feedback';

import {RNHapticFeedbackOptions} from '../../constants/Haptic';

import Checkbox from 'react-native-bouncy-checkbox';

import {useTranslation} from 'react-i18next';

import {PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';

import {AppStorageContext} from '../../class/storageContext';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

import {capitalizeFirst} from '../../modules/transform';

const Wallet = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const {t, i18n} = useTranslation('settings');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const HeadingBar = {
        height: 2,
        backgroundColor: ColorScheme.HeadingBar,
    };

    const {
        isAdvancedMode,
        setIsAdvancedMode,
        hideTotalBalance,
        setTotalBalanceHidden,
    } = useContext(AppStorageContext);

    return (
        <SafeAreaView>
            <View
                className="w-full h-full"
                style={{backgroundColor: ColorScheme.Background.Primary}}>
                <View
                    className="w-full h-full mt-4 items-center"
                    style={[
                        styles.flexed,
                    ]}>
                    <View className="w-5/6 mb-16">
                        <PlainButton
                            className="items-center flex-row -ml-1"
                            onPress={() => {
                                navigation.dispatch(CommonActions.goBack());
                            }}>
                            <Back
                                className="mr-2"
                                fill={ColorScheme.SVG.Default}
                            />
                            <VText
                                className="text-sm font-medium"
                                style={[
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {capitalizeFirst(t('settings'))}
                            </VText>
                        </PlainButton>
                    </View>

                    <View
                        className="justify-center w-full items-center">
                        <VText
                            className="text-2xl mb-4 w-5/6 font-medium"
                            style={[
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            {capitalizeFirst(t('wallet'))}
                        </VText>

                        <View className="w-full" style={[HeadingBar]} />

                        {/* Toggle advanced mode */}
                        <View
                            className="justify-center w-full items-center flex-row mt-8 mb-10">
                            <View className="w-5/6">
                                <View
                                    className={
                                        `w-full ${
                                            langDir === 'right'
                                                ? 'flex-row-reverse'
                                                : 'flex-row'
                                        } items-center mb-2`
                                    }>
                                    <VText
                                        className="text-sm font-medium"
                                        style={{color: ColorScheme.Text.Default}}>
                                        {t('advanced_mode')}
                                    </VText>
                                    <Checkbox
                                        fillColor={
                                            ColorScheme.Background
                                                .CheckBoxFilled
                                        }
                                        unFillColor={
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
                                        className="flex-row absolute -right-4"
                                        onPress={() => {
                                            RNHapticFeedback.trigger(
                                                'rigid',
                                                RNHapticFeedbackOptions,
                                            );

                                            setIsAdvancedMode(!isAdvancedMode);
                                        }}
                                        useBuiltInState={false}
                                    />
                                </View>

                                <View className="w-full">
                                    <VText
                                        className="text-xs"
                                        style={{color: ColorScheme.Text.DescText}}>
                                        {t('advanced_mode_description')}
                                    </VText>
                                </View>
                            </View>
                        </View>

                        {/* Hide wallet balance */}
                        <View className="w-5/6">
                            <View
                                className={
                                    `w-full ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } items-center mb-2`
                                }>
                                <VText
                                    className="text-sm font-medium"
                                    style={{color: ColorScheme.Text.Default}}>
                                    {t('hide_balance')}
                                </VText>
                                <Checkbox
                                    fillColor={
                                        ColorScheme.Background.CheckBoxFilled
                                    }
                                    unFillColor={
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
                                    className="flex-row absolute -right-4"
                                    onPress={() => {
                                        RNHapticFeedback.trigger(
                                            'rigid',
                                            RNHapticFeedbackOptions,
                                        );

                                        setTotalBalanceHidden(
                                            !hideTotalBalance,
                                        );
                                    }}
                                    useBuiltInState={false}
                                />
                            </View>

                            <VText
                                className="text-xs"
                                style={{color: ColorScheme.Text.DescText}}>
                                {t('hide_balance_description')}
                            </VText>
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Wallet;

const styles = StyleSheet.create({
    flexed: {
        flex: 1,
    },
});
