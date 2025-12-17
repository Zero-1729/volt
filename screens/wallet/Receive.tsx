/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {
    useContext,
    useState,
    useEffect,
    useMemo,
    useReducer,
    ReactElement,
    useCallback,
    useRef,
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

import VText from '../../components/text';

import {useNavigation, CommonActions} from '@react-navigation/native';

import {Toasts} from '@backpackapp-io/react-native-toast';
import {LiberalToast} from '../../components/toast';

import Carousel, {ICarouselInstance} from 'react-native-reanimated-carousel';

import ExpiryTimer from '../../components/expiry';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

import {SafeAreaView} from 'react-native-safe-area-context';

import BigNumber from 'bignumber.js';

import {useTranslation} from 'react-i18next';

import {
    capitalizeFirst,
    formatFiat,
    normalizeFiat,
    SATS_TO_BTC_RATE,
} from '../../modules/transform';

import Color from '../../constants/Color';

import {AppStorageContext} from '../../class/storageContext';

import QRCodeStyled from 'react-native-qrcode-styled';
import Close from '../../assets/svg/x-24.svg';
import Info from '../../assets/svg/info-16.svg';
import NFCIcon from '../../assets/svg/nfc.svg';

import {
    DisplayFiatAmount,
    DisplaySatsAmount,
    DisplayBTCAmount,
} from '../../components/balance';

import ShareIcon from '../../assets/svg/share-android-16.svg';
import EditIcon from '../../assets/svg/pencil-16.svg';

import Clipboard from '@react-native-clipboard/clipboard';

import {PlainButton} from '../../components/button';

import NativeDims from '../../constants/NativeWindowMetrics';
import {useSharedValue} from 'react-native-reanimated';

import Dot from '../../components/dots';

import {checkNetworkIsReachable} from '../../modules/wallet-utils';
import netInfo, {useNetInfo} from '@react-native-community/netinfo';
import NativeWindowMetrics from '../../constants/NativeWindowMetrics';
import { Bolt11InvoiceDetails, Bolt12InvoiceDetails, InputType_Tags, ReceivePaymentMethod, SdkEvent_Tags } from '@breeztech/breez-sdk-spark-react-native';
import { useWallet } from '../../contexts/walletContext';

// Prop type for params passed to this screen
// from the RequestAmount screen
type Props = NativeStackScreenProps<WalletParamList, 'Receive'>;
type Slide = () => ReactElement;

const Receive = ({route}: Props) => {
    const ColorScheme = Color(useColorScheme());

    const navigation = useNavigation();

    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const _wallet = useWallet();

    const {
        currentWalletID,
        getWalletData,
        isAdvancedMode,
        breezEvent,
        mempoolInfo,
        appFiatCurrency,
        fiatRate,
    } = useContext(AppStorageContext);

    const walletData = useMemo(() => {
        return getWalletData(currentWalletID);
    }, [currentWalletID, getWalletData]);

    const isLNWallet = useMemo(() => {
        return walletData.type === 'unified';
    }, [walletData]);

    const [bolt11, setBolt11] = useState<Bolt11InvoiceDetails>();
    const [bolt12, setBolt12] = useState<Bolt12InvoiceDetails>();
    const [isBolt11, setIsBolt11] = useState<boolean>(false);
    const [feeMessage, setFeeMessage] = useState<string>('');
    const [loadingInvoice, setLoadingInvoice] = useState(
        walletData.type === 'unified',
    );

    const networkState = useNetInfo();
    const isNetOn = checkNetworkIsReachable(networkState);

    const progressValue = useSharedValue(0);

    const initialState = {
        // Amount in sats
        bitcoinValue: new BigNumber(0),
        fiatValue: new BigNumber(0),
    };

    const reducer = (state: any, action: any) => {
        switch (action.type) {
            case 'SET_BITCOIN_VALUE':
                return {
                    ...state,
                    bitcoinValue: action.payload,
                };
            case 'SET_FIAT_VALUE':
                return {
                    ...state,
                    fiatValue: action.payload,
                };
            default:
                return state;
        }
    };

    const [state, dispatch] = useReducer(reducer, initialState);

    // Format as Bitcoin URI
    const getFormattedAddress = useCallback(
        (address: string) => {
            let amount = state.bitcoinValue;

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
        [state.bitcoinValue],
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

    const congestedMempool = useMemo(() => {
        return mempoolInfo.mempoolCongested;
    }, [mempoolInfo.mempoolCongested]);

    const displayExpiry = useMemo(() => {
        if (isBolt11) {
            return (
                <View className="absolute right-0">
                    <ExpiryTimer expiryDate={Number(bolt11?.expiry)} />
                </View>
            );
        }

        return <></>;
    }, [isBolt11, bolt11]);

    const isAmountInvoice = useMemo(() => {
        // Show if is a LN wallet & online
        // or has BTC onchain amount set
        return (
            !state.bitcoinValue.isZero() ||
            (isLNWallet && isNetOn && route.params.amount)
        );
    }, [state.bitcoinValue, isLNWallet, isNetOn, route.params.amount]);

    // Set bitcoin invoice URI
    const BTCInvoice = useMemo(
        () => getFormattedAddress(walletData.address.address),
        [getFormattedAddress, walletData.address.address],
    );

    const BTCAddress = useMemo(() => {
        return walletData.address.address;
    }, [walletData.address.address]);

    const routeToBoltNFC = useCallback(() => {
        if (isBolt11) {
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
    }, [bolt11?.amountMsat, isBolt11, navigation, route.params.lnDescription]);

    useEffect(() => {
        // Update the request amount if it is passed in as a parameter
        // from the RequestAmount screen
        if (route.params?.amount) {
            dispatch({
                type: 'SET_BITCOIN_VALUE',
                payload: new BigNumber(route.params.sats),
            });
            dispatch({
                type: 'SET_FIAT_VALUE',
                payload: new BigNumber(route.params.fiat),
            });
        }
    }, [route.params]);

    const displayLNInvoice = useCallback(async () => {
        const mSats =
            (state.bitcoinValue > 0 ? state.bitcoinValue : route.params.sats) *
            1_000;

        // Description
        const ln_desc = route.params.lnDescription
            ? route.params.lnDescription : '';

        const description = ln_desc;

        try {
            const response = _wallet.receivePayment({
                paymentMethod: new ReceivePaymentMethod.Bolt11Invoice({
                    description,
                    amountSats: BigInt(mSats / 1_000),
                })
            })

            const paymentRequest = (await response).paymentRequest;
            const receiveResp = await response;
            const receiveFeeSats = receiveResp.fee

            const parsedLN = await _wallet.parseInput(paymentRequest);

            if (parsedLN.tag === InputType_Tags.Bolt11Invoice) {
                setIsBolt11(parsedLN.tag === InputType_Tags.Bolt11Invoice);
                setBolt11(parsedLN.inner[0]);
            } else if (parsedLN.tag === InputType_Tags.Bolt12Invoice) {
                setBolt12(parsedLN.inner[0]);
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

            setLoadingInvoice(false);
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
    }, [state.bitcoinValue, route.params.sats, route.params.lnDescription, _wallet, t, appFiatCurrency.symbol, fiatRate.rate, navigation]);

    const closeScreen = useCallback(() => {
        // Note: we route back get back to amount and back here
        navigation.dispatch(CommonActions.goBack());
    }, [navigation]);

    const processLNInvoice = useCallback(async () => {
        const _netInfo = await netInfo.fetch();
        // Get invoice details
        // Note: hide amount details
        if (
            walletData.type === 'unified' &&
            checkNetworkIsReachable(_netInfo) &&
            route.params.amount &&
            !route.params.breezServicesNotInitialized
        ) {
            displayLNInvoice();
        }
    }, [
        displayLNInvoice,
        route.params.amount,
        route.params.breezServicesNotInitialized,
        walletData.type,
    ]);

        useEffect(() => {
        if (breezEvent.tag === SdkEvent_Tags.PaymentSucceeded) {
            // Serialize BigInt
            const txDetails = {...breezEvent.inner, amount: Number(breezEvent.inner.payment.amount)};

            // Route to LN payment status screen
            navigation.dispatch(
                CommonActions.navigate('LNTransactionStatus', {
                    status: true,
                    details: txDetails,
                    tag: breezEvent.tag,
                    detailsType: breezEvent.inner.payment.paymentType,
                    error: null,
                }),
            );
            return;
        }

        if (breezEvent.tag === SdkEvent_Tags.PaymentFailed) {
            // Serialize BigInt
            const txDetails = {...breezEvent.inner, amount: Number(breezEvent.inner.payment.amount)};

            // Route to LN payment status screen
            navigation.dispatch(
                CommonActions.navigate('LNTransactionStatus', {
                    status: false,
                    details: txDetails,
                    tag: breezEvent.tag,
                    detailsType: breezEvent.inner.payment.paymentType,
                    error: breezEvent.inner,
                }),
            );
            return;
        }
    }, [breezEvent]);

    useEffect(() => {
        processLNInvoice();
    }, [processLNInvoice]);

    const carouselRef = useRef<ICarouselInstance>(null);

    const onchainPanel = useCallback((): ReactElement => {
        const copyToClip = () => {
            copyDescToClipboard(BTCAddress);
        };

        return (
            <View
                className={
                    `items-center justify-center h-full w-full ${
                        congestedMempool ? 'mt-8' : 'mt-6'
                    }`
                }>
                {isAmountInvoice && (
                    <View
                        className="mb-4 flex justify-center items-center">
                        {/* Make it approx if it doesn't match bottom unit value for requested amount */}
                        {state.bitcoinValue < 100_000_000 ? (
                            <DisplaySatsAmount
                                amount={state.bitcoinValue}
                                fontSize={'text-2xl'}
                            />
                        ) : (
                            <DisplayBTCAmount
                                amount={state.bitcoinValue}
                                fontSize="text-2xl"
                            />
                        )}
                        <View className="opacity-40">
                            {/* Make it approx if it doesn't match bottom unit value for requested amount */}
                            <DisplayFiatAmount
                                amount={formatFiat(state.fiatValue)}
                                fontSize={'text-base'}
                                isApprox={
                                    route.params.amount !==
                                    state.fiatValue.toString()
                                }
                            />
                        </View>
                    </View>
                )}

                <View
                    className="rounded p-2"
                    style={[
                        styles.qrCodeContainer,
                        {
                            borderColor: ColorScheme.Background.QRBorder,
                            backgroundColor: 'white',
                        },
                    ]}>
                    <QRCodeStyled
                        style={{
                            backgroundColor: 'white',
                        }}
                        data={BTCInvoice}
                        padding={7}
                        pieceSize={7}
                        color={ColorScheme.Background.Default}
                        isPiecesGlued={true}
                        pieceBorderRadius={4}
                    />
                </View>

                {/* Message on congestion */}
                {congestedMempool && isNetOn && (
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

                {/* Bitcoin address info */}
                <View
                    className="p-4 mt-4 w-4/5 rounded mb-4"
                    style={{backgroundColor: ColorScheme.Background.Greyed}}>
                    <PlainButton
                        className="w-full"
                        onPress={copyToClip}>
                        <Text
                            ellipsizeMode="middle"
                            numberOfLines={1}
                            style={[{color: ColorScheme.Text.Default}]}>
                            {BTCAddress}
                        </Text>
                    </PlainButton>
                </View>

                {/* Bottom buttons */}
                <View
                    className={
                        `items-center ${
                            langDir === 'right'
                                ? 'flex-row-reverse'
                                : 'flex-row'
                        }`
                    }>
                    {/* Enter receive amount */}
                    <PlainButton
                        className={
                            `${
                                langDir === 'right' ? 'ml-4' : 'mr-4'
                            } rounded-full items-center flex-row justify-center px-4 py-2`
                        }
                        style={{
                                backgroundColor: ColorScheme.Background.Greyed,
                        }}
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.goBack(),
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
                            Share.share({
                                message: BTCInvoice,
                                title: 'Share Address',
                                url: BTCInvoice,
                            });
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
                </View>
            </View>
        );
    }, [
        congestedMempool,
        isAmountInvoice,
        state.bitcoinValue,
        state.fiatValue,
        route.params.amount,
        ColorScheme.Background.QRBorder,
        ColorScheme.Background.Default,
        ColorScheme.Background.Greyed,
        ColorScheme.SVG.GrayFill,
        ColorScheme.SVG.Default,
        ColorScheme.Text.DescText,
        ColorScheme.Text.Default,
        BTCInvoice,
        langDir,
        t,
        isNetOn,
        BTCAddress,
        copyDescToClipboard,
        navigation,
    ]);

    const lnPanel = useCallback((): ReactElement => {
        const copyToClip = () => {
            copyDescToClipboard(bolt11?.invoice?.bolt11?.toString() || '');
        };

        return (
            <View
                className="items-center justify-center h-full w-full mt-12">
                {!loadingInvoice && (
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

                {loadingInvoice ? (
                    <View
                        className="items-center justify-center h-full w-full">
                        <ActivityIndicator />
                        <Text
                            className="text-sm mt-4"
                            style={{color: ColorScheme.Text.Default}}>
                            {isAdvancedMode
                                ? t('loading_invoice_advanced', {
                                      spec: 'Bolt11',
                                  })
                                : t('loading_invoice')}
                        </Text>
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
                        <QRCodeStyled
                            style={{
                                backgroundColor: 'white',
                            }}
                            data={isBolt11 ? bolt11?.invoice.bolt11 || '' : bolt12?.invoice.invoice || ''}
                            padding={4}
                            pieceSize={3.75}
                            color={ColorScheme.Background.Default}
                            isPiecesGlued={true}
                            pieceBorderRadius={2}
                        />
                    </View>
                )}

                {/* Bitcoin address info */}
                {!loadingInvoice && (
                    <View
                        className="p-4 mt-4 w-4/5 rounded mb-4"
                        style={[
                            {backgroundColor: ColorScheme.Background.Greyed},
                        ]}>
                        <PlainButton
                            className="w-full"
                            onPress={copyToClip}>
                            <Text
                                ellipsizeMode="middle"
                                numberOfLines={1}
                                style={[{color: ColorScheme.Text.Default}]}>
                                {isBolt11 ? bolt11?.invoice.bolt11 : bolt12?.invoice.invoice}
                            </Text>
                        </PlainButton>
                    </View>
                )}

                {/* ln_fee_amount_message */}
                {!loadingInvoice && feeMessage && (
                    <Text
                        className="text-sm text-center mb-6 w-5/6'"
                        style={{color: ColorScheme.Text.DescText}}>
                        {feeMessage}
                    </Text>
                )}

                {/* Bottom buttons */}
                {!loadingInvoice && (
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
                                Share.share({
                                    message: bolt11?.invoice.bolt11,
                                    title: 'Share Address',
                                    url: bolt11?.invoice.source.bip21Uri?.toString() || '',
                                });
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
        );
    }, [loadingInvoice, ColorScheme.Text.DescText, ColorScheme.Text.Default, ColorScheme.Background.QRBorder, ColorScheme.Background.Default, ColorScheme.Background.Greyed, ColorScheme.SVG.Default, t, isAdvancedMode, isBolt11, bolt11?.invoice.bolt11, bolt11?.invoice.source.bip21Uri, bolt12?.invoice.invoice, feeMessage, langDir, routeToBoltNFC, copyDescToClipboard, navigation]);

    const panels = useMemo((): Slide[] => {
        return _wallet.isConnected() ? [lnPanel, onchainPanel] : [onchainPanel];
    }, [_wallet, lnPanel, onchainPanel]);

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

                {isLNWallet &&
                    route.params.amount &&
                    !route.params.breezServicesNotInitialized && (
                        <View
                            className="h-full w-full items-center justify-end absolute bottom-0"
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
                                height={
                                    Platform.OS === 'ios'
                                        ? NativeDims.height -
                                          NativeDims.navBottom * 3.2
                                        : NativeDims.height -
                                          NativeDims.navBottom * 2.4
                                }
                                loop={false}
                                panGestureHandlerProps={{
                                    activeOffsetX: [-10, 10],
                                }}
                                testID="ReceiveSlider"
                                renderItem={({index}): ReactElement => {
                                    const Slide = panels[index];
                                    return <Slide key={index} />;
                                }}
                                onProgressChange={(
                                    _,
                                    absoluteProgress,
                                ): void => {
                                    progressValue.value = absoluteProgress;
                                }}
                            />

                            {isNetOn && (
                                <View
                                    style={[
                                        styles.dots,
                                        {bottom: NativeDims.bottom},
                                    ]}
                                    pointerEvents="none">
                                    {panels.map((_slide, index) => (
                                        <Dot
                                            key={index}
                                            index={index}
                                            animValue={progressValue}
                                            length={panels.length}
                                        />
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                {(!isLNWallet ||
                    !route.params.amount ||
                    route.params.breezServicesNotInitialized) && (
                    <View
                        className="h-full w-full items-center justify-end absolute bottom-0"
                        style={[
                            styles.carouselContainer,
                            {zIndex: -9},
                        ]}>
                        {onchainPanel()}
                    </View>
                )}

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
