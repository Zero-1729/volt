/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {Text, useColorScheme, View} from 'react-native';

import {CommonActions, useNavigation} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';

import DropDownPicker from 'react-native-dropdown-picker';

import {useTailwind} from 'tailwind-rn';
import Color from '../../../constants/Color';

import {LongBottomButton, PlainButton} from '../../../components/button';
import {TextSingleInput} from '../../../components/input';

import Close from '../../../assets/svg/x-24.svg';
import ArrowUp from '../../../assets/svg/chevron-up-16.svg';
import ArrowDown from '../../../assets/svg/chevron-down-16.svg';
import Tick from '../../../assets/svg/check-16.svg';

import {
    convertXPUB,
    getExtendedKeyPrefix,
    isValidExtendedKey,
} from '../../../modules/wallet-utils';
import {xpubVersions} from '../../../modules/wallet-defaults';
import {errorAlert} from '../../../components/alert';

import Clipboard from '@react-native-clipboard/clipboard';

const Xpub = () => {
    const [resultMessageText, setResulteMessageText] = useState('');
    const [resultMessage, setResultMessage] = useState('');
    const [xpub, setXPUB] = useState('');

    const xpubVersionsSet = [];
    for (const item of xpubVersions) {
        xpubVersionsSet.push({
            value: item,
            label: item,
        });
    }

    const [open, setOpen] = useState(false);
    const [version, setVersion] = useState('xpub');
    const [versions, setVersions] = useState(xpubVersionsSet);

    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const navigation = useNavigation();

    const setAndClear = (value: any) => {
        setVersion(value);

        setResultMessage('');
        setResulteMessageText('');
    };

    const copyXpubToClipboard = () => {
        Clipboard.setString(resultMessage);

        setResulteMessageText('Copied to clipboard!');

        setTimeout(() => {
            setResulteMessageText(resultMessage);
        }, 450);
    };

    const convertXpub = () => {
        // Check if it is indeed an xpub and valid
        if (getExtendedKeyPrefix(xpub) !== 'xpub') {
            errorAlert('Error', 'Please provide an extended public key (XPUB)');
            return;
        }

        if (!isValidExtendedKey(xpub, true)) {
            errorAlert(
                'Error',
                'Please provide a valid extended public key (XPUB)',
            );
            return;
        }

        try {
            const pub = convertXPUB(xpub, version);

            setResultMessage(pub);
            setResulteMessageText(pub);
        } catch (e: any) {
            errorAlert('XPUB', e);
        }
    };

    const updateText = (text: string) => {
        if (text.length === 0) {
            clearText();
        }

        setXPUB(text.trim());
    };

    const clearText = () => {
        // Clear xpub
        setXPUB('');

        // Clear result message
        setResultMessage('');
    };

    const onBlur = () => {
        const valueWithSingleWhitespace = xpub.replace(
            /^\s+|\s+$|\s+(?=\s)/g,
            '',
        );

        setXPUB(valueWithSingleWhitespace);

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
                        Xpub Converter
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
                        This tool allows you to convert extended public keys
                        between different versions.
                    </Text>
                </View>

                {/* Input */}
                <View
                    style={[
                        tailwind('w-5/6 mt-8 border-gray-400 px-2'),
                        {borderWidth: 1, borderRadius: 6},
                    ]}>
                    <TextSingleInput
                        placeholder="Enter an extended public key here..."
                        placeholderTextColor={ColorScheme.Text.GrayedText}
                        isEnabled={true}
                        color={ColorScheme.Text.Default}
                        onChangeText={updateText}
                        onBlur={onBlur}
                    />
                </View>

                {/* Dropdown */}
                <View style={[tailwind('mt-6 w-5/6 self-center z-50')]}>
                    <Text
                        style={[
                            tailwind('text-sm'),
                            {color: ColorScheme.Text.DescText},
                        ]}>
                        Select Version
                    </Text>

                    <DropDownPicker
                        style={[
                            tailwind('rounded-md'),
                            {
                                backgroundColor:
                                    ColorScheme.Background.Secondary,
                                borderColor: ColorScheme.Background.Greyed,
                            },
                        ]}
                        containerStyle={[tailwind('mt-2')]}
                        labelStyle={{color: ColorScheme.Text.Default}}
                        dropDownContainerStyle={{
                            borderColor: ColorScheme.Background.Greyed,
                            backgroundColor: ColorScheme.Background.Greyed,
                        }}
                        listItemLabelStyle={{
                            color: ColorScheme.Text.DescText,
                        }}
                        ArrowUpIconComponent={() => (
                            <ArrowUp fill={ColorScheme.SVG.Default} />
                        )}
                        ArrowDownIconComponent={() => (
                            <ArrowDown fill={ColorScheme.SVG.Default} />
                        )}
                        TickIconComponent={() => (
                            <Tick fill={ColorScheme.SVG.Default} />
                        )}
                        open={open}
                        value={version}
                        items={versions}
                        setOpen={setOpen}
                        setValue={setAndClear}
                        setItems={setVersions}
                    />
                </View>

                {/* Result */}
                {resultMessageText.length > 0 ? (
                    <View style={[tailwind('mt-8 w-5/6')]}>
                        <Text
                            style={[
                                tailwind('text-sm mb-4'),
                                {color: ColorScheme.Text.GrayedText},
                            ]}>
                            Converted extended public key:
                        </Text>

                        <PlainButton
                            style={[
                                tailwind('rounded p-4'),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                },
                            ]}
                            onPress={() => {
                                copyXpubToClipboard();
                            }}>
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {resultMessageText}
                            </Text>
                        </PlainButton>
                    </View>
                ) : (
                    <></>
                )}

                {/* Converter Button */}
                <LongBottomButton
                    style={[tailwind('mt-12 w-full items-center')]}
                    title={'Convert'}
                    onPress={convertXpub}
                    disabled={xpub.trim().length === 0}
                    textColor={
                        xpub.trim().length > 0
                            ? ColorScheme.Text.Alt
                            : ColorScheme.Text.GrayedText
                    }
                    backgroundColor={
                        xpub.trim().length > 0
                            ? ColorScheme.Background.Inverted
                            : ColorScheme.Background.Secondary
                    }
                />
            </View>
        </SafeAreaView>
    );
};

export default Xpub;
