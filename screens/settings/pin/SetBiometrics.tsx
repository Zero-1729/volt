/* eslint-disable react-native/no-inline-styles */
import {Text, View, useColorScheme} from 'react-native';
import React, {useContext} from 'react';

import {useTailwind} from 'tailwind-rn';
import Color from '../../../constants/Color';

import {useNavigation} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {CommonActions} from '@react-navigation/native';

import {capitalizeFirst} from '../../../modules/transform';

import {LongButton, PlainButton} from '../../../components/button';
import {useTranslation} from 'react-i18next';

import BitcoinAstro from './../../../assets/svg/bitcoin-astro.svg';
import NativeWindowMetrics from '../../../constants/NativeWindowMetrics';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SettingsParamList} from '../../../Navigation';
import {AppStorageContext} from '../../../class/storageContext';

type Props = NativeStackScreenProps<SettingsParamList, 'SetBiometrics'>;

const SetBiometrics = ({route}: Props) => {
    const navigation = useNavigation();
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {t} = useTranslation('settings');

    const {setBiometricsActive} = useContext(AppStorageContext);

    const handleDone = () => {
        // TODO: handle setup biometrics
        setBiometricsActive(true);

        navigation.dispatch(
            CommonActions.navigate('SettingsRoot', {screen: 'Wallet'}),
        );
    };

    const skipAlong = () => {
        if (route.params?.standalone) {
            navigation.dispatch(
                CommonActions.navigate('SettingsRoot', {screen: 'Wallet'}),
            );
        } else {
            navigation.dispatch(CommonActions.navigate({name: 'DonePIN'}));
        }
    };

    return (
        <SafeAreaView
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View style={[tailwind('w-full h-full items-center')]}>
                <View
                    style={[
                        tailwind('items-center h-full w-full justify-center'),
                    ]}>
                    <View
                        style={[
                            tailwind('items-center w-5/6'),
                            {marginTop: -64},
                        ]}>
                        <BitcoinAstro height={256} width={256} />

                        <Text
                            style={[
                                tailwind('text-xl font-bold text-white mb-2'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('setup_bio')}
                        </Text>

                        <Text
                            style={[
                                tailwind('text-base text-center'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {t('setup_bio_desc')}
                        </Text>
                    </View>

                    <View
                        style={[
                            tailwind('absolute w-5/6'),
                            {bottom: NativeWindowMetrics.bottomButtonOffset},
                        ]}>
                        <PlainButton onPress={skipAlong}>
                            <Text
                                style={[
                                    tailwind(
                                        'text-base text-center font-bold mb-6',
                                    ),
                                    {color: ColorScheme.Text.DescText},
                                ]}>
                                {route.params?.standalone
                                    ? capitalizeFirst(t('cancel'))
                                    : capitalizeFirst(t('skip'))}
                            </Text>
                        </PlainButton>
                        <LongButton
                            title={capitalizeFirst(t('enable'))}
                            textColor={ColorScheme.Text.Alt}
                            backgroundColor={ColorScheme.Background.Inverted}
                            onPress={handleDone}
                        />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default SetBiometrics;
