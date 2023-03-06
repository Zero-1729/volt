import React from 'react';
import {useColorScheme, View, Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, CommonActions} from '@react-navigation/native';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import Dots from '../../assets/svg/kebab-horizontal-24.svg';
import Scan from '../../assets/svg/scan.svg';
import Back from '../../assets/svg/arrow-left-24.svg';

import {PlainButton} from '../../components/button';

const Wallet = () => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    // Get card color from wallet type
    const CardColor = ColorScheme.WalletColors.bech32;

    // Receive Wallet ID and fetch wallet data to display
    // Include functions to change individual wallet settings
    return (
        <SafeAreaView>
            <View style={[tailwind('w-full h-full')]}>
                {/* Top panel */}
                <View
                    style={[
                        tailwind('relative h-48'),
                        {backgroundColor: CardColor},
                    ]}>
                    <View
                        style={[
                            tailwind(
                                'absolute w-full top-4 flex-row justify-between',
                            ),
                        ]}>
                        <PlainButton
                            style={[tailwind('items-center flex-row left-6')]}
                            onPress={() => {
                                navigation.dispatch(CommonActions.goBack());
                            }}>
                            <Back
                                style={tailwind('mr-2')}
                                fill={ColorScheme.SVG.Default}
                            />
                            <Text style={[tailwind('text-white font-bold')]}>
                                Back
                            </Text>
                        </PlainButton>
                        <PlainButton style={[tailwind('right-6')]}>
                            <Dots width={32} fill={'white'} />
                        </PlainButton>
                    </View>

                    <View style={[tailwind('absolute left-6 bottom-6')]}>
                        <Text style={[tailwind('text-sm text-white mb-2')]}>
                            Wallet Name
                        </Text>
                        <Text style={[tailwind('text-2xl text-white')]}>
                            0 Sats
                        </Text>
                    </View>
                </View>

                {/* Send and receive */}
                <View style={[tailwind('justify-evenly flex-row mt-4 mb-4')]}>
                    <View
                        style={[
                            tailwind('rounded p-4 w-32'),
                            {backgroundColor: ColorScheme.Background.Greyed},
                        ]}>
                        <PlainButton>
                            <Text
                                style={[
                                    tailwind('text-sm text-center font-bold'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                Send
                            </Text>
                        </PlainButton>
                    </View>
                    <View
                        style={[
                            tailwind('rounded p-4 w-32'),
                            {backgroundColor: ColorScheme.Background.Greyed},
                        ]}>
                        <PlainButton>
                            <Text
                                style={[
                                    tailwind('text-sm text-center font-bold'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                Receive
                            </Text>
                        </PlainButton>
                    </View>
                    <View
                        style={[
                            tailwind('justify-center rounded px-4'),
                            {backgroundColor: ColorScheme.Background.Greyed},
                        ]}>
                        <PlainButton>
                            <Scan width={32} fill={ColorScheme.SVG.Default} />
                        </PlainButton>
                    </View>
                </View>

                {/* Transactions List */}
                <View />
            </View>
        </SafeAreaView>
    );
};

export default Wallet;
