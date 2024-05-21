import React, {useCallback, useMemo, useState} from 'react';
import {Text, View, useColorScheme, ActivityIndicator} from 'react-native';

import VText from '../components/text';

import {LongBottomButton} from './button';

import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {BottomModal} from './bmodal';
import Color from '../constants/Color';

import {useTranslation} from 'react-i18next';

import {useTailwind} from 'tailwind-rn';

import {capitalizeFirst} from '../modules/transform';
import NativeWindowMetrics from '../constants/NativeWindowMetrics';

import {
    parseInput,
    withdrawLnurl,
    InputTypeVariant,
    LnUrlWithdrawResultVariant,
} from '@breeztech/react-native-breez-sdk';

import NFCManager, {NfcTech} from 'react-native-nfc-manager';
import {extractNFCTagData} from '../modules/nfc';

import BoltIcon from '../assets/svg/bolt-mono.svg';
import {DisplayFiatAmount} from './balance';

type BoltNFCProps = {
    boltNFCRef: React.RefObject<BottomSheetModal>;
    onSelectNFC: (idx: number) => void;
    amountMsat: number;
    index: number;
    fiat: string;
};

const BoltNFC = (props: BoltNFCProps) => {
    const tailwind = useTailwind();
    const snapPoints = useMemo(() => ['65'], []);
    const ColorScheme = Color(useColorScheme());

    const {t} = useTranslation('wallet');
    const [statusMessage, setStatusMessage] = useState('');
    const [loading, setLoading] = useState<boolean>();

    const handleWithdraw = useCallback(
        async (lnurl: string) => {
            try {
                setStatusMessage(t('retrieving_lnurl_data'));

                const _amountMsat = props.amountMsat;
                const input = await parseInput(lnurl);

                if (input.type === InputTypeVariant.LN_URL_WITHDRAW) {
                    setStatusMessage(t('processing_lnurl_withdraw'));
                    const maxAmount = input.data.maxWithdrawable; // in sats

                    // Check if above limit
                    if (_amountMsat / 1_000 > maxAmount) {
                        setStatusMessage(
                            t('above_lnurl_withdraw_limit', {
                                amount: _amountMsat / 1_000,
                                maxAmount: maxAmount,
                            }),
                        );
                        setLoading(false);
                        return;
                    }

                    const lnUrlWithdrawResult = await withdrawLnurl({
                        data: input.data,
                        amountMsat: _amountMsat,
                        description: `Volt ${
                            _amountMsat / 1_000
                        } sats Withdrawal`,
                    });

                    if (
                        lnUrlWithdrawResult.type ===
                        LnUrlWithdrawResultVariant.OK
                    ) {
                        setStatusMessage(t('lnurl_withdrawal_success'));
                    } else {
                        setStatusMessage(
                            t('lnurl_withdrawal_failed', {
                                reason: lnUrlWithdrawResult.data.reason,
                            }),
                        );
                        setLoading(false);
                    }
                }
            } catch (error: any) {
                setStatusMessage(`Error: ${error.message}`);
            }
        },
        [props.amountMsat, t],
    );

    const readNFC = useCallback(async () => {
        if (loading) {
            // Stop loading
            setLoading(false);
            setStatusMessage('');
            NFCManager.cancelTechnologyRequest();
            return;
        }

        // Start loading
        setLoading(true);

        // Start processing the NFC
        NFCManager.start();

        // Check if NFC is enabled
        const supported = await NFCManager.isSupported();
        const enabled = await NFCManager.isEnabled();

        if (!supported) {
            setStatusMessage(t('nfc_unsupported'));
            setLoading(false);
            return;
        }

        if (!enabled) {
            setStatusMessage(t('nfc_disabled'));
            setLoading(false);
            return;
        }

        try {
            setStatusMessage(t('nfc_read_message'));
            // register for the NFC tag with NDEF in it
            await NFCManager.requestTechnology(NfcTech.Ndef);
            // the resolved tag object will contain `ndefMessage` property
            const tag = await NFCManager.getTag();

            if (tag !== null) {
                setStatusMessage(t('processing_nfc_tag'));
                const tagData = extractNFCTagData(tag);

                if (!tagData.lnurl) {
                    setStatusMessage(t('no_lnurl_data_found'));
                    setLoading(false);
                    return;
                }

                handleWithdraw(tagData.lnurl);
            } else {
                setStatusMessage(t('no_nfc_tag_found'));
                setLoading(false);
            }
        } catch (error: any) {
            setStatusMessage(t('nfc_tag_error', {error: error.message}));
            setLoading(false);
        } finally {
            // stop the nfc scanning
            NFCManager.cancelTechnologyRequest();
        }
    }, [handleWithdraw, loading, t]);

    return (
        <BottomModal
            snapPoints={snapPoints}
            ref={props.boltNFCRef}
            onUpdate={idx => {
                if (idx === -1) {
                    NFCManager.cancelTechnologyRequest();
                }

                props.onSelectNFC(idx);
            }}
            backgroundColor={ColorScheme.Background.Primary}
            handleIndicatorColor={'#64676E'}
            backdrop={true}>
            <View
                style={[
                    tailwind('w-full h-full items-center relative'),
                    {
                        backgroundColor: ColorScheme.Background.Primary,
                    },
                ]}>
                <View style={[tailwind('w-full px-2 h-full items-center')]}>
                    <View style={[tailwind('w-full items-center')]}>
                        <Text
                            style={[
                                tailwind('text-lg font-semibold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('Bolt NFC')}
                        </Text>
                    </View>

                    <View
                        style={[
                            tailwind(
                                'w-5/6 px-4 py-4 rounded-md mt-6 items-center justify-center',
                            ),
                            {
                                height: NativeWindowMetrics.height * 0.4 - 32,
                            },
                        ]}>
                        <View style={[tailwind('flex items-center')]}>
                            <VText
                                style={[
                                    tailwind('text-base font-bold'),
                                    {color: ColorScheme.Text.GrayText},
                                ]}>
                                {capitalizeFirst(t('amount'))}
                            </VText>
                            <DisplayFiatAmount
                                amount={props.fiat}
                                fontSize={'text-base'}
                            />
                        </View>

                        <View style={[tailwind('mt-2')]}>
                            <BoltIcon
                                height={98}
                                width={98}
                                fill={ColorScheme.SVG.Default}
                            />
                        </View>

                        {statusMessage && (
                            <View
                                style={[
                                    tailwind('w-full mt-6 mb-4 items-center'),
                                ]}>
                                {loading && (
                                    <ActivityIndicator
                                        style={[tailwind('mb-2')]}
                                        size="small"
                                        color={ColorScheme.SVG.Default}
                                    />
                                )}
                                <Text
                                    style={[
                                        tailwind('text-sm text-center'),
                                        {color: ColorScheme.Text.DescText},
                                    ]}>
                                    {statusMessage}
                                </Text>
                            </View>
                        )}
                    </View>

                    <LongBottomButton
                        title={
                            loading
                                ? capitalizeFirst(t('cancel'))
                                : capitalizeFirst(t('read_nfc'))
                        }
                        onPress={readNFC}
                        backgroundColor={ColorScheme.Background.Inverted}
                        textColor={ColorScheme.Text.Alt}
                    />
                </View>
            </View>
        </BottomModal>
    );
};

export default BoltNFC;
