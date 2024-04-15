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

import Checkbox from 'react-native-bouncy-checkbox';

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../../../constants/Haptic';

import {getMetaFromMnemonic, convertXKey} from '../../../modules/wallet-utils';
import {ENet} from '../../../types/enums';
import {
    createDescriptorFromXprv,
    fromDescriptorPTR,
    getPrivateDescriptors,
} from '../../../modules/descriptors';
import {errorAlert} from '../../../components/alert';

import Clipboard from '@react-native-clipboard/clipboard';

import {capitalizeFirst} from '../../../modules/transform';
import {WalletPaths} from '../../../modules/wallet-defaults';

const MnemonicTool = () => {
    const [resultMessage, setResultMessage] = useState('');
    const [mnemonic, setMnemonic] = useState('');
    const [isTestnet, setIsTestnet] = useState(false);

    const {t, i18n} = useTranslation('settings');
    const {t: e} = useTranslation('errors');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const inputTextRef = useRef<TextInput>(null);

    const [open, setOpen] = useState(false);
    const supported_materials = [
        {label: 'Taproot Private Descriptor', value: 'p2tr_private_descriptor'},
        {label: 'Taproot Public Descriptor', value: 'p2tr_public_descriptor'},
        {label: 'Segwit Private Descriptor', value: 'wpkh_private_descriptor'},
        {label: 'SegWit Public Descriptor', value: 'wpkh_public_descriptor'},
        {label: 'Extended Private Key', value: 'extended_priv_key'},
        {label: 'Extended Public Key', value: 'extended_pub_key'},
    ];
    const [materials, setMaterials] = useState(supported_materials);
    const [material, setMaterial] = useState(supported_materials[0].value);

    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const navigation = useNavigation();

    const setAndClear = (value: any) => {
        setMaterial(value);

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
            convertToMaterial();
        }
    };

    const convertToMaterial = () => {
        let result!: any;
        let network = isTestnet ? ENet.Testnet : ENet.Bitcoin;
        let walletPath = isTestnet
            ? WalletPaths.p2tr.testnet
            : WalletPaths.p2tr.bitcoin;

        // Get mnemonic metas
        const metas = getMetaFromMnemonic(mnemonic, walletPath, network);
        const zprv = convertXKey(metas.xprv, 'zprv');

        try {
            switch (material) {
                case 'p2tr_private_descriptor':
                    let privPDesc = fromDescriptorPTR(mnemonic, network).priv;
                    result = getPrivateDescriptors(privPDesc).external;
                    break;
                case 'p2tr_public_descriptor':
                    result = createDescriptorFromXprv(metas.xprv).external;
                    break;
                case 'wpkh_private_descriptor':
                    let privSDesc = createDescriptorFromXprv(zprv).priv;
                    result = getPrivateDescriptors(privSDesc).external;
                    break;
                case 'wpkh_public_descriptor':
                    result = createDescriptorFromXprv(zprv).external;
                    break;
                case 'extended_priv_key':
                    result = metas.xprv;
                    break;
                case 'extended_pub_key':
                    result = metas.xpub;
                    break;
                default:
                    break;
            }
        } catch (err: any) {
            errorAlert(
                capitalizeFirst(e('error')),
                e(err.message),
                capitalizeFirst(t('cancel')),
            );
            return;
        }

        try {
            setResultMessage(result);
        } catch (err: any) {
            errorAlert(
                t('mnemonic'),
                err.message,
                capitalizeFirst(t('cancel')),
            );
        }
    };

    const updateText = (text: string) => {
        if (text.length === 0) {
            clearText();
        }

        setMnemonic(text.trim());
    };

    const clearText = () => {
        // Clear xpub
        setMnemonic('');

        // Clear result message
        setResultMessage('');
    };

    const onBlur = () => {
        const valueWithSingleWhitespace = mnemonic.replace(
            /^\s+|\s+$|\s+(?=\s)/g,
            '',
        );

        setMnemonic(valueWithSingleWhitespace);

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
                        {t('mnemonic_converter')}
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
                <View style={[tailwind('w-5/6'), {marginTop: 64}]}>
                    <VText
                        style={[
                            tailwind('text-sm'),
                            {color: ColorScheme.Text.GrayedText},
                        ]}>
                        {t('mnemonic_converter_description')}
                    </VText>
                </View>

                {/* Input */}
                <View
                    style={[
                        tailwind('w-5/6 mt-6 border-gray-400 px-2'),
                        {borderWidth: 1, borderRadius: 6},
                    ]}>
                    <TextSingleInput
                        refs={inputTextRef}
                        placeholder={t('mnemonic_converter_placeholder')}
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
                        {t('select_material')}
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
                        value={material}
                        items={materials}
                        setOpen={setOpen}
                        setValue={setAndClear}
                        setItems={setMaterials}
                    />
                </View>

                {/* Network choice */}
                <View
                    style={tailwind(
                        `w-4/5 mt-4 ${
                            langDir === 'right'
                                ? 'flex-row-reverse'
                                : 'flex-row'
                        } items-center`,
                    )}>
                    <VText
                        style={[
                            tailwind('text-sm'),
                            {color: ColorScheme.Text.DescText},
                        ]}>
                        {t('default_testnet')}
                    </VText>
                    <Checkbox
                        fillColor={ColorScheme.Background.CheckBoxFilled}
                        unfillColor={ColorScheme.Background.CheckBoxUnfilled}
                        size={18}
                        isChecked={isTestnet}
                        iconStyle={{
                            borderWidth: 1,
                            borderRadius: 2,
                        }}
                        innerIconStyle={{
                            borderWidth: 1,
                            borderColor: ColorScheme.Background.CheckBoxOutline,
                            borderRadius: 2,
                        }}
                        style={[
                            tailwind(
                                `flex-row absolute ${
                                    langDir === 'right' ? 'right-0' : '-right-4'
                                }`,
                            ),
                        ]}
                        onPress={() => {
                            RNHapticFeedback.trigger(
                                'rigid',
                                RNHapticFeedbackOptions,
                            );

                            setIsTestnet(!isTestnet);
                        }}
                        disableBuiltInState={true}
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
                    disabled={mnemonic.trim().length === 0}
                    textColor={
                        mnemonic.trim().length > 0
                            ? ColorScheme.Text.Alt
                            : ColorScheme.Text.GrayedText
                    }
                    backgroundColor={
                        mnemonic.trim().length > 0
                            ? ColorScheme.Background.Inverted
                            : ColorScheme.Background.Secondary
                    }
                />

                <Toast config={toastConfig as ToastConfig} />
            </View>
        </SafeAreaView>
    );
};

export default MnemonicTool;
