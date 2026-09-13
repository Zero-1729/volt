/* eslint-disable react-native/no-inline-styles */
import React, {useMemo, useContext} from 'react';
import {
    Text,
    View,
    useColorScheme,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';

import VText, {VTextSingle} from '../components/text';

import {AppStorageContext} from '../class/storageContext';

import {LongBottomButton, PlainButton} from './button';

import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {BottomModal} from './bmodal';
import Color from '../constants/Color';

import {useTranslation} from 'react-i18next';

import {addCommas, capitalizeFirst, normalizeFiat} from '../modules/transform';

import {TComboWallet, TMiniWallet, TTransaction} from '../types/wallet';

import Prompt from 'react-native-prompt-android';

import BigNumber from 'bignumber.js';

import NativeWindowMetrics from '../constants/NativeWindowMetrics';

import {bumpFeeBDKPsbt} from '../modules/bdk';
import {getPrivateDescriptors} from '../modules/descriptors';
import {getMiniWallet} from '../modules/wallet-utils';
import {LiberalToast} from './toast';

type BumpTxFeeProps = {
    bumpRef: React.RefObject<BottomSheetModal>;
    onSelectBump: (idx: number) => void;
    triggerBump: (status: {broadcasted: boolean; errorMessage: string}) => void;
    walletId: string;
    tx: TTransaction;
};

const BumpTxFee = (props: BumpTxFeeProps) => {
    const snapPoints = useMemo(() => ['65'], []);

    const {t, i18n} = useTranslation('wallet');
    const {t: e} = useTranslation('errors');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const [feeRate, setFeeRate] = React.useState<number>(0);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [newTxId, setNewTxId] = React.useState<string>('');

    const {electrumServerURL, fiatRate, appFiatCurrency, getWalletData} =
        useContext(AppStorageContext);

    const wallet: TMiniWallet = getMiniWallet(getWalletData(props.walletId));

    const ColorScheme = Color(useColorScheme());

    const oldTxFeeRate = Number((props.tx.fee / props.tx.vsize).toPrecision(1));

    const openFeePrompt = () => {
        if (Platform.OS === 'android') {
            Prompt(
                capitalizeFirst(t('custom')),
                t('custom_fee_alert_message'),
                [
                    {text: capitalizeFirst(t('cancel'))},
                    {
                        text: capitalizeFirst(t('set')),
                        onPress: updateFeeRate,
                    },
                ],
                {
                    type: 'numeric',
                },
            );
        } else {
            Alert.prompt(
                capitalizeFirst(t('custom')),
                t('custom_fee_alert_message'),
                [
                    {
                        text: capitalizeFirst(t('cancel')),
                        onPress: () => {},
                        style: 'cancel',
                    },
                    {
                        text: capitalizeFirst(t('set')),
                        onPress: updateFeeRate,
                    },
                ],
                'plain-text',
                '',
                'number-pad',
            );
        }
    };

    const bumpFee = async () => {
        // set loading
        setLoading(true);

        const descriptors = await getPrivateDescriptors(
            wallet.privateDescriptor,
        );

        const _wallet: TMiniWallet = {
            ...wallet,
            externalDescriptor: descriptors.external,
            internalDescriptor: descriptors.internal,
        };

        const status = await bumpFeeBDKPsbt(
            props.tx.txid,
            feeRate,
            _wallet as TComboWallet,
            electrumServerURL,
        );

        // kill loading
        setLoading(false);

        // set new txid
        if (status.broadcasted) {
            setNewTxId(await status.psbt.txid());
        } else {
            // clear fee rate
            setFeeRate(0);
        }

        // Check if tx already confirmed
        let errorMessage = status.errorMessage.startsWith(
            'TransactionConfirmed',
        )
            ? 'Transaction already confirmed'
            : status.errorMessage;

        props.triggerBump({
            broadcasted: status.broadcasted,
            errorMessage: errorMessage,
        });
    };

    const updateFeeRate = (input: string | undefined) => {
        const rate = Number(input);

        // TODO: add more checks to report here
        if (rate <= oldTxFeeRate) {
            LiberalToast(capitalizeFirst(t('error')), capitalizeFirst(
                `${e('fee_rate_too_low')} ${oldTxFeeRate} ${t('satoshi')}`,
            ), {
                duration: 3000,
            });
            return;
        }

        if (rate > 0) {
            setFeeRate(rate);
        }
    };

    return (
        <BottomModal
            snapPoints={snapPoints}
            ref={props.bumpRef}
            onUpdate={props.onSelectBump}
            backgroundColor={ColorScheme.Background.Primary}
            handleIndicatorColor={'#64676E'}
            backdrop={true}>
            <View
                className="w-full h-full items-center relative"
                style={{
                        backgroundColor: ColorScheme.Background.Primary,
                    }}>
                <View className="w-full px-2 h-full items-center">
                    {/* Display Fee update */}
                    {/* Display recommended feeRate and custom fee setting */}
                    {/* Then use prop fn to call and route to wallet and request 'reload=true' */}
                    <View className="w-full items-center">
                        <Text
                            className="text-lg font-semibold"
                            style={{color: ColorScheme.Text.Default}}>
                            {t('bump_fee')}
                        </Text>
                    </View>

                    <View
                        className="w-full px-4 py-4 rounded-md mt-4"
                        style={{backgroundColor: ColorScheme.Background.Greyed}}>
                        <View className="flex">
                            <VText
                                className="text-sm font-bold"
                                style={{color: ColorScheme.Text.GrayText}}>
                                {t('tx_id')}
                            </VText>
                            <VTextSingle
                                className="text-sm"
                                style={{color: ColorScheme.Text.DescText}}>
                                {newTxId.length > 0 ? newTxId : props.tx.txid}
                            </VTextSingle>
                        </View>

                        {/* Display current fee rate */}
                        <View className="items-center mt-4 w-full">
                            <View className={`${
                                            langDir === 'right'
                                                ? 'flex-row-reverse'
                                                : 'flex-row'
                                        } items-center w-full`}>
                                <VText
                                    className={`text-left text-sm font-semibold
                                        ${
                                            langDir === 'right'
                                                ? 'ml-4'
                                                : 'mr-4'
                                        }`
                                    }
                                    style={{color: ColorScheme.Text.GrayText}}>
                                    {capitalizeFirst(t('fee'))}
                                </VText>
                                <VText
                                    className="text-left text-sm"
                                    style={{color: ColorScheme.Text.DescText}}>
                                    {`~${addCommas(
                                        props.tx.fee?.toString(),
                                    )} sats (${
                                        appFiatCurrency.symbol
                                    } ${normalizeFiat(
                                        new BigNumber(props.tx.fee),
                                        new BigNumber(fiatRate.rate),
                                    )})`}
                                </VText>
                            </View>
                        </View>

                        {/* Display current fee rate */}
                        <View className="items-center mt-1 w-full">
                            <View className={`${
                                            langDir === 'right'
                                                ? 'flex-row-reverse'
                                                : 'flex-row'
                                        } items-center w-full`}>
                                <VText
                                    className={`text-left text-sm font-semibold ${
                                                langDir === 'right'
                                                    ? 'ml-4'
                                                    : 'mr-4'
                                            }`}
                                    style={{color: ColorScheme.Text.GrayText}}>
                                    {capitalizeFirst(t('feerate'))}
                                </VText>
                                <VText
                                    className="text-left text-sm"
                                    style={{color: ColorScheme.Text.DescText}}>
                                    {`~${addCommas(
                                        oldTxFeeRate.toString(),
                                    )} ${t('sat_vbyte')}`}
                                </VText>
                            </View>
                        </View>
                    </View>

                    <PlainButton
                        onPress={() => {
                            openFeePrompt();
                        }}
                        className={`items-center px-4 ${
                                    langDir === 'right'
                                        ? 'flex-row-reverse'
                                        : 'flex-row'
                                } justify-between mt-4 w-full rounded-md`}
                        style={{
                                height: 64,
                                borderWidth: 2,
                                borderColor: ColorScheme.Background.Greyed,
                            }}>
                        <VText
                            className="text-sm font-bold"
                            style={{
                                    color: ColorScheme.Text.Default,
                                }}>
                            {feeRate > 0 ? t('update_fee') : t('fee_bump_text')}
                        </VText>
                        {feeRate > 0 && (
                            <VText
                                className="text-sm"
                                style={{
                                        color: ColorScheme.Text.DescText,
                                    }}>
                                {`~${addCommas(
                                    (props.tx.vsize * feeRate).toString(),
                                )} sats (${
                                    appFiatCurrency.symbol
                                } ${normalizeFiat(
                                    new BigNumber(props.tx.vsize * feeRate),
                                    new BigNumber(fiatRate.rate),
                                )})`}
                            </VText>
                        )}
                    </PlainButton>

                    <View
                        className="w-full items-center absolute"
                        style={{
                                bottom:
                                    NativeWindowMetrics.bottomButtonOffset + 48,
                            }}>
                        <View className="w-full mb-6 items-center">
                            {loading && (
                                <ActivityIndicator
                                    className='mb-2'
                                    size="small"
                                    color={ColorScheme.SVG.Default}
                                />
                            )}
                            {loading && (
                                <Text
                                    className="text-sm"
                                    style={{color: ColorScheme.Text.DescText}}>
                                    {t('bumping_tx')}
                                </Text>
                            )}
                        </View>
                    </View>

                    <LongBottomButton
                        disabled={loading || feeRate === 0}
                        title={capitalizeFirst(t('bump'))}
                        onPress={() => {
                            bumpFee();
                        }}
                        backgroundColor={ColorScheme.Background.Inverted}
                        textColor={ColorScheme.Text.Alt}
                    />
                </View>
            </View>
        </BottomModal>
    );
};

export default BumpTxFee;
