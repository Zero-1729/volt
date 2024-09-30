/* eslint-disable react-native/no-inline-styles */
import React, {useContext, useCallback} from 'react';

import {StyleSheet, Text, View, useColorScheme} from 'react-native';
import {StackActions, useNavigation} from '@react-navigation/native';

import {useTailwind} from 'tailwind-rn';

import {LongBottomButton} from '../../components/button';
import {AppStorageContext} from '../../class/storageContext';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useTranslation} from 'react-i18next';

import {capitalizeFirst} from '../../modules/transform';

import {MnemonicDisplayCapsule} from '../../components/shared';

import Color from '../../constants/Color';

const Mnemonic = () => {
    const navigation = useNavigation();
    const {getWalletData, currentWalletID, isWalletInitialized, setWalletInit} =
        useContext(AppStorageContext);

    const walletData = getWalletData(currentWalletID);

    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {t} = useTranslation('wallet');
    const {t: e} = useTranslation('errors');

    const mnemonic = walletData.mnemonic.split(' ');

    const returnToHome = useCallback(() => {
        const noWallets = !isWalletInitialized;

        // Update wallet init here
        if (noWallets) {
            setWalletInit(true);
        }

        navigation.dispatch(StackActions.popToTop());
    }, [isWalletInitialized, navigation, setWalletInit]);

    return (
        <SafeAreaView
            edges={['bottom', 'right', 'left']}
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View style={[tailwind('w-full h-full items-center relative')]}>
                <View
                    style={[
                        tailwind(
                            'w-5/6 justify-center items-center flex-row mt-8',
                        ),
                    ]}>
                    {/* Mnemonic page heading */}
                    <Text
                        style={[
                            tailwind('font-bold text-lg'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {t('mnemonic_title')}
                    </Text>
                </View>

                {/* Mnemonic instruction and note on backing up */}
                <View style={[tailwind('w-5/6 mt-10')]}>
                    <Text
                        style={
                            (tailwind('text-sm'),
                            {color: ColorScheme.Text.Default})
                        }>
                        <Text
                            style={[tailwind('font-bold text-sm text-center')]}>
                            {capitalizeFirst(t('note'))}:
                        </Text>{' '}
                        {t('mnemonic_note')}
                        {'\n\n'}
                        <Text
                            style={[
                                tailwind('text-center'),
                                {color: ColorScheme.Text.GrayedText},
                            ]}>
                            {e('mnemonic_warn')}
                        </Text>
                    </Text>
                </View>

                {/* Show Mnemonic phrases */}
                <View
                    style={[
                        tailwind(
                            'w-5/6 flex-row justify-center items-center mt-6 mb-6',
                        ),
                    ]}>
                    {/* col 0 */}
                    <View
                        style={[
                            tailwind('items-center justify-center mr-4'),
                            styles.capsuleContainer,
                        ]}>
                        {mnemonic.slice(0, 6).map((word, index) => (
                            <MnemonicDisplayCapsule
                                key={index}
                                word={word}
                                index={index}
                            />
                        ))}
                    </View>

                    {/* col 1 */}
                    <View
                        style={[
                            tailwind('items-center justify-center'),
                            styles.capsuleContainer,
                        ]}>
                        {mnemonic.slice(6, 12).map((word, index) => (
                            <MnemonicDisplayCapsule
                                key={index + 6}
                                word={word}
                                index={index + 6}
                            />
                        ))}
                    </View>
                </View>

                {/* Button to indicate backup complete, ready to go home */}
                <LongBottomButton
                    onPress={returnToHome}
                    backgroundColor={ColorScheme.Background.Inverted}
                    textColor={ColorScheme.Text.Alt}
                    title={t('mnemonic_ok_button')}
                    style={[tailwind('font-bold')]}
                />
            </View>
        </SafeAreaView>
    );
};

export default Mnemonic;

const styles = StyleSheet.create({
    capsuleContainer: {
        width: '46%',
    },
});
