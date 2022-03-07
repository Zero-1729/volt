/* eslint-disable react-native/no-inline-styles */
import React from 'react';

import {
    TextInput,
    Platform,
    View,
    Text,
    Switch,
    useColorScheme,
} from 'react-native';

import tailwind from 'tailwind-rn';

import DocumentPicker from 'react-native-document-picker';

import {PlainButton} from './button';

import Folder from './../assets/svg/file-directory-fill-24.svg';
import Scan from './../assets/svg/scan.svg';
import Font from '../constants/Font';

import Color from '../constants/Color';

export const TextSingleInput = props => {
    return (
        <TextInput
            underlineColorAndroid="transparent"
            keyboardType={
                Platform.OS === 'android' ? 'visible-password' : 'default'
            }
            spellCheck={false}
            autoCorrect={false}
            autoCapitalize="none"
            selectTextOnFocus={true}
            {...props}
            style={[tailwind('py-4 px-2 rounded text-xs')]}
        />
    );
};

export const TextMultiInput = props => {
    const ColorScheme = Color(useColorScheme());

    return (
        <View
            style={[
                tailwind('rounded pt-6 pb-10 px-8 h-52'),
                {
                    borderWidth: 2,
                    borderColor: props.borderColor
                        ? props.borderColor
                        : 'transparent',
                },
            ]}>
            <TextInput
                multiline
                underlineColorAndroid="transparent"
                keyboardType={
                    Platform.OS === 'android' ? 'visible-password' : 'default'
                }
                spellCheck={false}
                autoCorrect={false}
                autoCapitalize="none"
                selectTextOnFocus={false}
                {...props}
                style={[
                    tailwind('text-xs'),
                    {
                        textAlignVertical: 'top',
                    },
                ]}
            />

            {props.showScanIcon ? (
                <View
                    style={[
                        tailwind(
                            `absolute ${
                                props.showFolder ? 'right-12' : 'right-4'
                            } bottom-4`,
                        ),
                    ]}>
                    <PlainButton onPress={() => {}}>
                        <Scan
                            width={22}
                            fill={props.showFolder ? 'gray' : props.folderColor}
                        />
                    </PlainButton>
                </View>
            ) : (
                <></>
            )}

            {props.showFolder ? (
                <View style={[tailwind('absolute right-4 bottom-4')]}>
                    <PlainButton
                        onPress={() => {
                            DocumentPicker.pickSingle({
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

            {props.showTestnetToggle ? (
                <View
                    style={[
                        tailwind(
                            'left-4 bottom-3 absolute items-center flex-row',
                        ),
                    ]}>
                    <Switch
                        style={[
                            tailwind('-ml-2 relative'),
                            {transform: [{scaleX: 0.6}, {scaleY: 0.6}]},
                        ]}
                        trackColor={{false: '#767577', true: '#2771f0'}}
                        thumbColor={props.isEnabled ? '#ffffff' : '#8e8e8e'}
                        value={props.isEnabled}
                        onValueChange={props.toggleSwitch}
                    />
                    <Text
                        style={[
                            tailwind('text-white text-sm'),
                            {
                                fontWeight: props.isEnabled ? 'bold' : 'normal',
                                opacity: props.isEnabled ? 0.8 : 0.2,
                                color: ColorScheme.Text.Default,
                            },
                            Font.RobotoText,
                        ]}>
                        Testnet
                    </Text>
                </View>
            ) : (
                <></>
            )}
        </View>
    );
};
