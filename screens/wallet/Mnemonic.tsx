import React, {useContext, useCallback} from 'react';

import {Text, View, useColorScheme} from 'react-native';
import {StackActions, useNavigation} from '@react-navigation/native';

import {useTailwind} from 'tailwind-rn';

import {LongBottomButton} from '../../components/button';
import {AppStorageContext} from '../../class/storageContext';

import {SafeAreaView} from 'react-native-safe-area-context';

import {displayNumberedSeed} from '../../modules/transform';

import Color from '../../constants/Color';

const Mnemonic = () => {
    const navigation = useNavigation();
    const {getWalletData, currentWalletID} = useContext(AppStorageContext);

    const walletData = getWalletData(currentWalletID);

    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const returnToHome = useCallback(() => {
        // We need to get back to the main parent modal
        // so we can close it and return to the home screen
        navigation.getParent()?.dispatch(StackActions.popToTop());
    }, [navigation]);

    const displayMnemonic = () => {
        const components: JSX.Element[] = [];

        // iterate over seed words and create a styled component for each
        displayNumberedSeed(walletData.secret).forEach((word, index) => {
            components.push(
                <View style={[tailwind('m-1 rounded-sm')]} key={index}>
                    <Text
                        style={[
                            tailwind('text-base font-bold px-2 py-1 '),
                            {
                                color: ColorScheme.Text.GrayedText,
                                backgroundColor:
                                    ColorScheme.Background.Secondary,
                            },
                        ]}
                        textBreakStrategy={'simple'}>
                        {word}
                    </Text>
                </View>,
            );
        });

        return components;
    };

    return (
        <SafeAreaView edges={['bottom', 'right', 'left']}>
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
                        Backup Mnemonic
                    </Text>
                </View>

                {/* Newly created wallet name */}
                <Text
                    style={[
                        tailwind('text-base text-center w-1/2 mt-1'),
                        {color: ColorScheme.Text.Default},
                    ]}
                    ellipsizeMode={'middle'}
                    numberOfLines={1}>
                    {walletData.name}
                </Text>

                {/* Mnemonic instruction and note on backing up */}
                <View style={[tailwind('w-5/6 mt-12')]}>
                    <Text
                        style={
                            (tailwind('text-sm'),
                            {color: ColorScheme.Text.Default})
                        }>
                        <Text
                            style={[tailwind('font-bold text-sm text-center')]}>
                            NOTE:
                        </Text>{' '}
                        Please, back up your mnemonic phrase. It is the only way
                        to restore your wallet.
                        {'\n\n'}
                        <Text
                            style={[
                                tailwind('text-center'),
                                {color: ColorScheme.Text.GrayedText},
                            ]}>
                            You can backup your mnemonic phrase by writing it
                            down on a piece of paper and storing it in a safe
                            place. Do not share it with anyone.
                        </Text>
                    </Text>
                </View>

                {/* Show Mnemonic phrases */}
                <View style={[tailwind('w-5/6 mt-12 grow')]}>
                    <View
                        style={[tailwind('flex-row flex-wrap justify-center')]}>
                        {displayMnemonic()}
                    </View>
                </View>

                {/* Button to indicate backup complete, ready to go home */}
                <LongBottomButton
                    onPress={returnToHome}
                    backgroundColor={ColorScheme.Background.Inverted}
                    textColor={ColorScheme.Text.Alt}
                    title="OK, I have backed up"
                    style={[tailwind('font-bold')]}
                />
            </View>
        </SafeAreaView>
    );
};

export default Mnemonic;
