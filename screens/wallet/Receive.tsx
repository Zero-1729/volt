/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {
    useContext,
    useState,
    useEffect,
    useMemo,
    useCallback,
} from 'react';
import {
    useColorScheme,
    View,
    Text,
    Share,
    StyleSheet,
    ActivityIndicator,
    Platform,
} from 'react-native';

import bip21 from 'bip21';

import VText from '../../components/text';

import {useNavigation, CommonActions} from '@react-navigation/native';

import {Toasts} from '@backpackapp-io/react-native-toast';
import {LiberalToast} from '../../components/toast';

import ExpiryTimer from '../../components/expiry';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

import {SafeAreaView} from 'react-native-safe-area-context';

import BigNumber from 'bignumber.js';

import {useTranslation} from 'react-i18next';

import {
    capitalizeFirst,
    normalizeFiat,
    SATS_TO_BTC_RATE,
} from '../../modules/transform';

import Color from '../../constants/Color';

import {AppStorageContext} from '../../class/storageContext';

import QRCode from 'react-qr-code';
import Close from '../../assets/svg/x-24.svg';
import Info from '../../assets/svg/info-16.svg';
import NFCIcon from '../../assets/svg/nfc.svg';

import ShareIcon from '../../assets/svg/share-android-16.svg';
import EditIcon from '../../assets/svg/pencil-16.svg';

import Clipboard from '@react-native-clipboard/clipboard';

import {PlainButton} from '../../components/button';

import {checkNetworkIsReachable} from '../../modules/wallet-utils';
import netInfo, {useNetInfo} from '@react-native-community/netinfo';
import NativeWindowMetrics from '../../constants/NativeWindowMetrics';
import { Bolt11InvoiceDetails, InputType_Tags, ReceivePaymentMethod, SdkEvent_Tags } from '@breeztech/breez-sdk-spark-react-native';
import { useWallet } from '../../contexts/walletContext';
import { useBreezEvent } from '../../contexts/BreezEventContext';

// Prop type for params passed to this screen
// from the RequestAmount screen
// TODO: redo entire screen to handle showing onchain vs ln invoices
type Props = NativeStackScreenProps<WalletParamList, 'Receive'>;

const Receive = ({route}: Props) => {
    const ColorScheme = Color(useColorScheme());

    const navigation = useNavigation();

    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const _wallet = useWallet();
    const { breezEvent } = useBreezEvent();

    const satsAmount = new BigNumber(route.params.sats);

    const {
        currentWalletID,
        getWalletData,
        isAdvancedMode,
        appFiatCurrency,
        fiatRate,
    } = useContext(AppStorageContext);

    const walletData = getWalletData(currentWalletID);

    const [mempoolCongested, setMempoolCongested] = useState<boolean>(false);

    // For now only support bolt12 invoice
    const [bip21Uri, setBip21Uri] = useState<string>('');
    const [bolt11, setBolt11] = useState<Bolt11InvoiceDetails>();
    const [feeMessage, setFeeMessage] = useState<string>('');
    const [loadingQr, setLoadingQr] = useState(
        walletData.type === 'unified',
    );

    const isAmountInvoice = useMemo(() => {
        return route.params.amount !== undefined && route.params.amount > 0;
    }, [route.params.amount]);

    const networkState = useNetInfo();
    const isNetOn = checkNetworkIsReachable(networkState);

    const getMempool = async () => {
        const fees = await _wallet.getFeesRecommendations();

        setMempoolCongested(fees.halfHourFee >= 5);
    }

    // Format as Bitcoin URI
    const getFormattedAddress = useCallback(
        (address: string) => {
            let amount = satsAmount;

            if (amount.gt(0)) {
                // If amount is greater than 0, return a bitcoin payment request URI
                return `bitcoin:${address}?amount=${amount.div(
                    SATS_TO_BTC_RATE,
                )}`;
            }

            // If amount is 0, return a plain address
            // return a formatted bitcoin address to include the bitcoin payment request URI
            return `bitcoin:${address}`;
        },
        [satsAmount],
    );

    // Copy data to clipboard
    const copyDescToClipboard = useCallback(
        (invoice: string) => {
            // Copy backup material to Clipboard
            // Temporarily set copied message
            // and revert after a few seconds
            Clipboard.setString(invoice);

            LiberalToast(capitalizeFirst(t('clipboard')), capitalizeFirst(t('copied_to_clipboard')), {
                duration: 1000,
            });
        },
        [t],
    );

    const displayExpiry = useMemo(() => {
        if (bolt11) {
            return (
                <View className="absolute right-0">
                    <ExpiryTimer expiryDate={Number(bolt11?.expiry)} />
                </View>
            );
        }

        return <></>;
    }, [bolt11]);

    const routeToBoltNFC = () => {
        if (bolt11) {
            navigation.dispatch(
                CommonActions.navigate('WalletRoot', {
                    screen: 'BoltNFC',
                    params: {
                        amountMsat: bolt11?.amountMsat,
                        description: route.params.lnDescription,
                        fromQuickActions: false,
                    },
                }),
            );
        }
    };

    const displayLNInvoice = async () => {
        const _netInfo = await netInfo.fetch();

        // Description
        const ln_desc = route.params.lnDescription
            ? route.params.lnDescription : '';

        const description = ln_desc;

        let BTCAddress = getFormattedAddress(walletData.address.address);
        let bolt11Invoice: Bolt11InvoiceDetails | null = null;

        if (!checkNetworkIsReachable(_netInfo) || !isAmountInvoice) {
            setLoadingQr(false);
            setBip21Uri(BTCAddress);
            return;
        }

        try {
            const response = _wallet.receivePayment({
                paymentMethod: new ReceivePaymentMethod.Bolt11Invoice({
                    description,
                    amountSats: route.params.sats,
                })
            })

            const paymentRequest = (await response).paymentRequest;
            const receiveResp = await response;
            const receiveFeeSats = receiveResp.fee

            const parsedLN = await _wallet.parseInput(paymentRequest);

            if (parsedLN.tag === InputType_Tags.Bolt11Invoice) {
                setBolt11(parsedLN.inner[0]);
                bolt11Invoice = parsedLN.inner[0];
            } else {
                throw new Error('Invalid invoice type received');
            }

            if (receiveFeeSats > 0) {
                setFeeMessage(
                    t('ln_fee_amount_message', {
                        sats: receiveFeeSats,
                        currency: appFiatCurrency.symbol,
                        fiat: normalizeFiat(
                            new BigNumber(receiveFeeSats),
                            fiatRate.rate,
                        ),
                    }),
                );
            }
        } catch (error: any) {
            navigation.dispatch(
                CommonActions.navigate('WalletRoot', {
                    screen: 'WalletView',
                    params: {
                        reload: false,
                    },
                }),
            );
            return error;
        }

        // Build Bip21 unified URI
        const bp21 = bip21.encode(walletData.address.address, {
            amount: satsAmount.div(SATS_TO_BTC_RATE),
            description: ln_desc,
            lightning: bolt11Invoice.invoice.bolt11,
        });

        setBip21Uri(bp21);
        setLoadingQr(false);
    };

    const closeScreen = () => {
        // Note: we route back get back to amount and back here
        navigation.dispatch(CommonActions.reset({
            index: 1,
            routes: [
                {name: 'HomeScreen'},
                {name: 'WalletRoot', params: {
                    reload: route.params.status,
                },
            }],
        }));
    };

    useEffect(() => {
        getMempool();
        displayLNInvoice();
    }, []);

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
            edges={['top', 'bottom', 'right', 'left']}
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View
                className="w-full h-full items-center justify-center"
                style={{backgroundColor: ColorScheme.Background.Default}}>
                <View
                    className="w-5/6 justify-center items-center absolute top-6 flex">
                    <PlainButton
                        className="absolute left-0 z-10"
                        onPress={closeScreen}>
                        <Close fill={ColorScheme.SVG.Default} />
                    </PlainButton>

                    <Text
                        className="text-lg font-bold"
                        style={{color: ColorScheme.Text.Default}}>
                        {t('bitcoin_invoice')}
                    </Text>

                    {/* Invoice Timeout */}
                    {displayExpiry}
                </View>

                {/* Main Panel */}
                <>
                    <View
                className="items-center justify-center h-full w-full mt-12">
                {!loadingQr && isAmountInvoice && (
                    <>
                        <View
                            className="items-center justify-center w-4/5 mb-4 flex-row">
                            <ActivityIndicator />
                            <VText
                                className="ml-2 text-center"
                                style={{color: ColorScheme.Text.DescText}}>
                                {t('keep_receive_open')}
                            </VText>
                        </View>
                    </>
                )}

                {loadingQr ? (
                    <View
                        className="items-center justify-center h-full w-full">
                        <ActivityIndicator />
                        {isAmountInvoice && <Text
                            className="text-sm mt-4"
                            style={{color: ColorScheme.Text.Default}}>
                            {isAdvancedMode
                                ? t('loading_invoice_advanced', {
                                      spec: 'Bolt11',
                                  })
                                : t('loading_invoice')}
                        </Text>}
                    </View>
                ) : (
                    <View
                        className="rounded p-2"
                        style={[
                            styles.qrCodeContainer,
                            {
                                borderColor: ColorScheme.Background.QRBorder,
                                backgroundColor: 'white',
                            },
                        ]}>
                        <QRCode
                            style={{
                                backgroundColor: 'white',
                            }}
                            size={NativeWindowMetrics.width * 0.6}
                            value={bip21Uri}
                            color={ColorScheme.Background.Default}
                        />
                    </View>
                )}

                {/* Bitcoin address info */}
                {!loadingQr && (
                    <View
                        className="p-4 mt-4 w-4/5 rounded mb-4"
                        style={[
                            {backgroundColor: ColorScheme.Background.Greyed},
                        ]}>
                        <PlainButton
                            className="w-full"
                            onPress={() => {
                                copyDescToClipboard(bip21Uri);
                            }}>
                            <Text
                                ellipsizeMode="middle"
                                numberOfLines={1}
                                style={[{color: ColorScheme.Text.Default}]}>
                                {!isAmountInvoice ? walletData.address.address : bolt11 ? bolt11?.invoice.bolt11 : ''}
                            </Text>
                        </PlainButton>
                    </View>
                )}

                {/* ln_fee_amount_message */}
                {!loadingQr && feeMessage && (
                    <Text
                        className="text-sm text-center mb-6 w-5/6'"
                        style={{color: ColorScheme.Text.DescText}}>
                        {feeMessage}
                    </Text>
                )}

                {/* Message on congestion */}
                {mempoolCongested && isNetOn && (
                    <View
                        className={
                            `mt-4 w-5/6 ${
                                langDir === 'right'
                                    ? 'flex-row-reverse'
                                    : 'flex-row'
                            } items-center justify-center`
                        }>
                        <Info
                            width={16}
                            height={16}
                            fill={ColorScheme.SVG.GrayFill}
                        />
                        <Text
                            className={
                                `${
                                    langDir === 'right'
                                        ? 'mr-2'
                                        : 'ml-2 text-center'
                                } text-sm`
                            }
                            style={{
                                    color: ColorScheme.Text.DescText,
                            }}>
                            {t('mempool_congested')}
                        </Text>
                    </View>
                )}

                {/* Bottom buttons */}
                {!loadingQr && (
                    <View
                        className={
                            `items-center ${
                                Platform.OS === 'ios'
                                    ? 'w-1/2 justify-around'
                                    : 'w-5/6 justify-around'
                            } ${
                                langDir === 'right'
                                    ? 'flex-row-reverse'
                                    : 'flex-row'
                            }`
                        }>
                        {/* Enter receive amount */}
                        <PlainButton
                            className="rounded-full items-center flex-row justify-center px-4 py-2"
                            style={{
                                backgroundColor:
                                    ColorScheme.Background.Greyed,
                            }}
                            onPress={() => {
                                navigation.dispatch(
                                    CommonActions.navigate({
                                        name: 'RequestAmount',
                                    }),
                                );
                            }}>
                            <EditIcon
                                fill={ColorScheme.SVG.Default}
                                width={16}
                                height={16}
                            />
                            <Text
                                className="font-bold text-center text-sm ml-2"
                                style={{color: ColorScheme.Text.Default}}>
                                {capitalizeFirst(t('edit'))}
                            </Text>
                        </PlainButton>

                        {/* Share Button */}
                        <PlainButton
                            onPress={() => {
                                if (!isAmountInvoice) {
                                    Share.share({
                                        message: getFormattedAddress(walletData.address.address),
                                        title: 'Share Address',
                                        url: getFormattedAddress(walletData.address.address),
                                    });
                                } else {
                                    Share.share({
                                        message: bolt11?.invoice.bolt11,
                                        title: 'Share Address',
                                        url: bolt11?.invoice.source.bip21Uri?.toString() || '',
                                    });
                                }
                            }}>
                            <View
                                className="rounded-full items-center flex-row justify-center px-4 py-2"
                                style={{
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                }}>
                                <ShareIcon
                                    fill={ColorScheme.SVG.Default}
                                    width={16}
                                    height={16}
                                />
                                <Text
                                    className="text-sm font-bold ml-2"
                                    style={{
                                        color: ColorScheme.Text.Default,
                                    }}>
                                    {capitalizeFirst(t('share'))}
                                </Text>
                            </View>
                        </PlainButton>

                        {/* NFC Button */}
                        {Platform.OS === 'android' && (
                            <PlainButton onPress={routeToBoltNFC}>
                                <View
                                    className="rounded-full items-center flex-row justify-center px-4 py-2"
                                    style={{
                                        backgroundColor:
                                            ColorScheme.Background.Greyed,
                                    }}>
                                    <NFCIcon
                                        className="mr-1"
                                        fill={ColorScheme.SVG.Default}
                                        width={18}
                                        height={18}
                                    />
                                    <Text
                                        className="text-sm font-bold"
                                        style={{
                                            color: ColorScheme.Text.Default,
                                        }}>
                                        {'NFC'}
                                    </Text>
                                            </View>
                                        </PlainButton>
                                    )}
                                </View>
                            )}
                        </View>
                </>

                <Toasts extraInsets={{top: NativeWindowMetrics.height * -0.075}} />
            </View>
        </SafeAreaView>
    );
};

export default Receive;

const styles = StyleSheet.create({
    qrCodeContainer: {
        borderWidth: 2,
    },
    carouselContainer: {
        flex: 1,
    },
    carouselStyle: {
        alignItems: 'center',
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignSelf: 'center',
        marginTop: 16,
        width: 26,
        position: 'absolute',
    },
});
