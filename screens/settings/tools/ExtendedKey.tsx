/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useRef} from 'react';
import {useColorScheme, View, TextInput} from 'react-native';

import VText from '../../../components/text';

import {CommonActions, useNavigation} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';

import DropDownPicker from 'react-native-dropdown-picker';

import {useTailwind} from 'tailwind-rn';
import Color from '../../../constants/Color';

import {useTranslation} from 'react-i18next';

import {LongBottomButton, PlainButton} from '../../../components/button';
import {TextSingleInput} from '../../../components/input';

import Toast, {ToastConfig} from 'react-native-toast-message';
import {toastConfig} from '../../../components/toast';

import Close from '../../../assets/svg/x-24.svg';
import ArrowUp from '../../../assets/svg/chevron-up-16.svg';
import ArrowDown from '../../../assets/svg/chevron-down-16.svg';
import Tick from '../../../assets/svg/check-16.svg';

import {
    convertXKey,
    getExtendedKeyPrefix,
    isValidExtendedKey,
} from '../../../modules/wallet-utils';
import {supportedExtVersions} from '../../../modules/wallet-defaults';
import {errorAlert} from '../../../components/alert';

import Clipboard from '@react-native-clipboard/clipboard';

import {EBackupMaterial} from '../../../types/enums';
import {capitalizeFirst} from '../../../modules/transform';

const ExtendedKey = () => {
    const [resultMessage, setResultMessage] = useState('');
    const [xkey, setXKey] = useState('');

    const {t, i18n} = useTranslation('settings');
    const {t: e} = useTranslation('errors');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const xKeyVersionsSet = [];
    for (const item of supportedExtVersions) {
        xKeyVersionsSet.push({
            value: item,
            label: `${item}pub / ${item}prv`,
        });
    }

    const inputTextRef = useRef<TextInput>(null);

    const [open, setOpen] = useState(false);
    const [version, setVersion] = useState('x');
    const [versions, setVersions] = useState(xKeyVersionsSet);

    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const navigation = useNavigation();

    const setAndClear = (value: any) => {
        setVersion(value);

        setResultMessage('');
    };

    const copyXpubToClipboard = () => {
        Clipboard.setString(resultMessage);

        Toast.show({
            topOffset: 60,
            type: 'Liberal',
            text1: capitalizeFirst(t('clipboard')),
            text2: capitalizeFirst(t('copied_to_clipboard')),
            visibilityTime: 1000,
            autoHide: true,
            position: 'top',
        });
    };

    const handleButtonPress = () => {
        if (resultMessage.length > 0) {
            clearText();
            inputTextRef.current?.clear();
        } else {
            convertKey();
        }
    };

    const convertKey = () => {
        let extKeyPrefix = '';

        try {
            extKeyPrefix = getExtendedKeyPrefix(xkey);
        } catch (err: any) {
            errorAlert(
                capitalizeFirst(e('error')),
                e(err.message),
                capitalizeFirst(t('cancel')),
            );
            return;
        }

        // Check if it is indeed an xpub and valid
        if (
            extKeyPrefix !== EBackupMaterial.Xpub &&
            extKeyPrefix !== EBackupMaterial.Xprv
        ) {
            errorAlert(
                capitalizeFirst(e('error')),
                e('give_ext_key_error'),
                capitalizeFirst(t('cancel')),
            );
            return;
        }

        if (!isValidExtendedKey(xkey, true)) {
            errorAlert(
                capitalizeFirst(e('error')),
                e('invalid_ext_key_error'),
                capitalizeFirst(t('cancel')),
            );
            return;
        }

        try {
            // quick hack
            // switch to prv/pub
            const conversionVersion = version + extKeyPrefix.slice(1);

            const key = convertXKey(xkey, conversionVersion);

            setResultMessage(key);
        } catch (err: any) {
            errorAlert(t('ext_key'), err.message, capitalizeFirst(t('cancel')));
        }
    };

    const updateText = (text: string) => {
        if (text.length === 0) {
            clearText();
        }

        setXKey(text.trim());
    };

    const clearText = () => {
        // Clear xpub
        setXKey('');

        // Clear result message
        setResultMessage('');
    };

    const onBlur = () => {
        const valueWithSingleWhitespace = xkey.replace(
            /^\s+|\s+$|\s+(?=\s)/g,
            '',
        );

        setXKey(valueWithSingleWhitespace);

        return valueWithSingleWhitespace;
    };

    return (
        <SafeAreaView edges={['bottom', 'right', 'left']}>
            <View style={[tailwind('w-full h-full items-center')]}>
                <View
                    style={[
                        tailwind(
                            `${
                                langDir === 'right'
                                    ? 'flex-row-reverse'
                                    : 'flex-row'
                            } items-center justify-center relative mt-6 w-5/6`,
                        ),
                    ]}>
                    <VText
                        style={[
                            tailwind('text-lg font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {t('ext_key_converter')}
                    </VText>

                    <PlainButton
                        style={[tailwind('absolute right-0')]}
                        onPress={() => {
                            navigation.dispatch(CommonActions.goBack());
                        }}>
                        <Close fill={ColorScheme.SVG.Default} />
                    </PlainButton>
                </View>

                {/* Content */}
                <View style={tailwind('mt-20 w-5/6')}>
                    <VText
                        style={[
                            tailwind('text-sm'),
                            {color: ColorScheme.Text.GrayedText},
                        ]}>
                        {t('ext_key_converter_description')}
                    </VText>
                </View>

                {/* Input */}
                <View
                    style={[
                        tailwind('w-5/6 mt-8 border-gray-400 px-2'),
                        {borderWidth: 1, borderRadius: 6},
                    ]}>
                    <TextSingleInput
                        refs={inputTextRef}
                        placeholder={t('ext_key_converter_placeholder')}
                        placeholderTextColor={ColorScheme.Text.GrayedText}
                        isEnabled={true}
                        color={ColorScheme.Text.Default}
                        onChangeText={updateText}
                        onBlur={onBlur}
                    />
                </View>

                {/* Dropdown */}
                <View style={[tailwind('mt-6 w-5/6 self-center z-50')]}>
                    <VText
                        style={[
                            tailwind('text-sm'),
                            {color: ColorScheme.Text.DescText},
                        ]}>
                        {t('select_version')}
                    </VText>

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
                {resultMessage.length > 0 && (
                    <View style={[tailwind('mt-8 w-5/6')]}>
                        <VText
                            style={[
                                tailwind('text-sm mb-4'),
                                {color: ColorScheme.Text.GrayedText},
                            ]}>
                            {t('converted_xpub_text')}
                        </VText>

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
                            <VText
                                style={[
                                    tailwind('text-sm'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {resultMessage}
                            </VText>
                        </PlainButton>
                    </View>
                )}

                {/* Converter Button */}
                <LongBottomButton
                    style={[tailwind('mt-12 w-full items-center')]}
                    title={`${
                        resultMessage
                            ? capitalizeFirst(t('clear'))
                            : capitalizeFirst(t('convert'))
                    }`}
                    onPress={handleButtonPress}
                    disabled={xkey.trim().length === 0}
                    textColor={
                        xkey.trim().length > 0
                            ? ColorScheme.Text.Alt
                            : ColorScheme.Text.GrayedText
                    }
                    backgroundColor={
                        xkey.trim().length > 0
                            ? ColorScheme.Background.Inverted
                            : ColorScheme.Background.Secondary
                    }
                />

                <Toast config={toastConfig as ToastConfig} />
            </View>
        </SafeAreaView>
    );
};

export default ExtendedKey;
