import React from 'react';
import {Text, View, useColorScheme} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation, StackActions} from '@react-navigation/native';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import {PlainButton, LongBottomButton} from '../../components/button';

import Close from '../../assets/svg/x-24.svg';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

type Props = NativeStackScreenProps<WalletParamList, 'Send'>;

const SendView = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const sats = route.params?.invoiceData?.options?.amount;

    const amt =
        sats === route.params.wallet.balance.toString()
            ? 'max'
            : sats + ' sats';

    return (
        <SafeAreaView edges={['bottom', 'left', 'right']}>
            <View
                style={[tailwind('w-full h-full items-center justify-center')]}>
                <View
                    style={[
                        tailwind(
                            'absolute top-6 w-full flex-row items-center justify-center',
                        ),
                    ]}>
                    <PlainButton
                        onPress={() =>
                            navigation.dispatch(StackActions.popToTop())
                        }
                        style={[tailwind('absolute z-10 left-6')]}>
                        <Close fill={ColorScheme.SVG.Default} />
                    </PlainButton>
                    <Text
                        style={[
                            tailwind('text-sm font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Send Transaction
                    </Text>
                </View>

                <View style={[tailwind('items-center justify-center w-full')]}>
                    <Text
                        style={[
                            tailwind('text-base text-center w-4/5'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Transaction with {`'${route.params?.wallet?.name}'`}{' '}
                        wallet
                        {'\n\n'}
                        Sending {sats ? `'${amt}'` : ''} to address:{' '}
                        {route.params?.invoiceData?.address}{' '}
                    </Text>
                </View>

                <LongBottomButton
                    title={'Continue'}
                    textColor={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                />
            </View>
        </SafeAreaView>
    );
};

export default SendView;
