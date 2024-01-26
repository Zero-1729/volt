/* eslint-disable react-native/no-inline-styles */
import React, {useState, useContext} from 'react';

import {useColorScheme, Text, View} from 'react-native';

import VText from '../../components/text';

import {CommonActions, useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useTranslation} from 'react-i18next';

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../../constants/Haptic';

import Checkbox from 'react-native-bouncy-checkbox';

import RNFS from 'react-native-fs';

import {AppStorageContext} from '../../class/storageContext';
import {
    descriptorSymbols,
    isSupportedExtKey,
    isExtendedKey,
    getExtendedKeyPrefix,
    isValidExtendedKey,
    isDescriptorPattern,
    validateMnenomic,
} from '../../modules/wallet-utils';
import {extendedKeyInfo} from '../../modules/wallet-defaults';

import {useTailwind} from 'tailwind-rn';

import {PlainButton, LongBottomButton} from '../../components/button';
import {TextMultiInput} from '../../components/input';

import Back from '../../assets/svg/arrow-left-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

import {
    conservativeAlert,
    liberalAlert,
    errorAlert,
} from '../../components/alert';

import {EBackupMaterial, ENet} from '../../types/enums';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AddWalletParamList} from '../../Navigation';

import {capitalizeFirst} from '../../modules/transform';

type Props = NativeStackScreenProps<AddWalletParamList, 'RestoreActions'>;

const ImportAction = ({route}: Props) => {
    const navigation = useNavigation();
    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {t} = useTranslation('wallet');
    const {t: e} = useTranslation('errors');

    const {isAdvancedMode, restoreWallet, defaultToTestnet} =
        useContext(AppStorageContext);

    const [importText, setImportText] = useState('');
    const [network, setNetwork] = useState<ENet>(
        defaultToTestnet ? ENet.Testnet : ENet.Bitcoin,
    );

    const toggleNetwork = () => {
        if (network === ENet.Testnet) {
            setNetwork(ENet.Bitcoin);
        } else {
            setNetwork(ENet.Testnet);
        }
    };

    const handleFolderCallback = async (data: any) => {
        await RNFS.readFile(data.uri, 'utf8')
            .then(res => {
                // We only support single line imports with the import action
                // so we split the data by lines and only take the first line
                // as the import material
                const dataByLines = res.split('\n');
                const importMaterial = dataByLines[0];
                const lines = dataByLines.length;

                if (lines > 1) {
                    conservativeAlert(
                        capitalizeFirst(t('error')),
                        t('import_support_error'),
                        capitalizeFirst(t('cancel')),
                    );
                    return;
                }

                handleImport(importMaterial);
            })
            .catch(err => {
                handleFolderError(err);
            });
    };

    const handleFolderError = (err: Error) => {
        // Handle when any error in the folder action is reported
        conservativeAlert(
            capitalizeFirst(t('error')),
            err.message,
            capitalizeFirst(t('cancel')),
        );

        return;
    };

    const handleFolderCancel = () => {
        // Handle when user cancels folder action
        return;
    };

    const mutateInputText = (text: string) => {
        // TODO: display properly formatted single quotes in input field [ios]
        // This is a 50% hack to ensure the user can use single quotes
        // for wallet paths in descriptors and they'll be interpreted properly
        setImportText(text.replace(/[‘’]/g, "'"));
    };

    const onBlur = () => {
        const valueWithSingleWhitespace = importText.replace(
            /^\s+|\s+$|\s+(?=\s)/g,
            '',
        );

        setImportText(valueWithSingleWhitespace);

        return valueWithSingleWhitespace;
    };

    const handleSuccessRoute = () => {
        // Route to home and display success alert
        // If onboarding, reset to home screen
        if (route.params?.onboarding) {
            navigation.dispatch(
                CommonActions.reset({
                    index: 1,
                    routes: [
                        {
                            name: 'HomeScreen',
                            params: {
                                restoreMeta: {
                                    title: capitalizeFirst(t('restore')),
                                    message: t('wallet_restored_message'),
                                    load: true,
                                },
                            },
                        },
                    ],
                }),
            );
        } else {
            // If not onboarding, navigate back home
            navigation.getParent()?.dispatch(
                CommonActions.navigate('HomeScreen', {
                    restoreMeta: {
                        title: 'Restore',
                        message: 'Wallet restored successfully',
                        load: true,
                    },
                }),
            );
        }
    };

    const handleMnemonic = async (mnemonic: string) => {
        // Validate if a valid mnemonic
        try {
            validateMnenomic(mnemonic);
        } catch {
            // Let user know the mnemonic is valid
            errorAlert(
                capitalizeFirst(t('mnemonic')),
                e('mnemonic_invalid_error'),
                capitalizeFirst(t('cancel')),
            );
            return;
        }

        // Report any other issues separately
        try {
            // Restore wallet using mnemonic
            await restoreWallet(mnemonic, EBackupMaterial.Mnemonic, network);

            // Clear input
            setImportText('');

            handleSuccessRoute();
        } catch (err: any) {
            // Let user know the mnemonic is valid
            errorAlert(
                capitalizeFirst(t('mnemonic')),
                err.message,
                capitalizeFirst(t('cancel')),
            );
        }
    };

    const handleDescriptor = async (descriptor: string) => {
        try {
            if (!isDescriptorPattern(descriptor)) {
                errorAlert(
                    capitalizeFirst(t('descriptor')),
                    e('descriptor_valid_error'),
                    capitalizeFirst(t('cancel')),
                );

                return;
            }

            await restoreWallet(
                descriptor,
                EBackupMaterial.Descriptor,
                network,
            );

            // Clear input
            setImportText('');

            handleSuccessRoute();
        } catch (err: any) {
            errorAlert(
                capitalizeFirst(t('descriptor')),
                err.message,
                capitalizeFirst(t('cancel')),
            );
        }
    };

    const handleExtendedKey = async (extendedKey: string) => {
        try {
            await restoreWallet(
                extendedKey,
                getExtendedKeyPrefix(extendedKey),
                getNetworkIfXkey(extendedKey),
            );

            // Clear input
            setImportText('');

            handleSuccessRoute();
        } catch (err: any) {
            errorAlert(
                capitalizeFirst(t('extended_key')),
                err.message,
                capitalizeFirst(t('cancel')),
            );
        }
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

    const isLooslyDescriptor = (text: string) => {
        const hasDigits = /\d/.test(text);

        // Assume it is a descriptor if it has both
        // numbers or descriptor symbols
        if (
            descriptorSymbols.some((symbol: string) => text.includes(symbol)) &&
            hasDigits
        ) {
            return true;
        }
        return false;
    };

    const getNetworkIfXkey = (text: string) => {
        if (text.length === 0) {
            return network;
        }

        if (isExtendedKey(text) && isSupportedExtKey(text)) {
            return extendedKeyInfo[text[0]].network;
        }

        return network;
    };

    const handleImport = (material: string) => {
        // determine if the import text is one of the following:
        // - 12 - 24 word seed
        // - Wallet Descriptor (e.g. pkh(...))
        // - Xpriv / Xpub

        // Check if mnemonic
        if (isMnemonic(material)) {
            // Handle import of Mnemonic
            handleMnemonic(material);
            return;
        }

        // Check if descriptor
        if (isLooslyDescriptor(material)) {
            // Handle import of descriptor
            handleDescriptor(material);
            return;
        }

        // Check if user provided an xpriv or xpub
        if (isExtendedKey(material)) {
            // Check if ext key is supported
            if (!isSupportedExtKey(material)) {
                // Report unsupported extended keys
                liberalAlert(
                    t('extended_key'),
                    e('unsupported_ext_key_error'),
                    capitalizeFirst(t('cancel')),
                );
                return;
            }

            // Perform a checksum check
            try {
                isValidExtendedKey(material);
            } catch (err: any) {
                // Report invalid ext key
                errorAlert(
                    capitalizeFirst(t('extended_key')),
                    err.message,
                    capitalizeFirst(t('cancel')),
                );
                return;
            }

            // Handle import of support valid extended key
            handleExtendedKey(material);

            return;
        }

        liberalAlert(t('import'), e('import_material_error'), t('try_again'));
    };

    const importInstructions = isAdvancedMode
        ? t('import_advanced_placeholder')
        : t('import_basic_placeholder');

    return (
        <SafeAreaView edges={['bottom', 'right', 'left']}>
            <View
                style={[
                    tailwind('w-full h-full items-center'),
                    {backgroundColor: ColorScheme.Background.Primary},
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
                            {t('back')}
                        </Text>
                    </PlainButton>

                    <VText
                        style={[
                            tailwind('font-medium text-2xl mt-20'),
                            {color: ColorScheme.Text.Default},
                            Font.RobotoText,
                        ]}>
                        {t('restore_wallet_title')}
                    </VText>
                    <VText
                        style={[
                            tailwind('text-sm mt-2 mb-8'),
                            {color: ColorScheme.Text.GrayText},
                        ]}>
                        {t('restore_wallet_description')}
                    </VText>

                    <TextMultiInput
                        placeholder={importInstructions}
                        placeholderTextColor={ColorScheme.Text.GrayedText}
                        onChangeText={mutateInputText}
                        onBlur={onBlur}
                        color={ColorScheme.Text.Default}
                        borderColor={ColorScheme.Text.LightGreyText}
                        showFolder={true}
                        onSuccess={handleFolderCallback}
                        onError={handleFolderError}
                        onCancel={handleFolderCancel}
                    />

                    {/* Wallet Network */}
                    {isMnemonic(importText.trim()) && (
                        <View style={[tailwind('mt-8 flex-row')]}>
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                Testnet
                            </Text>
                            {/* btn */}
                            <Checkbox
                                disabled={isExtendedKey(importText.trim())}
                                fillColor={
                                    ColorScheme.Background.CheckBoxFilled
                                }
                                unfillColor={
                                    ColorScheme.Background.CheckBoxUnfilled
                                }
                                size={18}
                                isChecked={network === ENet.Testnet}
                                iconStyle={{
                                    borderWidth: 1,
                                    borderRadius: 2,
                                }}
                                innerIconStyle={{
                                    borderWidth: 1,
                                    borderColor:
                                        ColorScheme.Background.CheckBoxOutline,
                                    borderRadius: 2,
                                }}
                                style={[tailwind('flex-row absolute -right-4')]}
                                onPress={() => {
                                    RNHapticFeedback.trigger(
                                        'rigid',
                                        RNHapticFeedbackOptions,
                                    );

                                    toggleNetwork();
                                }}
                                disableBuiltInState={true}
                            />
                        </View>
                    )}
                </View>

                <LongBottomButton
                    disabled={importText.trim().length === 0}
                    onPress={() => {
                        handleImport(importText.trim());
                    }}
                    title={t('continue')}
                    textColor={
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
