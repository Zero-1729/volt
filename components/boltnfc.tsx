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

import BoltIcon from '../assets/svg/bolt-icon-dark.svg';
import BoltIconLight from '../assets/svg/bolt-icon-light.svg';
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
                setStatusMessage('Retrieving LNURL Data...');

                const _amountMsat = props.amountMsat;
                const input = await parseInput(lnurl);

                if (input.type === InputTypeVariant.LN_URL_WITHDRAW) {
                    setStatusMessage('Processing Withdrawal...');
                    const maxAmount = input.data.maxWithdrawable; // in sats

                    // Check if above limit
                    if (_amountMsat / 1_000 > maxAmount) {
                        setStatusMessage(
                            `Invoice amount ${
                                _amountMsat / 1_000
                            } sats is more than ${maxAmount} sats max amount`,
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
                        setStatusMessage('Withdrawal successful!');
                    } else {
                        setStatusMessage(
                            `Withdrawal failed: ${lnUrlWithdrawResult.data.reason}`,
                        );
                    }
                }
            } catch (error: any) {
                setStatusMessage(`Error: ${error.message}`);
            }
        },
        [props.amountMsat],
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
            setStatusMessage('NFC is not supported');
            setLoading(false);
            return;
        }

        if (!enabled) {
            setStatusMessage('NFC is not enabled');
            setLoading(false);
            return;
        }

        try {
            setStatusMessage('Hold your NFC Tag near your device...');
            // register for the NFC tag with NDEF in it
            await NFCManager.requestTechnology(NfcTech.Ndef);
            // the resolved tag object will contain `ndefMessage` property
            const tag = await NFCManager.getTag();

            if (tag !== null) {
                setStatusMessage('Processing NFC Tag...');
                const tagData = extractNFCTagData(tag);

                if (!tagData.lnurl) {
                    setStatusMessage('No LNURL found in NFC Tag');
                    setLoading(false);
                    return;
                }

                handleWithdraw(tagData.lnurl);
            } else {
                setStatusMessage('No NFC Tag found');
                setLoading(false);
            }
        } catch (error: any) {
            setStatusMessage(`Error reading NFC Tag: ${error.message}`);
            setLoading(false);
        } finally {
            // stop the nfc scanning
            NFCManager.cancelTechnologyRequest();
        }
    }, [handleWithdraw, loading]);

    return (
        <BottomModal
            snapPoints={snapPoints}
            ref={props.boltNFCRef}
            onUpdate={idx => {
                if (idx !== -1) {
                    readNFC();
                } else {
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
                                backgroundColor: ColorScheme.Background.Greyed,
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
                            {useColorScheme() === 'dark' ? (
                                <BoltIcon height={98} width={98} />
                            ) : (
                                <BoltIconLight height={98} width={98} />
                            )}
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
