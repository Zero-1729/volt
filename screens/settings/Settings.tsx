import React, {useContext} from 'react';

import {View, useColorScheme, Linking, Platform} from 'react-native';

import VText from '../../components/text';

import {CommonActions} from '@react-navigation/native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import {AppStorageContext} from '../../class/storageContext';

import {useTailwind} from 'tailwind-rn';

import {capitalizeFirst} from '../../modules/transform';

import {PlainButton} from '../../components/button';
import {DeletionAlert} from '../../components/alert';

import Back from './../../assets/svg/arrow-left-24.svg';
import Right from './../../assets/svg/chevron-right-24.svg';
import Left from './../../assets/svg/chevron-left-24.svg';

import NativeDims from '../../constants/NativeWindowMetrics';

import {useTranslation} from 'react-i18next';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

const Settings = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {t, i18n} = useTranslation('settings');

    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const HeadingBar = {
        height: 2,
        backgroundColor: ColorScheme.HeadingBar,
    };

    const device = Platform.OS;
    const bottomOffset: {[index: string]: number} = {
        ios: NativeDims.navBottom + 32,
        android: NativeDims.navBottom + 56,
    };

    const {
        appLanguage,
        appFiatCurrency,
        resetAppData,
        isDevMode,
        isWalletInitialized,
        isAdvancedMode,
    } = useContext(AppStorageContext);

    const handleAppDataReset = () => {
        if (isWalletInitialized) {
            resetAppData();
        }
    };

    const showDialog = () => {
        DeletionAlert(
            t('reset_data'),
            t('reset_app_text'),
            capitalizeFirst(t('reset')),
            capitalizeFirst(t('cancel')),
            handleAppDataReset,
        );
    };

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
                        <VText
                            style={[
                                tailwind('text-sm font-medium'),
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            {capitalizeFirst(t('back'))}
                        </VText>
                    </PlainButton>
                </View>

                <View
                    style={tailwind('justify-center w-full items-center mb-6')}>
                    <VText
                        style={[
                            tailwind('text-2xl mb-4 w-5/6 font-medium'),
                            {color: ColorScheme.Text.Default},
                            Font.RobotoText,
                        ]}>
                        {capitalizeFirst(t('settings'))}
                    </VText>

                    <View style={[tailwind('w-full'), HeadingBar]} />
                </View>

                <View style={[tailwind('w-5/6')]}>
                    <PlainButton
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate({name: 'PINManager'}),
                            );
                        }}>
                        <View
                            style={[
                                tailwind(
                                    `items-center ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } justify-between mt-2 mb-6`,
                                ),
                            ]}>
                            <VText
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {t('manage_pin')}
                            </VText>

                            {langDir === 'left' ? (
                                <Right
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
                                />
                            ) : (
                                <Left
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
                                />
                            )}
                        </View>
                    </PlainButton>

                    <PlainButton
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate({name: 'Currency'}),
                            );
                        }}>
                        <View
                            style={[
                                tailwind(
                                    `items-center ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } justify-between mt-2 mb-6`,
                                ),
                            ]}>
                            <VText
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {capitalizeFirst(t('currency'))}
                            </VText>

                            <View
                                style={[
                                    tailwind(
                                        'flex-row justify-between items-center',
                                    ),
                                ]}>
                                {langDir === 'right' && (
                                    <Left
                                        style={[tailwind('mr-2')]}
                                        width={16}
                                        stroke={ColorScheme.SVG.GrayFill}
                                        fill={ColorScheme.SVG.GrayFill}
                                    />
                                )}

                                <VText
                                    style={[
                                        tailwind(
                                            `text-xs ${
                                                langDir === 'right'
                                                    ? ''
                                                    : 'mr-2'
                                            }`,
                                        ),
                                        {color: ColorScheme.Text.GrayedText},
                                    ]}>
                                    {`${appFiatCurrency.short} (${appFiatCurrency.symbol})`}
                                </VText>

                                {langDir === 'left' && (
                                    <Right
                                        width={16}
                                        stroke={ColorScheme.SVG.GrayFill}
                                        fill={ColorScheme.SVG.GrayFill}
                                    />
                                )}
                            </View>
                        </View>
                    </PlainButton>

                    <PlainButton
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate({name: 'Language'}),
                            );
                        }}>
                        <View
                            style={[
                                tailwind(
                                    `items-center ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } justify-between mt-2 mb-6`,
                                ),
                            ]}>
                            <VText
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {capitalizeFirst(t('language'))}
                            </VText>

                            <View
                                style={[
                                    tailwind(
                                        'flex-row justify-between items-center',
                                    ),
                                ]}>
                                {langDir === 'right' && (
                                    <Left
                                        style={[tailwind('mr-2')]}
                                        width={16}
                                        stroke={ColorScheme.SVG.GrayFill}
                                        fill={ColorScheme.SVG.GrayFill}
                                    />
                                )}

                                <VText
                                    style={[
                                        tailwind(
                                            `text-xs ${
                                                langDir === 'right'
                                                    ? ''
                                                    : 'mr-2'
                                            }`,
                                        ),
                                        {color: ColorScheme.Text.GrayedText},
                                    ]}>
                                    {appLanguage.name}
                                </VText>

                                {langDir === 'left' && (
                                    <Right
                                        width={16}
                                        stroke={ColorScheme.SVG.GrayFill}
                                        fill={ColorScheme.SVG.GrayFill}
                                    />
                                )}
                            </View>
                        </View>
                    </PlainButton>

                    <PlainButton
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate({name: 'Network'}),
                            );
                        }}>
                        <View
                            style={[
                                tailwind(
                                    `items-center ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } justify-between mt-2 mb-6`,
                                ),
                            ]}>
                            <VText
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {capitalizeFirst(t('network'))}
                            </VText>

                            {langDir === 'left' ? (
                                <Right
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
                                />
                            ) : (
                                <Left
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
                                />
                            )}
                        </View>
                    </PlainButton>

                    <PlainButton
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate({name: 'Wallet'}),
                            );
                        }}>
                        <View
                            style={[
                                tailwind(
                                    `items-center ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } justify-between mt-2 mb-6`,
                                ),
                            ]}>
                            <VText
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {capitalizeFirst(t('wallet'))}
                            </VText>

                            {langDir === 'left' ? (
                                <Right
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
                                />
                            ) : (
                                <Left
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
                                />
                            )}
                        </View>
                    </PlainButton>

                    <PlainButton
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate({name: 'SettingsTools'}),
                            );
                        }}>
                        <View
                            style={[
                                tailwind(
                                    `items-center ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } justify-between mt-2 mb-6`,
                                ),
                            ]}>
                            <VText
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {capitalizeFirst(t('tools'))}
                            </VText>

                            {langDir === 'left' ? (
                                <Right
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
                                />
                            ) : (
                                <Left
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
                                />
                            )}
                        </View>
                    </PlainButton>

                    <View
                        style={[
                            tailwind(
                                `items-center ${
                                    langDir === 'right'
                                        ? 'flex-row-reverse'
                                        : 'flex-row'
                                } justify-between mt-4`,
                            ),
                        ]}>
                        <PlainButton
                            onPress={() => {
                                Linking.openSettings();
                            }}>
                            <VText
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {t('system_preferences')}
                            </VText>
                        </PlainButton>
                    </View>
                </View>

                {isDevMode && isWalletInitialized && isAdvancedMode && (
                    <PlainButton
                        onPress={showDialog}
                        style={[
                            tailwind('absolute items-center'),
                            {bottom: bottomOffset[device] + 10},
                        ]}>
                        <VText
                            style={[
                                tailwind(
                                    'text-sm w-full font-bold text-red-600',
                                ),
                            ]}>
                            {t('reset_app')}
                        </VText>
                    </PlainButton>
                )}

                <PlainButton
                    style={[
                        tailwind('items-center justify-center absolute'),
                        {bottom: NativeDims.bottom},
                    ]}
                    onPress={() => {
                        navigation.dispatch(
                            CommonActions.navigate({name: 'About'}),
                        );
                    }}>
                    <View
                        style={[
                            tailwind('self-center p-3 px-12 rounded-full'),
                            {
                                backgroundColor:
                                    ColorScheme.Background.Inverted,
                            },
                        ]}>
                        <VText
                            style={[
                                tailwind('text-sm font-bold'),
                                {color: ColorScheme.Text.Alt},
                                Font.RobotoText,
                            ]}>
                            {capitalizeFirst(t('about'))}
                        </VText>
                    </View>
                </PlainButton>
            </View>
        </SafeAreaView>
    );
};

export default Settings;
