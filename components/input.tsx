/* eslint-disable react-native/no-inline-styles */
import React from 'react';

import {TextInput, Platform, View} from 'react-native';

import tailwind from 'tailwind-rn';

import DocumentPicker from 'react-native-document-picker';

import {PlainButton} from './button';

import Folder from './../assets/svg/file-directory-fill-24.svg';
import Scan from './../assets/svg/scan.svg';

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
        </View>
    );
};
