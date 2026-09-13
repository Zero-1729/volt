/* eslint-disable react-native/no-inline-styles */
import React, {
    useState,
    useContext,
    useEffect,
    useCallback,
    useMemo,
} from 'react';
import {
    Text,
    View,
    useColorScheme,
    Platform,
    StyleSheet,
    StatusBar,
} from 'react-native';

import VText from '../../components/text';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {InitStackParamList} from '../../Navigation';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation, CommonActions} from '@react-navigation/native';

import {AppStorageContext} from '../../class/storageContext';

import {useTranslation} from 'react-i18next';

import netInfo, {useNetInfo} from '@react-native-community/netinfo';
import {checkNetworkIsReachable} from '../../modules/wallet-utils';

import decodeURI from 'bip21';
import {
    getMiniWallet,
    checkInvoiceAndWallet,
    decodeInvoiceType,
    getCountdownStart,
    isInvoiceExpired,
} from '../../modules/wallet-utils';
import {capitalizeFirst, convertBTCtoSats} from '../../modules/transform';

import Color from '../../constants/Color';

import BigNumber from 'bignumber.js';

import ExpiryTimer from '../../components/expiry';
import {LongBottomButton, PlainButton} from '../../components/button';
import {FiatBalance, DisplaySatsAmount} from '../../components/balance';

import {WalletCard} from '../../components/shared';
import {TInvoiceData} from '../../types/wallet';

import NativeWindowMetrics from '../../constants/NativeWindowMetrics';
import {LnInvoice, nodeInfo, parseInvoice} from '@breeztech/react-native-breez-sdk';

import {Toasts} from '@backpackapp-io/react-native-toast';
import {LiberalToast} from '../../components/toast';

type Props = NativeStackScreenProps<InitStackParamList, 'PayInvoice'>;

const PayInvoice = ({route}: Props) => {
    const ColorScheme = Color(useColorScheme());

    const {t} = useTranslation('wallet');
    const {t: e} = useTranslation('errors');

    const navigation = useNavigation();
    const [bolt11, setBolt11] = useState<LnInvoice>();
    const [isLightning, setIsLightning] = useState(false);
    const [decodedInvoice, setDecodedInvoice] = useState<TInvoiceData>(
        {} as TInvoiceData,
    );
    const [expiryEpoch, setExpiryEpoch] = useState<number>();
    const [isExpired, setIsExpired] = useState(false);
    const networkState = useNetInfo();
    const isNetOn = checkNetworkIsReachable(networkState);

    const [paymentToSelf, setPaymentToSelf] = useState(false);

    const {hideTotalBalance, getWalletData, currentWalletID} =
        useContext(AppStorageContext);
    const wallet = getWalletData(currentWalletID);

    const topPlatformOffset = 6 + (Platform.OS === 'android' ? 12 : 0);
    const cardHeight = 220;

    const sats = decodedInvoice.options?.amount
        ? decodedInvoice.options?.amount * 100_000_000
        : undefined;

    const amount = isLightning
        ? bolt11?.amountMsat
            ? bolt11?.amountMsat / 1_000
            : undefined
        : sats;

    const hasMessage = decodedInvoice.options?.message || bolt11?.description;
    const messageText = !isLightning
        ? decodedInvoice.options?.message
        : bolt11?.description;

    const displayExpiry = useMemo(() => {
        if (!(expiryEpoch && isLightning)) {
            return <></>;
        }

        return (
            <View className="absolute right-0 justify-center">
                <ExpiryTimer expiryDate={expiryEpoch} />
            </View>
        );
    }, [expiryEpoch, isLightning]);

    const decodeInvoice = useCallback((invoice: string) => {
        // Only handling Bolt11 Lightning invoices
        return decodeURI.decode(invoice) as TInvoiceData;
    }, []);

    const decodeBolt11 = useCallback(async (invoice: string) => {
        const decodedBolt11 = await parseInvoice(invoice);
        setBolt11(decodedBolt11);
        setIsLightning(true);

        // Check and report self payment (LN)
        const _nodeID = await nodeInfo();

        // Check if bolt11 is self
        if (bolt11?.payeePubkey === _nodeID.id) {
            setPaymentToSelf(true);
        }

        setExpiryEpoch(
            getCountdownStart(
                decodedBolt11.timestamp as number,
                decodedBolt11.expiry as number,
            ),
        );

        setIsExpired(
            isInvoiceExpired(
                decodedBolt11.timestamp as number,
                decodedBolt11.expiry as number,
            ),
        );
    }, [bolt11?.payeePubkey]);

    const handleInvoiceType = useCallback(
        async (invoice: string) => {
            const invoiceType = await decodeInvoiceType(invoice);

            if (
                invoiceType.type === 'lightning' ||
                invoiceType.type === 'bitcoin' ||
                invoiceType.type === 'unified'
            ) {
                let invoiceBolt11!: string;
                let btcInvoice!: string;

                // Handle unified BIP21 QR
                if (invoiceType.type === 'unified') {
                    const embededBolt11 =
                        invoiceType.invoice?.split('&lightning=');

                    if (embededBolt11.length > 1) {
                        invoiceBolt11 =
                            invoiceType.invoice?.split('&lightning=').pop() ??
                            '';
                    } else {
                        btcInvoice =
                            invoiceType.invoice
                                ?.split('&lightning=')[0]
                                .toLowerCase() ?? '';
                    }
                }

                // Handle Bolt11 Invoice
                if (
                    (invoiceType.type === 'lightning' &&
                        invoiceType.spec === 'bolt11') ||
                    invoiceBolt11
                ) {
                    decodeBolt11(
                        invoiceBolt11 ? invoiceBolt11 : route.params?.invoice,
                    );
                    return;
                }

                // If LN report we aren't supporting it yet
                if (
                    !(invoiceType?.spec === 'bolt11') &&
                    invoiceType.type === 'lightning'
                ) {
                    LiberalToast(capitalizeFirst(t('error')), e('unsupported_invoice_type'), {
                        duration: 3000,
                    });

                    navigation.dispatch(CommonActions.navigate('HomeScreen'));

                    return;
                }

                // handle bitcoin BIP21 invoice
                setDecodedInvoice(
                    decodeInvoice(
                        btcInvoice ? btcInvoice : route.params?.invoice,
                    ),
                );
            } else {
                LiberalToast(capitalizeFirst(t('error')), e('invalid_invoice_error'), {
                    duration: 3000,
                });

                navigation.dispatch(CommonActions.navigate('HomeScreen'));
            }
        },
        [decodeBolt11, decodeInvoice, e, navigation, route.params?.invoice, t],
    );

    const handleRoute = useCallback(async () => {
        const _wallet = getMiniWallet(wallet);
        const invoiceHasAmount = !!decodedInvoice?.options?.amount;

        // Check network connection first
        const _netInfo = await netInfo.fetch();
        if (!checkNetworkIsReachable(_netInfo)) {
            LiberalToast(capitalizeFirst(t('error')), e('no_internet_message'), {
                duration: 3000,
            });
            return;
        }

        // Handle ln invoice
        if (isLightning) {
            navigation.dispatch(
                CommonActions.navigate('WalletRoot', {
                    screen: 'Send',
                    params: {
                        wallet: _wallet,
                        feeRate: 0,
                        dummyPsbtVsize: 0,
                        invoiceData: null,
                        bolt11: bolt11,
                    },
                }),
            );

            return;
        }

        // Check wallet and invoice
        if (
            checkInvoiceAndWallet(_wallet, decodedInvoice, (msg: string) => {
                LiberalToast(capitalizeFirst(t('error')), e(msg), {
                    duration: 2500,
                });

                // route home
                navigation.dispatch(
                    CommonActions.navigate('HomeScreen', {
                        screen: 'HomeScreen',
                    }),
                );

                return;
            })
        ) {
            // Navigate handling
            if (invoiceHasAmount) {
                // convert btc to sats
                if (decodedInvoice.options) {
                    decodedInvoice.options.amount = Number(
                        convertBTCtoSats(
                            decodedInvoice.options?.amount?.toString() as string,
                        ),
                    );
                }

                navigation.dispatch(
                    CommonActions.navigate('WalletRoot', {
                        screen: 'FeeSelection',
                        params: {
                            invoiceData: decodedInvoice,
                            wallet: _wallet,
                        },
                    }),
                );
            } else {
                navigation.dispatch(
                    CommonActions.navigate('WalletRoot', {
                        screen: 'SendAmount',
                        params: {
                            invoiceData: decodedInvoice,
                            wallet: _wallet,
                            isLightning: isLightning,
                        },
                    }),
                );
            }
        }
    }, [bolt11, decodedInvoice, e, isLightning, navigation, t, wallet]);

    useEffect(() => {
        handleInvoiceType(route.params.invoice);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const invoiceOptionsEmpty = decodedInvoice.options
        ? Object.keys(decodedInvoice.options).length === 0
        : true;

    return (
        <SafeAreaView
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <StatusBar barStyle={ColorScheme.BarStyle.Inverted} />
            <View
                className="h-full w-full items-center justify-start relative"
                style={{backgroundColor: ColorScheme.Background.Primary}}>
                <View
                    className="w-5/6 items-center flex-row justify-between"
                    style={{marginTop: topPlatformOffset}}>
                    <Text
                        className="text-center font-bold text-xl w-full"
                        style={{color: ColorScheme.Text.Default}}>
                        {t('pay_invoice_title')}
                    </Text>
                    {displayExpiry}
                </View>

                {/*Display the invoice data */}
                <View
                    className={
                        `${
                            invoiceOptionsEmpty ? 'w-5/6 p-2' : 'w-5/6 p-6'
                        } items-center flex justify-between rounded mt-6`
                    }>
                    {decodedInvoice.options?.label && (
                        <Text
                            numberOfLines={1}
                            ellipsizeMode="middle"
                            className="w-full text-center font-bold text-lg mb-2"
                            style={{
                                color: ColorScheme.Text.Default,
                            }}>
                            {decodedInvoice.options.label}
                        </Text>
                    )}
                    {amount && (
                        <View
                            className="w-full items-center flex mb-2">
                            <FiatBalance
                                balance={amount}
                                loading={false}
                                balanceFontSize={'text-3xl'}
                                fontColor={ColorScheme.Text.Default}
                                ignoreHideBalance={true}
                            />
                            <View
                                className="w-full mt-4"
                                style={[
                                    styles.invoiceLineBreaker,
                                    {
                                        borderColor:
                                            ColorScheme.Background.Inverted,
                                    },
                                ]}
                            />
                            <View
                                className="w-full items-center flex-row justify-between mt-4">
                                <VText
                                    className="font-bold"
                                    style={{color: ColorScheme.Text.Default}}>
                                    Amount
                                </VText>
                                <DisplaySatsAmount
                                    amount={new BigNumber(amount)}
                                    fontSize="text-sm"
                                    isApprox={false}
                                    textColor={ColorScheme.Text.GrayText}
                                />
                            </View>
                        </View>
                    )}

                    {!isLightning && (
                        <View
                            className="w-full items-center flex justify-between mb-4">
                            <VText
                                className="font-bold w-full mb-2"
                                style={{color: ColorScheme.Text.Default}}>
                                Address
                            </VText>
                            <VText
                                className="w-full"
                                style={{color: ColorScheme.Text.GrayText}}>
                                {decodedInvoice.address}
                            </VText>
                        </View>
                    )}

                    {/* Display the message */}
                    {hasMessage && (
                        <>
                            <View
                                className="w-full mb-4 opacity-20"
                                style={[
                                    styles.invoiceLineBreaker,
                                    {
                                        borderColor:
                                            ColorScheme.Background.Inverted,
                                    },
                                ]}
                            />

                            <Text
                                numberOfLines={2}
                                ellipsizeMode="middle"
                                className="font-bold"
                                style={{color: ColorScheme.Text.GrayText}}>
                                {messageText}
                            </Text>
                        </>
                    )}
                </View>

                <View
                    className="w-full items-center justify-center mt-4">
                    <View
                        style={[
                            {
                                height: cardHeight,
                                width: NativeWindowMetrics.width * 0.94,
                            },
                        ]}>
                        <WalletCard
                            withBalance={true}
                            loading={false}
                            maxedCard={
                                wallet.balance.lightning
                                    .plus(wallet.balance.onchain)
                                    .isZero() && wallet.transactions.length > 0
                            }
                            balance={wallet.balance.lightning.plus(
                                wallet.balance.onchain,
                            )}
                            network={wallet.network}
                            isWatchOnly={wallet.isWatchOnly}
                            label={wallet.name}
                            walletType={wallet.type}
                            hideBalance={hideTotalBalance}
                            unit={wallet.units}
                            navCallback={() => {}}
                        />

                        {/* Show offline message */}
                        {!isNetOn && <View className="mt-8">
                            <Text className="text-center text-sm" style={{color: ColorScheme.Text.DescText}}>
                                {e('no_internet_message')}
                                </Text>
                        </View>}

                        {/* Show pay self */}
                        {paymentToSelf && <View className="mt-4">
                            <Text className="text-center text-sm" style={{color: ColorScheme.Text.DescText}}>
                                {t('payment_to_self_detected')}
                                </Text>
                        </View>}
                    </View>
                </View>

                <View
                    className="absolute"
                    style={{bottom: NativeWindowMetrics.bottomButtonOffset + 72}}>
                    <PlainButton
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate('HomeScreen', {
                                    screen: 'HomeScreen',
                                }),
                            );
                        }}>
                        <Text
                            className="text-sm font-bold"
                            style={{color: ColorScheme.Text.DescText}}>
                            {capitalizeFirst(t('cancel'))}
                        </Text>
                    </PlainButton>
                </View>

                <LongBottomButton
                    disabled={
                        isExpired ||
                        !isNetOn ||
                        (!bolt11 && Object.keys(decodedInvoice).length === 0) ||
                        paymentToSelf
                    }
                    title={t('pay_invoice')}
                    textColor={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                    onPress={handleRoute}
                />

                <Toasts extraInsets={{top: NativeWindowMetrics.height * -0.075}} />
            </View>
        </SafeAreaView>
    );
};

export default PayInvoice;

const styles = StyleSheet.create({
    invoiceLineBreaker: {
        borderBottomWidth: 1,
        opacity: 0.1,
    },
});
