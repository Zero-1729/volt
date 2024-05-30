import React, {useCallback, useContext, useState} from 'react';

import {
    StyleSheet,
    View,
    FlatList,
    useColorScheme,
    ActivityIndicator,
} from 'react-native';

import {CommonActions} from '@react-navigation/native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import RNHapticFeedback from 'react-native-haptic-feedback';

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

import {addCommas, capitalizeFirst} from '../../modules/transform';
import Toast from 'react-native-toast-message';
import {fetchFiatRate} from '../../modules/currency';
import {TRateObject, TRateResponse} from '../../types/wallet';

const Currency = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {t, i18n} = useTranslation('settings');
    const {t: e} = useTranslation('errors');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const [loadingRate, setLoadingRate] = useState(false);

    const {appFiatCurrency, setAppFiatCurrency, fiatRate, updateFiatRate} =
        useContext(AppStorageContext);

    const networkState = useNetInfo();

    const handleCurrencySwitch = useCallback(
        async (currency: TCurrency) => {
            setLoadingRate(true);
            let response: TRateResponse;

            response = await fetchFiatRate(currency.short, fiatRate);

            if (response?.success) {
                const rateObj = response.rate as TRateObject;

                updateFiatRate({
                    ...fiatRate,
                    rate: rateObj.rate,
                    lastUpdated: rateObj.lastUpdated,
                    dailyChange: rateObj.dailyChange,
                });
                setAppFiatCurrency(currency);
                RNHapticFeedback.trigger('soft', RNHapticFeedbackOptions);
                setLoadingRate(false);
            } else {
                Toast.show({
                    topOffset: 54,
                    type: 'Liberal',
                    text1: capitalizeFirst(t('network')),
                    text2: response.error,
                    visibilityTime: 2500,
                });
                setLoadingRate(false);
            }
        },
        [fiatRate, setAppFiatCurrency, t, updateFiatRate],
    );

    const renderItem = ({item, index}: {item: TCurrency; index: number}) => {
        return (
            <PlainButton
                onPress={() => {
                    if (!checkNetworkIsReachable(networkState)) {
                        Toast.show({
                            topOffset: 54,
                            type: 'Liberal',
                            text1: capitalizeFirst(t('network')),
                            text2: e('no_internet_message'),
                            visibilityTime: 1750,
                        });
                        return;
                    }

                    handleCurrencySwitch(item);
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
                                styles.rateHighlight,
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                },
                            ]}>
                            {loadingRate ? (
                                <View
                                    style={[
                                        tailwind(
                                            `${
                                                langDir === 'right'
                                                    ? 'flex-row-reverse'
                                                    : 'flex-row'
                                            }`,
                                        ),
                                    ]}>
                                    <ActivityIndicator size={'small'} />
                                    <VText
                                        style={[
                                            tailwind(
                                                `text-sm ${
                                                    langDir === 'right'
                                                        ? 'mr-2'
                                                        : 'ml-2'
                                                }`,
                                            ),
                                            {
                                                color: ColorScheme.Text
                                                    .GrayedText,
                                            },
                                        ]}>
                                        {t('loading_rate')}
                                    </VText>
                                </View>
                            ) : (
                                <VText
                                    style={[
                                        tailwind('text-sm'),
                                        {
                                            color: ColorScheme.Text.Default,
                                        },
                                    ]}>
                                    {`${t('price_at')} ${addCommas(
                                        fiatRate.rate.toString(),
                                    )} ${appFiatCurrency.short} ${t(
                                        'price_on',
                                    )} `}
                                    <VText style={[tailwind('flex font-bold')]}>
                                        {'CoinGecko'}
                                    </VText>
                                </VText>
                            )}
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
                            {t('last_updated', {date: fiatRate.lastUpdated})}
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
    rateHighlight: {
        height: 54,
    },
});
