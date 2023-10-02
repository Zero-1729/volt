/* eslint-disable react-hooks/exhaustive-deps */
import {
    Text,
    View,
    useColorScheme,
    Linking,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import React, {useState, useLayoutEffect, useContext} from 'react';

import {useNavigation, StackActions} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

import {AppStorageContext} from '../../class/storageContext';

import {SafeAreaView} from 'react-native-safe-area-context';

import {SingleBDKSend} from '../../modules/bdk';
import {PartiallySignedTransaction} from 'bdk-rn';
import {getPrivateDescriptors} from '../../modules/descriptors';

import {TComboWallet} from '../../types/wallet';

import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';

Dayjs.extend(calendar);
Dayjs.extend(LocalizedFormat);

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../../constants/Haptic';
import NativeOffsets from '../../constants/NativeWindowMetrics';

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

const DoneRender = (
    statusInfo: TStatusInfo,
    network: string,
    isAMode: boolean,
) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const bottomOffset = NativeOffsets.bottom + 96;

    // Get URL for mempool.space
    const openMempoolSpace = (txid: string) => {
        RNHapticFeedback.trigger('impactLight', RNHapticFeedbackOptions);

        Linking.openURL(
            `https://mempool.space/${
                network === ENet.Testnet ? 'testnet/' : ''
            }tx/${txid}`,
        );
    };

    const buttonText = isAMode ? 'View on Mempool.space' : 'See more';

    return (
        <View style={[tailwind('h-full justify-center')]}>
            <Text
                style={[
                    tailwind(
                        'text-lg absolute font-bold text-center w-full top-6 px-4',
                    ),
                    {color: ColorScheme.Text.Default},
                ]}>
                Status
            </Text>

            <View style={[tailwind('-mt-12 justify-center px-4 items-center')]}>
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
                            ? 'Transaction sent'
                            : 'Transaction failed to send'}
                    </Text>
                </View>

                {isAMode ? (
                    <View style={[tailwind('items-center w-4/5')]}>
                        <Text
                            style={[
                                tailwind('text-sm text-center mt-4'),
                                {color: ColorScheme.Text.GrayedText},
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
                    <Text style={[tailwind('font-bold text-sm')]}>
                        {buttonText}
                    </Text>
                </PlainButton>
            ) : (
                <></>
            )}

            <View style={[tailwind('absolute bottom-0 items-center w-full')]}>
                <LongBottomButton
                    onPress={() => {
                        navigation.dispatch(StackActions.popToTop());
                    }}
                    title={'Back to Wallet'}
                    textColor={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                />
            </View>
        </View>
    );
};

const StatusRender = (statusMessage: string) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    return (
        <View style={[tailwind('w-full h-full items-center justify-center')]}>
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
    );
};

const TransactionStatus = ({route}: Props) => {
    const {electrumServerURL, isAdvancedMode} = useContext(AppStorageContext);

    const [statusMessage, setStatusMessage] = useState('');
    const [statusInfo, setStatusInfo] = useState<TStatusInfo>({
        status: '',
        txId: '',
        message: '',
    });

    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

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

        const {address, amount} = route.params.payload.addressAmounts[0];

        // determine if max send
        const isMaxSend = amount.toString() === wallet.balance.toString();

        const {broadcasted, psbt, errorMessage} = await SingleBDKSend(
            amount.toString(),
            address,
            route.params.payload.feeRate,
            isMaxSend,
            wallet as TComboWallet,
            electrumServerURL,
            (msg: string) => {
                setStatusMessage(msg);
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
                {!statusInfo.status && StatusRender(statusMessage)}
                {!!statusInfo.status &&
                    DoneRender(
                        statusInfo,
                        route.params.network,
                        isAdvancedMode,
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
