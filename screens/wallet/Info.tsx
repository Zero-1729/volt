/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useContext, useRef, useState} from 'react';
import {Text, View, TextInput, useColorScheme, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, CommonActions} from '@react-navigation/native';

import VText from '../../components/text';

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../../constants/Haptic';

import {PlainButton} from '../../components/button';
import {TextSingleInput} from '../../components/input';
import {DeletionAlert} from '../../components/alert';

import {useTranslation} from 'react-i18next';

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

import {LiberalToast} from '../../components/toast';

import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import PINPass from '../../components/pinpass';

import {disconnect, nodeInfo} from '@breeztech/react-native-breez-sdk';

import {biometricAuth} from '../../modules/shared';

const Info = () => {
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
        isBiometricsActive,
        setPINAttempts,
        setPINActive,
        setBiometricsActive,
        setLoadLock,
        setOnboarding,
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
    const [routeName, setRouteName] = useState('');

    const bottomPINPassRef = useRef<BottomSheetModal>(null);
    const [pinIdx, setPINIdx] = useState(-1);

    const togglePINPassModal = useCallback(() => {
        if (pinIdx !== 1) {
            bottomPINPassRef.current?.present();
        } else {
            bottomPINPassRef.current?.close();
        }
    }, [pinIdx]);

    const handlePINSuccess = async () => {
        if (routeName === 'WalletBackup') {
            routeToBackup();
        } else if (routeName === 'WalletXpub') {
            routeToXPub();
        }
        bottomPINPassRef.current?.close();
    };

    const routeToBackup = () => {
        navigation.dispatch(
            CommonActions.navigate({
                name: 'WalletBackup',
            }),
        );
    };

    const routeToXPub = () => {
        navigation.dispatch(
            CommonActions.navigate({
                name: 'WalletXpub',
            }),
        );
    };

    const routeWithBioPIN = useCallback(
        (routeCallback: () => void) => {
            if (isBiometricsActive) {
                biometricAuth(
                    success => {
                        if (success) {
                            routeCallback();
                        }
                    },
                    // prompt response callback
                    () => {
                        togglePINPassModal();
                    },
                    // prompt error callback
                    error => {
                        LiberalToast(t('Biometrics'), error.message, {
                            duration: 3000,
                        });
                    },
                );

                return;
            }

            // IF no biometrics, just call on PIN modal
            togglePINPassModal();
        },
        [isBiometricsActive, t, togglePINPassModal],
    );

    const handleXPubRoute = () => {
        setRouteName('WalletXpub');
        routeWithBioPIN(routeToXPub);
    };

    const handleBackupRoute = () => {
        setRouteName('WalletBackup');
        routeWithBioPIN(routeToBackup);
    };

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
            LiberalToast(capitalizeFirst(t('notice')), t('wait_for_wallet_to_load_error'), {
                duration: 3000,
            });
            return;
        }

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
            if (walletData.type === 'unified') {
                try {
                    const id = await nodeInfo();

                    if (id) {
                        // Disconnect from Breez SDK
                        await disconnect();
                    }
                } catch (err: any) {}
            }

            // Delete wallet from store
            deleteWallet(currentWalletID);

            // clear info
            setPINAttempts(0);
            setPINActive(false);
            setBiometricsActive(false);
            setLoadLock(false);
            setOnboarding(true);

            // Navigate to HomeScreen
            // Make it clear deleted wallet is no longer in store
            navigation.dispatch(CommonActions.navigate({name: 'HomeScreen'}));
        } catch (err) {
            console.error('[Wallet Screen] Error deleting wallet: ', err);
        }
    };

    return (
        <SafeAreaView
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            {/* Display Wallet Info, addresses, and other related data / settings */}
            <View
                className="absolute w-full h-16 top-0"
                style={{backgroundColor: CardColor}}
            />
            <BottomSheetModalProvider>
                <View className="w-full h-full items-center">
                    <View
                        className="w-full absolute"
                        style={[
                            styles.backgroundContainer,
                            {
                                backgroundColor: CardColor,
                            },
                        ]}
                    />
                    <View
                        className="flex-row mt-6 w-5/6 justify-center items-center">
                        <PlainButton
                            className="absolute w-full left-0 items-center flex-row"
                            onPress={() => {
                                navigation.dispatch(CommonActions.goBack());
                            }}>
                            <Back fill={'white'} />
                        </PlainButton>
                        {/* Wallet name */}
                        <Text
                            className="w-4/6 text-center font-bold text-white"
                            ellipsizeMode="middle"
                            numberOfLines={1}>
                            {walletData.name}
                        </Text>
                    </View>

                    {/* Allow user to change wallet name */}
                    <View className="w-5/6 mt-12" style={{marginBottom: 64}}>
                        <View>
                            <View className="flex flex-row">
                                <VText
                                    className="text-sm mb-2 mr-1 w-full text-white">
                                    {capitalizeFirst(t('edit')) + ' ' + t('name')}
                                </VText>
                            </View>
                            <View
                                className="px-4 w-full"
                                style={[
                                    styles.renameContainer,
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
                                            renameWallet(
                                                currentWalletID,
                                                tmpName,
                                            );

                                            // Reset tmpName and clear input
                                            setTmpName('');
                                            nameInput.current?.clear();
                                        }
                                    }}
                                    color={'white'}
                                />

                                {tmpName.length > 0 && (
                                    <View
                                        className="absolute right-4 justify-center h-full">
                                        <Text
                                            className="text-sm opacity-60 text-white">
                                            ({tmpName.length}/
                                            {WALLET_NAME_LENGTH})
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Wallet Info */}
                    {/* Wallet Type Path and Master Fingerprint */}
                    {isAdvancedMode && (
                        <View className="w-5/6 mb-6 flex-row">
                            <View className="w-1/2 items-center">
                                <Text
                                    className="text-sm mb-2"
                                    style={{color: ColorScheme.Text.GrayedText}}>
                                    {t('derivation_path')}
                                </Text>

                                <PlainButton onPress={copyPathToClipboard}>
                                    <Text
                                        className="text-sm"
                                        style={{color: ColorScheme.Text.Default}}>
                                        {walletPathText}
                                    </Text>
                                </PlainButton>
                            </View>

                            <View className="w-1/2 items-center">
                                <Text
                                    className="text-sm mb-2"
                                    style={{color: ColorScheme.Text.GrayedText}}>
                                    {t('master_fingerprint')}
                                </Text>

                                <PlainButton onPress={copyFingerToClipboard}>
                                    <Text
                                        className="text-sm"
                                        style={{color: ColorScheme.Text.Default}}>
                                        {walletFingerprintText}
                                    </Text>
                                </PlainButton>
                            </View>
                        </View>
                    )}

                    {/* Wallet Network and Type */}
                    {isAdvancedMode && (
                        <View
                            className="w-5/6 flex-row justify-start">
                            <View className="w-1/2 items-center">
                                <Text
                                    className="text-sm mb-2"
                                    style={{color: ColorScheme.Text.GrayedText}}>
                                    {capitalizeFirst(t('network'))}
                                </Text>

                                <Text
                                    className="capitalize text-sm"
                                    style={{color: ColorScheme.Text.Default}}>
                                    {walletNetwork}
                                </Text>
                            </View>

                            <View className="w-1/2 items-center">
                                <Text
                                    className="text-sm mb-2"
                                    style={{color: ColorScheme.Text.GrayedText}}>
                                    {t('type')}
                                </Text>

                                <Text
                                    className="text-sm"
                                    style={{color: ColorScheme.Text.Default}}>
                                    {walletTypeName}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* View Divider */}
                    {isAdvancedMode && (
                        <View className="w-full my-8" style={[HeadingBar]} />
                    )}

                    {/* Wallet Tools & Info */}
                    {/* Backup / Export material - Seed and Descriptor */}
                    <PlainButton
                        className="w-5/6 mb-6"
                        onPress={handleBackupRoute}>
                        <View
                            className={
                                `items-center ${
                                    langDir === 'right'
                                        ? 'flex-row-reverse'
                                        : 'flex-row'
                                } justify-between`
                            }>
                            <Text
                                className="text-sm"
                                style={{color: ColorScheme.Text.Default}}>
                                {capitalizeFirst(t('backup'))}
                            </Text>

                            <View className="items-center">
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
                        className="w-5/6 mb-6"
                        onPress={handleXPubRoute}>
                        <View
                            className={
                                `items-center ${
                                    langDir === 'right'
                                        ? 'flex-row-reverse'
                                        : 'flex-row'
                                } justify-between`
                            }>
                            <Text
                                className="text-sm"
                                style={{color: ColorScheme.Text.Default}}>
                                {t('show_xpub')}
                            </Text>

                            <View className="items-center">
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
                        className="w-5/6"
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
                            className={
                                `items-center ${
                                    langDir === 'right'
                                        ? 'flex-row-reverse'
                                        : 'flex-row'
                                } justify-between`
                            }>
                            <Text
                                className="text-sm"
                                style={{color: ColorScheme.Text.Default}}>
                                {t('check_address_ownership')}
                            </Text>

                            <View className="items-center">
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
                        className="absolute bottom-6 px-8 py-3 rounded-full"
                        style={{
                            backgroundColor: ColorScheme.Background.Alert,
                        }}>
                        <Text
                            className="font-bold"
                            style={{color: ColorScheme.Text.Alert}}>
                            {capitalizeFirst(t('delete'))}
                        </Text>
                    </PlainButton>
                </View>

                <PINPass
                    pinPassRef={bottomPINPassRef}
                    triggerSuccess={handlePINSuccess}
                    onSelectPinPass={setPINIdx}
                    pinMode={false}
                />
            </BottomSheetModalProvider>
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
