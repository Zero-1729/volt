/* eslint-disable react-native/no-inline-styles */
import {Text, View, useColorScheme} from 'react-native';
import React, {useContext} from 'react';

import {useTailwind} from 'tailwind-rn';
import Color from '../../../constants/Color';

import {useNavigation} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {CommonActions} from '@react-navigation/native';

import {capitalizeFirst} from '../../../modules/transform';

import {LongBottomButton} from '../../../components/button';
import {useTranslation} from 'react-i18next';

import BitcoinRobe from './../../../assets/svg/bitcoin-robe.svg';

import {AppStorageContext} from '../../../class/storageContext';

const Done = () => {
    const navigation = useNavigation();
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {setPINActive} = useContext(AppStorageContext);

    const {t} = useTranslation('settings');

    const handleDone = () => {
        setPINActive(true);

        navigation.dispatch(
            CommonActions.navigate('SettingsRoot', {screen: 'Wallet'}),
        );
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
                        <BitcoinRobe height={256} width={256} />

                        <Text
                            style={[
                                tailwind('text-xl font-bold text-white'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('done_pin_setup')}
                        </Text>

                        <Text
                            style={[
                                tailwind('text-base text-center'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {t('done_pin_setup_message')}
                        </Text>
                    </View>

                    <LongBottomButton
                        title={capitalizeFirst(t('done'))}
                        textColor={ColorScheme.Text.Alt}
                        backgroundColor={ColorScheme.Background.Inverted}
                        onPress={handleDone}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Done;
