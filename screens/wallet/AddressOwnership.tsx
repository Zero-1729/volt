/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {Text, useColorScheme, View} from 'react-native';

import {CommonActions, useNavigation} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';
import Color from '../../constants/Color';

import {LongBottomButton, PlainButton} from '../../components/button';
import {TextSingleInput} from '../../components/input';

import Close from '../../assets/svg/x-circle-fill-24.svg';

const AddressOwnership = () => {
    const [resultMessage, setResultMessage] = useState('');
    const [address, setAddress] = useState('');

    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const navigation = useNavigation();

    const checkAddressOwnership = () => {
        const isOwnedByYou = false;

        // TODO: Check if address is owned by this wallet

        if (isOwnedByYou) {
            setResultMessage('Address is owned by this wallet');
        } else {
            setResultMessage('Address is not owned by this wallet');
        }
    };

    const updateText = (text: string) => {
        if (text.length === 0) {
            clearText();
        }

        setAddress(text);
    };

    const clearText = () => {
        // Clear address
        setAddress('');

        // Clear result message
        setResultMessage('');
    };

    const onBlur = () => {
        const valueWithSingleWhitespace = address.replace(
            /^\s+|\s+$|\s+(?=\s)/g,
            '',
        );

        setAddress(valueWithSingleWhitespace);

        return valueWithSingleWhitespace;
    };

    return (
        <SafeAreaView edges={['bottom', 'right', 'left']}>
            <View style={[tailwind('w-full h-full items-center')]}>
                <View
                    style={[
                        tailwind(
                            'flex-row items-center justify-center relative mt-6 w-5/6',
                        ),
                    ]}>
                    <Text
                        style={[
                            tailwind('text-lg font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Address Ownership
                    </Text>

                    <PlainButton
                        style={[tailwind('absolute right-0 top-0')]}
                        onPress={() => {
                            navigation.dispatch(CommonActions.goBack());
                        }}>
                        <Close width={32} fill={ColorScheme.SVG.Default} />
                    </PlainButton>
                </View>

                {/* Content */}
                <View style={tailwind('mt-20 w-5/6')}>
                    <Text
                        style={[
                            tailwind('text-sm text-justify'),
                            {color: ColorScheme.Text.GrayedText},
                        ]}>
                        <Text
                            style={[
                                tailwind('font-bold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            INFO:
                        </Text>{' '}
                        This tool allows you to check whether an address is
                        owned by you or not. This is useful when you are not
                        sure whether you have imported a private key or a
                        watch-only address.
                    </Text>
                </View>

                {/* Input */}
                <View
                    style={[
                        tailwind('mt-10 w-5/6 border-gray-400 px-2'),
                        {borderWidth: 1, borderRadius: 6},
                    ]}>
                    <TextSingleInput
                        placeholder="Enter an address here..."
                        placeholderTextColor={ColorScheme.Text.GrayedText}
                        isEnabled={true}
                        color={ColorScheme.Text.Default}
                        onChangeText={updateText}
                        onBlur={onBlur}
                    />
                </View>

                {/* Result */}
                <View style={[tailwind('mt-8')]}>
                    <Text
                        style={[
                            tailwind('text-base'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {resultMessage}
                    </Text>
                </View>

                {/* Checker Button */}
                <LongBottomButton
                    style={[tailwind('mt-12 w-full items-center')]}
                    title={'Check Address'}
                    onPress={checkAddressOwnership}
                    textColor={
                        address.trim().length > 0
                            ? ColorScheme.Text.Alt
                            : ColorScheme.Text.GrayedText
                    }
                    backgroundColor={
                        address.trim().length > 0
                            ? ColorScheme.Background.Inverted
                            : ColorScheme.Background.Secondary
                    }
                />
            </View>
        </SafeAreaView>
    );
};

export default AddressOwnership;
