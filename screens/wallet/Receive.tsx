/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */

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

import {
    useNavigation,
    CommonActions,
    StackActions,
} from '@react-navigation/native';

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

import BTCQR from '../../assets/svg/btc-qr.svg';
import LNQR from '../../assets/svg/ln.svg';

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
    const walletData = getWalletData(currentWalletID);
    const isLNWallet = walletData.type === 'unified';

    const progressValue = useSharedValue(0);
    const [feeMessage, setFeeMessage] = useState<string>('');
    const [loadingInvoice, setLoadingInvoice] = useState(
        walletData.type === 'unified',
    );
    const [LNInvoice, setLNInvoice] = useState<LnInvoice>();

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

    const displayLNInvoice = async () => {
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

            setLNInvoice(receivePaymentResp.lnInvoice);

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
            Toast.show({
                topOffset: 60,
                type: 'Liberal',
                text1: t('error'),
                text2: error.message,
                visibilityTime: 2000,
            });

            navigation.dispatch(
                CommonActions.navigate('WalletRoot', {
                    screen: 'WalletView',
                    params: {
                        reload: false,
                    },
                }),
            );
        }
    };

    useEffect(() => {
        // Get invoice details
        // Note: hide amount details
        if (walletData.type === 'unified') {
            displayLNInvoice();
        }
    }, []);

    useEffect(() => {
        if (breezEvent.type === BreezEventVariant.INVOICE_PAID) {
            // Route to LN payment status screen
            navigation.dispatch(StackActions.popToTop());
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
            navigation.dispatch(StackActions.popToTop());
            navigation.dispatch(
                CommonActions.navigate('LNTransactionStatus', {
                    status: false,
                    details: breezEvent.details,
                    detailsType: EBreezDetails.Failed,
                }),
            );
            return;
        }
    }, [breezEvent]);

    // Format as Bitcoin URI
    const getFormattedAddress = (address: string) => {
        let amount = state.bitcoinValue;

        if (amount.gt(0)) {
            // If amount is greater than 0, return a bitcoin payment request URI
            return `bitcoin:${address}?amount=${amount.div(SATS_TO_BTC_RATE)}`;
        }

        // If amount is 0, return a plain address
        // return a formatted bitcoin address to include the bitcoin payment request URI
        return `bitcoin:${address}`;
    };

    // Set bitcoin invoice URI
    const BTCInvoice = useMemo(
        () => getFormattedAddress(walletData.address.address),
        [state.bitcoinValue],
    );

    // const getFees = () => {
    //     const openingFeeMsat = receivePaymentResponse.openingFeeMsat;
    //     const openingFeeSat =
    //         openingFeeMsat != null ? openingFeeMsat / 1000 : 0;
    //     console.log(
    //         `A setup fee of ${openingFeeSat} sats is applied to this invoice.`,
    //     );
    // };

    // Copy data to clipboard
    const copyDescToClipboard = (invoice: string) => {
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
    };

    const isAmountInvoice =
        (!isLNWallet && !state.bitcoinValue.isZero()) || isLNWallet;

    const carouselRef = useRef<ICarouselInstance>(null);

    const onchainPanel = useCallback((): ReactElement => {
        const copyToClip = () => {
            copyDescToClipboard(BTCInvoice);
        };

        return (
            <View
                style={[
                    tailwind(
                        `items-center justify-center h-full w-full ${
                            mempoolInfo.mempoolCongested ? 'mt-10' : 'mt-6'
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
                        tailwind('rounded'),
                        {borderColor: ColorScheme.Background.QRBorder},
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
                                    style={{
                                        position: 'absolute',
                                        top: NativeDims.height / 7.725,
                                        left: NativeDims.width / 3.425,
                                    }}>
                                    <BTCQR width={54} height={54} />
                                </View>
                            );
                        }}
                    />
                </View>

                {/* Message on congestion */}
                {mempoolInfo?.mempoolCongested && (
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
                            {BTCInvoice}
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
        ColorScheme,
        BTCInvoice,
        state,
        t,
        tailwind,
        route.params.amount,
        isAmountInvoice,
        styles,
        Toast,
    ]);

    const lnPanel = useCallback((): ReactElement => {
        const copyToClip = () => {
            copyDescToClipboard(LNInvoice?.bolt11 as string);
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
                                tailwind('items-center w-4/5 mb-4 flex-row'),
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
                            tailwind('rounded'),
                            {
                                borderColor: ColorScheme.Background.QRBorder,
                            },
                        ]}>
                        <QRCodeStyled
                            style={{
                                backgroundColor: 'white',
                            }}
                            data={LNInvoice?.bolt11}
                            padding={4}
                            pieceSize={4}
                            color={ColorScheme.Background.Default}
                            isPiecesGlued={true}
                            pieceBorderRadius={2}
                            children={(): ReactElement => {
                                return (
                                    <View
                                        style={[
                                            tailwind(
                                                'rounded-full justify-center items-center',
                                            ),
                                            {
                                                position: 'absolute',
                                                top: NativeDims.height / 6.215,
                                                left: NativeDims.width / 2.925,
                                                backgroundColor: 'black',
                                                height: 54,
                                                width: 54,
                                            },
                                        ]}>
                                        <LNQR width={32} height={32} />
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
                                {LNInvoice?.bolt11}
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
                                `items-center w-5/6 justify-around ${
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
                                    message: LNInvoice?.bolt11 as string,
                                    title: 'Share Address',
                                    url: LNInvoice?.bolt11 as string,
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
                        <PlainButton onPress={() => {}}>
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
                    </View>
                )}
            </View>
        );
    }, [ColorScheme, tailwind, LNInvoice, loadingInvoice, t, styles, Toast]);

    const panels = useMemo(
        (): Slide[] => [lnPanel, onchainPanel],
        [onchainPanel, lnPanel],
    );

    return (
        <SafeAreaView
            edges={['bottom', 'right', 'left']}
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
                        onPress={() => {
                            navigation.dispatch(StackActions.popToTop());
                        }}>
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
                    {LNInvoice?.expiry && (
                        <View style={[tailwind('absolute right-0')]}>
                            <ExpiryTimer expiryDate={LNInvoice?.expiry} />
                        </View>
                    )}
                </View>

                {isLNWallet && (
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
                                    : NativeDims.height
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
                            onProgressChange={(_, absoluteProgress): void => {
                                progressValue.value = absoluteProgress;
                            }}
                        />

                        <View
                            style={[styles.dots, {bottom: NativeDims.bottom}]}
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
                    </View>
                )}

                {!isLNWallet && (
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
});
