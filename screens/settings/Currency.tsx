import React, {useContext} from 'react';

import {StyleSheet, Text, View, FlatList, useColorScheme} from 'react-native';

import {CommonActions} from '@react-navigation/native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import RNHapticFeedback from 'react-native-haptic-feedback';

import DayJS from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
DayJS.extend(calendar);

import {RNHapticFeedbackOptions} from '../../constants/Haptic';

import {useTailwind} from 'tailwind-rn';

import {CurrencyType} from '../../types/settings';

import {AppStorageContext} from '../../class/storageContext';

import {PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';
import Check from './../../assets/svg/check-circle-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

import {Currencies} from '../../constants/Currency';

import {liberalAlert} from '../../components/alert';
import {addCommas} from '../../modules/transform';

const Currency = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {appFiatCurrency, setAppFiatCurrency, networkState, fiatRate} =
        useContext(AppStorageContext);

    const renderItem = ({item, index}: {item: CurrencyType; index: number}) => {
        return (
            <PlainButton
                onPress={() => {
                    if (!networkState?.isConnected) {
                        liberalAlert(
                            'Network',
                            'Unable to fetch currency data, connect to the Internet',
                            'Cancel',
                        );
                        return;
                    }

                    RNHapticFeedback.trigger('soft', RNHapticFeedbackOptions);
                    setAppFiatCurrency(item);
                }}>
                <View
                    style={[
                        tailwind(
                            'w-5/6 self-center items-center flex-row justify-between mt-3 mb-6',
                        ),
                        index === 0 ? styles.PaddedTop : {},
                    ]}>
                    <Text
                        style={[
                            tailwind('text-sm'),
                            {color: ColorScheme.Text.Default},
                            Font.RobotoText,
                        ]}>
                        {`${item.short} (${item.symbol})`}
                    </Text>

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
                        <View
                            style={[
                                tailwind('flex-row w-5/6 justify-between'),
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-2xl mb-4 font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                Currency
                            </Text>

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
                                <Text
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
                                </Text>
                            </View>
                        </View>

                        <View
                            style={[
                                tailwind('text-sm py-4 w-full pl-8'),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                },
                            ]}>
                            <Text style={{color: ColorScheme.Text.Default}}>
                                Price at{' '}
                                {`${addCommas(fiatRate.rate.toString())} ${
                                    appFiatCurrency.short
                                }`}{' '}
                                on
                                <Text style={[tailwind('font-bold')]}>
                                    {' '}
                                    {fiatRate.source}
                                </Text>
                            </Text>
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
                        <Text style={[{color: ColorScheme.Text.GrayedText}]}>
                            Last updated{' '}
                            {DayJS(fiatRate.lastUpdated).calendar()}
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Currency;

const styles = StyleSheet.create({
    PaddedTop: {
        paddingTop: 16,
    },
    Flexed: {
        flex: 1,
    },
});
