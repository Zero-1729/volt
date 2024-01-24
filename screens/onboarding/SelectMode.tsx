/* eslint-disable react-native/no-inline-styles */
import React, {useState, useContext} from 'react';
import {Text, View, useColorScheme, StyleSheet} from 'react-native';

import VText from '../../components/text';

import {CommonActions} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/core';
import {SafeAreaView} from 'react-native-safe-area-context';

import {AppStorageContext} from '../../class/storageContext';

import {useTranslation} from 'react-i18next';

import {capitalizeFirst} from '../../modules/transform';

import {useTailwind} from 'tailwind-rn';

import {LongBottomButton, PlainButton} from '../../components/button';

import SelectedIcon from './../../assets/svg/check-circle-fill-24.svg';

import Color from '../../constants/Color';

const SelectMode = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {t, i18n} = useTranslation('onboarding');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const {setWalletModeType} = useContext(AppStorageContext);

    const [selectedMode, setSelectedMode] = useState('single');

    const setModeAndRoute = () => {
        // Set the mode in the store
        setWalletModeType(selectedMode);

        // Route to add wallet screen
        navigation.dispatch(
            CommonActions.navigate('AddWalletRoot', {
                screen: 'Add',
                params: {onboarding: true},
            }),
        );
    };

    return (
        <SafeAreaView>
            <View
                style={[
                    tailwind(
                        'w-full h-full relative items-center justify-center',
                    ),
                    {
                        backgroundColor: ColorScheme.Background.Primary,
                    },
                ]}>
                <Text
                    style={[
                        tailwind('text-lg absolute font-bold top-6'),
                        {color: ColorScheme.Text.Default},
                    ]}>
                    {t('select_mode_title')}
                </Text>

                <View style={[tailwind('items-center w-4/5 py-4'), {top: -25}]}>
                    <View
                        style={[
                            tailwind('justify-center items-center w-full'),
                        ]}>
                        <PlainButton
                            style={[tailwind('w-5/6 p-2')]}
                            onPress={() => {
                                setSelectedMode('single');
                            }}>
                            <>
                                <View
                                    style={[
                                        tailwind(
                                            `${
                                                langDir === 'right'
                                                    ? 'flex-row-reverse'
                                                    : 'flex-row'
                                            } items-center`,
                                        ),
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind(
                                                `text-sm font-semibold ${
                                                    langDir === 'right'
                                                        ? 'ml-2'
                                                        : 'mr-2'
                                                }`,
                                            ),
                                            {color: ColorScheme.Text.Default},
                                        ]}>
                                        {t('single_mode_title')}
                                    </Text>

                                    {selectedMode === 'single' && (
                                        <SelectedIcon
                                            height={16}
                                            width={16}
                                            fill={ColorScheme.SVG.Default}
                                        />
                                    )}
                                </View>

                                <VText
                                    style={[
                                        tailwind('text-sm mt-4'),
                                        {color: ColorScheme.Text.GrayedText},
                                    ]}>
                                    {t('single_mode_description')}
                                </VText>
                            </>
                        </PlainButton>

                        <View
                            style={[
                                styles.divider,
                                tailwind('w-full mt-6 mb-6'),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                },
                            ]}
                        />

                        <PlainButton
                            style={[tailwind('w-5/6 p-2')]}
                            onPress={() => {
                                setSelectedMode('multi');
                            }}>
                            <>
                                <View
                                    style={[
                                        tailwind(
                                            `${
                                                langDir === 'right'
                                                    ? 'flex-row-reverse'
                                                    : 'flex-row'
                                            } items-center`,
                                        ),
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind(
                                                `text-sm font-semibold ${
                                                    langDir === 'right'
                                                        ? 'ml-2'
                                                        : 'mr-2'
                                                }`,
                                            ),
                                            {color: ColorScheme.Text.Default},
                                        ]}>
                                        {t('multi_mode_title')}
                                    </Text>

                                    {selectedMode === 'multi' && (
                                        <SelectedIcon
                                            height={16}
                                            width={16}
                                            fill={ColorScheme.SVG.Default}
                                        />
                                    )}
                                </View>

                                <VText
                                    style={[
                                        tailwind('text-sm mt-4'),
                                        {color: ColorScheme.Text.GrayedText},
                                    ]}>
                                    {t('multi_mode_description')}
                                </VText>
                            </>
                        </PlainButton>
                    </View>
                </View>

                <LongBottomButton
                    onPress={setModeAndRoute}
                    title={capitalizeFirst(t('done'))}
                    textColor={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                />
            </View>
        </SafeAreaView>
    );
};

export default SelectMode;

const styles = StyleSheet.create({
    divider: {
        height: 1,
    },
});
