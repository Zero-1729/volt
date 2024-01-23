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

import {useNavigation, CommonActions} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

import {AppStorageContext} from '../../class/storageContext';

import {SafeAreaView} from 'react-native-safe-area-context';

import {SingleBDKSend} from '../../modules/bdk';
import {PartiallySignedTransaction} from 'bdk-rn';
import {getPrivateDescriptors} from '../../modules/descriptors';
import {TComboWallet} from '../../types/wallet';

import {useTranslation} from 'react-i18next';

import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';

Dayjs.extend(calendar);
Dayjs.extend(LocalizedFormat);

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../../constants/Haptic';
import NativeOffsets from '../../constants/NativeWindowMetrics';

import {capitalizeFirst} from '../../modules/transform';
import {useTailwind} from 'tailwind-rn';
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
    const tailwind = useTailwind();
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
        const {broadcasted, psbt, errorMessage} = await SingleBDKSend(
            route.params.unsignedPsbt,
            wallet as TComboWallet,
            electrumServerURL,
            (msg: string) => {
                setStatusMessage(t(msg));
            },
        );

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
        <SafeAreaView edges={['right', 'left', 'bottom']}>
            <View
                style={[
                    styles.statusContainer,
                    tailwind('w-full h-full relative justify-center'),
                    {
                        backgroundColor: ColorScheme.Background.Primary,
                    },
                ]}>
                {!statusInfo.status && (
                    <View
                        style={[
                            tailwind(
                                'w-full h-full items-center justify-center',
                            ),
                        ]}>
                        <View style={[tailwind('items-center justify-center')]}>
                            <Cog
                                style={[tailwind('mb-2')]}
                                width={32}
                                height={32}
                                fill={ColorScheme.SVG.Default}
                            />

                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {statusMessage}
                            </Text>

                            <ActivityIndicator
                                style={[tailwind('mt-4')]}
                                size="small"
                                color={ColorScheme.SVG.Default}
                            />
                        </View>

                        {/* Replace with loading status bars below */}
                    </View>
                )}
                {!!statusInfo.status && (
                    <View style={[tailwind('h-full justify-center')]}>
                        <Text
                            style={[
                                tailwind(
                                    'text-lg absolute font-bold text-center w-full top-6 px-4',
                                ),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {capitalizeFirst(t('status'))}
                        </Text>

                        <View
                            style={[
                                tailwind(
                                    '-mt-12 justify-center px-4 items-center',
                                ),
                            ]}>
                            <View style={[tailwind('items-center')]}>
                                {statusInfo.status === 'failed' && (
                                    <Failed
                                        style={[tailwind('self-center')]}
                                        fill={ColorScheme.SVG.Default}
                                        height={128}
                                        width={128}
                                    />
                                )}

                                {statusInfo.status === 'success' && (
                                    <Success
                                        style={[tailwind('self-center')]}
                                        fill={ColorScheme.SVG.Default}
                                        height={128}
                                        width={128}
                                    />
                                )}
                            </View>

                            <View style={[tailwind('w-4/5 mt-4 items-center')]}>
                                <Text
                                    style={[
                                        tailwind('text-lg font-bold'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    {statusInfo.status === 'success'
                                        ? t('tx_sent')
                                        : t('tx_failed')}
                                </Text>
                            </View>

                            {isAdvancedMode ? (
                                <View style={[tailwind('items-center w-4/5')]}>
                                    <Text
                                        style={[
                                            tailwind(
                                                'text-sm text-center mt-4',
                                            ),
                                            {
                                                color: ColorScheme.Text
                                                    .GrayedText,
                                            },
                                        ]}>
                                        {statusInfo.status === 'success'
                                            ? statusInfo.txId
                                            : statusInfo.message}
                                    </Text>
                                </View>
                            ) : (
                                <></>
                            )}
                        </View>

                        {statusInfo.status === 'success' ? (
                            <PlainButton
                                style={[
                                    tailwind('absolute self-center'),
                                    {bottom: bottomOffset},
                                ]}
                                onPress={() => {
                                    openMempoolSpace(statusInfo.txId);
                                }}>
                                <Text
                                    style={[
                                        tailwind('font-bold text-sm'),
                                        {color: ColorScheme.Text.DescText},
                                    ]}>
                                    {buttonText}
                                </Text>
                            </PlainButton>
                        ) : (
                            <></>
                        )}

                        <View
                            style={[
                                tailwind(
                                    'absolute bottom-0 items-center w-full',
                                ),
                            ]}>
                            <LongBottomButton
                                onPress={() => {
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
