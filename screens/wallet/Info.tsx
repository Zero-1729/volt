/* eslint-disable react-native/no-inline-styles */
import React, {useContext, useRef, useState} from 'react';
import {Text, View, TextInput, useColorScheme, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, CommonActions} from '@react-navigation/native';

import VText from '../../components/text';

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../../constants/Haptic';

import {PlainButton} from '../../components/button';
import {TextSingleInput} from '../../components/input';
import {DeletionAlert, liberalAlert} from '../../components/alert';

import {useTranslation} from 'react-i18next';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import Back from '../../assets/svg/arrow-left-24.svg';
import Right from './../../assets/svg/chevron-right-24.svg';
import Left from './../../assets/svg/chevron-left-24.svg';

import {AppStorageContext} from '../../class/storageContext';
import {
    WalletTypeDetails,
    WALLET_NAME_LENGTH,
} from '../../modules/wallet-defaults';
import {getMiniWallet} from '../../modules/wallet-utils';

import Clipboard from '@react-native-clipboard/clipboard';
import {ENet} from '../../types/enums';
import {capitalizeFirst} from '../../modules/transform';

const Info = () => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const {t, i18n} = useTranslation('wallet');
    const {t: e} = useTranslation('errors');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    // To control input elm
    const nameInput = useRef<TextInput>();

    // Get advanced mode flag, current wallet ID and wallet data
    const {
        loadLock,
        isAdvancedMode,
        currentWalletID,
        getWalletData,
        renameWallet,
        deleteWallet,
    } = useContext(AppStorageContext);

    const walletData = getWalletData(currentWalletID);

    const HeadingBar = {
        borderBottomWidth: 2,
        borderColor: ColorScheme.HeadingBar,
    };

    const walletName = walletData.name;
    const walletPath = walletData.derivationPath;
    const walletType = WalletTypeDetails[walletData.type];
    const walletNetwork = walletData.network;
    const walletTypeName =
        walletType[0] +
        (isAdvancedMode
            ? ` (${walletType[walletData.network === ENet.Testnet ? 2 : 1]})`
            : '');
    const walletFingerprint = walletData.masterFingerprint
        ? walletData.masterFingerprint.toUpperCase()
        : '-';

    const [walletFingerprintText, setWalletFingerprintText] =
        useState(walletFingerprint);
    const [walletPathText, setWalletPathText] = useState(walletPath);

    const CardColor =
        ColorScheme.WalletColors[walletData.type][walletData.network];

    const copyPathToClipboard = () => {
        Clipboard.setString(walletPath);

        setWalletPathText(capitalizeFirst(t('copied_to_clipboard')));

        setTimeout(() => {
            setWalletPathText(walletPath);
        }, 450);
    };

    const copyFingerToClipboard = () => {
        Clipboard.setString(walletFingerprint);

        setWalletFingerprintText(capitalizeFirst(t('copied_to_clipboard')));

        setTimeout(() => {
            setWalletFingerprintText(walletFingerprintText);
        }, 450);
    };

    const [tmpName, setTmpName] = useState<string>('');

    const updateTmpName = (name: string) => {
        // Only update if name is not empty
        if (name.trim().length >= 0) {
            setTmpName(name);
        }
    };

    const showDialog = () => {
        // Avoid deletion while loading
        if (loadLock) {
            liberalAlert(
                capitalizeFirst(t('notice')),
                e('wait_for_wallet_to_load_error'),
                capitalizeFirst(t('cancel')),
                true,
            );
            return;
        }

        // TODO: Check if other wallets exist and in single mode
        // warn user about 'n' other wallets

        DeletionAlert(
            t('delete_wallet'),
            e('wallet_delete_warn'),
            capitalizeFirst(t('delete')),
            capitalizeFirst(t('cancel')),
            handleDeleteWallet,
        );
    };

    const handleDeleteWallet = async () => {
        try {
            // Navigate to HomeScreen
            // Make it clear deleted wallet is no longer in store
            navigation.dispatch(CommonActions.navigate({name: 'HomeScreen'}));

            // Delete wallet from store
            await deleteWallet(currentWalletID);
        } catch (err) {
            console.error('[Wallet Screen] Error deleting wallet: ', err);
        }
    };

    return (
        <SafeAreaView>
            {/* Display Wallet Info, addresses, and other related data / settings */}
            <View
                style={[
                    tailwind('absolute w-full h-16 top-0'),
                    {backgroundColor: CardColor},
                ]}
            />
            <View style={[tailwind('w-full h-full items-center')]}>
                <View
                    style={[
                        styles.backgroundContainer,
                        tailwind('w-full absolute'),
                        {
                            backgroundColor: CardColor,
                        },
                    ]}
                />
                <View
                    style={[
                        tailwind(
                            'flex-row mt-6 w-5/6 justify-center items-center',
                        ),
                    ]}>
                    <PlainButton
                        style={[
                            tailwind(
                                'absolute w-full left-0 items-center flex-row',
                            ),
                        ]}
                        onPress={() => {
                            navigation.dispatch(CommonActions.goBack());
                        }}>
                        <Back fill={'white'} />
                    </PlainButton>
                    {/* Wallet name */}
                    <Text
                        style={[
                            tailwind('w-4/6 text-center font-bold'),
                            {color: 'white'},
                        ]}
                        ellipsizeMode="middle"
                        numberOfLines={1}>
                        {walletData.name}
                    </Text>
                </View>

                {/* Allow user to change wallet name */}
                <View style={[tailwind('w-5/6 mt-12'), {marginBottom: 64}]}>
                    <View>
                        <View style={[tailwind('flex flex-row')]}>
                            <VText
                                style={[
                                    tailwind('text-sm mb-2 mr-1 w-full'),
                                    {color: 'white'},
                                ]}>
                                {t('name')}
                            </VText>
                        </View>
                        <View
                            style={[
                                styles.renameContainer,
                                tailwind('px-4 w-full'),
                            ]}>
                            <TextSingleInput
                                placeholderTextColor={
                                    'rgba(255, 255, 255, 0.6)'
                                }
                                refs={nameInput}
                                maxLength={WALLET_NAME_LENGTH}
                                shavedHeight={true}
                                placeholder={walletName}
                                onChangeText={updateTmpName}
                                onBlur={() => {
                                    // Only set new name if name is not empty
                                    // and name is different from current name
                                    if (
                                        tmpName.trim() !== walletName &&
                                        tmpName.trim().length > 1
                                    ) {
                                        RNHapticFeedback.trigger(
                                            'impactLight',
                                            RNHapticFeedbackOptions,
                                        );
                                        renameWallet(currentWalletID, tmpName);

                                        // Reset tmpName and clear input
                                        setTmpName('');
                                        nameInput.current?.clear();
                                    }
                                }}
                                color={'white'}
                            />

                            {tmpName.length > 0 && (
                                <View
                                    style={[
                                        tailwind(
                                            'absolute right-4 justify-center h-full',
                                        ),
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm opacity-60'),
                                            {color: 'white'},
                                        ]}>
                                        ({tmpName.length}/{WALLET_NAME_LENGTH})
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Wallet Info */}
                {/* Wallet Type Path and Master Fingerprint */}
                {isAdvancedMode && (
                    <View style={[tailwind('w-5/6 mb-6 flex-row')]}>
                        <View style={[tailwind('w-1/2 items-center')]}>
                            <Text
                                style={[
                                    tailwind('text-sm mb-2'),
                                    {color: ColorScheme.Text.GrayedText},
                                ]}>
                                {t('derivation_path')}
                            </Text>

                            <PlainButton onPress={copyPathToClipboard}>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    {walletPathText}
                                </Text>
                            </PlainButton>
                        </View>

                        <View style={[tailwind('w-1/2 items-center')]}>
                            <Text
                                style={[
                                    tailwind('text-sm mb-2'),
                                    {color: ColorScheme.Text.GrayedText},
                                ]}>
                                {t('master_fingerprint')}
                            </Text>

                            <PlainButton onPress={copyFingerToClipboard}>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    {walletFingerprintText}
                                </Text>
                            </PlainButton>
                        </View>
                    </View>
                )}

                {/* Wallet Network and Type */}
                {isAdvancedMode && (
                    <View style={[tailwind('w-5/6 flex-row justify-start')]}>
                        <View style={[tailwind('w-1/2 items-center')]}>
                            <Text
                                style={[
                                    tailwind('text-sm mb-2'),
                                    {color: ColorScheme.Text.GrayedText},
                                ]}>
                                {capitalizeFirst(t('network'))}
                            </Text>

                            <Text
                                style={[
                                    tailwind('text-sm capitalize'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {walletNetwork}
                            </Text>
                        </View>

                        <View style={[tailwind('w-1/2 items-center')]}>
                            <Text
                                style={[
                                    tailwind('text-sm mb-2'),
                                    {color: ColorScheme.Text.GrayedText},
                                ]}>
                                {t('type')}
                            </Text>

                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {walletTypeName}
                            </Text>
                        </View>
                    </View>
                )}

                {/* View Divider */}
                {isAdvancedMode && (
                    <View style={[tailwind('w-full my-8'), HeadingBar]} />
                )}

                {/* Wallet Tools & Info */}
                {/* Backup / Export material - Seed and Descriptor */}
                <PlainButton
                    style={[tailwind('w-5/6 mb-6')]}
                    onPress={() => {
                        navigation.dispatch(
                            CommonActions.navigate({
                                name: 'WalletBackup',
                            }),
                        );
                    }}>
                    <View
                        style={[
                            tailwind(
                                `items-center ${
                                    langDir === 'right'
                                        ? 'flex-row-reverse'
                                        : 'flex-row'
                                } justify-between`,
                            ),
                        ]}>
                        <Text
                            style={[
                                tailwind('text-sm'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {capitalizeFirst(t('backup'))}
                        </Text>

                        <View style={[tailwind('items-center')]}>
                            {langDir === 'right' && (
                                <Left
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
                                />
                            )}
                            {langDir === 'left' && (
                                <Right
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
                                />
                            )}
                        </View>
                    </View>
                </PlainButton>

                {/* Wallet Xpub */}
                <PlainButton
                    style={[tailwind('w-5/6 mb-6')]}
                    onPress={() => {
                        navigation.dispatch(
                            CommonActions.navigate({
                                name: 'WalletXpub',
                            }),
                        );
                    }}>
                    <View
                        style={[
                            tailwind(
                                `items-center ${
                                    langDir === 'right'
                                        ? 'flex-row-reverse'
                                        : 'flex-row'
                                } justify-between`,
                            ),
                        ]}>
                        <Text
                            style={[
                                tailwind('text-sm'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('show_xpub')}
                        </Text>

                        <View style={[tailwind('items-center')]}>
                            {langDir === 'right' && (
                                <Left
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
                                />
                            )}
                            {langDir === 'left' && (
                                <Right
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
                                />
                            )}
                        </View>
                    </View>
                </PlainButton>

                {/* Address Ownership Checker */}
                <PlainButton
                    style={[tailwind('w-5/6')]}
                    onPress={() => {
                        const miniwallet = getMiniWallet(walletData);

                        navigation.dispatch(
                            CommonActions.navigate({
                                name: 'AddressOwnership',
                                params: {
                                    wallet: miniwallet,
                                },
                            }),
                        );
                    }}>
                    <View
                        style={[
                            tailwind(
                                `items-center ${
                                    langDir === 'right'
                                        ? 'flex-row-reverse'
                                        : 'flex-row'
                                } justify-between`,
                            ),
                        ]}>
                        <Text
                            style={[
                                tailwind('text-sm'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('check_address_ownership')}
                        </Text>

                        <View style={[tailwind('items-center')]}>
                            {langDir === 'right' && (
                                <Left
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
                                />
                            )}
                            {langDir === 'left' && (
                                <Right
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
                                />
                            )}
                        </View>
                    </View>
                </PlainButton>

                {/* Delete Wallet btn */}
                <PlainButton
                    onPress={showDialog}
                    style={[
                        tailwind('absolute bottom-6 px-8 py-3 rounded-full'),
                        {
                            backgroundColor: ColorScheme.Background.Alert,
                        },
                    ]}>
                    <Text
                        style={[
                            tailwind('font-bold'),
                            {color: ColorScheme.Text.Alert},
                        ]}>
                        {capitalizeFirst(t('delete'))}
                    </Text>
                </PlainButton>
            </View>
        </SafeAreaView>
    );
};

export default Info;

const styles = StyleSheet.create({
    backgroundContainer: {
        top: 0,
        height: 192,
    },
    renameContainer: {
        borderWidth: 1,
        borderRadius: 4,
        borderColor: 'rgba(0, 0, 0, 0.4)',
    },
});
