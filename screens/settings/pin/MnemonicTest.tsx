/* eslint-disable react-native/no-inline-styles */
import {Text, View, useColorScheme} from 'react-native';
import React, {useContext, useState} from 'react';

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

import {setKeychainItem} from './../../../class/keychainContext';
import {AppStorageContext} from '../../../class/storageContext';

import {MnemonicInput} from '../../../components/input';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SettingsParamList} from '../../../Navigation';

type Props = NativeStackScreenProps<SettingsParamList, 'MnemonicTest'>;

const MnemonicTest = ({route}: Props) => {
    const navigation = useNavigation();
    const ColorScheme = Color(useColorScheme());

    const {getWalletData, currentWalletID, setPINAttempts} =
        useContext(AppStorageContext);
    const walletMnemonic = getWalletData(currentWalletID).mnemonic;
    const mnemonicList = walletMnemonic.split(' ');

    const {t} = useTranslation('settings');

    const [isCorrectMnemonic, setIsCorrectMnemonic] = useState(false);

    const handleCorrectMnemonic = () => {
        if (isCorrectMnemonic) {
            setPINAttempts(0);
            setKeychainItem('pin', '');
            navigation.dispatch(
                CommonActions.navigate({
                    name: 'SetPIN',
                    params: {
                        isPINReset: route.params?.isPINReset,
                        isChangePIN: route.params?.isChangePIN,
                    },
                }),
            );
        }
    };

    return (
        <SafeAreaView
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View className="w-full h-full items-center">
                <View className="items-center h-full w-full">
                    <View
                        className="w-5/6 absolute top-6 flex-row justify-center">
                        <PlainButton
                            className="items-center flex-row -ml-1 absolute left-0"
                            onPress={() => {
                                navigation.dispatch(CommonActions.goBack());
                            }}>
                            <Back
                                fill={ColorScheme.SVG.Default}
                            />
                            <Text
                                className="ml-2 text-sm font-medium"
                                style={{color: ColorScheme.Text.Default}}>
                                {capitalizeFirst(t('back'))}
                            </Text>
                        </PlainButton>

                        <View className="self-center">
                            <Text
                                className="text-base font-bold"
                                style={{color: ColorScheme.Text.Default}}>
                                {t('mnemonic_test')}
                            </Text>
                        </View>
                    </View>
                    <View
                        className="w-5/6 justify-center items-center"
                        style={{marginTop: 80, marginBottom: 32}}>
                        <Text
                            className="text-base text-center"
                            style={{color: ColorScheme.Text.DescText}}>
                            {t('mnemonic_test_desc')}
                        </Text>
                    </View>

                    {/* Checker for Mnemonic */}
                    <View
                        className="w-5/6 items-center"
                        style={{marginLeft: 16}}>
                        <MnemonicInput
                            mnemonicList={mnemonicList}
                            onMnemonicCheck={setIsCorrectMnemonic}
                        />
                    </View>

                    {isCorrectMnemonic && (
                        <View
                            className="items-center w-5/6 absolute"
                            style={{
                                    bottom: NativeWindowMetrics.bottomButtonOffset,
                                }}>
                            <LongButton
                                title={capitalizeFirst(t('continue'))}
                                backgroundColor={
                                    ColorScheme.Background.Inverted
                                }
                                color={ColorScheme.Text.Alt}
                                onPress={handleCorrectMnemonic}
                            />
                        </View>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

export default MnemonicTest;
