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

import {TCurrency, TRate} from '../../types/settings';

import {AppStorageContext} from '../../class/storageContext';

import {PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';
import Check from './../../assets/svg/check-circle-fill-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

import Currencies from '../../constants/Currency';

import {addCommas, capitalizeFirst} from '../../modules/transform';

import {Toasts} from '@backpackapp-io/react-native-toast';
import {LiberalToast} from '../../components/toast';

import {fetchFiatRate} from '../../modules/currency';
import {TRateObject, TRateResponse} from '../../types/wallet';
import BigNumber from 'bignumber.js';
import NativeWindowMetrics from '../../constants/NativeWindowMetrics';

const Currency = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

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
                        LiberalToast(capitalizeFirst(t('network')), response.error, {
                            duration: 2500,
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
                className={
                    `${
                            langDir === 'right'
                                ? 'flex-row-reverse'
                                : 'flex-row'
                        } w-full items-center justify-between px-6 py-4 mb-2`
                }
                style={[
                    index === 0 ? styles.paddedTop : {},
                ]}>
                <View
                    className={
                        `items-center ${
                                langDir === 'right'
                                    ? 'flex-row-reverse'
                                    : 'flex-row'
                            }`
                    }>
                    <VText
                        className="text-sm"
                        style={[
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {item.full_name}
                    </VText>
                    {appFiatCurrency.short === item.short && (
                        <View
                            className={
                                `${langDir === 'right' ? 'mr-2' : 'ml-2'}`
                            }>
                            <Check width={16} fill={ColorScheme.SVG.Default} />
                        </View>
                    )}
                </View>
                <View
                    className="items-center justify-center flex-row">
                    <VText
                        className="text-sm"
                        style={[
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
                className="w-full h-full"
                style={[
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
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
                                fill={ColorScheme.SVG.Default}
                            />
                            <VText
                                className="ml-2 text-sm font-medium"
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
                        <View
                            className={
                                `${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } w-5/6 justify-between`
                            }>
                            <VText
                                className="text-2xl mb-4 font-medium"
                                style={[
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {capitalizeFirst(t('currency'))}
                            </VText>

                            {/* Highlight current select currency here */}
                            <View
                                className="px-4 py-0 flex-row items-center h-8 rounded-full"
                                style={[
                                    {
                                        backgroundColor:
                                            ColorScheme.Background.Inverted,
                                    },
                                ]}>
                                <VText
                                    className="text-sm font-bold"
                                    style={[
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
                            className={
                                `text-sm py-4 w-full ${
                                        langDir === 'right' ? 'pr-8' : 'pl-8'
                                    }`
                            }
                            style={[
                                styles.rateHighlight,
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                },
                            ]}>
                            {loadingRate ? (
                                <View
                                    className={
                                        `${
                                                langDir === 'right'
                                                    ? 'flex-row-reverse'
                                                    : 'flex-row'
                                            }`
                                    }>
                                    <ActivityIndicator size={'small'} />
                                    <VText
                                        className={
                                            `text-sm ${
                                                    langDir === 'right'
                                                        ? 'mr-2'
                                                        : 'ml-2'
                                                }`
                                        }
                                        style={[
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
                                    className="text-sm"
                                    style={[
                                        {
                                            color: ColorScheme.Text.Default,
                                        },
                                    ]}>
                                    {`${t('price_at')} ${addCommas(
                                        fiatRate.rate.toString(),
                                    )} ${appFiatCurrency.short} ${t(
                                        'price_on',
                                    )} `}
                                    <VText className="flex font-bold">
                                        {'CoinGecko'}
                                    </VText>
                                </VText>
                            )}
                        </View>
                    </View>

                    <FlatList
                        className="w-full"
                        data={Currencies}
                        renderItem={renderItem}
                        keyExtractor={item => item.locale}
                        initialNumToRender={25}
                        contentInsetAdjustmentBehavior="automatic"
                    />

                    <View
                        className="w-full items-center justify-center"
                        style={[
                            styles.bottomMessage,
                        ]}>
                        <VText style={[{color: ColorScheme.Text.GrayedText}]}>
                            {t('last_updated', {date: fiatRate.lastUpdated})}
                        </VText>
                    </View>

                    <Toasts extraInsets={{top: NativeWindowMetrics.height * -0.09}} />
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
