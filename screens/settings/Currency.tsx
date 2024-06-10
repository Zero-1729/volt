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

import netInfo, {useNetInfo} from '@react-native-community/netinfo';
import {checkNetworkIsReachable} from '../../modules/wallet-utils';

import {RNHapticFeedbackOptions} from '../../constants/Haptic';

import {useTailwind} from 'tailwind-rn';

import {TCurrency, TRate} from '../../types/settings';

import {AppStorageContext} from '../../class/storageContext';

import {PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';
import Check from './../../assets/svg/check-circle-fill-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

import Currencies from '../../constants/Currency';

import {addCommas, capitalizeFirst} from '../../modules/transform';
import Toast from 'react-native-toast-message';
import {fetchFiatRate} from '../../modules/currency';
import {TRateObject, TRateResponse} from '../../types/wallet';
import BigNumber from 'bignumber.js';

const Currency = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {t, i18n} = useTranslation('settings');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const fallbackNetworkState = useNetInfo();

    const [loadingRate, setLoadingRate] = useState(false);

    const {
        appFiatCurrency,
        setAppFiatCurrency,
        fiatRate,
        updateFiatRate,
        setCachedRates,
        rates,
        isAdvancedMode,
    } = useContext(AppStorageContext);

    const handleCurrencySwitch = useCallback(
        async (currency: TCurrency) => {
            let response: TRateResponse;

            // Check Internet connection
            // Only fetch if online
            const _netInfo = await netInfo.fetch();
            if (
                checkNetworkIsReachable(_netInfo) ||
                checkNetworkIsReachable(fallbackNetworkState)
            ) {
                response = await fetchFiatRate(currency.short, fiatRate);

                if (response?.success) {
                    const rateObj = response.rate as TRateObject;

                    updateFiatRate({
                        ...fiatRate,
                        rate: rateObj.rate,
                        lastUpdated: rateObj.lastUpdated,
                        dailyChange: rateObj.dailyChange,
                    });

                    // Set app fiat currency
                    setAppFiatCurrency(currency);
                    // refresh cached rates
                    setCachedRates(response.rates as TRate);

                    RNHapticFeedback.trigger('soft', RNHapticFeedbackOptions);
                    setLoadingRate(false);
                } else {
                    if (isAdvancedMode) {
                        Toast.show({
                            topOffset: 54,
                            type: 'Liberal',
                            text1: capitalizeFirst(t('network')),
                            text2: response.error,
                            visibilityTime: 2500,
                        });
                    }

                    // If online and hit cool down limit,
                    // update from cache if not refreshed
                    updateFiatRate({
                        ...fiatRate,
                        rate: new BigNumber(
                            rates[currency.short.toLowerCase()],
                        ),
                        lastUpdated: fiatRate.lastUpdated,
                    });
                    setLoadingRate(false);
                }
            } else {
                // Otherwise
                // Load cached rate
                updateFiatRate({
                    ...fiatRate,
                    rate: new BigNumber(rates[currency.short.toLowerCase()]),
                    lastUpdated: fiatRate.lastUpdated,
                });
                setAppFiatCurrency(currency);
                setLoadingRate(false);
            }
        },
        [
            fallbackNetworkState,
            fiatRate,
            isAdvancedMode,
            rates,
            setAppFiatCurrency,
            setCachedRates,
            t,
            updateFiatRate,
        ],
    );

    const renderItem = ({item, index}: {item: TCurrency; index: number}) => {
        return (
            <PlainButton
                onPress={() => {
                    setLoadingRate(true);
                    handleCurrencySwitch(item);
                }}
                style={[
                    tailwind(
                        `${
                            langDir === 'right'
                                ? 'flex-row-reverse'
                                : 'flex-row'
                        } w-full items-center justify-between px-6 py-4 mb-2`,
                    ),
                    index === 0 ? styles.paddedTop : {},
                ]}>
                <View
                    style={[
                        tailwind(
                            `items-center ${
                                langDir === 'right'
                                    ? 'flex-row-reverse'
                                    : 'flex-row'
                            }`,
                        ),
                    ]}>
                    <VText
                        style={[
                            tailwind('text-sm'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {item.full_name}
                    </VText>
                    {appFiatCurrency.short === item.short && (
                        <View
                            style={[
                                tailwind(
                                    `${langDir === 'right' ? 'mr-2' : 'ml-2'}`,
                                ),
                            ]}>
                            <Check width={16} fill={ColorScheme.SVG.Default} />
                        </View>
                    )}
                </View>
                <View
                    style={[tailwind('items-center justify-center flex-row')]}>
                    <VText
                        style={[
                            tailwind('text-sm'),
                            {color: ColorScheme.Text.DescText},
                            Font.RobotoText,
                        ]}>
                        {`${item.short} (${item.symbol})`}
                    </VText>
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

                    <View
                        style={[
                            tailwind('w-full items-center justify-center'),
                            styles.bottomMessage,
                        ]}>
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
        paddingTop: 24,
    },
    flexed: {
        flex: 1,
    },
    rateHighlight: {
        height: 54,
    },
    bottomMessage: {
        height: 48,
    },
});
