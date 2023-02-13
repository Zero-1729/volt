/* eslint-disable react-native/no-inline-styles */
import React, {useState, useContext} from 'react';

import {useColorScheme, Text, View} from 'react-native';

import {useNavigation} from '@react-navigation/core';

import {CommonActions} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {AppStorageContext} from '../../class/storageContext';

import {useTailwind} from 'tailwind-rn';

import {PlainButton, LongBottomButton} from '../../components/button';

import {TextSingleInput} from '../../components/input';

import Back from './../../assets/svg/arrow-left-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

const CreateAction = (): JSX.Element => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {isWalletInitialized, setWalletInitialized, addWallet} =
        useContext(AppStorageContext);

    const [newWalletName, setNewWalletName] = useState('');

    const updateWalletName = async (walletName: string) => {
        // Indicate that the wallet has been created
        if (!isWalletInitialized) {
            setWalletInitialized(true);
        }

        try {
            // Default wallet type is Segwit bech32
            addWallet(walletName, false, 'bech32', '');
        } catch (e) {
            console.error(`[CreateAction] Error adding wallet: [${e}]`);
        }

        // Navigate to the wallet screen
        navigation.dispatch(
            CommonActions.navigate({
                name: 'Home',
            }),
        );
    };

    const onBlur = () => {
        const valueWithSingleWhitespace = newWalletName.replace(
            /^\s+|\s+$|\s+(?=\s)/g,
            '',
        );

        setNewWalletName(valueWithSingleWhitespace);

        return valueWithSingleWhitespace;
    };

    return (
        <SafeAreaView>
            <View
                style={[
                    tailwind('w-full h-full items-center'),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <View style={[tailwind('w-5/6 mt-4')]}>
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
                            Back
                        </Text>
                    </PlainButton>

                    <Text
                        style={[
                            tailwind('font-bold text-2xl mt-20'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Create New Wallet
                    </Text>

                    <Text
                        style={[
                            tailwind('text-xs mt-2'),
                            {color: ColorScheme.Text.GrayText},
                        ]}>
                        Defaults to SegWit Native (address starts with 'bc1')
                    </Text>

                    <View
                        style={[
                            tailwind('mt-10 border-gray-400 px-4'),
                            {borderWidth: 1, borderRadius: 6},
                        ]}>
                        <TextSingleInput
                            placeholder={'Enter Wallet name'}
                            onChangeText={setNewWalletName}
                            onBlur={onBlur}
                            color={ColorScheme.Text.Default}
                        />
                    </View>
                </View>

                <LongBottomButton
                    onPress={() => {
                        updateWalletName(newWalletName);
                    }}
                    title={'Continue'}
                    textColor={
                        newWalletName.trim().length > 0
                            ? ColorScheme.Text.Alt
                            : ColorScheme.Text.GrayedText
                    }
                    backgroundColor={
                        newWalletName.trim().length > 0
                            ? ColorScheme.Background.Inverted
                            : ColorScheme.Background.Secondary
                    }
                />
            </View>
        </SafeAreaView>
    );
};

export default CreateAction;
