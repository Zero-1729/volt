/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useContext} from 'react';

import {useColorScheme, Text, View} from 'react-native';

import {StackActions, useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import DropDownPicker from 'react-native-dropdown-picker';

import {AppStorageContext} from '../../class/storageContext';

import {useTailwind} from 'tailwind-rn';

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../../constants/Haptic';

import {PlainButton, LongBottomButton} from '../../components/button';

import {TextSingleInput} from '../../components/input';

import Checkbox from 'react-native-bouncy-checkbox';

import Back from './../../assets/svg/arrow-left-24.svg';
import ArrowUp from './../../assets/svg/chevron-up-16.svg';
import ArrowDown from './../../assets/svg/chevron-down-16.svg';
import Tick from './../../assets/svg/check-16.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

import {errorAlert} from '../../components/alert';

import {NetType} from '../../types/wallet';

const CreateAction = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {addWallet, isAdvancedMode, networkState} =
        useContext(AppStorageContext);

    const [newWalletName, setNewWalletName] = useState('');

    const [network, setNetwork] = useState<NetType>('testnet'); // Default to testnet
    const [open, setOpen] = useState(false);
    const [account, setAccount] = useState('bech32'); // Default to segwit
    const [accounts, setAccounts] = useState([
        {
            value: 'bech32',
            label: 'Native SegWit (BIP84)',
        },
        {value: 'p2sh', label: 'Segwit Wrapped (BIP49)'},
        {value: 'legacy', label: 'Legacy (BIP44)'},
    ]);

    const accountInfo: {[index: string]: string} = {
        bech32: 'Native SegWit Bech32 (bc1...)',
        p2sh: 'Segwit Wrapped P2SH (3...)',
        legacy: 'Legacy P2PKH (1...)',
    };

    const toggleNetwork = () => {
        if (network === 'testnet') {
            setNetwork('bitcoin');
        } else {
            setNetwork('testnet');
        }
    };

    const updateWalletName = async (walletName: string, type: string) => {
        try {
            // Perform network check to avoid BDK native code error
            // Must be connected to network to use bdk-rn fns
            if (!networkState?.isConnected) {
                throw new Error(
                    'Internet connection offline, re-connect to create wallet.',
                );
            }

            // Clear wallet name
            setNewWalletName('');

            // Default wallet type is Segwit bech32 on Testnet
            await addWallet(walletName, type, network);

            // Navigate to mnemonic screen
            navigation.dispatch(StackActions.push('Mnemonic'));
        } catch (e: any) {
            errorAlert('Alert', e.message);
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
                                tailwind('text-sm font-medium'),
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            Back
                        </Text>
                    </PlainButton>

                    <Text
                        style={[
                            tailwind('font-bold text-2xl mt-20'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Create New Wallet
                    </Text>

                    <Text
                        style={[
                            tailwind('text-xs mt-2'),
                            {color: ColorScheme.Text.GrayText},
                        ]}>
                        {isAdvancedMode
                            ? accountInfo[account]
                            : "Defaults to SegWit Native (address starts with 'bc1...')"}
                    </Text>

                    <View
                        style={[
                            tailwind('mt-10 border-gray-400 px-4'),
                            {borderWidth: 1, borderRadius: 6},
                        ]}>
                        <TextSingleInput
                            placeholder={'Enter Wallet name'}
                            placeholderTextColor={ColorScheme.Text.GrayedText}
                            onChangeText={setNewWalletName}
                            onBlur={onBlur}
                            color={ColorScheme.Text.Default}
                        />
                    </View>

                    {isAdvancedMode ? (
                        <View style={[tailwind('mt-8')]}>
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    {color: ColorScheme.Text.DescText},
                                ]}>
                                Select Account Type
                            </Text>

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
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    Testnet
                                </Text>
                                {/* btn */}
                                <Checkbox
                                    fillColor={
                                        ColorScheme.Background.CheckBoxFilled
                                    }
                                    unfillColor={
                                        ColorScheme.Background.CheckBoxUnfilled
                                    }
                                    size={18}
                                    isChecked={network === 'testnet'}
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
                    ) : (
                        <></>
                    )}
                </View>

                <LongBottomButton
                    onPress={() => {
                        updateWalletName(newWalletName, account);
                    }}
                    disabled={newWalletName.trim().length === 0}
                    title={'Continue'}
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
