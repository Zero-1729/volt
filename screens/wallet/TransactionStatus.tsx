/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import {
    Text,
    View,
    useColorScheme,
    Linking,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import React, {useState, useLayoutEffect, useContext, useEffect} from 'react';

import {
    useNavigation,
    CommonActions,
    StackActions,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

import {AppStorageContext} from '../../class/storageContext';

import {SafeAreaView} from 'react-native-safe-area-context';

import {SingleBDKSend} from '../../modules/bdk';
import {PartiallySignedTransaction} from 'bdk-rn';
import {getPrivateDescriptors} from '../../modules/descriptors';
import {TComboWallet} from '../../types/wallet';

import {useTranslation} from 'react-i18next';

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../../constants/Haptic';
import NativeOffsets from '../../constants/NativeWindowMetrics';

import {capitalizeFirst} from '../../modules/transform';
import Color from '../../constants/Color';

import {ENet} from '../../types/enums';

import {LongBottomButton, PlainButton} from '../../components/button';

import Success from '../../assets/svg/check-circle-fill-24.svg';
import Failed from '../../assets/svg/x-circle-fill-24.svg';
import Cog from '../../assets/svg/gear-24.svg';

type Props = NativeStackScreenProps<WalletParamList, 'TransactionStatus'>;

type TStatusInfo = {
    status: string;
    txId: string;
    message: string;
};

const TransactionStatus = ({route}: Props) => {
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const {t} = useTranslation('wallet');

    const {electrumServerURL, isAdvancedMode} = useContext(AppStorageContext);

    const [statusMessage, setStatusMessage] = useState('');
    const [statusInfo, setStatusInfo] = useState<TStatusInfo>({
        status: '',
        txId: '',
        message: '',
    });

    const bottomOffset = NativeOffsets.bottom + 110;

    // Get URL for mempool.space
    const openMempoolSpace = (txid: string) => {
        RNHapticFeedback.trigger('impactLight', RNHapticFeedbackOptions);

        Linking.openURL(
            `https://mempool.space/${
                route.params.network === ENet.Testnet ? 'testnet/' : ''
            }tx/${txid}`,
        );
    };

    const buttonText = isAdvancedMode ? t('view_on_mempool') : t('see_more');

    // Start process of tx build and send
    useLayoutEffect(() => {
        initSend();
    }, []);

    const initSend = async () => {
        // For now, only single sends are supported
        // Update wallet descriptors to private version
        const descriptors = getPrivateDescriptors(
            route.params.wallet.privateDescriptor,
        );

        let wallet = {
            ...route.params.wallet,
            externalDescriptor: descriptors.external,
            internalDescriptor: descriptors.internal,
        };

        // We expect a signed PSBT to be passed in
        let broadcasted = false;
        let psbt = null;
        let errorMessage = '';

        // Only attempt if PSBT present
        if (route.params.unsignedPsbt) {
            const result = await SingleBDKSend(
                route.params.unsignedPsbt,
                wallet as TComboWallet,
                electrumServerURL,
                (msg: string) => {
                    setStatusMessage(t(msg));
                },
            );

            broadcasted = result.broadcasted;
            psbt = result.psbt;
            errorMessage = result.errorMessage;
        } else {
            // Didn't get a PSBT
            setStatusMessage('could not create PSBT');
        }

        await updateStatusInfo(broadcasted, psbt, errorMessage);
    };

    const updateStatusInfo = async (
        broadcasted: boolean,
        psbt: PartiallySignedTransaction | null,
        errorMessage: string,
    ) => {
        setStatusInfo({
            status: broadcasted ? 'success' : 'failed',
            txId: psbt ? await psbt?.txid() : '',
            message: errorMessage,
        });
    };

    useEffect(() => {
        // vibrate on successful send
        if (statusInfo.status === 'success') {
            RNHapticFeedback.trigger('impactLight', RNHapticFeedbackOptions);
        }
    }, [statusInfo.status]);

    return (
        <SafeAreaView
            edges={['right', 'left', 'bottom']}
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View
                className="w-full h-full relative justify-center"
                style={[
                    styles.statusContainer,
                    {
                        backgroundColor: ColorScheme.Background.Primary,
                    },
                ]}>
                {!statusInfo.status && (
                    <View
                        className="w-full h-full items-center justify-center">
                        <View className="items-center justify-center">
                            <Cog
                                className="mb-2"
                                width={32}
                                height={32}
                                fill={ColorScheme.SVG.Default}
                            />

                            <Text
                                className="text-sm"
                                style={{color: ColorScheme.Text.Default}}>
                                {statusMessage}
                            </Text>

                            <ActivityIndicator
                                className="mt-4"
                                size="small"
                                color={ColorScheme.SVG.Default}
                            />
                        </View>

                        {/* Replace with loading status bars below */}
                    </View>
                )}
                {!!statusInfo.status && (
                    <View className="h-full justify-center">
                        <Text
                            className="text-lg absolute font-bold text-center w-full top-6 px-4"
                            style={{color: ColorScheme.Text.Default}}>
                            {capitalizeFirst(t('status'))}
                        </Text>

                        <View
                            className="-mt-12 justify-center px-4 items-center">
                            <View className="items-center">
                                {statusInfo.status === 'failed' && (
                                    <Failed
                                        className="self-center"
                                        fill={ColorScheme.SVG.Default}
                                        height={128}
                                        width={128}
                                    />
                                )}

                                {statusInfo.status === 'success' && (
                                    <Success
                                        className="self-center"
                                        fill={ColorScheme.SVG.Default}
                                        height={128}
                                        width={128}
                                    />
                                )}
                            </View>

                            <View className="w-4/5 mt-4 items-center">
                                <Text
                                    className="text-lg font-bold"
                                    style={{color: ColorScheme.Text.Default}}>
                                    {statusInfo.status === 'success'
                                        ? t('tx_sent')
                                        : t('tx_failed')}
                                </Text>
                            </View>

                            {isAdvancedMode && (
                                <View className="items-center w-4/5">
                                    <Text
                                        className="text-sm text-center mt-4"
                                        style={{
                                                color: ColorScheme.Text
                                                    .GrayedText,
                                        }}>
                                        {statusInfo.status === 'success'
                                            ? statusInfo.txId
                                            : statusInfo.message}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {statusInfo.status === 'success' && (
                            <PlainButton
                                className="absolute self-center"
                                style={{bottom: bottomOffset}}
                                onPress={() => {
                                    openMempoolSpace(statusInfo.txId);
                                }}>
                                <Text
                                    className="font-bold text-sm"
                                    style={{color: ColorScheme.Text.DescText}}>
                                    {buttonText}
                                </Text>
                            </PlainButton>
                        )}

                        <View
                            className="absolute bottom-0 items-center w-full">
                            <LongBottomButton
                                onPress={() => {
                                    navigation.dispatch(
                                        StackActions.popToTop(),
                                    );

                                    navigation.dispatch(
                                        CommonActions.navigate('WalletRoot', {
                                            screen: 'WalletView',
                                            params: {
                                                reload:
                                                    statusInfo.status ===
                                                    'success',
                                            },
                                        }),
                                    );
                                }}
                                title={t('back_to_wallet')}
                                textColor={ColorScheme.Text.Alt}
                                backgroundColor={
                                    ColorScheme.Background.Inverted
                                }
                            />
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

export default TransactionStatus;

const styles = StyleSheet.create({
    statusContainer: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
});
