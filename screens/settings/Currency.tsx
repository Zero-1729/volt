import React, {useCallback, useEffect, useState} from 'react';

import {StyleSheet, Text, View, FlatList, useColorScheme} from 'react-native';

import {CommonActions} from '@react-navigation/native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import tailwind from 'tailwind-rn';

import {PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';
import Check from './../../assets/svg/check-circle-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

import {Currencies} from '../../constants/Currency';

import {CurrencyType} from '../../types/currency';

import AsyncStorage from '@react-native-async-storage/async-storage';

const Currency = () => {
    const navigation = useNavigation();

    const [selectedCurrency, setCurrency] = useState('USD');

    const ColorScheme = Color(useColorScheme());

    const HeadingBar = {
        height: 2,
        backgroundColor: ColorScheme.HeadingBar,
    };

    // Retrieve the stored current currency value
    const getDefaultCurrency = async (item: string) => {
        try {
            const value = await AsyncStorage.getItem(item);
            if (value !== null) {
                return value;
            }
        } catch (e) {
            console.error(
                '[AsyncStorage] (Currency setting) Error loading data: ',
                e,
            );
        }
    };

    // Update the Async stored currency value
    const updateDefaultCurrency = async (item: string, value: string) => {
        try {
            await AsyncStorage.setItem(item, value);
        } catch (e) {
            console.error(
                '[AsyncStorage] (Currency settings) Error saving data: ',
                e,
            );
        }
    };

    // Update the currency value state
    const updateCurrency = useCallback(async (currency: string) => {
        setCurrency(currency);
        updateDefaultCurrency('defaultCurrency', currency);
    }, []);

    // Load and set current currency value data
    useEffect(() => {
        getDefaultCurrency('defaultCurrency').then(currency => {
            if (currency) {
                setCurrency(currency);
            }
        });
    }, []);

    const renderItem = ({item, index}: {item: CurrencyType; index: number}) => {
        return (
            <PlainButton
                onPress={() => {
                    updateCurrency(item.short);
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
                        {selectedCurrency === item.short && (
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
                        <Text
                            style={[
                                tailwind('text-2xl mb-4 w-5/6 font-medium'),
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            Currency
                        </Text>

                        <View style={[tailwind('w-full'), HeadingBar]} />
                    </View>

                    {/* Highlight current select currency here */}
                    <View
                        style={[
                            tailwind(
                                'w-full h-12 self-center items-center flex-row justify-between',
                            ),
                            {backgroundColor: ColorScheme.Background.Secondary},
                        ]}>
                        <Text
                            style={[
                                tailwind('text-sm pl-8 font-bold'),
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            Selected: {selectedCurrency}
                        </Text>
                    </View>

                    <FlatList
                        style={tailwind('w-full')}
                        data={Currencies}
                        renderItem={renderItem}
                        keyExtractor={item => item.locale}
                        initialNumToRender={25}
                        contentInsetAdjustmentBehavior="automatic"
                    />
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
