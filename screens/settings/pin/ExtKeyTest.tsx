/* eslint-disable react-native/no-inline-styles */
import {Text, View, useColorScheme} from 'react-native';
import React, {useContext, useState} from 'react';

import {useTailwind} from 'tailwind-rn';
import Color from '../../../constants/Color';

import {useNavigation} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {LongButton} from '../../../components/button';

import NativeWindowMetrics from '../../../constants/NativeWindowMetrics';
import {CommonActions} from '@react-navigation/native';

import {useTranslation} from 'react-i18next';

import {PlainButton} from '../../../components/button';
import {capitalizeFirst} from '../../../modules/transform';

import Back from './../../../assets/svg/arrow-left-24.svg';

import {AppStorageContext} from '../../../class/storageContext';

import {ExtKeyInput} from '../../../components/input';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SettingsParamList} from '../../../Navigation';

type Props = NativeStackScreenProps<SettingsParamList, 'ExtKeyTest'>;

const ExtKeyTest = ({route}: Props) => {
    //TODO: include handling for xprv, ATM the xprv in the descriptor is not the same level as xprv stored from wallet creation/restore.
    const navigation = useNavigation();
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {getWalletData, currentWalletID} = useContext(AppStorageContext);
    const walletXpub = getWalletData(currentWalletID).xpub;

    const [tmpKey, setTmpKey] = useState('');

    const {t} = useTranslation('settings');

    const [isCorrectExtKey, setCorrectExtKey] = useState(false);

    const updateKey = (text: string) => {
        setTmpKey(text);
    };

    const handleExtKeyCorrect = (matches: boolean) => {
        setCorrectExtKey(matches);
    };

    const handleRoute = async () => {
        navigation.dispatch(
            CommonActions.navigate({
                name: 'SetPIN',
                params: {
                    isPINReset: route.params?.isPINReset,
                    isChangePIN: route.params?.isChangePIN,
                },
            }),
        );
    };

    return (
        <SafeAreaView
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View style={[tailwind('w-full h-full items-center')]}>
                <View style={[tailwind('items-center h-full w-full')]}>
                    <View
                        style={[
                            tailwind(
                                'w-5/6 absolute top-0 flex-row justify-center',
                            ),
                        ]}>
                        <PlainButton
                            style={[
                                tailwind(
                                    'items-center flex-row -ml-1 absolute left-0',
                                ),
                            ]}
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
                                ]}>
                                {capitalizeFirst(t('back'))}
                            </Text>
                        </PlainButton>

                        <View style={[tailwind('self-center')]}>
                            <Text
                                style={[
                                    tailwind('text-base font-bold'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {t('ext_test')}
                            </Text>
                        </View>
                    </View>
                    <View
                        style={[
                            tailwind('w-5/6 justify-center items-center'),
                            {marginTop: 64, marginBottom: 32},
                        ]}>
                        <Text
                            style={[
                                tailwind('text-base text-center'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {t('ext_pub_test_desc')}
                        </Text>
                    </View>

                    {/* Ext Key */}
                    <View style={[tailwind('w-5/6')]}>
                        <ExtKeyInput
                            handleCorrect={handleExtKeyCorrect}
                            onChangeText={updateKey}
                            value={tmpKey}
                            extKey={walletXpub}
                            color={ColorScheme.Text.Default}
                            placeholder={t('enter_ext_pub')}
                        />
                    </View>

                    {isCorrectExtKey && (
                        <View
                            style={[
                                tailwind('items-center w-5/6 absolute'),
                                {
                                    bottom: NativeWindowMetrics.bottomButtonOffset,
                                },
                            ]}>
                            <LongButton
                                title={capitalizeFirst(t('continue'))}
                                backgroundColor={
                                    ColorScheme.Background.Inverted
                                }
                                color={ColorScheme.Text.Alt}
                                onPress={handleRoute}
                            />
                        </View>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

export default ExtKeyTest;
