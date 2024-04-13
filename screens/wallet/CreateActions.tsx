/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useContext} from 'react';

import {
    useColorScheme,
    Text,
    View,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';

import VText from '../../components/text';

import {StackActions, useNavigation} from '@react-navigation/core';

import screenOffsets from '../../constants/NativeWindowMetrics';

import {SafeAreaView} from 'react-native-safe-area-context';

import DropDownPicker from 'react-native-dropdown-picker';

import {AppStorageContext} from '../../class/storageContext';

import {useTailwind} from 'tailwind-rn';

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../../constants/Haptic';

import {PlainButton, LongBottomButton} from '../../components/button';

import {TextSingleInput} from '../../components/input';

import {useTranslation} from 'react-i18next';

import {WALLET_NAME_LENGTH} from '../../modules/wallet-defaults';

import Checkbox from 'react-native-bouncy-checkbox';

import Back from './../../assets/svg/arrow-left-24.svg';
import ArrowUp from './../../assets/svg/chevron-up-16.svg';
import ArrowDown from './../../assets/svg/chevron-down-16.svg';
import Tick from './../../assets/svg/check-16.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

import {errorAlert} from '../../components/alert';

import {ENet} from '../../types/enums';
import {capitalizeFirst} from '../../modules/transform';

const CreateAction = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {t, i18n} = useTranslation('wallet');
    const {t: e} = useTranslation('errors');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const {addWallet, isAdvancedMode, defaultToTestnet} =
        useContext(AppStorageContext);
    const [newWalletName, setNewWalletName] = useState('');

    const [network, setNetwork] = useState<ENet>(
        defaultToTestnet ? ENet.Testnet : ENet.Bitcoin,
    );
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [account, setAccount] = useState('unified'); // Default to taproot
    const [accounts, setAccounts] = useState([
        {
            value: 'unified',
            label: 'Lightning (BIP86)',
        },
        {
            value: 'p2tr',
            label: 'Taproot (BIP86)',
        },
        {
            value: 'wpkh',
            label: 'Native SegWit (BIP84)',
        },
        {value: 'shp2wpkh', label: 'Segwit Wrapped (BIP49)'},
        {value: 'p2pkh', label: 'Legacy (BIP44)'},
    ]);

    const accountInfo: {[index: string]: string[]} = {
        unified: ['Lightning (bc1p...)', 'Lightning Testnet (tb1p...)'],
        p2tr: ['Taproot (bc1p...)', 'Taproot Testnet (tb1p...)'],
        wpkh: [
            'Native SegWit Bech32 (bc1q...)',
            'Native SegWit Testnet Bech32 (tb1q...)',
        ],
        shp2wpkh: [
            'Segwit Wrapped P2SH (3...)',
            'Segwit Wrapped Testnet P2SH (2...)',
        ],
        p2pkh: ['Legacy P2PKH (1...)', 'Legacy Testnet P2PKH (m...)'],
    };

    const toggleNetwork = () => {
        if (network === ENet.Testnet) {
            setNetwork(ENet.Bitcoin);
        } else {
            setNetwork(ENet.Testnet);
        }
    };

    const updateWalletName = async (walletName: string, type: string) => {
        const cachedName = walletName;

        try {
            // Clear wallet name
            setNewWalletName('');
            setLoading(true);

            // Default wallet type is Segwit p2tr on Testnet
            await addWallet(walletName, type, network);

            // Vibrate to let user know the action was successful
            RNHapticFeedback.trigger('impactLight', RNHapticFeedbackOptions);

            // Clear loading
            setLoading(false);

            // Navigate to mnemonic screen
            navigation.dispatch(
                StackActions.push('Mnemonic', {onboarding: false}),
            );
        } catch (err: any) {
            errorAlert(
                capitalizeFirst(t('alert')),
                e(err.message),
                capitalizeFirst(t('cancel')),
            );

            // Revert to make it obvious to user to try again
            setNewWalletName(cachedName);
            setLoading(false);
        }
    };

    const onBlur = () => {
        const valueWithSingleWhitespace = newWalletName.replace(
            /^\s+|\s+$|\s+(?=\s)/g,
            '',
        );

        setNewWalletName(valueWithSingleWhitespace);

        return valueWithSingleWhitespace;
    };

    return (
        <SafeAreaView
            edges={['bottom', 'right', 'left']}
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
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
                                tailwind('text-sm font-medium'),
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            {t('back')}
                        </Text>
                    </PlainButton>

                    <VText
                        style={[
                            tailwind('font-bold text-2xl mt-20'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {t('create_title')}
                    </VText>

                    <VText
                        style={[
                            tailwind('text-xs mt-2'),
                            {color: ColorScheme.Text.GrayText},
                        ]}>
                        {isAdvancedMode
                            ? accountInfo[account][
                                  network === ENet.Testnet ? 1 : 0
                              ]
                            : `${t('create_wallet_defaults_message')} (${t(
                                  'create_wallet_defaults_message_1',
                              )} '${
                                  network === ENet.Testnet ? 'tb1' : 'bc1'
                              }...')`}
                    </VText>

                    <View
                        style={[
                            styles.inputContainer,
                            tailwind('mt-10 border-gray-400 px-4 relative'),
                        ]}>
                        <TextSingleInput
                            maxLength={WALLET_NAME_LENGTH}
                            placeholder={t('wallet_create_placeholder')}
                            placeholderTextColor={ColorScheme.Text.GrayedText}
                            onChangeText={setNewWalletName}
                            onBlur={onBlur}
                            color={ColorScheme.Text.Default}
                        />
                        {/* Input limit */}
                        {newWalletName.trim().length > 0 && (
                            <View
                                style={[
                                    tailwind(
                                        `absolute justify-center h-full ${
                                            langDir === 'right'
                                                ? 'left-4'
                                                : 'right-4'
                                        }`,
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        {color: ColorScheme.Text.DescText},
                                    ]}>
                                    {newWalletName.length}/{WALLET_NAME_LENGTH}
                                </Text>
                            </View>
                        )}
                    </View>

                    {isAdvancedMode && (
                        <View style={[tailwind('mt-8')]}>
                            <VText
                                style={[
                                    tailwind('text-sm'),
                                    {color: ColorScheme.Text.DescText},
                                ]}>
                                {t('select_account_type')}
                            </VText>

                            {/* Dropdown */}
                            <DropDownPicker
                                style={[
                                    tailwind('rounded-md'),
                                    {
                                        backgroundColor:
                                            ColorScheme.Background.Secondary,
                                        borderColor:
                                            ColorScheme.Background.Greyed,
                                    },
                                ]}
                                containerStyle={[tailwind('mt-2')]}
                                labelStyle={{color: ColorScheme.Text.Default}}
                                dropDownContainerStyle={{
                                    borderColor: ColorScheme.Background.Greyed,
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
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
                                value={account}
                                items={accounts}
                                setOpen={setOpen}
                                setValue={setAccount}
                                setItems={setAccounts}
                            />

                            {/* Wallet Network */}
                            <View style={[tailwind('mt-10 flex-row')]}>
                                <VText
                                    style={[
                                        tailwind('text-sm'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    {t('set_testnet')}
                                </VText>
                                {/* btn */}
                                <Checkbox
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
                                            ColorScheme.Background
                                                .CheckBoxOutline,
                                        borderRadius: 2,
                                    }}
                                    style={[
                                        tailwind('flex-row absolute -right-4'),
                                    ]}
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
                        </View>
                    )}
                </View>

                {loading && (
                    <View
                        style={[
                            tailwind('absolute'),
                            {bottom: screenOffsets.bottomButtonOffset + 72},
                        ]}>
                        <VText
                            style={[
                                tailwind('text-sm mb-4'),
                                {color: ColorScheme.Text.GrayedText},
                            ]}>
                            {t('wallet_generation_text')}
                        </VText>
                        <ActivityIndicator />
                    </View>
                )}

                <LongBottomButton
                    onPress={() => {
                        updateWalletName(newWalletName, account);
                    }}
                    disabled={newWalletName.trim().length === 0}
                    title={t('continue')}
                    textColor={
                        newWalletName.trim().length > 0
                            ? ColorScheme.Text.Alt
                            : ColorScheme.Text.GrayedText
                    }
                    backgroundColor={
                        newWalletName.trim().length > 0
                            ? ColorScheme.Background.Inverted
                            : ColorScheme.Background.Secondary
                    }
                />
            </View>
        </SafeAreaView>
    );
};

export default CreateAction;

const styles = StyleSheet.create({
    inputContainer: {
        borderWidth: 1,
        borderRadius: 6,
    },
});
