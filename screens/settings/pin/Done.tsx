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

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SettingsParamList} from '../../../Navigation';

type Props = NativeStackScreenProps<SettingsParamList, 'DonePIN'>;

const Done = ({route}: Props) => {
    const navigation = useNavigation();
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {setPINActive} = useContext(AppStorageContext);

    const {t} = useTranslation('settings');

    const titleText = route.params?.isChangePIN
        ? t('done_pin_change')
        : t('done_pin_setup');
    const titleDesc = route.params?.isChangePIN
        ? t('done_pin_change_message')
        : t('done_pin_setup_message');

    const buttonTitle =
        route.params?.isPINReset || route.params?.isChangePIN
            ? capitalizeFirst(t('done'))
            : capitalizeFirst(t('continue'));

    const handleDone = () => {
        setPINActive(true);

        // If we were in Reset flow
        if (route.params?.isPINReset && !route.params?.isChangePIN) {
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{name: 'HomeScreen'}],
                }),
            );
            return;
        }

        // If in change PIN flow
        if (route.params?.isChangePIN) {
            navigation.dispatch(
                CommonActions.navigate('SettingsRoot', {
                    screen: 'PINManager',
                }),
            );

            return;
        }

        // TODO: take this out and replace with Onboarding flow
        navigation.dispatch(
            CommonActions.navigate('AddWalletRoot', {
                screen: 'Add',
                params: {onboarding: true},
            }),
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
                                tailwind('text-xl font-bold text-white mb-2'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {titleText}
                        </Text>

                        <Text
                            style={[
                                tailwind('text-base text-center'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {titleDesc}
                        </Text>
                    </View>

                    <LongBottomButton
                        title={buttonTitle}
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
