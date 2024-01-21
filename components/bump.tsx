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

import {AppStorageContext} from '../class/storageContext';

import {LongBottomButton, PlainButton} from './button';

import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {BottomModal} from './bmodal';
import Color from '../constants/Color';

import {useTailwind} from 'tailwind-rn';
import {addCommas, normalizeFiat} from '../modules/transform';

import {TComboWallet, TMiniWallet, TTransaction} from '../types/wallet';

import Prompt from 'react-native-prompt-android';

import BigNumber from 'bignumber.js';

import NativeWindowMetrics from '../constants/NativeWindowMetrics';

import {conservativeAlert} from './alert';

import {bumpFeeBDKPsbt} from '../modules/bdk';
import {getPrivateDescriptors} from '../modules/descriptors';
import {getMiniWallet} from '../modules/wallet-utils';

type BumpTxFeeProps = {
    bumpRef: React.RefObject<BottomSheetModal>;
    onSelectBump: (idx: number) => void;
    triggerBump: (status: {broadcasted: boolean; errorMessage: string}) => void;
    walletId: string;
    tx: TTransaction;
};

const BumpTxFee = (props: BumpTxFeeProps) => {
    const tailwind = useTailwind();
    const snapPoints = useMemo(() => ['65'], []);

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
                'Custom',
                'Enter fee rate (sats/vB)',
                [
                    {text: 'Cancel'},
                    {
                        text: 'Set',
                        onPress: updateFeeRate,
                    },
                ],
                {
                    type: 'numeric',
                },
            );
        } else {
            Alert.prompt(
                'Custom',
                'Enter fee rate (sats/vB)',
                [
                    {
                        text: 'Cancel',
                        onPress: () => {},
                        style: 'cancel',
                    },
                    {
                        text: 'Set',
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
            conservativeAlert(
                'Error',
                `Fee rate must be higher than ${oldTxFeeRate} sats/vB`,
            );
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
                style={[
                    tailwind('w-full h-full items-center relative'),
                    {
                        backgroundColor: ColorScheme.Background.Primary,
                    },
                ]}>
                <View style={[tailwind('w-full px-2 h-full items-center')]}>
                    {/* Display Fee update */}
                    {/* Display recommended feeRate and custom fee setting */}
                    {/* Then use prop fn to call and route to wallet and request 'reload=true' */}
                    <View style={[tailwind('w-full items-center')]}>
                        <Text
                            style={[
                                tailwind('text-lg font-semibold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Bump Fee
                        </Text>
                    </View>

                    <View
                        style={[
                            tailwind('w-full px-4 py-4 rounded-md mt-4'),
                            {backgroundColor: ColorScheme.Background.Greyed},
                        ]}>
                        <View style={[tailwind('flex')]}>
                            <Text
                                style={[
                                    tailwind('text-sm font-bold'),
                                    {color: ColorScheme.Text.GrayText},
                                ]}>
                                Transaction ID
                            </Text>
                            <Text
                                ellipsizeMode="middle"
                                numberOfLines={1}
                                style={[
                                    tailwind('text-sm'),
                                    {color: ColorScheme.Text.DescText},
                                ]}>
                                {newTxId.length > 0 ? newTxId : props.tx.txid}
                            </Text>
                        </View>

                        {/* Display current fee rate */}
                        <View style={[tailwind('items-center mt-4 w-full')]}>
                            <View
                                style={[
                                    tailwind('flex-row items-center w-full'),
                                ]}>
                                <Text
                                    style={[
                                        tailwind(
                                            'text-left text-sm font-semibold mr-4',
                                        ),
                                        {color: ColorScheme.Text.GrayText},
                                    ]}>
                                    Fee
                                </Text>
                                <Text
                                    style={[
                                        tailwind('text-left text-sm'),
                                        {color: ColorScheme.Text.DescText},
                                    ]}>
                                    {`~${addCommas(
                                        props.tx.fee.toString(),
                                    )} sats (${
                                        appFiatCurrency.symbol
                                    } ${normalizeFiat(
                                        new BigNumber(props.tx.fee),
                                        new BigNumber(fiatRate.rate),
                                    )})`}
                                </Text>
                            </View>
                        </View>

                        {/* Display current fee rate */}
                        <View style={[tailwind('items-center mt-1 w-full')]}>
                            <View
                                style={[
                                    tailwind('flex-row items-center w-full'),
                                ]}>
                                <Text
                                    style={[
                                        tailwind(
                                            'text-left text-sm font-semibold mr-4',
                                        ),
                                        {color: ColorScheme.Text.GrayText},
                                    ]}>
                                    Feerate
                                </Text>
                                <Text
                                    style={[
                                        tailwind('text-left text-sm'),
                                        {color: ColorScheme.Text.DescText},
                                    ]}>
                                    {`~${addCommas(
                                        oldTxFeeRate.toString(),
                                    )} sats/vB`}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <PlainButton
                        onPress={() => {
                            openFeePrompt();
                        }}
                        style={[
                            tailwind(
                                'items-center px-4 flex-row justify-between mt-4 w-full rounded-md',
                            ),
                            {
                                height: 64,
                                borderWidth: 2,
                                borderColor: ColorScheme.Background.Greyed,
                            },
                        ]}>
                        <Text
                            style={[
                                tailwind('text-sm font-bold'),
                                {
                                    color: ColorScheme.Text.Default,
                                },
                            ]}>
                            {feeRate > 0 ? 'Update feerate' : 'Set new feerate'}
                        </Text>
                        {feeRate > 0 && (
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    {
                                        color: ColorScheme.Text.DescText,
                                    },
                                ]}>
                                {`~${addCommas(
                                    (props.tx.vsize * feeRate).toString(),
                                )} sats (${
                                    appFiatCurrency.symbol
                                } ${normalizeFiat(
                                    new BigNumber(props.tx.vsize * feeRate),
                                    new BigNumber(fiatRate.rate),
                                )})`}
                            </Text>
                        )}
                    </PlainButton>

                    <View
                        style={[
                            tailwind('w-full items-center absolute'),
                            {
                                bottom:
                                    NativeWindowMetrics.bottomButtonOffset + 48,
                            },
                        ]}>
                        <View style={[tailwind('w-full mb-6 items-center')]}>
                            {loading && (
                                <ActivityIndicator
                                    style={[tailwind('mb-2')]}
                                    size="small"
                                    color={ColorScheme.SVG.Default}
                                />
                            )}
                            {loading && (
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        {color: ColorScheme.Text.DescText},
                                    ]}>
                                    Bumping and broadcasting transaction...
                                </Text>
                            )}
                        </View>
                    </View>

                    <LongBottomButton
                        disabled={loading || feeRate === 0}
                        title={'Bump'}
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
