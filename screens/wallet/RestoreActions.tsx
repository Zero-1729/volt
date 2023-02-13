/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';

import {useColorScheme, Text, View} from 'react-native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import tailwind from 'tailwind-rn';

import {PlainButton} from '../../components/button';
import {TextMultiInput} from '../../components/input';

import Back from './../../assets/svg/arrow-left-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

const ImportAction = (): JSX.Element => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const [importText, setImportText] = useState('');

    const handleFolderCallback = (data: any) => {
        console.log(data);
    };

    const handleFolderError = (e: Error) => {
        // Handle when any error in the folder action is reported
        console.error(e);
    };

    const handleFolderCancel = (e: Error) => {
        // Handle when user cancels folder action
        console.log(e);
    };

    const onBlur = () => {
        const valueWithSingleWhitespace = importText.replace(
            /^\s+|\s+$|\s+(?=\s)/g,
            '',
        );

        setImportText(valueWithSingleWhitespace);

        return valueWithSingleWhitespace;
    };

    const importInstructions =
        'Enter one of the following:\n\n- 12-24 word seed\n- Xpriv/Zpriv\n- PrivateKey (WIF)';

    return (
        <SafeAreaView>
            <View
                style={[
                    tailwind('w-full h-full items-center'),
                    {backgroundColor: ColorScheme.Background.Primary},
                    Font.RobotoText,
                ]}>
                <View style={[tailwind('w-5/6 mt-4')]}>
                    <PlainButton
                        style={tailwind('items-center flex-row -ml-1')}
                        onPress={() => {
                            navigation.goBack();
                        }}>
                        <Back
                            style={tailwind('mr-2')}
                            fill={ColorScheme.SVG.Default}
                        />
                        <Text
                            style={[
                                tailwind('text-sm font-bold'),
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            Back
                        </Text>
                    </PlainButton>

                    <Text
                        style={[
                            tailwind('font-medium text-2xl mt-20'),
                            {color: ColorScheme.Text.Default},
                            Font.RobotoText,
                        ]}>
                        Restore Wallet
                    </Text>
                    <Text
                        style={[
                            tailwind('text-sm mt-2 mb-8'),
                            {color: ColorScheme.Text.GrayText},
                        ]}>
                        Enter backup material
                    </Text>

                    <TextMultiInput
                        placeholder={importInstructions}
                        placeholderTextColor={ColorScheme.Text.GrayedText}
                        onChangeText={setImportText}
                        onBlur={onBlur}
                        color={ColorScheme.Text.Default}
                        borderColor={ColorScheme.Text.LightGreyText}
                        showFolder={true}
                        showScanIcon={true}
                        onSuccess={handleFolderCallback}
                        onError={handleFolderError}
                        onCancel={handleFolderCancel}
                    />

                    <PlainButton disabled={importText.trim().length === 0}>
                        <View
                            style={[
                                tailwind('mt-8 rounded items-center'),
                                {
                                    backgroundColor:
                                        importText.trim().length > 0
                                            ? ColorScheme.Background.Inverted
                                            : ColorScheme.Background.Secondary,
                                },
                            ]}>
                            <Text
                                style={[
                                    tailwind('px-4 py-4 font-bold'),
                                    {
                                        color:
                                            importText.trim().length > 0
                                                ? ColorScheme.Text.Alt
                                                : ColorScheme.Text.GrayedText,
                                    },
                                ]}>
                                Continue
                            </Text>
                        </View>
                    </PlainButton>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default ImportAction;
