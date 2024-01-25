/* eslint-disable react-native/no-inline-styles */
import React from 'react';

import {
    Text,
    TextInput,
    Keyboard,
    Platform,
    View,
    InputAccessoryView,
    Button,
    Pressable,
    useColorScheme,
    StyleSheet,
} from 'react-native';

import {useTailwind} from 'tailwind-rn';

import {useTranslation} from 'react-i18next';

import DocumentPicker from 'react-native-document-picker';

import Color from '../constants/Color';

import bottomOffset from '../constants/NativeWindowMetrics';

import {PlainButton} from './button';

import {
    TextInputProps,
    TextLongInputProps,
    NumpadRequestInputProps,
} from '../types/props';

import Folder from './../assets/svg/file-directory-fill-24.svg';
import LeftArrow from '../assets/svg/chevron-left-24.svg';

export const TextSingleInput = (props: TextInputProps) => {
    const tailwind = useTailwind();

    const {i18n} = useTranslation();
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    return (
        <TextInput
            underlineColorAndroid="transparent"
            keyboardType={
                Platform.OS === 'android' ? 'visible-password' : 'default'
            }
            maxLength={props.maxLength}
            spellCheck={false}
            autoCorrect={false}
            autoCapitalize="none"
            selectTextOnFocus={true}
            value={props.value}
            ref={props.refs}
            {...props}
            style={[
                tailwind(
                    `${props.shavedHeight ? 'py-3' : 'py-4'} px-2 text-xs`,
                ),
                {textAlign: props.noTrans ? 'auto' : langDir},
            ]}
        />
    );
};

export const TextMultiInput = (props: TextLongInputProps) => {
    const tailwind = useTailwind();

    const InputAccessoryViewID = 'notsoUniqueID';

    return (
        <View
            style={[
                tailwind('rounded pb-11 px-4 h-44'),
                {
                    borderWidth: 2,
                    borderColor: props.borderColor
                        ? props.borderColor
                        : 'transparent',
                },
            ]}>
            {Platform.OS === 'ios' ? (
                <InputAccessoryView nativeID={InputAccessoryViewID}>
                    <Button
                        title="Done"
                        onPress={() => {
                            Keyboard.dismiss();
                        }}
                    />
                </InputAccessoryView>
            ) : (
                <></>
            )}

            <TextInput
                multiline
                underlineColorAndroid="transparent"
                keyboardType={'default'}
                spellCheck={false}
                autoCorrect={false}
                autoCapitalize="none"
                selectTextOnFocus={false}
                onChangeText={props.onChange}
                enablesReturnKeyAutomatically={true}
                inputAccessoryViewID={InputAccessoryViewID}
                {...props}
                style={[styles.inputContainer, tailwind('text-xs pt-4')]}
            />

            {props.showFolder ? (
                <View style={[tailwind('absolute right-4 bottom-3')]}>
                    <PlainButton
                        onPress={() => {
                            DocumentPicker.pick({
                                type: [
                                    DocumentPicker.types.allFiles,
                                    DocumentPicker.types.pdf,
                                    DocumentPicker.types.plainText,
                                ],
                            })
                                .then(data => {
                                    props.onSuccess(data);
                                })
                                .catch(e => {
                                    if (DocumentPicker.isCancel(e)) {
                                        props.onCancel(e);
                                    } else {
                                        props.onError(e);
                                    }
                                });
                        }}>
                        <Folder
                            width={22}
                            fill={props.showFolder ? 'gray' : props.folderColor}
                        />
                    </PlainButton>
                </View>
            ) : (
                <></>
            )}
        </View>
    );
};

export const AmountNumpad = (props: NumpadRequestInputProps) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const addDecimalPoint = (text: string) => {
        // Do not allow decimal point to be added if amount in sats
        if (props.isSats) {
            return text;
        }

        // Do not allow decimal point to be added if it already exists
        if (text.includes('.')) {
            return text;
        }

        return text + '.';
    };

    const safelyConcat = (text: string, char: string) => {
        // Can't go beyond 8 decimal places
        if (text.split('.')[1]?.length >= 8) {
            return text;
        }

        return text + char;
    };

    const safelyDelete = (text: string) => {
        if (props.maxAmount === text) {
            return '';
        }

        return text.slice(0, -1);
    };

    return (
        <View
            style={[
                tailwind('absolute w-full items-center justify-center flex'),
                {bottom: bottomOffset.bottomButtonOffset + 68},
            ]}>
            {/* Row 0 */}
            <View style={[tailwind('w-full flex-row mb-6')]}>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyConcat(props.amount, '1'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        1
                    </Text>
                </PlainButton>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyConcat(props.amount, '2'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        2
                    </Text>
                </PlainButton>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyConcat(props.amount, '3'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        3
                    </Text>
                </PlainButton>
            </View>

            {/* Row 1 */}
            <View style={[tailwind('w-full flex-row mb-6')]}>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyConcat(props.amount, '4'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        4
                    </Text>
                </PlainButton>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyConcat(props.amount, '5'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        5
                    </Text>
                </PlainButton>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyConcat(props.amount, '6'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        6
                    </Text>
                </PlainButton>
            </View>

            {/* Row 2 */}
            <View style={[tailwind('w-full flex-row mb-6')]}>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyConcat(props.amount, '7'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        7
                    </Text>
                </PlainButton>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyConcat(props.amount, '8'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        8
                    </Text>
                </PlainButton>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyConcat(props.amount, '9'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        9
                    </Text>
                </PlainButton>
            </View>

            {/* Row 3 */}
            <View style={[tailwind('w-full flex-row')]}>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(addDecimalPoint(props.amount));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        .
                    </Text>
                </PlainButton>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyConcat(props.amount, '0'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        0
                    </Text>
                </PlainButton>
                <Pressable
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        props.onAmountChange(safelyDelete(props.amount));
                    }}
                    onLongPress={() => {
                        props.onAmountChange('');
                    }}>
                    <LeftArrow fill={ColorScheme.SVG.Default} />
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        textAlignVertical: 'top',
    },
});
