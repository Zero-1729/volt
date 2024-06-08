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

import {
    receivePayment,
    LnInvoice,
    BreezEventVariant,
} from '@breeztech/react-native-breez-sdk';
import {EBreezDetails} from '../../types/enums';

import Toast, {ToastConfig} from 'react-native-toast-message';
import {toastConfig} from '../../components/toast';

import Carousel, {ICarouselInstance} from 'react-native-reanimated-carousel';

import ExpiryTimer from '../../components/expiry';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

import {SafeAreaView} from 'react-native-safe-area-context';

import BigNumber from 'bignumber.js';

import {useTailwind} from 'tailwind-rn';

import {useTranslation} from 'react-i18next';

import {
    addCommas,
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

import BTCIcon from '../../assets/svg/btc-symbol.svg';
import LNIcon from '../../assets/svg/ln.svg';

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
import {runOnJS, useSharedValue} from 'react-native-reanimated';

import Dot from '../../components/dots';

import {checkNetworkIsReachable} from '../../modules/wallet-utils';
import netInfo, {useNetInfo} from '@react-native-community/netinfo';

// Prop type for params passed to this screen
// from the RequestAmount screen
type Props = NativeStackScreenProps<WalletParamList, 'Receive'>;
type Slide = () => ReactElement;

const Receive = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const navigation = useNavigation();

    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

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

    const [LNInvoice, setLNInvoice] = useState<LnInvoice>();
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

            Toast.show({
                topOffset: 60,
                type: 'Liberal',
                text1: capitalizeFirst(t('clipboard')),
                text2: capitalizeFirst(t('copied_to_clipboard')),
                visibilityTime: 1000,
                position: 'top',
            });
        },
        [t],
    );

    const congestedMempool = useMemo(() => {
        return mempoolInfo.mempoolCongested;
    }, [mempoolInfo.mempoolCongested]);

    const bolt11Invoice = useMemo(() => {
        return LNInvoice?.bolt11;
    }, [LNInvoice]);
    const bolt11AmountMsat = useMemo(() => {
        return LNInvoice?.amountMsat;
    }, [LNInvoice]);

    const displayExpiry = useMemo(() => {
        if (LNInvoice) {
            return (
                <View style={[tailwind('absolute right-0')]}>
                    <ExpiryTimer expiryDate={LNInvoice.expiry} />
                </View>
            );
        }

        return <></>;
    }, [LNInvoice, tailwind]);

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
        if (bolt11AmountMsat) {
            navigation.dispatch(
                CommonActions.navigate('WalletRoot', {
                    screen: 'BoltNFC',
                    params: {
                        amountMsat: bolt11AmountMsat,
                        description: route.params.lnDescription,
                        fromQuickActions: false,
                    },
                }),
            );
        }
    }, [bolt11AmountMsat, navigation, route.params.lnDescription]);

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

        const satsAmt = mSats / 1_000;

        // Description
        const ln_desc = route.params.lnDescription
            ? route.params.lnDescription
            : `Volt LN invoice for ${addCommas(satsAmt.toString())} sats`;

        try {
            const receivePaymentResp = await receivePayment({
                amountMsat: mSats,
                description: ln_desc,
            });

            const openingFee = receivePaymentResp.openingFeeMsat
                ? receivePaymentResp.openingFeeMsat / 1_000
                : 0;

            runOnJS(setLNInvoice)(receivePaymentResp.lnInvoice);

            if (openingFee > 0) {
                setFeeMessage(
                    t('ln_fee_amount_message', {
                        sats: openingFee,
                        currency: appFiatCurrency.symbol,
                        fiat: normalizeFiat(
                            new BigNumber(openingFee),
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
        }
    }, [
        state.bitcoinValue,
        route.params.sats,
        route.params.lnDescription,
        t,
        appFiatCurrency.symbol,
        fiatRate.rate,
        navigation,
    ]);

    const closeScreen = useCallback(() => {
        // Note: we route back to wallet view as edit is what gets us back to amount
        // and back here
        navigation.dispatch(
            CommonActions.navigate('WalletRoot', {
                screen: 'WalletView',
                params: {
                    reload: false,
                },
            }),
        );
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
        processLNInvoice();
    }, [displayLNInvoice, processLNInvoice, walletData.type]);

    useEffect(() => {
        if (breezEvent.type === BreezEventVariant.INVOICE_PAID) {
            // Route to LN payment status screen
            navigation.dispatch(
                CommonActions.navigate('LNTransactionStatus', {
                    status: true,
                    details: breezEvent.details,
                    detailsType: EBreezDetails.Received,
                }),
            );
            return;
        }

        if (breezEvent.type === BreezEventVariant.PAYMENT_FAILED) {
            // Route to LN payment status screen
            navigation.dispatch(
                CommonActions.navigate('LNTransactionStatus', {
                    status: false,
                    details: breezEvent.details,
                    detailsType: EBreezDetails.Failed,
                }),
            );
            return;
        }
    }, [breezEvent, navigation]);

    const carouselRef = useRef<ICarouselInstance>(null);

    const onchainPanel = useCallback((): ReactElement => {
        const copyToClip = () => {
            copyDescToClipboard(BTCAddress);
        };

        return (
            <View
                style={[
                    tailwind(
                        `items-center justify-center h-full w-full ${
                            congestedMempool ? 'mt-8' : 'mt-6'
                        }`,
                    ),
                ]}>
                {isAmountInvoice && (
                    <View
                        style={[
                            tailwind('mb-4 flex justify-center items-center'),
                        ]}>
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
                        <View style={[tailwind('opacity-40')]}>
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
                    style={[
                        styles.qrCodeContainer,
                        tailwind('rounded p-2'),
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
                        children={(): ReactElement => {
                            return (
                                <View
                                    style={[
                                        tailwind('w-full h-full'),
                                        styles.qrLogoContainer,
                                    ]}>
                                    <View
                                        style={[
                                            tailwind(
                                                'rounded-full items-center justify-center',
                                            ),
                                            {
                                                backgroundColor: 'black',
                                                height: 54,
                                                width: 54,
                                            },
                                        ]}>
                                        <BTCIcon width={32} height={32} />
                                    </View>
                                </View>
                            );
                        }}
                    />
                </View>

                {/* Message on congestion */}
                {congestedMempool && isNetOn && (
                    <View
                        style={[
                            tailwind(
                                `mt-4 w-5/6 ${
                                    langDir === 'right'
                                        ? 'flex-row-reverse'
                                        : 'flex-row'
                                } items-center justify-center`,
                            ),
                        ]}>
                        <Info
                            width={16}
                            height={16}
                            fill={ColorScheme.SVG.GrayFill}
                        />
                        <Text
                            style={[
                                tailwind(
                                    `${
                                        langDir === 'right'
                                            ? 'mr-2'
                                            : 'ml-2 text-center'
                                    } text-sm`,
                                ),
                                {
                                    color: ColorScheme.Text.DescText,
                                },
                            ]}>
                            {t('mempool_congested')}
                        </Text>
                    </View>
                )}

                {/* Bitcoin address info */}
                <View
                    style={[
                        tailwind('p-4 mt-4 w-4/5 rounded mb-4'),
                        {backgroundColor: ColorScheme.Background.Greyed},
                    ]}>
                    <PlainButton
                        style={[tailwind('w-full')]}
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
                    style={[
                        tailwind(
                            `items-center ${
                                langDir === 'right'
                                    ? 'flex-row-reverse'
                                    : 'flex-row'
                            }`,
                        ),
                    ]}>
                    {/* Enter receive amount */}
                    <PlainButton
                        style={[
                            tailwind(
                                `${
                                    langDir === 'right' ? 'ml-4' : 'mr-4'
                                } rounded-full items-center flex-row justify-center px-4 py-2`,
                            ),
                            {
                                backgroundColor: ColorScheme.Background.Greyed,
                            },
                        ]}
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate({
                                    name: 'RequestAmount',
                                }),
                            );
                        }}>
                        <EditIcon
                            style={[tailwind('mr-2')]}
                            fill={ColorScheme.SVG.Default}
                            width={16}
                            height={16}
                        />
                        <Text
                            style={[
                                tailwind('font-bold text-center text-sm'),
                                {color: ColorScheme.Text.Default},
                            ]}>
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
                            style={[
                                tailwind(
                                    'rounded-full items-center flex-row justify-center px-4 py-2',
                                ),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                },
                            ]}>
                            <ShareIcon
                                style={[tailwind('mr-2')]}
                                fill={ColorScheme.SVG.Default}
                                width={16}
                                height={16}
                            />
                            <Text
                                style={[
                                    tailwind('text-sm font-bold'),
                                    {
                                        color: ColorScheme.Text.Default,
                                    },
                                ]}>
                                {capitalizeFirst(t('share'))}
                            </Text>
                        </View>
                    </PlainButton>
                </View>
            </View>
        );
    }, [
        tailwind,
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
            copyDescToClipboard(bolt11Invoice as string);
        };

        return (
            <View
                style={[
                    tailwind('items-center justify-center h-full w-full mt-12'),
                ]}>
                {!loadingInvoice && (
                    <>
                        <View
                            style={[
                                tailwind(
                                    'items-center justify-center w-4/5 mb-4 flex-row',
                                ),
                            ]}>
                            <ActivityIndicator />
                            <VText
                                style={[
                                    tailwind('ml-2 text-center'),
                                    {color: ColorScheme.Text.DescText},
                                ]}>
                                {t('keep_receive_open')}
                            </VText>
                        </View>
                    </>
                )}

                {loadingInvoice ? (
                    <View
                        style={[
                            tailwind(
                                'items-center justify-center h-full w-full',
                            ),
                        ]}>
                        <ActivityIndicator />
                        <Text
                            style={[
                                tailwind('text-sm mt-4'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {isAdvancedMode
                                ? t('loading_invoice_advanced', {
                                      spec: 'Bolt11',
                                  })
                                : t('loading_invoice')}
                        </Text>
                    </View>
                ) : (
                    <View
                        style={[
                            styles.qrCodeContainer,
                            tailwind('rounded p-2'),
                            {
                                borderColor: ColorScheme.Background.QRBorder,
                                backgroundColor: 'white',
                            },
                        ]}>
                        <QRCodeStyled
                            style={{
                                backgroundColor: 'white',
                            }}
                            data={bolt11Invoice}
                            padding={4}
                            pieceSize={3.75}
                            color={ColorScheme.Background.Default}
                            isPiecesGlued={true}
                            pieceBorderRadius={2}
                            children={(): ReactElement => {
                                return (
                                    <View
                                        style={[
                                            tailwind('w-full h-full'),
                                            styles.qrLogoContainer,
                                        ]}>
                                        <View
                                            style={[
                                                tailwind(
                                                    'rounded-full items-center justify-center',
                                                ),
                                                {
                                                    backgroundColor: 'black',
                                                    height: 54,
                                                    width: 54,
                                                },
                                            ]}>
                                            <LNIcon width={32} height={32} />
                                        </View>
                                    </View>
                                );
                            }}
                        />
                    </View>
                )}

                {/* Bitcoin address info */}
                {!loadingInvoice && (
                    <View
                        style={[
                            tailwind('p-4 mt-4 w-4/5 rounded mb-4'),
                            {backgroundColor: ColorScheme.Background.Greyed},
                        ]}>
                        <PlainButton
                            style={[tailwind('w-full')]}
                            onPress={copyToClip}>
                            <Text
                                ellipsizeMode="middle"
                                numberOfLines={1}
                                style={[{color: ColorScheme.Text.Default}]}>
                                {bolt11Invoice}
                            </Text>
                        </PlainButton>
                    </View>
                )}

                {/* ln_fee_amount_message */}
                {!loadingInvoice && feeMessage && (
                    <Text
                        style={[
                            tailwind('text-sm text-center mb-6 w-5/6'),
                            {color: ColorScheme.Text.DescText},
                        ]}>
                        {feeMessage}
                    </Text>
                )}

                {/* Bottom buttons */}
                {!loadingInvoice && (
                    <View
                        style={[
                            tailwind(
                                `items-center ${
                                    Platform.OS === 'ios'
                                        ? 'w-1/2 justify-between'
                                        : 'w-5/6 justify-around'
                                } ${
                                    langDir === 'right'
                                        ? 'flex-row-reverse'
                                        : 'flex-row'
                                }`,
                            ),
                        ]}>
                        {/* Enter receive amount */}
                        <PlainButton
                            style={[
                                tailwind(
                                    'rounded-full items-center flex-row justify-center px-4 py-2',
                                ),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                },
                            ]}
                            onPress={() => {
                                navigation.dispatch(
                                    CommonActions.navigate({
                                        name: 'RequestAmount',
                                    }),
                                );
                            }}>
                            <EditIcon
                                style={[tailwind('mr-2')]}
                                fill={ColorScheme.SVG.Default}
                                width={16}
                                height={16}
                            />
                            <Text
                                style={[
                                    tailwind('font-bold text-center text-sm'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {capitalizeFirst(t('edit'))}
                            </Text>
                        </PlainButton>

                        {/* Share Button */}
                        <PlainButton
                            onPress={() => {
                                Share.share({
                                    message: bolt11Invoice as string,
                                    title: 'Share Address',
                                    url: bolt11Invoice as string,
                                });
                            }}>
                            <View
                                style={[
                                    tailwind(
                                        'rounded-full items-center flex-row justify-center px-4 py-2',
                                    ),
                                    {
                                        backgroundColor:
                                            ColorScheme.Background.Greyed,
                                    },
                                ]}>
                                <ShareIcon
                                    style={[tailwind('mr-2')]}
                                    fill={ColorScheme.SVG.Default}
                                    width={16}
                                    height={16}
                                />
                                <Text
                                    style={[
                                        tailwind('text-sm font-bold'),
                                        {
                                            color: ColorScheme.Text.Default,
                                        },
                                    ]}>
                                    {capitalizeFirst(t('share'))}
                                </Text>
                            </View>
                        </PlainButton>

                        {/* NFC Button */}
                        {Platform.OS === 'android' && (
                            <PlainButton onPress={routeToBoltNFC}>
                                <View
                                    style={[
                                        tailwind(
                                            'rounded-full items-center flex-row justify-center px-4 py-2',
                                        ),
                                        {
                                            backgroundColor:
                                                ColorScheme.Background.Greyed,
                                        },
                                    ]}>
                                    <NFCIcon
                                        style={[tailwind('mr-1')]}
                                        fill={ColorScheme.SVG.Default}
                                        width={18}
                                        height={18}
                                    />
                                    <Text
                                        style={[
                                            tailwind('text-sm font-bold'),
                                            {
                                                color: ColorScheme.Text.Default,
                                            },
                                        ]}>
                                        {'NFC'}
                                    </Text>
                                </View>
                            </PlainButton>
                        )}
                    </View>
                )}
            </View>
        );
    }, [
        tailwind,
        loadingInvoice,
        ColorScheme.Text.DescText,
        ColorScheme.Text.Default,
        ColorScheme.Background.QRBorder,
        ColorScheme.Background.Default,
        ColorScheme.Background.Greyed,
        ColorScheme.SVG.Default,
        t,
        isAdvancedMode,
        bolt11Invoice,
        feeMessage,
        langDir,
        routeToBoltNFC,
        copyDescToClipboard,
        navigation,
    ]);

    const panels = useMemo((): Slide[] => {
        return isNetOn ? [lnPanel, onchainPanel] : [onchainPanel];
    }, [isNetOn, lnPanel, onchainPanel]);

    return (
        <SafeAreaView
            edges={['top', 'bottom', 'right', 'left']}
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View
                style={[
                    tailwind('w-full h-full items-center justify-center'),
                    {backgroundColor: ColorScheme.Background.Default},
                ]}>
                <View
                    style={[
                        tailwind(
                            'w-5/6 justify-center items-center absolute top-6 flex',
                        ),
                    ]}>
                    <PlainButton
                        style={[tailwind('absolute left-0 z-10')]}
                        onPress={closeScreen}>
                        <Close fill={ColorScheme.SVG.Default} />
                    </PlainButton>

                    <Text
                        style={[
                            tailwind('text-lg font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {t('bitcoin_invoice')}
                    </Text>

                    {/* Invoice Timeout */}
                    {displayExpiry}
                </View>

                {isLNWallet &&
                    route.params.amount &&
                    !route.params.breezServicesNotInitialized && (
                        <View
                            style={[
                                styles.carouselContainer,
                                tailwind(
                                    'h-full w-full items-center justify-end absolute bottom-0',
                                ),
                                {zIndex: -9},
                            ]}>
                            <Carousel
                                ref={carouselRef}
                                style={[tailwind('items-center')]}
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
                        style={[
                            styles.carouselContainer,
                            tailwind(
                                'h-full w-full items-center justify-end absolute bottom-0',
                            ),
                            {zIndex: -9},
                        ]}>
                        {onchainPanel()}
                    </View>
                )}

                <Toast config={toastConfig as ToastConfig} />
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
    dots: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignSelf: 'center',
        marginTop: 16,
        width: 26,
        position: 'absolute',
    },
    qrLogoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
