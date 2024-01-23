import React, {useContext} from 'react';

import {StyleSheet, View, FlatList, useColorScheme} from 'react-native';

import {CommonActions} from '@react-navigation/native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import RNHapticFeedback from 'react-native-haptic-feedback';

import DayJS from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
DayJS.extend(calendar);

import {useTranslation} from 'react-i18next';

import VText from '../../components/text';

import {useNetInfo} from '@react-native-community/netinfo';
import {checkNetworkIsReachable} from '../../modules/wallet-utils';

import {RNHapticFeedbackOptions} from '../../constants/Haptic';

import {useTailwind} from 'tailwind-rn';

import {TCurrency} from '../../types/settings';

import {AppStorageContext} from '../../class/storageContext';

import {PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';
import Check from './../../assets/svg/check-circle-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

import {Currencies} from '../../constants/Currency';

import {liberalAlert} from '../../components/alert';
import {addCommas, capitalizeFirst} from '../../modules/transform';

const Currency = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {t, i18n} = useTranslation('settings');
    const {t: e} = useTranslation('errors');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const {appFiatCurrency, setAppFiatCurrency, fiatRate} =
        useContext(AppStorageContext);

    const networkState = useNetInfo();

    const renderItem = ({item, index}: {item: TCurrency; index: number}) => {
        return (
            <PlainButton
                onPress={() => {
                    if (!checkNetworkIsReachable(networkState)) {
                        liberalAlert(
                            capitalizeFirst(t('network')),
                            e('no_internet_message'),
                            capitalizeFirst(t('cancel')),
                        );
                        return;
                    }

                    RNHapticFeedback.trigger('soft', RNHapticFeedbackOptions);
                    setAppFiatCurrency(item);
                }}>
                <View
                    style={[
                        tailwind(
                            `w-5/6 self-center items-center ${
                                langDir === 'right'
                                    ? 'flex-row-reverse'
                                    : 'flex-row'
                            } justify-between mt-3 mb-6`,
                        ),
                        index === 0 ? styles.paddedTop : {},
                    ]}>
                    <VText
                        style={[
                            tailwind('text-sm'),
                            {color: ColorScheme.Text.Default},
                            Font.RobotoText,
                        ]}>
                        {`${item.short} (${item.symbol})`}
                    </VText>

                    <View
                        style={[
                            tailwind('flex-row items-center justify-between'),
                        ]}>
                        {appFiatCurrency.short === item.short && (
                            <Check width={16} fill={ColorScheme.SVG.Default} />
                        )}
                    </View>
                </View>
            </PlainButton>
        );
    };

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
                        styles.flexed,
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
                            <VText
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {capitalizeFirst(t('settings'))}
                            </VText>
                        </PlainButton>
                    </View>

                    <View
                        style={tailwind('justify-center w-full items-center')}>
                        <View
                            style={[
                                tailwind(
                                    `${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } w-5/6 justify-between`,
                                ),
                            ]}>
                            <VText
                                style={[
                                    tailwind('text-2xl mb-4 font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {capitalizeFirst(t('currency'))}
                            </VText>

                            {/* Highlight current select currency here */}
                            <View
                                style={[
                                    tailwind(
                                        'px-4 py-0 flex-row items-center h-8 rounded-full',
                                    ),
                                    {
                                        backgroundColor:
                                            ColorScheme.Background.Inverted,
                                    },
                                ]}>
                                <VText
                                    style={[
                                        tailwind('text-sm font-bold'),
                                        {
                                            color: ColorScheme.Text.Alt,
                                            backgroundColor:
                                                ColorScheme.Background.Inverted,
                                        },
                                        Font.RobotoText,
                                    ]}>
                                    {`${appFiatCurrency.short} (${appFiatCurrency.symbol})`}
                                </VText>
                            </View>
                        </View>

                        <View
                            style={[
                                tailwind(
                                    `text-sm py-4 w-full ${
                                        langDir === 'right' ? 'pr-8' : 'pl-8'
                                    }`,
                                ),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                },
                            ]}>
                            <VText
                                style={[
                                    tailwind('text-sm'),
                                    {
                                        color: ColorScheme.Text.Default,
                                    },
                                ]}>
                                {`${t('price_at')} ${addCommas(
                                    fiatRate.rate.toString(),
                                )} ${appFiatCurrency.short} ${t('price_on')} `}
                                <VText style={[tailwind('flex font-bold')]}>
                                    {fiatRate.source}
                                </VText>
                            </VText>
                        </View>
                    </View>

                    <FlatList
                        style={tailwind('w-full')}
                        data={Currencies}
                        renderItem={renderItem}
                        keyExtractor={item => item.locale}
                        initialNumToRender={25}
                        contentInsetAdjustmentBehavior="automatic"
                    />

                    <View style={[tailwind('w-full items-center mt-2')]}>
                        <VText style={[{color: ColorScheme.Text.GrayedText}]}>
                            {`${t('last_updated')} ${DayJS(
                                fiatRate.lastUpdated,
                            ).calendar()}`}
                        </VText>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Currency;

const styles = StyleSheet.create({
    paddedTop: {
        paddingTop: 16,
    },
    flexed: {
        flex: 1,
    },
});
