/* eslint-disable react-native/no-inline-styles */
import React, {
    useMemo,
    useCallback,
    ReactElement,
    useState,
    useContext,
    useEffect,
} from 'react';
import {
    useColorScheme,
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import VText from '../../components/text';

import {
    useNavigation,
    StackActions,
    CommonActions,
} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';
import NativeDims from '../../constants/NativeWindowMetrics';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';
import {useSharedValue} from 'react-native-reanimated';

import NativeWindowMetrics from '../../constants/NativeWindowMetrics';

import Color from '../../constants/Color';

import Close from '../../assets/svg/x-24.svg';
import AlertIcon from '../../assets/svg/alert-16.svg';

import {LongBottomButton, PlainButton} from '../../components/button';

import Carousel from 'react-native-reanimated-carousel';
import {useTranslation} from 'react-i18next';
import {DisplaySatsAmount} from '../../components/balance';
import BigNumber from 'bignumber.js';

import {addCommas, i18nNumber, normalizeFiat} from '../../modules/transform';

import {capitalizeFirst} from '../../modules/transform';
import {AppStorageContext} from '../../class/storageContext';

import Success from '../../assets/svg/check-circle-fill-24.svg';
import Failed from '../../assets/svg/x-circle-fill-24.svg';

import {Toasts} from '@backpackapp-io/react-native-toast';
import {LiberalToast} from '../../components/toast';

import {getPrivateDescriptors} from '../../modules/descriptors';
import {TComboWallet} from '../../types/wallet';
import {SingleBDKSend, psbtFromInvoice} from '../../modules/bdk';
import {PartiallySignedTransaction} from 'bdk-rn';
import {openChannelFee} from '@breeztech/react-native-breez-sdk';

type Props = NativeStackScreenProps<WalletParamList, 'SwapIn'>;
type Slide = () => ReactElement;

const SwapIn = ({route}: Props) => {
    const ColorScheme = Color(useColorScheme());

    const {
        getWalletData,
        currentWalletID,
        fiatRate,
        electrumServerURL,
        mempoolInfo,
        appFiatCurrency,
        appLanguage,
        isAdvancedMode,
    } = useContext(AppStorageContext);
    const wallet = getWalletData(currentWalletID);

    const navigation = useNavigation();
    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const [loadingTX, setLoadingTX] = useState<boolean>(false);
    const [loadingChanFees, setLoadingChanFees] = useState<boolean>(true);
    const [statusMessage, setStatusMessage] = useState<string>();
    const [failedTx, setFailedTx] = useState<boolean>(false);
    const [errMessage, setErrMessage] = useState<string>();
    const [txID, setTxID] = useState<string>();
    const [channelOpeningFees, setChannelOpeningFees] = useState<number>(0);
    const [_uPsbt, _setPsbt] = useState<PartiallySignedTransaction>();
    const [_uPsbtVSize, _setUPVS] = useState<number>();

    // For now, only single sends are supported
    // Update wallet descriptors to private version
    const descriptors = getPrivateDescriptors(wallet.privateDescriptor);

    const swapInfo = route.params.swapMeta;
    const carouselRef = React.useRef<{ next: () => void }>(null);
    const progressValue = useSharedValue(0);

    const CardColor = ColorScheme.WalletColors[wallet.type][wallet.network];

    const handleCloseButton = () => {
        navigation.dispatch(StackActions.popToTop());
    };

    const getChannelOpeningFees = useCallback(async () => {
        try {
            const amountMsat =
                (route.params.invoiceData.options?.amount as number) * 1_000;

            openChannelFee({amountMsat})
                .then(feeResp => {
                    setChannelOpeningFees((feeResp.feeMsat as number) / 1_000);
                    setLoadingChanFees(false);
                })
                .catch((e: any) => {
                    console.log('[SwapIn] Error: ', e.message);
                });
        } catch (e: any) {
            console.log('[SwapIn] Error: ', e.message);
        }
    }, [route.params.invoiceData.options?.amount]);

    const generatePsbt = useCallback(async () => {
        setLoadingTX(true);

        psbtFromInvoice(
            descriptors,
            mempoolInfo.fastestFee,
            route.params.invoiceData,
            wallet as TComboWallet,
            new BigNumber(wallet.balance.onchain),
            electrumServerURL,
            (e: any) => {
                LiberalToast(capitalizeFirst(t('error')), t('tx_fail_creation_error'), {
                    duration: 2000,
                });

                console.log('[Send] Error creating transaction: ', e.message);
                setFailedTx(true);
            },
        )
            .then(async (value: any) => {
                _setPsbt(value);
                const vsize = (await value.extractTx()).vsize();

                _setUPVS(vsize);
                setLoadingTX(false);
            })
            .catch((e: any) => {
                setLoadingTX(false);
                console.log('[PSBT] error: ', e.message);
            });
    }, [
        descriptors,
        electrumServerURL,
        mempoolInfo.fastestFee,
        route.params.invoiceData,
        t,
        wallet,
    ]);

    const setPsbtVsize = useCallback(async () => {
        const psbt = _uPsbt as PartiallySignedTransaction;

        try {
            const vsize = await (await psbt.extractTx()).size();

            _setUPVS(vsize);
        } catch (e: any) {
            console.log('[Error]: ', e.message);
        }
    }, [_uPsbt]);

    const sendTx = useCallback(async () => {
        carouselRef.current?.next();

        try {
            let _w = {
                ...wallet,
                externalDescriptor: descriptors.external,
                internalDescriptor: descriptors.internal,
            };

            // TODO: tag this outgoing tx as a swap (SwapIn)
            // So we show in wallet list of tx that this is a swap in progress
            // We expect a signed PSBT to be passed in
            const {broadcasted, psbt, errorMessage} = await SingleBDKSend(
                (_uPsbt as PartiallySignedTransaction).base64,
                _w as TComboWallet,
                electrumServerURL,
                (msg: string) => {
                    setStatusMessage(t(msg));
                },
            );

            const _txID = (await psbt?.txid()) as string;

            if (errorMessage) {
                setErrMessage(errorMessage);
            } else {
                console.log('[swapIn] Broadcasted: ', broadcasted, _txID);

                setTxID(_txID);
            }
        } catch (e: any) {
            setFailedTx(true);
            setErrMessage(e.message);
        }
    }, [
        _uPsbt,
        descriptors.external,
        descriptors.internal,
        electrumServerURL,
        t,
        wallet,
    ]);

    useEffect(() => {
        // TODO: Ensure tx also created here? so we can display fee in fiat
        getChannelOpeningFees();
        generatePsbt();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (_uPsbt !== null) {
            setPsbtVsize();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [_uPsbt]);

    // Panels
    // Breakdown of the swap out process
    const breakdownPanel = useCallback((): ReactElement => {
        return (
            <View className="w-full h-full items-center">
                {/* Main breakdown */}
                <View
                    className="w-5/6 mt-6 items-center justify-center flex rounded-md py-2"
                    style={{
                        borderColor: ColorScheme.Background.Greyed,
                        borderWidth: 1,
                        marginTop: 128,
                    }}>
                    {/* LN amount */}
                    <View className="w-full px-4 py-2">
                        <VText
                            className="w-full text-sm font-semibold mb-1"
                            style={{
                                color: ColorScheme.Text.Default,
                                textAlign:
                                    langDir === 'right' ? 'right' : 'left',
                            }}>
                            {capitalizeFirst(t('recv_amount'))}
                        </VText>
                        <View
                            className={
                                `${
                                    langDir === 'right'
                                        ? 'flex-row-reverse'
                                        : 'flex-row'
                                } mt-2`
                            }>
                            <DisplaySatsAmount
                                textColor={ColorScheme.Text.DescText}
                                amount={
                                    new BigNumber(
                                        route.params.invoiceData.options
                                            ?.amount as number,
                                    )
                                }
                                fontSize={'text-sm'}
                            />
                            <View
                                className={
                                    `rounded-full px-4 py-1 ${
                                        langDir === 'right'
                                            ? 'mr-2'
                                            : 'ml-2'
                                    }`
                                }
                                style={{
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                }}>
                                <Text
                                    className="text-sm font-bold"
                                    style={{
                                        color: ColorScheme.Text.Default,
                                    }}>
                                    {`${appFiatCurrency.symbol} ${normalizeFiat(
                                        new BigNumber(
                                            route.params.invoiceData.options
                                                ?.amount as number,
                                        ),
                                        new BigNumber(fiatRate.rate),
                                    )}`}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Onchain receiving address */}
                    <View className="w-full px-4 py-2">
                        <VText
                            className="w-full text-sm font-semibold"
                            style={{
                                color: ColorScheme.Text.Default,
                                textAlign:
                                    langDir === 'right' ? 'right' : 'left',
                            }}>
                            {t('onchain_address')}
                        </VText>
                        <VText
                            className="w-full text-sm mt-2"
                            style={{
                                color: ColorScheme.Text.DescText,
                                textAlign:
                                    langDir === 'right' ? 'right' : 'left',
                            }}>
                            {swapInfo.address}
                        </VText>
                    </View>

                    {/* onchain fee */}
                    <View className="w-full mt-2 px-4 py-2">
                        <VText
                            className="w-full text-sm font-bold mb-1"
                            style={{
                                color: ColorScheme.Text.Default,
                                textAlign:
                                    langDir === 'right' ? 'right' : 'left',
                            }}>
                            {t('onchain_fee_rate')}
                        </VText>
                        {_uPsbt && _uPsbtVSize ? (
                            <View
                                className={
                                    `${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } mt-2 items-center`
                                }>
                                <Text
                                    style={[
                                        {color: ColorScheme.Text.DescText},
                                    ]}>
                                    {`${addCommas(
                                        mempoolInfo.fastestFee.toString(),
                                    )} sats/vB`}
                                </Text>
                                <View
                                    className={
                                        `rounded-full px-4 py-1 ${
                                            langDir === 'right'
                                                ? 'mr-2'
                                                : 'ml-2'
                                        }`
                                    }
                                    style={{
                                        backgroundColor:
                                            ColorScheme.Background.Greyed,
                                    }}>
                                    <Text
                                        className="text-sm font-bold"
                                        style={{
                                                color: ColorScheme.Text.Default,
                                        }}>
                                        {`~${
                                            appFiatCurrency.symbol
                                        } ${normalizeFiat(
                                            new BigNumber(
                                                (_uPsbtVSize as number) *
                                                    mempoolInfo.fastestFee,
                                            ),
                                            new BigNumber(fiatRate.rate),
                                        )}`}
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View
                                className="mt-2 rounded-sm"
                                style={{
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                    height: 32,
                                    width: 128,
                                }}
                            />
                        )}
                    </View>

                    {/* Amount to swap */}
                    {loadingChanFees ? (
                        <View
                            className="self-start ml-4 w-5/6 rounded-sm mt-4 mb-4"
                            style={{
                                backgroundColor:
                                    ColorScheme.Background.Greyed,
                                height: 48,
                            }}
                        />
                    ) : (
                        <View
                            className="w-full mt-2 justify-start px-4 py-2">
                            <VText
                                className="w-full text-sm font-bold mb-1"
                                style={{
                                    color: ColorScheme.Text.Default,
                                    textAlign:
                                        langDir === 'right'
                                        ? 'right'
                                        : 'left',
                                }}>
                                {t('channel_fee')}
                            </VText>
                            {channelOpeningFees > 0 ? (
                                <View
                                    className={
                                        `${
                                            langDir === 'right'
                                                ? 'flex-row-reverse'
                                                : 'flex-row'
                                        } mt-2`}>
                                    <DisplaySatsAmount
                                        textColor={ColorScheme.Text.DescText}
                                        amount={
                                            new BigNumber(channelOpeningFees)
                                        }
                                        fontSize={'text-sm'}
                                    />
                                    <View
                                        className={
                                            `rounded-full px-4 py-1 ${
                                                langDir === 'right'
                                                    ? 'mr-2'
                                                    : 'ml-2'
                                            }`
                                        }
                                        style={{
                                            backgroundColor:
                                                ColorScheme.Background
                                                .Greyed,
                                        }}>
                                        <Text
                                            className="text-sm font-bold"
                                            style={{
                                                color: ColorScheme.Text
                                                    .Default,
                                            }}>
                                            {`${
                                                appFiatCurrency.symbol
                                            } ${normalizeFiat(
                                                new BigNumber(
                                                    channelOpeningFees,
                                                ),
                                                new BigNumber(fiatRate.rate),
                                            )}`}
                                        </Text>
                                    </View>
                                </View>
                            ) : (
                                <Text
                                    className="text-sm mt-1 mb-2"
                                    style={{
                                        color: ColorScheme.Text.DescText,
                                        textAlign:
                                            langDir === 'right'
                                                ? 'right'
                                                : 'left',
                                    }}>
                                    -
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Display network congestion */}
                {mempoolInfo.mempoolHighFeeEnv && (
                    <View
                        className={
                            `mt-4 w-5/6 ${
                                langDir === 'right'
                                    ? 'flex-row-reverse'
                                    : 'flex-row'
                            } items-center justify-center`
                        }>
                        <AlertIcon width={16} height={16} fill={CardColor} />
                        <Text
                            className={
                                `${
                                    langDir === 'right'
                                        ? 'mr-2'
                                        : 'ml-2 text-center'
                                } text-sm`
                            }
                            style={{
                                color: CardColor,
                            }}>
                            {t('mempool_high_fee')}
                        </Text>
                    </View>
                )}

                {/* Bottom Button */}
                <View
                    className="absolute items-center w-full"
                    style={{bottom: NativeWindowMetrics.bottomButtonOffset + 24}}>
                    <LongBottomButton
                        disabled={loadingTX || loadingChanFees}
                        onPress={sendTx}
                        backgroundColor={ColorScheme.Background.Inverted}
                        title={capitalizeFirst(t('swap'))}
                        textColor={ColorScheme.Text.Alt}
                    />
                </View>
            </View>
        );
    }, [
        ColorScheme,
        langDir,
        t,
        route.params.invoiceData.options?.amount,
        appFiatCurrency.symbol,
        fiatRate.rate,
        swapInfo.address,
        _uPsbt,
        _uPsbtVSize,
        mempoolInfo.fastestFee,
        mempoolInfo.mempoolHighFeeEnv,
        loadingChanFees,
        channelOpeningFees,
        CardColor,
        loadingTX,
        sendTx,
    ]);

    // Swapping Progress
    const inflightPanel = useCallback((): ReactElement => {
        return (
            <View className="w-full h-full items-center">
                {loadingTX && (
                    <View
                        className="items-center justify-center h-full w-full"
                        style={{marginTop: -48}}>
                        <ActivityIndicator
                            color={ColorScheme.Text.Default}
                            size="small"
                        />
                        <Text
                            className="text-sm mt-2"
                            style={{color: ColorScheme.Text.DescText}}>
                            {statusMessage}
                        </Text>
                    </View>
                )}

                {!failedTx && !loadingTX && (
                    <>
                        <View style={[{marginTop: 128}]}>
                            <Success
                                height={128}
                                width={128}
                                fill={ColorScheme.SVG.Default}
                            />
                        </View>

                        <View
                            className="w-5/6 mt-6 items-center justify-center flex rounded-md py-2"
                            style={{
                                borderColor: ColorScheme.Background.Greyed,
                                borderWidth: 1,
                            }}>
                            {/* TXID */}
                            <View
                                className="w-full justify-start px-4 py-2">
                                <VText
                                    className="w-full text-sm font-semibold mb-1"
                                    style={{
                                        color: ColorScheme.Text.Default,
                                    }}>
                                    {capitalizeFirst(t('tx_id'))}
                                </VText>
                                <VText
                                    className="w-full text-sm"
                                    style={{
                                        color: ColorScheme.Text.DescText,
                                    }}>
                                    {txID}
                                </VText>
                            </View>

                            {/* LN amount */}
                            <View className="w-full px-4 py-2">
                                <VText
                                    className="w-full text-sm font-semibold mb-1"
                                    style={{
                                        color: ColorScheme.Text.Default,
                                        textAlign:
                                            langDir === 'right'
                                                ? 'right'
                                                : 'left',
                                    }}>
                                    {capitalizeFirst(t('recv_amount'))}
                                </VText>
                                <View
                                    className={
                                        `${
                                            langDir === 'right'
                                                ? 'flex-row-reverse'
                                                : 'flex-row'
                                        } mt-2`
                                    }>
                                    <DisplaySatsAmount
                                        textColor={ColorScheme.Text.DescText}
                                        amount={
                                            new BigNumber(
                                                route.params.invoiceData.options
                                                    ?.amount as number,
                                            )
                                        }
                                        fontSize={'text-sm'}
                                    />
                                    <View
                                        className={
                                            `rounded-full px-4 py-1 ${
                                                langDir === 'right'
                                                    ? 'mr-2'
                                                    : 'ml-2'
                                            }`
                                        }
                                        style={{
                                            backgroundColor:
                                                ColorScheme.Background
                                                    .Greyed,
                                        }}>
                                        <Text
                                            className="text-sm font-bold"
                                            style={{
                                                color: ColorScheme.Text
                                                    .Default,
                                            }}>
                                            {`${
                                                appFiatCurrency.symbol
                                            } ${normalizeFiat(
                                                new BigNumber(
                                                    route.params.invoiceData
                                                        .options
                                                        ?.amount as number,
                                                ),
                                                new BigNumber(fiatRate.rate),
                                            )}`}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Lock Height */}
                            {isAdvancedMode && <View
                                className="w-full justify-start px-4 py-2">
                                <VText
                                    className="w-full text-sm font-semibold mb-1"
                                    style={{
                                        color: ColorScheme.Text.Default,
                                    }}>
                                    {t('lock_height')}
                                </VText>
                                <VText
                                    className="w-full text-sm"
                                    style={{
                                        color: ColorScheme.Text.DescText,
                                    }}>
                                    {swapInfo.lockHeight}
                                </VText>
                            </View>}
                        </View>

                        <View
                            className="items-center w-5/6 mt-4 flex-row">
                            <Text
                                className="text-sm text-center ml-2"
                                style={{color: ColorScheme.Text.Default}}>
                                {t('swapout_message', {
                                    n: i18nNumber(6, appLanguage.code),
                                })}
                            </Text>
                        </View>

                        <View
                            className="absolute items-center w-full"
                            style={{
                                bottom:
                                    NativeWindowMetrics.bottomButtonOffset +
                                    24,
                            }}>
                            <LongBottomButton
                                disabled={loadingTX}
                                onPress={() => {
                                    navigation.dispatch(
                                        CommonActions.navigate('WalletRoot', {
                                            screen: 'WalletView',
                                            params: {
                                                reload: true,
                                            },
                                        }),
                                    );
                                }}
                                backgroundColor={
                                    ColorScheme.Background.Inverted
                                }
                                title={capitalizeFirst(t('done'))}
                                textColor={ColorScheme.Text.Alt}
                            />
                        </View>
                    </>
                )}

                {failedTx && !loadingTX && (
                    <View className="items-center" style={{marginTop: 128}}>
                        <Failed
                            width={128}
                            height={128}
                            fill={ColorScheme.SVG.Default}
                        />

                        <Text
                            className="mt-4 text-center text-sm"
                            style={{color: ColorScheme.Text.Default}}>
                            {errMessage}
                        </Text>
                    </View>
                )}
            </View>
        );
    }, [loadingTX, ColorScheme.Text.Default, ColorScheme.Text.DescText, ColorScheme.Text.Alt, ColorScheme.SVG.Default, ColorScheme.Background.Greyed, ColorScheme.Background.Inverted, statusMessage, failedTx, t, txID, langDir, route.params.invoiceData.options?.amount, appFiatCurrency.symbol, fiatRate.rate, isAdvancedMode, swapInfo.lockHeight, appLanguage.code, errMessage, navigation]);

    const panels = useMemo(
        (): Slide[] => [breakdownPanel, inflightPanel],
        [breakdownPanel, inflightPanel],
    );

    return (
        <SafeAreaView
            edges={['left', 'right', 'bottom']}
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View
                className="w-full h-full items-center justify-center">
                <View
                    className="absolute top-6 z-10 w-full flex-row items-center justify-center">
                    <PlainButton
                        onPress={handleCloseButton}
                        className="absolute z-10 left-6">
                        <Close fill={ColorScheme.SVG.Default} />
                    </PlainButton>
                    <Text
                        className="text-base font-bold"
                        style={{color: ColorScheme.Text.Default}}>
                        {capitalizeFirst(t('swap_in'))}
                    </Text>
                </View>

                {/* Carousel */}
                <View
                    className="h-full w-full items-center"
                    style={[
                        styles.carouselContainer,
                        {zIndex: -9},
                    ]}>
                    <Carousel
                        ref={carouselRef}
                        style={[styles.carouselStyle]}
                        data={panels}
                        width={NativeDims.width}
                        // Adjust height for iOS
                        // to account for top stack height
                        height={NativeDims.height}
                        loop={false}
                        panGestureHandlerProps={{
                            activeOffsetX: [-10, 10],
                        }}
                        testID="ReceiveSlider"
                        renderItem={({index}): ReactElement => {
                            const Slide = panels[index];
                            return <Slide key={index} />;
                        }}
                        onProgressChange={(_, absoluteProgress): void => {
                            progressValue.value = absoluteProgress;
                        }}
                        enabled={false}
                    />
                </View>

                <Toasts extraInsets={{top: NativeWindowMetrics.height * -0.075}} />
            </View>
        </SafeAreaView>
    );
};

export default SwapIn;

const styles = StyleSheet.create({
    carouselContainer: {
        flex: 1,
    },
    carouselStyle: {
        alignItems: 'center',
    },
});
