import React from 'react';
import {Text, View, useColorScheme} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {CommonActions, useNavigation} from '@react-navigation/native';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';
import Font from '../../constants/Font';

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
                            navigation.dispatch(CommonActions.goBack())
                        }
                        style={[tailwind('absolute z-10 left-6')]}>
                        <Close fill={'white'} />
                    </PlainButton>
                    <Text style={[tailwind('text-sm text-white font-bold')]}>
                        Send Transaction
                    </Text>
                </View>

                <View style={[tailwind('items-center justify-center')]}>
                    <Text
                        style={[
                            tailwind('text-base'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Transaction with {route.params?.wallet?.name} wallet
                        {'\n\n'}
                        Sending to {route.params?.invoiceData?.address}{' '}
                        {sats ? `for ${sats} satoshis` : ''}{' '}
                    </Text>
                </View>

                <LongBottomButton
                    title={'Continue'}
                    textColor={'black'}
                    backgroundColor={'white'}
                />
            </View>
        </SafeAreaView>
    );
};

export default SendView;
