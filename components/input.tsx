/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useContext, useEffect, useState} from 'react';

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

import nativeWindowMetrics from '../constants/NativeWindowMetrics';

import FingerPrint from '../assets/svg/touch-id-24.svg';
import FaceId from '../assets/svg/face-id-24.svg';

import {PlainButton} from './button';

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../constants/Haptic';

import {i18nNumber} from '../modules/transform';

import {
    TextInputProps,
    TextLongInputProps,
    NumpadRequestInputProps,
    PinNumpadInputProps,
    MnemonicInputProps,
} from '../types/props';

import Folder from './../assets/svg/file-directory-fill-24.svg';
import LeftArrow from '../assets/svg/chevron-left-24.svg';
import {AppStorageContext} from '../class/storageContext';

type CapsuleInputProps = {
    word: string;
    index: number;
    state: boolean | null;
    mnemonicRef: React.RefObject<TextInput>;
    languageCode: string;
    onChangeTextCallback: (text: string, index: number) => void;
    calculateWordTrue: (index: number) => void;
};

// Mnemonic TextInput Capsule
const MnemonicInputCapsule = (props: CapsuleInputProps) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const getColumnBackgroundColor = (state: boolean | null) => {
        if (state === null) {
            return ColorScheme.Background.Greyed;
        } else if (state) {
            return ColorScheme.Background.Correct;
        } else {
            return ColorScheme.Background.Wrong;
        }
    };

    const getColumnTextColor = (state: boolean | null) => {
        if (state === null) {
            return ColorScheme.Text.GrayedText;
        }

        return ColorScheme.Text.Default;
    };

    return (
        <View
            style={[
                tailwind('flex-row items-center justify-center w-full'),
                {
                    marginTop: 6,
                    marginBottom: 6,
                },
            ]}>
            <View
                style={[
                    tailwind('items-center justify-center'),
                    {
                        backgroundColor: getColumnBackgroundColor(props.state),
                        borderTopLeftRadius: 32,
                        borderBottomLeftRadius: 32,
                        marginRight: 2,
                        height: 40,
                        width: '25%',
                    },
                ]}>
                <Text
                    style={[
                        tailwind('text-sm font-bold'),
                        {
                            color: getColumnTextColor(props.state),
                        },
                    ]}>
                    {i18nNumber(props.index, props.languageCode)}
                </Text>
            </View>

            <TextInput
                keyboardType={'default'}
                spellCheck={false}
                autoCorrect={false}
                autoCapitalize="none"
                selectTextOnFocus={true}
                value={props.word}
                ref={props.mnemonicRef}
                onBlur={() => {
                    props.calculateWordTrue(props.index);
                }}
                onChangeText={text => {
                    props.onChangeTextCallback(text, props.index);
                }}
                style={{
                    color: ColorScheme.Text.Default,
                    height: 40,
                    width: '75%',
                    borderTopRightRadius: 32,
                    borderBottomRightRadius: 32,
                    backgroundColor: ColorScheme.Background.Greyed,
                    paddingLeft: 8,
                    paddingRight: 8,
                }}
            />
        </View>
    );
};

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
            {Platform.OS === 'ios' && (
                <InputAccessoryView nativeID={InputAccessoryViewID}>
                    <Button
                        title="Done"
                        onPress={() => {
                            Keyboard.dismiss();
                        }}
                    />
                </InputAccessoryView>
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

            {props.showFolder && (
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

        // If already zero and adding to make more zeros, don't allow
        if (text === '0' && char === '0') {
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
                {bottom: nativeWindowMetrics.bottomButtonOffset + 68},
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

export const PinNumpad = (props: PinNumpadInputProps) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {appLanguage} = useContext(AppStorageContext);

    const safelyConcat = (text: string, char: string) => {
        // Can't go beyond 8 decimal places
        if (text.split('.')[1]?.length >= props.pinLimit) {
            return text;
        }

        return text + char;
    };

    const safelyDelete = (text: string) => {
        if (props.pin === text) {
            return '';
        }

        return text.slice(0, -1);
    };

    const vibrateInput = () => {
        RNHapticFeedback.trigger('impactLight', RNHapticFeedbackOptions);
    };

    return (
        <View style={[tailwind('w-full items-center justify-center flex')]}>
            {/* Row 0 */}
            <View style={[tailwind('w-full flex-row mb-12')]}>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        vibrateInput();
                        props.onPinChange(safelyConcat(props.pin, '1'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {i18nNumber(1, appLanguage.code)}
                    </Text>
                </PlainButton>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        vibrateInput();
                        props.onPinChange(safelyConcat(props.pin, '2'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {i18nNumber(2, appLanguage.code)}
                    </Text>
                </PlainButton>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        vibrateInput();
                        props.onPinChange(safelyConcat(props.pin, '3'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {i18nNumber(3, appLanguage.code)}
                    </Text>
                </PlainButton>
            </View>

            {/* Row 1 */}
            <View style={[tailwind('w-full flex-row mb-12')]}>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        vibrateInput();
                        props.onPinChange(safelyConcat(props.pin, '4'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {i18nNumber(4, appLanguage.code)}
                    </Text>
                </PlainButton>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        vibrateInput();
                        props.onPinChange(safelyConcat(props.pin, '5'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {i18nNumber(5, appLanguage.code)}
                    </Text>
                </PlainButton>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        vibrateInput();
                        props.onPinChange(safelyConcat(props.pin, '6'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {i18nNumber(6, appLanguage.code)}
                    </Text>
                </PlainButton>
            </View>

            {/* Row 2 */}
            <View style={[tailwind('w-full flex-row mb-12')]}>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        vibrateInput();
                        props.onPinChange(safelyConcat(props.pin, '7'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {i18nNumber(7, appLanguage.code)}
                    </Text>
                </PlainButton>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        vibrateInput();
                        props.onPinChange(safelyConcat(props.pin, '8'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {i18nNumber(8, appLanguage.code)}
                    </Text>
                </PlainButton>
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        vibrateInput();
                        props.onPinChange(safelyConcat(props.pin, '9'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {i18nNumber(9, appLanguage.code)}
                    </Text>
                </PlainButton>
            </View>

            {/* Row 3 */}
            <View
                style={[
                    tailwind(
                        `w-full flex-row  ${
                            props.showBiometrics
                                ? 'justify-center'
                                : 'justify-end'
                        }`,
                    ),
                ]}>
                {props.showBiometrics && (
                    <PlainButton
                        style={[tailwind('w-1/3 items-center justify-center')]}
                        onPress={props.triggerBiometrics}>
                        {Platform.OS === 'android' ? (
                            <FingerPrint
                                fill={ColorScheme.SVG.Default}
                                width={40}
                                height={40}
                            />
                        ) : (
                            <FaceId
                                fill={ColorScheme.SVG.Default}
                                width={40}
                                height={40}
                            />
                        )}
                    </PlainButton>
                )}
                <PlainButton
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        vibrateInput();
                        props.onPinChange(safelyConcat(props.pin, '0'));
                    }}>
                    <Text
                        style={[
                            tailwind('text-xl font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {i18nNumber(0, appLanguage.code)}
                    </Text>
                </PlainButton>
                <Pressable
                    style={[tailwind('w-1/3 items-center justify-center')]}
                    onPress={() => {
                        vibrateInput();
                        props.onPinChange(safelyDelete(props.pin));
                    }}
                    onLongPress={() => {
                        props.onPinChange('');
                    }}>
                    <LeftArrow fill={ColorScheme.SVG.Default} />
                </Pressable>
            </View>
        </View>
    );
};

export const MnemonicInput = (props: MnemonicInputProps) => {
    const tailwind = useTailwind();
    const {appLanguage} = useContext(AppStorageContext);

    const vibrateInput = () => {
        RNHapticFeedback.trigger('impactLight', RNHapticFeedbackOptions);
    };

    const validMnemonics = props.mnemonicList;
    const [list, setList] = useState<{state: boolean | null; word: string}[]>(
        Array(12)
            .fill(null)
            .map(() => ({state: null, word: ''})),
    );

    const mnemonicRefs: React.RefObject<TextInput>[] = [...Array(12)].map(() =>
        React.createRef<TextInput>(),
    );

    const updateTextItem = (text: string, index: number) => {
        const nextList = [...list];
        nextList[index].word = text;
        setList(nextList);
    };

    const calculateWordTrue = (index: number) => {
        if (list[index].word === '') {
            return;
        }

        const word = list[index].word;

        const nextList = [...list];
        nextList[index].state = word === validMnemonics[index];
        setList(nextList);

        if (word === validMnemonics[index]) {
            vibrateInput();
        }
    };

    useEffect(() => {
        if (list.every(item => item.state === true)) {
            props.onMnemonicCheck(true);
        }
    }, [list[list.length - 1].state]);

    return (
        <View style={[tailwind('w-full items-center justify-center flex-row')]}>
            {/* Col 0 */}
            <View style={[tailwind('w-1/2 flex mr-4')]}>
                {Array(6)
                    .fill('')
                    .map((_, index) => (
                        <PlainButton
                            key={index}
                            style={[tailwind('items-center justify-center')]}
                            onPress={() => {
                                mnemonicRefs[index].current?.focus();
                            }}>
                            <MnemonicInputCapsule
                                word={list[index].word}
                                index={index}
                                state={list[index].state}
                                mnemonicRef={mnemonicRefs[index]}
                                onChangeTextCallback={updateTextItem}
                                calculateWordTrue={calculateWordTrue}
                                languageCode={appLanguage.code}
                            />
                        </PlainButton>
                    ))}
            </View>

            {/* Col 1 */}
            <View style={[tailwind('w-1/2 flex mr-4')]}>
                {Array(6)
                    .fill('')
                    .map((_, index) => (
                        <PlainButton
                            key={index + 6}
                            style={[tailwind('items-center justify-center')]}
                            onPress={() => {
                                mnemonicRefs[index + 6].current?.focus();
                            }}>
                            <MnemonicInputCapsule
                                word={list[index + 6].word}
                                index={index + 6}
                                state={list[index + 6].state}
                                mnemonicRef={mnemonicRefs[index + 6]}
                                onChangeTextCallback={updateTextItem}
                                calculateWordTrue={calculateWordTrue}
                                languageCode={appLanguage.code}
                            />
                        </PlainButton>
                    ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        textAlignVertical: 'top',
    },
});
