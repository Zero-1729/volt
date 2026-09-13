/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    useState,
    useContext,
    useEffect,
    useRef,
} from 'react';
import {
    StyleSheet,
    Text,
    View,
    useColorScheme,
    ActivityIndicator,
    StatusBar,
} from 'react-native';

import VText, {VTextSingle, VTextMulti} from '../../components/text';

import {SafeAreaView} from 'react-native-safe-area-context';

import {AppStorageContext} from '../../class/storageContext';
import {capitalizeFirst, normalizeFiat} from '../../modules/transform';
import BigNumber from 'bignumber.js';

import {FiatBalance, DisplaySatsAmount} from '../../components/balance';

import {useNavigation, CommonActions} from '@react-navigation/native';

import Color from '../../constants/Color';

import {PlainButton, LongBottomButton} from '../../components/button';

import Close from '../../assets/svg/x-24.svg';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';
import NativeWindowMetrics from '../../constants/NativeWindowMetrics';
import {useTranslation} from 'react-i18next';
import ExpiryTimer from '../../components/expiry';

import {Toasts} from '@backpackapp-io/react-native-toast';
import {LiberalToast} from '../../components/toast';

import {
    isInvoiceExpired,
    getCountdownStart,
} from '../../modules/wallet-utils';

import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {biometricAuth} from '../../modules/shared';
import PINPass from '../../components/pinpass';

import { PaymentStatus, SdkEvent_Tags, SendPaymentOptions } from '@breeztech/breez-sdk-spark-react-native';
import { useWallet } from '../../contexts/walletContext';
import { useBreezEvent } from '../../contexts/BreezEventContext';

type Props = NativeStackScreenProps<WalletParamList, 'Send'>;

const SendView = ({route}: Props) => {
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const [loading, setLoading] = useState(false);

    const {
        fiatRate,
        appFiatCurrency,
        isAdvancedMode,
        isBiometricsActive,
    } = useContext(AppStorageContext);

    const { breezEvent } = useBreezEvent();
    const _breezWallet = useWallet();

    const isLightning = !!route.params.bolt11;
    const timestamp = Number(route.params.bolt11?.timestamp);
    const expiry = Number(route.params.bolt11?.expiry);
    const amountMsat = Number(route.params.bolt11?.amountMsat);

    const isExpired = isInvoiceExpired(
        timestamp,
        expiry,
    );

    const expiryEpoch = getCountdownStart(
        timestamp,
        expiry,
    );

    const screenTitle = isLightning
        ? t('lightning_invoice')
        : t('transaction_summary');
    const hasLabel = route.params.invoiceData?.options?.label ?? '';
    const hasMessage = isLightning
        ? route.params.bolt11.description
        : route.params.invoiceData?.options?.message;
    const messageTitle = isLightning
        ? capitalizeFirst(t('invoice_description'))
        : capitalizeFirst(t('message'));
    const messageText = isLightning
        ? route.params.bolt11.description
        : route.params.invoiceData?.options?.message;
    const loadingMessage = isLightning
        ? t('paying')
        : `${capitalizeFirst(t('generating'))} ${
              isAdvancedMode
                  ? t('psbt').toUpperCase()
                  : capitalizeFirst(t('transaction'))
          }...`;

    const sats = new BigNumber(
        isLightning
            ? amountMsat / 1_000
            : route.params.invoiceData?.options?.amount || 0,
    );

    // TODO: fix self-payment detection for both LN and onchain

    const [alreadyPaidInvoice, setAlreadyPaidInvoice] = useState(false);

    // const bottomExportRef = useRef<BottomSheetModal>(null);
    const bottomPINPassRef = useRef<BottomSheetModal>(null);
    // const [openExport, setOpenExport] = useState(-1);
    const [pinIdx, setPINIdx] = useState(-1);

    const togglePINPassModal = () => {
        if (pinIdx !== 1) {
            bottomPINPassRef.current?.present();
        } else {
            bottomPINPassRef.current?.close();
        }
    };

    const handlePINSuccess = async () => {
        handleSend();
        bottomPINPassRef.current?.close();
    };

    const authAndPay = () => {
        if (isBiometricsActive) {
            biometricAuth(
                success => {
                    if (success) {
                        handleSend();
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

        togglePINPassModal();
    };

    // Note: this is just a match check to determine if 'Max' entered in prev screen.
    // For onchain BDK will handle max
    // For Breez, we need to do some work
    const isMax = isLightning
        ? route.params.wallet?.balanceLightning ===
          amountMsat / 1_000
        : route.params.invoiceData?.options?.amount?.toString() ===
          route.params.wallet?.balanceOnchain.toString();

    // TODO: refactor this into wallet service (transaction creation for onchain)

    const preparePayment = async (paymentRequest: string) => {
        try {
            const prepareResponse = await _breezWallet.prepareSendPayment({
                paymentRequest: paymentRequest,
                amount: undefined,
                tokenIdentifier: undefined
            })

            return prepareResponse;
        } catch (error: any) {
            // Report error preparing payment
            LiberalToast(capitalizeFirst(t('error')), error?.inner[0], {
                duration: 5000,
            });
            setLoading(false);
            console.log('[Send] Error preparing payment: ', error?.inner[0]);
        }
    }

    const handleBolt11Payment = async () => {
        // Handle if wallet broke and warn
        const walletBalanceLN = route.params.wallet?.balanceLightning as number;
        const bolt11AmountSats =
            amountMsat / 1_000;

        if (walletBalanceLN < bolt11AmountSats) {
            LiberalToast(capitalizeFirst(t('error')), t('ln_insufficient_funds'), {
                duration: 3000,
            });

            setLoading(false);
            return;
        }

        const paymentRequest = route.params.bolt11?.invoice?.bolt11;
        const prepareResponse = await preparePayment(paymentRequest);

        if (prepareResponse) {
            try {
                const options =  new SendPaymentOptions.Bolt11Invoice({
                    preferSpark: false,
                    completionTimeoutSecs: 10
                })

                const sendResponse = await _breezWallet.sendPayment({
                    prepareResponse,
                    options: options,
                    idempotencyKey: undefined,
                })
                
                const payment = sendResponse.payment
    
                if (payment.status === PaymentStatus.Completed) {
                    setLoading(false);
                } else if (payment.status === PaymentStatus.Failed) {
                    const info = String(payment.details?.inner);
    
                    LiberalToast(capitalizeFirst(t('error')), info, {
                        duration: 2000,
                    });
    
                    setLoading(false);
                    console.log(
                        '[Send] Error sending payment: ',
                        payment.details,
                    );
                }
            } catch (error: any) {
                // Flag as paid invoice already
                if (error.message === 'Invoice already paid') {
                    setAlreadyPaidInvoice(true);
                }

                LiberalToast(capitalizeFirst(t('error')), error?.inner[0], {
                    duration: 5000,
                });
                setLoading(false);
                console.log('[Send] Error sending payment: ', error?.inner[0]);
            }
        }
    };

    const handleSend = async () => {
        if (isLightning) {
            setLoading(true);
            handleBolt11Payment();
        }
    };

    // TODO: open export psbt modal

    // TODO: refactor this into wallet service (Psbt export)
 
    // TODO: refactor this into wallet service (Psbt creation for onchain)

    // TODO: find a way to perform a self-check on invoice

    // TODO: find a way to perform a self-check on onchain address

    // TODO: refactor this into wallet service (psbt call in useEffect)

    useEffect(() => {
        if (breezEvent?.tag === SdkEvent_Tags.PaymentSucceeded) {
            // Serialize BigInt
            const txDetails = {...breezEvent.inner, amount: Number(breezEvent.inner.payment.amount.toString())};
    
            // Route to LN payment status screen
            navigation.dispatch(
                CommonActions.navigate('LNTransactionStatus', {
                    status: true,
                    details: txDetails,
                    tag: breezEvent.tag,
                    detailsType: breezEvent?.inner.payment.paymentType,
                    error: null,
                }),
            );
            return;
        }
    
        if (breezEvent?.tag === SdkEvent_Tags.PaymentFailed) {
            // Serialize BigInt
            const txDetails = {...breezEvent.inner, amount: Number(breezEvent.inner.payment.amount.toString())};
    
            // Route to LN payment status screen
            navigation.dispatch(
                CommonActions.navigate('LNTransactionStatus', {
                    status: false,
                    details: txDetails,
                    tag: breezEvent.tag,
                    detailsType: breezEvent?.inner.payment.paymentType,
                    error: breezEvent.inner,
                }),
            );
            return;
        }
        }, [breezEvent]);

    return (
        <SafeAreaView
            edges={['bottom', 'top', 'left', 'right']}
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <StatusBar barStyle={ColorScheme.BarStyle.Inverted} />
            <View
                className="w-full h-full items-center justify-center"
                style={{backgroundColor: ColorScheme.Background.Primary}}>
                <BottomSheetModalProvider>
                    <View
                        className="absolute top-6 w-full flex-row items-center justify-center">
                        <PlainButton
                            onPress={() =>
                                navigation.dispatch(CommonActions.reset({
                                    index: 0,
                                    routes: [{name: 'HomeScreen'}],
                                }))
                            }
                            className="absolute z-10 left-6">
                            <Close fill={ColorScheme.SVG.Default} />
                        </PlainButton>

                        <Text
                            className="text-sm font-bold"
                            style={{color: ColorScheme.Text.Default}}>
                            {screenTitle}
                        </Text>

                        {isLightning && (
                            <View
                                className="absolute right-6 justify-center">
                                <ExpiryTimer expiryDate={expiryEpoch} />
                            </View>
                        )}
                    </View>
                    <View
                        className={
                            `-mt-12 items-center w-full h-4/6 relative ${
                                isLightning && !hasMessage
                                    ? 'justify-center'
                                    : ''
                            }`
                        }>
                        <View className="items-center">
                            <View className="items-center flex-row">
                                <Text
                                    className="text-base mb-1"
                                    style={{
                                        color: ColorScheme.Text.GrayedText,
                                    }}>
                                    {capitalizeFirst(t('amount'))}
                                </Text>
                            </View>
                            {isMax && (
                                <Text
                                    className="text-4xl"
                                    style={{color: ColorScheme.Text.Default}}>
                                    {capitalizeFirst(t('max'))}
                                </Text>
                            )}
                            {!isMax && (
                                <FiatBalance
                                    balance={sats.toNumber()}
                                    loading={false}
                                    balanceFontSize={'text-4xl'}
                                    fontColor={ColorScheme.Text.Default}
                                    ignoreHideBalance={true}
                                />
                            )}
                            {!isMax && (
                                <DisplaySatsAmount
                                    amount={sats}
                                    fontSize={'text-sm'}
                                    textColor={ColorScheme.Text.DescText}
                                />
                            )}
                        </View>

                        {!isLightning && (
                            <View className="mt-12 w-4/5">
                                <PlainButton onPress={() => {}}>
                                    <View
                                        className="items-center flex-row mb-1">
                                        <VText
                                            className="text-sm w-full mr-2"
                                            style={{
                                                color: ColorScheme.Text
                                                    .GrayedText,
                                            }}>
                                            {capitalizeFirst(t('address'))}
                                        </VText>
                                    </View>
                                </PlainButton>
                                <VText
                                    className="text-sm"
                                    style={{color: ColorScheme.Text.Default}}>
                                    {route.params.invoiceData?.address}
                                </VText>
                            </View>
                        )}

                        {!isLightning && (
                            <View
                                className={
                                    `mt-6 items-center justify-between w-4/5 ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    }`
                                }>
                                <Text
                                    className="text-sm font-bold"
                                    style={{color: ColorScheme.Text.Default}}>
                                    {capitalizeFirst(t('fee'))}
                                </Text>

                                <View
                                    className={
                                        `flex ${
                                            langDir === 'right'
                                                ? 'flex-row-reverse'
                                                : 'flex-row'
                                        } justify-center items-center`
                                    }>
                                    <Text
                                        className="text-sm px-2 mr-2 rounded-full"
                                        style={{
                                            color: ColorScheme.Text
                                                .GrayText,
                                        }}>
                                        {`${
                                            appFiatCurrency.symbol
                                        } ${normalizeFiat(
                                            new BigNumber(
                                                route.params.feeRate *
                                                    route.params.dummyPsbtVSize,
                                            ),
                                            new BigNumber(fiatRate.rate),
                                        )}`}
                                    </Text>

                                    <View
                                        className="items-center justify-center rounded-full px-4 py-1"
                                        style={{
                                            backgroundColor:
                                                ColorScheme.Background
                                                    .Inverted,
                                        }}>
                                        <Text
                                            className="text-sm"
                                            style={{
                                                color: ColorScheme.Text.Alt,
                                            }}>
                                            {`${route.params.feeRate} ${t(
                                                'sat_vbyte',
                                            )}`}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {(hasLabel.length > 0 || isLightning) && (
                            <View
                                className="justify-between w-4/5 mt-4">
                                {hasLabel.length > 0 && (
                                    <View
                                        className={
                                            `${
                                                langDir === 'right'
                                                    ? 'flex-row-reverse'
                                                    : 'flex-row'
                                            } justify-between`
                                        }>
                                        <VText
                                            className="text-sm font-bold"
                                            style={{
                                                color: ColorScheme.Text
                                                    .Default,
                                            }}>
                                            {capitalizeFirst(t('label'))}
                                        </VText>

                                        <VTextSingle
                                            className="text-sm w-3/5 text-right"
                                            style={{
                                                color: ColorScheme.Text
                                                    .DescText,
                                            }}>
                                            {
                                                route.params.invoiceData
                                                    ?.options?.label
                                            }
                                        </VTextSingle>
                                    </View>
                                )}

                                {hasMessage && (
                                    <View
                                        className="w-full mt-6"
                                        style={[
                                            styles.invoiceMessage,
                                        ]}>
                                        <VText
                                            className="text-sm mb-4 font-bold"
                                            style={{
                                                color: ColorScheme.Text
                                                    .Default,
                                            }}>
                                            {messageTitle}
                                        </VText>
                                        <VTextMulti
                                            className="text-sm"
                                            style={{
                                                color: ColorScheme.Text
                                                    .DescText,
                                            }}>
                                            {messageText}
                                        </VTextMulti>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* TODO: consider loading psbt and payself */}
                    {((isLightning && loading) ||
                        (!isLightning)) && (
                            <View
                                className="absolute"
                                style={{
                                    bottom:
                                        NativeWindowMetrics.bottomButtonOffset +
                                        76,
                                }}>
                                <ActivityIndicator
                                    className="mb-4"
                                    size={'small'}
                                    color={ColorScheme.Text.Default}
                                />
                                <Text
                                    className="text-sm"
                                    style={{color: ColorScheme.Text.GrayedText}}>
                                    {loadingMessage}
                                </Text>
                            </View>
                        )}

                    <LongBottomButton
                        disabled={
                            loading ||
                            (!isLightning) ||
                            isExpired ||
                            alreadyPaidInvoice
                        }
                        onPress={authAndPay}
                        title={capitalizeFirst(t('send'))}
                        textColor={ColorScheme.Text.Alt}
                        backgroundColor={ColorScheme.Background.Inverted}
                    />

                    <PINPass
                        pinPassRef={bottomPINPassRef}
                        triggerSuccess={handlePINSuccess}
                        onSelectPinPass={setPINIdx}
                        pinMode={false}
                    />

                    <Toasts extraInsets={{top: NativeWindowMetrics.height * -0.075}} />
                </BottomSheetModalProvider>
            </View>
        </SafeAreaView>
    );
};

export default SendView;

const styles = StyleSheet.create({
    invoiceMessage: {
        height: 128,
    },
});
