/* eslint-disable react-native/no-inline-styles */
import React, {useState, useContext} from 'react';

import {useColorScheme, Text, View} from 'react-native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import {AppStorageContext} from '../../class/storageContext';
import {validateMnenomic} from '../../modules/bip39';
import {descriptorSymbols} from '../../class/wallet/base';

import {useTailwind} from 'tailwind-rn';

import {PlainButton, LongBottomButton} from '../../components/button';
import {TextMultiInput} from '../../components/input';

import Back from '../../assets/svg/arrow-left-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

import {liberalAlert, errorAlert} from '../../components/alert';

const ImportAction = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const [importText, setImportText] = useState('');

    const {isAdvancedMode} = useContext(AppStorageContext);

    const handleFolderCallback = (data: any) => {
        console.info(`[Success] Document Picker: ${data.uri}`);
    };

    const handleFolderError = (e: Error) => {
        // Handle when any error in the folder action is reported
        console.error(`[Error] Document Picker: ${e.message}`);
    };

    const handleFolderCancel = (e: Error) => {
        // Handle when user cancels folder action
        console.warn(`[Warn] Document Picker: ${e.message}`);
    };

    const onBlur = () => {
        const valueWithSingleWhitespace = importText.replace(
            /^\s+|\s+$|\s+(?=\s)/g,
            '',
        );

        setImportText(valueWithSingleWhitespace);

        return valueWithSingleWhitespace;
    };

    const handleMnemonic = (mnemonic: string) => {
        // Validate if a valid mnemonic
        try {
            validateMnenomic(mnemonic);

            // TODO: call the wallet creation function
        } catch (e: any) {
            // Let user know the mnemonic is valid
            errorAlert(e.message, 'Invalid mnemonic');
        }
    };

    const handleDescriptor = (descriptor: string) => {
        // TODO: perform descriptor validity check
    };

    const handleExtendedKey = (extendedKey: string) => {
        // TODO: perform checksum check here
    };

    const isMnemonic = (text: string) => {
        // We assume it is a mnemonic if it meets the following:
        // (1) it has more than one word separated by a space
        // (2) it has 12 or 24 words
        const textWordLength = text.split(' ').length;
        const isSingleWord = textWordLength === 1;
        const isMnemonicLength = textWordLength === 12 || textWordLength === 24;

        if (!isSingleWord && isMnemonicLength) {
            return true;
        }
    };

    const isDescriptor = (text: string) => {
        const hasDigits = /\d/.test(text);

        // Assume it is a descriptor if it has both
        // numbers or descriptor symbols
        // TODO: implement a stricter pattern check
        if (
            descriptorSymbols.some(symbol => text.includes(symbol)) &&
            hasDigits
        ) {
            return true;
        }
        return false;
    };

    const isExtendedKey = (text: string) => {
        const extendedPrivs = ['xprv', 'yprv', 'tprv', 'zprv', 'vprv'];
        const extendedPubs = ['xpub', 'ypub', 'tpub', 'zpub', 'vpub'];

        const prefix = text.substring(0, 4);

        // Preliminary length check
        if (text.length !== 111) {
            return false;
        }

        // Check if prefix is valid xpriv or xpub
        // NOTE: We mean xpub and xpriv in the general BIP32 sense,
        // where tprv, yprv, zprv, vprv, are all considered xprvs
        // and similarly, tpub, ypub, zpub, vpub are all considered xpubs
        // TODO: perform stricter check
        if (extendedPrivs.includes(prefix) || extendedPubs.includes(prefix)) {
            return true;
        }

        return false;
    };

    const handleImport = () => {
        // determine if the import text is one of the following:
        // - 12 - 24 word seed
        // - Wallet Descriptor (e.g. pkh(...))
        // - Xpriv / Xpub

        // Check if mnemonic
        if (isMnemonic(importText)) {
            // Handle import of Mnemonic
            handleMnemonic(importText);
            return;
        }

        // Check if descriptor
        if (isDescriptor(importText)) {
            // Handle import of descriptor
            errorAlert('Descriptor', 'Descriptor import not yet supported');

            handleDescriptor(importText);
            return;
        }

        // Check if user provided an xpriv or xpub
        if (isExtendedKey(importText)) {
            // Handle import of extended key
            errorAlert(
                'Extended Key',
                'Extended private & public key import not yet supported',
            );

            handleExtendedKey(importText);
            return;
        }

        liberalAlert('Import', 'Cannot import material', 'Try Again');
    };

    const importInstructions = isAdvancedMode
        ? 'Enter one of the following:\n\n- 12 - 24 word seed\n- Xpriv/Zpriv\n- Wallet Descriptor (e.g. pkh(...))'
        : 'Enter your 12 - 24 word seed';

    return (
        <SafeAreaView edges={['bottom', 'right', 'left']}>
            <View
                style={[
                    tailwind('w-full h-full items-center'),
                    {backgroundColor: ColorScheme.Background.Primary},
                    Font.RobotoText,
                ]}>
                <View style={[tailwind('w-5/6 mt-8')]}>
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
                </View>
                <LongBottomButton
                    onPress={handleImport}
                    title="Continue"
                    color={
                        importText.trim().length > 0
                            ? ColorScheme.Text.Alt
                            : ColorScheme.Text.GrayedText
                    }
                    backgroundColor={
                        importText.trim().length > 0
                            ? ColorScheme.Background.Inverted
                            : ColorScheme.Background.Secondary
                    }
                />
            </View>
        </SafeAreaView>
    );
};

export default ImportAction;
