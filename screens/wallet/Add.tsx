/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useContext} from 'react';

import {StyleSheet, Text, View, useColorScheme} from 'react-native';

import VText from '../../components/text';

import {StackActions} from '@react-navigation/native';

import {useNavigation} from '@react-navigation/core';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AddWalletParamList} from './../../Navigation';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useTranslation} from 'react-i18next';

import {AppStorageContext} from '../../class/storageContext';

import {LongButton, PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';
import InfoIcon from './../../assets/svg/info-16.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

import Checkbox from 'react-native-bouncy-checkbox';

import NativeWindowMetrics from '../../constants/NativeWindowMetrics';

type Props = NativeStackScreenProps<AddWalletParamList, 'Add'>;

const Add = ({route}: Props) => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const {t} = useTranslation('wallet');

    const {isAdvancedMode, isWalletInitialized, setIsAdvancedMode} =
        useContext(AppStorageContext);

    const toggleAdvancedMode = useCallback(() => {
        setIsAdvancedMode(!isAdvancedMode);
    }, [isAdvancedMode, setIsAdvancedMode]);

    return (
        <SafeAreaView
            edges={['left', 'bottom', 'right']}
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View
                className="w-full h-full items-center"
                style={{backgroundColor: ColorScheme.Background.Primary}}>
                <View className="w-5/6 mt-8 mb-16">
                    {!route.params?.onboarding && (
                        <PlainButton
                            className="items-center flex-row -ml-1"
                            onPress={() => {
                                navigation.goBack();
                            }}>
                            <Back
                                className="mr-2"
                                fill={ColorScheme.SVG.Default}
                            />
                            <Text
                                className="text-sm font-medium"
                                style={[
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {t('back')}
                            </Text>
                        </PlainButton>
                    )}

                    <View className="mt-20 mb-10">
                        <VText
                            className="font-bold text-2xl"
                            style={{color: ColorScheme.Text.Default}}>
                            {t('add_wallet_title')}
                        </VText>
                        <VText
                            className="text-sm"
                            style={{color: ColorScheme.Text.GrayText}}>
                            {t('add_wallet_description')}
                        </VText>
                    </View>

                    {/* Import an existing Wallet */}
                    <View
                        className="mb-6 rounded-md p-5"
                        style={[
                            styles.cardShadow,
                            {
                                backgroundColor:
                                    ColorScheme.MiscCardColor.ImportCard,
                            },
                        ]}>
                        <VText
                            className="font-bold mt-2 text-white"
                            style={{color: ColorScheme.Text.Default}}>
                            {t('import_title')}
                        </VText>

                        <VText
                            className="mt-4 mb-2 text-white text-xs"
                            style={{color: ColorScheme.Text.DescText}}>
                            {t('import_description')}
                        </VText>

                        <View className="items-end">
                            <PlainButton
                                onPress={() => {
                                    // If the wallet is not initialized, then we are on the onboarding screen
                                    const onboarding = !isWalletInitialized;

                                    navigation.dispatch(
                                        StackActions.push('RestoreActions', {
                                            onboarding: onboarding,
                                        }),
                                    );
                                }}>
                                <View
                                    className="px-6 py-2 rounded-full mt-4"
                                    style={{
                                        backgroundColor:
                                            ColorScheme.MiscCardColor
                                                .ImportCardButton,
                                    }}>
                                    <Text
                                        className="text-xs text-white font-bold"
                                        style={[
                                            Font.RobotoText,
                                            {color: ColorScheme.Text.GrayText},
                                        ]}>
                                        {t('import_button_text')}
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
                        title={t('create_title')}
                    />

                    {isAdvancedMode && (
                        <View className="mt-6 flex-row">
                            <InfoIcon
                                width={30}
                                fill={ColorScheme.SVG.Default}
                            />
                            <Text
                                className="text-xs"
                                style={{color: ColorScheme.Text.GrayText}}>
                                {t('supported_accounts_info')}
                            </Text>
                        </View>
                    )}
                </View>

                <View
                    className="absolute w-5/6"
                    style={[
                        styles.advancedModeContainer,
                    ]}>
                    <PlainButton
                        onPress={toggleAdvancedMode}
                        className="flex-row self-center justify-center">
                        <Text
                            className="text-sm mr-4"
                            style={{color: ColorScheme.Text.Default}}>
                            {t('add_wallet_advanced_mode')}
                        </Text>
                        {/* btn */}
                        <Checkbox
                            disabled={!isAdvancedMode}
                            fillColor={ColorScheme.Background.CheckBoxFilled}
                            unFillColor={
                                ColorScheme.Background.CheckBoxUnfilled
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
                                    ColorScheme.Background.CheckBoxOutline,
                                borderRadius: 2,
                            }}
                            style={styles.checkBox}
                            onPress={toggleAdvancedMode}
                            useBuiltInState={false}
                        />
                    </PlainButton>
                    <Text
                        className="text-xs self-center text-center mt-4 w-5/6"
                        style={{color: ColorScheme.Text.DescText}}>
                        {t('add_wallet_advanced_mode_desc')}
                    </Text>
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
    advancedModeContainer: {
        bottom: NativeWindowMetrics.bottom + 32,
    },
    checkBox: {
        width: 20,
    },
});
