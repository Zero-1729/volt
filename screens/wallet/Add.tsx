import React, {useContext} from 'react';

import {StyleSheet, Text, View, useColorScheme} from 'react-native';

import VText from '../../components/text';

import {StackActions} from '@react-navigation/native';

import {useNavigation} from '@react-navigation/core';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AddWalletParamList} from './../../Navigation';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';

import {useTranslation} from 'react-i18next';

import {AppStorageContext} from '../../class/storageContext';

import {LongButton, PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';
import InfoIcon from './../../assets/svg/info-16.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

type Props = NativeStackScreenProps<AddWalletParamList, 'Add'>;

const Add = ({route}: Props) => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {t} = useTranslation('wallet');

    const {isAdvancedMode, isWalletInitialized} = useContext(AppStorageContext);

    return (
        <SafeAreaView edges={['left', 'bottom', 'right']}>
            <View
                style={[
                    tailwind('w-full h-full items-center'),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <View style={tailwind('w-5/6 mt-8 mb-16')}>
                    {!route.params?.onboarding && (
                        <PlainButton
                            style={tailwind('items-center flex-row -ml-1')}
                            onPress={() => {
                                navigation.goBack();
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
                                {t('back')}
                            </Text>
                        </PlainButton>
                    )}

                    <View style={[tailwind('mt-20 mb-10')]}>
                        <VText
                            style={[
                                tailwind('font-bold text-2xl'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('add_wallet_title')}
                        </VText>
                        <VText
                            style={[
                                tailwind('text-sm'),
                                {color: ColorScheme.Text.GrayText},
                            ]}>
                            {t('add_wallet_description')}
                        </VText>
                    </View>

                    {/* Import an existing Wallet */}
                    <View
                        style={[
                            styles.cardShadow,
                            tailwind('mb-6 rounded-md p-5'),
                            {
                                backgroundColor:
                                    ColorScheme.MiscCardColor.ImportCard,
                            },
                        ]}>
                        <VText
                            style={[
                                tailwind('font-bold mt-2 text-white'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('import_title')}
                        </VText>

                        <VText
                            style={[
                                tailwind('mt-4 mb-2 text-white text-xs'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {t('import_description')}
                        </VText>

                        <View style={[tailwind('items-end')]}>
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
                                    style={[
                                        tailwind('px-6 py-2 rounded-full mt-4'),
                                        {
                                            backgroundColor:
                                                ColorScheme.MiscCardColor
                                                    .ImportCardButton,
                                        },
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind(
                                                'text-xs text-white font-bold',
                                            ),
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

                    {isAdvancedMode ? (
                        <View style={[tailwind('mt-6 flex-row')]}>
                            <InfoIcon
                                width={30}
                                fill={ColorScheme.SVG.Default}
                            />
                            <Text
                                style={[
                                    tailwind('text-xs'),
                                    {color: ColorScheme.Text.GrayText},
                                ]}>
                                {t('supported_accounts_info')}
                            </Text>
                        </View>
                    ) : (
                        <></>
                    )}
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
});
