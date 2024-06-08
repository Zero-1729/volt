/* eslint-disable react-native/no-inline-styles */
// TODO: probably merge into one Amount screen that routes to request screen and send screen, accordingly.
import React, {useContext, useEffect, useState} from 'react';
import {useColorScheme, View, Text, Alert, Platform} from 'react-native';
import Prompt from 'react-native-prompt-android';

import {useNavigation, CommonActions} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';
import VText, {VTextSingle} from '../../components/text';

import {useTailwind} from 'tailwind-rn';

import {useTranslation} from 'react-i18next';

import BigNumber from 'bignumber.js';

import Color from '../../constants/Color';

import {AppStorageContext} from '../../class/storageContext';

import Close from '../../assets/svg/x-24.svg';

import NativeWindowMetrics from '../../constants/NativeWindowMetrics';

import Toast, {ToastConfig} from 'react-native-toast-message';

import BottomArrow from '../../assets/svg/chevron-down-16.svg';

import netInfo from '@react-native-community/netinfo';
import {checkNetworkIsReachable} from '../../modules/wallet-utils';

import {
    SATS_TO_BTC_RATE,
    capitalizeFirst,
    formatFiat,
    formatSats,
    normalizeFiat,
} from '../../modules/transform';
import {openChannelFee, nodeInfo} from '@breeztech/react-native-breez-sdk';

type DisplayUnit = {
    value: BigNumber;
    symbol: string;
    name: string;
};

import {LongButton, PlainButton} from '../../components/button';
import {AmountNumpad} from '../../components/input';
import {
    DisplayFiatAmount,
    DisplaySatsAmount,
    DisplayBTCAmount,
} from '../../components/balance';
import {actionAlert} from '../../components/alert';
import {toastConfig} from '../../components/toast';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

type Props = NativeStackScreenProps<WalletParamList, 'RequestAmount'>;

const RequestAmount = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const navigation = useNavigation();

    const {t} = useTranslation('wallet');
    const {t: e} = useTranslation('errors');

    const {fiatRate, appFiatCurrency, getWalletData, currentWalletID} =
        useContext(AppStorageContext);

    const wallet = getWalletData(currentWalletID);
    const walletType = wallet.type;

    const [breezServicesNotInitialized, setBreezServicesNotInitialized] =
        useState(true);

    const [maxReceivableAmount, updateMaxReceivableAmount] = useState(
        new BigNumber(0),
    );
    const [lnInvoiceDesc, setLNInvoiceDesc] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [topUnit, setTopUnit] = useState<DisplayUnit>({
        value: new BigNumber(0),
        symbol: 'sats',
        name: 'sats',
    });
    const [bottomUnit, setBottomUnit] = useState<DisplayUnit>({
        value: new BigNumber(0),
        symbol: appFiatCurrency.symbol,
        name: appFiatCurrency.short,
    });
    const [satsAmount, setSatsAmount] = useState<DisplayUnit>({
        value: new BigNumber(0),
        symbol: 'sats',
        name: 'sats',
    });
    const [fiatAmount, setFiatAmount] = useState<BigNumber>(new BigNumber(0));

    const setMaxReceivableAmount = async () => {
        try {
            const nodeState = await nodeInfo();

            updateMaxReceivableAmount(
                new BigNumber(nodeState.maxReceivableMsat / 1_000),
            );
        } catch (error: any) {
            if (error.message === 'BreezServices not initialized') {
                setBreezServicesNotInitialized(true);

                Toast.show({
                    topOffset: 60,
                    type: 'Liberal',
                    text1: capitalizeFirst(t('error')),
                    text2: t('not_connected_to_breez_services'),
                    position: 'top',
                    visibilityTime: 2000,
                });
            }
        }
    };

    const isLightning = walletType === 'unified';

    const shouldSkip = route.params?.boltNFCMode
        ? false
        : satsAmount.value.isZero();
    const skipText = route.params?.boltNFCMode
        ? capitalizeFirst(t('continue'))
        : capitalizeFirst(t('skip'));

    const disableContinueButtton =
        (route.params?.boltNFCMode && satsAmount.value.isZero()) ||
        (isLightning && !maxReceivableAmount.isZero) ||
        (satsAmount.value.gte(maxReceivableAmount) &&
            !maxReceivableAmount.isZero() &&
            walletType === 'unified');

    useEffect(() => {
        setMaxReceivableAmount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const _handleDescription = (text: string | undefined) => {
        const chars = text as string;

        if (chars.length <= 90) {
            setLNInvoiceDesc(chars);
        } else {
            Toast.show({
                topOffset: 60,
                type: 'Liberal',
                text1: capitalizeFirst(t('warn')),
                text2: e('ln_description_length'),
                position: 'top',
                visibilityTime: 2000,
            });
        }
    };

    const updateDescription = () => {
        if (Platform.OS === 'android') {
            Prompt(
                capitalizeFirst(t('ln_description')),
                t('ln_description_text'),
                [
                    {text: capitalizeFirst(t('cancel'))},
                    {
                        text: capitalizeFirst(t('set')),
                        onPress: _handleDescription,
                    },
                ],
                {
                    type: 'default',
                },
            );
        } else {
            Alert.prompt(
                capitalizeFirst(t('ln_description')),
                t('ln_description_text'),
                [
                    {
                        text: capitalizeFirst(t('cancel')),
                        onPress: () => {},
                        style: 'cancel',
                    },
                    {
                        text: capitalizeFirst(t('set')),
                        onPress: _handleDescription,
                    },
                ],
                'plain-text',
                '',
                'default',
            );
        }
    };

    const updateAmount = (value: string) => {
        // When newly swapped, the value is reset to new number from user
        // We reset instead of preserve previous top unit value
        // because we assume the user changes unit to get a new value
        // in the new bottom unit and not to preserve the previous value

        // I.e. if the previous bottom was $20, and the user swaps to sats
        // we assume the user wants to set a different value in sats
        setAmount(value);

        setSatsAmount({
            value:
                bottomUnit.name === 'sats'
                    ? new BigNumber(value || 0)
                    : new BigNumber(calculateSatsEquivalent(value)),
            symbol: 'sats',
            name: 'sats',
        });

        setFiatAmount(
            bottomUnit.name !== 'sats'
                ? new BigNumber(value || 0)
                : calculateFiatEquivalent(value),
        );
    };

    const calculateSatsEquivalent = (value: string): string => {
        if (value.length > 0) {
            const fiat = new BigNumber(value);

            // Remember we don't want to handle sub-sats
            return fiat
                .dividedBy(fiatRate.rate.multipliedBy(0.00000001))
                .toFixed(0);
        }

        return '0';
    };

    const calculateFiatEquivalent = (value: string): BigNumber => {
        if (value.length > 0) {
            const satoshis = new BigNumber(value);

            return new BigNumber(
                satoshis
                    .multipliedBy(0.00000001)
                    .multipliedBy(fiatRate.rate)
                    .toFixed(2),
            );
        }

        return new BigNumber(0);
    };

    const swapPolarity = () => {
        let tU = topUnit;
        let bU = bottomUnit;

        // Swap top with bottom values
        updateAmount(amount);

        // Swap top with bottom units
        if (bottomUnit?.name === 'sats') {
            setTopUnit(bU);
            setBottomUnit(tU);

            // Update amounts
            // Ensure we aren't prepending a 0
            setAmount(tU.value.toString() === '0' ? '' : tU.value.toString());
        } else {
            // Swap top with bottom units
            setTopUnit(bU);
            setBottomUnit(tU);

            // Update amounts
            // Ensure we aren't prepending a 0
            setAmount(bU.value.toString() === '0' ? '' : bU.value.toString());
        }
    };

    const renderFiatAmount = (fontSize: string) => {
        return (
            <>
                <DisplayFiatAmount
                    amount={formatFiat(fiatAmount)}
                    isApprox={topUnit?.name !== 'sats' && amount.length > 0}
                    fontSize={fontSize}
                />
            </>
        );
    };

    const renderSatAmount = (fontSize: string) => {
        return satsAmount.value.gte(SATS_TO_BTC_RATE) ? (
            <DisplayBTCAmount
                amount={satsAmount.value}
                fontSize={fontSize}
                isApprox={bottomUnit.name !== 'sats' && amount.length > 0}
            />
        ) : (
            <DisplaySatsAmount
                amount={satsAmount.value}
                fontSize={fontSize}
                isApprox={bottomUnit.name !== 'sats' && amount.length > 0}
            />
        );
    };

    const routeToOnchainReceive = () => {
        navigation.dispatch(
            CommonActions.navigate({
                name: 'Receive',
                params: {
                    sats: satsAmount.value.toString(),
                    fiat: fiatAmount.toString(),
                    amount: amount,
                    lnDescription: lnInvoiceDesc,
                    breezServicesNotInitialized: breezServicesNotInitialized,
                },
            }),
        );
    };

    const handleRoute = async () => {
        if (route.params?.boltNFCMode) {
            navigation.dispatch(
                CommonActions.navigate('WalletRoot', {
                    screen: 'BoltNFC',
                    params: {
                        amountMsat: satsAmount.value
                            .multipliedBy(1_000)
                            .toNumber(),
                        description: lnInvoiceDesc,
                        fromQuickActions: true,
                        satsUnit: bottomUnit.name === 'sats',
                    },
                }),
            );

            return;
        }

        if (walletType === 'unified') {
            // Network check
            const _netInfo = await netInfo.fetch();
            if (!checkNetworkIsReachable(_netInfo)) {
                routeToOnchainReceive();
                return;
            }

            if (!shouldSkip && !breezServicesNotInitialized) {
                const channelOpenFee = await openChannelFee({
                    amountMsat: satsAmount.value.multipliedBy(1_000).toNumber(),
                });

                const info = await nodeInfo();
                const beyondMaxLiquidity = satsAmount.value.gte(
                    info.inboundLiquidityMsats / 1_000,
                );

                const feeSats = (channelOpenFee.feeMsat as number) / 1_000;

                // Warn user that amount will trigger a new channel open
                // In cases were first tx or if larger than channel liquidity
                if (beyondMaxLiquidity && feeSats > 0) {
                    actionAlert(
                        capitalizeFirst(t('channel_opening')),
                        e('new_channel_open_warn', {
                            n: feeSats,
                            fiat: `${appFiatCurrency.symbol} ${normalizeFiat(
                                new BigNumber(feeSats),
                                fiatRate.rate,
                            )}`,
                        }),
                        t('ok'),
                        capitalizeFirst(t('cancel')),
                        () => {
                            navigation.dispatch(
                                CommonActions.navigate({
                                    name: 'Receive',
                                    params: {
                                        sats: satsAmount.value.toString(),
                                        fiat: fiatAmount.toString(),
                                        amount: amount,
                                        lnDescription: lnInvoiceDesc,
                                    },
                                }),
                            );
                        },
                    );
                }
            } else {
                routeToOnchainReceive();
                return;
            }
        }

        routeToOnchainReceive();
        return;
    };

    return (
        <SafeAreaView
            edges={['top', 'bottom', 'right', 'left']}
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View
                style={[tailwind('w-full h-full items-center justify-center')]}>
                <View
                    style={[
                        tailwind(
                            `w-5/6 items-center justify-center ${
                                isLightning ? 'flex' : 'flex flex-row'
                            } absolute top-6`,
                        ),
                    ]}>
                    <PlainButton
                        style={[
                            tailwind(
                                `absolute left-0 z-10 ${
                                    isLightning ? 'top-0' : ''
                                } `,
                            ),
                        ]}
                        onPress={() => {
                            navigation.dispatch(CommonActions.goBack());
                        }}>
                        <Close fill={ColorScheme.SVG.Default} width={32} />
                    </PlainButton>
                    <Text
                        style={[
                            tailwind('text-sm text-center w-full font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {capitalizeFirst(t('receive'))}
                    </Text>

                    {/* Invoice description */}
                    {isLightning && (
                        <PlainButton onPress={updateDescription}>
                            <View
                                style={[
                                    tailwind(
                                        'items-center mt-4 rounded-full px-4 py-1 flex-row',
                                    ),
                                    {
                                        backgroundColor:
                                            ColorScheme.Background.Greyed,
                                    },
                                ]}>
                                <VText
                                    style={[
                                        tailwind(
                                            'text-sm text-center mr-2 font-bold',
                                        ),
                                        {
                                            color: lnInvoiceDesc
                                                ? ColorScheme.Text.Default
                                                : ColorScheme.Text.DescText,
                                        },
                                    ]}>
                                    {t('ln_description')}
                                </VText>
                                <BottomArrow
                                    width={16}
                                    fill={
                                        lnInvoiceDesc
                                            ? ColorScheme.SVG.Default
                                            : ColorScheme.SVG.GrayFill
                                    }
                                />
                            </View>
                        </PlainButton>
                    )}

                    {isLightning && lnInvoiceDesc.length > 0 && (
                        <View style={[tailwind('mt-3 w-5/6 items-center')]}>
                            <VTextSingle
                                style={[
                                    tailwind('text-sm'),
                                    {color: ColorScheme.Text.DescText},
                                ]}>
                                {lnInvoiceDesc}
                            </VTextSingle>
                        </View>
                    )}
                </View>

                {/* Screen for amount */}
                <View
                    style={[
                        tailwind(
                            'w-full items-center flex justify-center flex -mt-48',
                        ),
                    ]}>
                    {/* Top unit */}
                    <View style={[tailwind('opacity-40 mb-2')]}>
                        {!(topUnit?.name === 'sats')
                            ? renderFiatAmount('text-base')
                            : renderSatAmount('text-base')}
                    </View>

                    {/* Bottom unit */}
                    <View>
                        <PlainButton
                            onPress={() => {
                                swapPolarity();
                            }}>
                            {bottomUnit?.name === 'sats'
                                ? renderSatAmount('text-4xl')
                                : renderFiatAmount('text-4xl')}
                        </PlainButton>
                    </View>
                </View>

                {isLightning &&
                    satsAmount.value.gte(maxReceivableAmount) &&
                    !maxReceivableAmount.isZero() && (
                        <View
                            style={[
                                tailwind('mt-12 w-5/6 rounded-sm px-4 py-2'),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                },
                            ]}>
                            <VText
                                style={[
                                    tailwind('text-sm text-center'),
                                    {
                                        color: ColorScheme.Text.GrayText,
                                    },
                                ]}>
                                {t('max_receivable_lightning', {
                                    sats: formatSats(maxReceivableAmount),
                                })}
                            </VText>
                        </View>
                    )}

                {/* Number pad for input amount */}
                <AmountNumpad
                    amount={amount}
                    onAmountChange={updateAmount}
                    isSats={bottomUnit.name === 'sats'}
                />

                {/* Continue button */}
                <View
                    style={[
                        tailwind(
                            `absolute w-5/6 ${
                                disableContinueButtton ? 'opacity-40' : ''
                            }`,
                        ),
                        {bottom: NativeWindowMetrics.bottom},
                    ]}>
                    <LongButton
                        disabled={disableContinueButtton}
                        onPress={handleRoute}
                        title={
                            shouldSkip
                                ? skipText
                                : capitalizeFirst(t('continue'))
                        }
                        textColor={ColorScheme.Text.Alt}
                        backgroundColor={ColorScheme.Background.Inverted}
                    />
                </View>
                <Toast config={toastConfig as ToastConfig} />
            </View>
        </SafeAreaView>
    );
};

export default RequestAmount;
