/* eslint-disable react-native/no-inline-styles */
import {StyleSheet, Text, View, useColorScheme} from 'react-native';
import React, {useState} from 'react';

import {
    useNavigation,
    StackActions,
    CommonActions,
} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';
import Color from '../../constants/Color';
import {useTailwind} from 'tailwind-rn';

import {capitalizeFirst} from '../../modules/transform';
import {useTranslation} from 'react-i18next';

import {PlainButton, LongBottomButton} from '../../components/button';

import Close from '../../assets/svg/x-24.svg';
import {TextSingleInput} from '../../components/input';
import VText from '../../components/text';

const SendLN = () => {
    const navigation = useNavigation();
    const ColorScheme = Color(useColorScheme());
    const tailwind = useTailwind();

    const {t} = useTranslation('wallet');

    const [inputText, setInputText] = useState('');
    const [descrtionText, setDescriptionText] = useState('');

    const DESCRIPTION_LENGTH_LIMIT = 32;

    const handleAmount = () => {
        navigation.dispatch(
            CommonActions.navigate('SendAmount', {
                params: {},
            }),
        );
    };

    const isLNAddress = (address: string): boolean => {
        const splitted = address.split('@');

        if (splitted.length !== 2) {
            return false;
        }

        const isNonEmpty = !!splitted[0].trim() && !!splitted[1].trim();

        const mailRegExp = new RegExp(
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        );

        return isNonEmpty && mailRegExp.test(address);
    };

    const isNodeID = (text: string): boolean => {
        return text.length === 66;
    };

    const mutateText = (text: string) => {
        if (inputText.length === 0) {
            clearText();
        }

        setInputText(text);
    };

    const mutateDescription = (text: string) => {
        if (descrtionText.length === 0) {
            clearDesc();
        }

        setDescriptionText(text);
    };

    const clearText = () => {
        setInputText('');
    };

    const clearDesc = () => {
        setDescriptionText('');
    };

    return (
        <SafeAreaView
            edges={['left', 'right', 'bottom']}
            style={[{backgroundColor: ColorScheme.Background.Primary}]}>
            <View style={[tailwind('h-full w-full items-center')]}>
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
                            tailwind('text-base font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Send
                    </Text>
                </View>

                <View
                    style={[
                        styles.mainContainer,
                        tailwind('items-center w-5/6'),
                    ]}>
                    <View style={[tailwind(' w-full')]}>
                        <VText
                            style={[
                                tailwind('font-bold w-full mb-4'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('to')}
                        </VText>

                        <View
                            style={[
                                tailwind('w-full rounded-md px-2'),
                                {
                                    borderColor: ColorScheme.Background.Greyed,
                                    borderWidth: 1,
                                },
                            ]}>
                            <TextSingleInput
                                color={ColorScheme.Text.Default}
                                placeholder={t('manual_placholder')}
                                placeholderTextColor={
                                    ColorScheme.Text.GrayedText
                                }
                                value={inputText}
                                onChangeText={mutateText}
                            />
                        </View>
                    </View>

                    {(isLNAddress(inputText) || isNodeID(inputText)) && (
                        <View style={[tailwind('w-full items-center mt-12')]}>
                            <VText
                                style={[
                                    tailwind('font-bold w-full mb-4'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                Description
                            </VText>

                            <View
                                style={[
                                    tailwind('w-full rounded-md px-2'),
                                    {
                                        borderColor:
                                            ColorScheme.Background.Greyed,
                                        borderWidth: 1,
                                    },
                                ]}>
                                <TextSingleInput
                                    color={ColorScheme.Text.Default}
                                    placeholder={t('description')}
                                    placeholderTextColor={
                                        ColorScheme.Text.GrayedText
                                    }
                                    value={descrtionText}
                                    onChangeText={mutateDescription}
                                    maxLength={DESCRIPTION_LENGTH_LIMIT}
                                />
                                {descrtionText.length > 0 && (
                                    <View
                                        style={[
                                            tailwind(
                                                'absolute right-4 justify-center h-full',
                                            ),
                                        ]}>
                                        <Text
                                            style={[
                                                tailwind('text-sm opacity-60'),
                                                {
                                                    color: ColorScheme.Text
                                                        .DescText,
                                                },
                                            ]}>
                                            ({descrtionText.length}/
                                            {DESCRIPTION_LENGTH_LIMIT})
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                </View>

                <LongBottomButton
                    disabled={!(isLNAddress(inputText) || isNodeID(inputText))}
                    onPress={handleAmount}
                    title={capitalizeFirst(t('continue'))}
                    textColor={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                />
            </View>
        </SafeAreaView>
    );
};

export default SendLN;

const styles = StyleSheet.create({
    mainContainer: {
        marginTop: 128,
    },
});
