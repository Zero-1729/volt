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

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import Close from '../../assets/svg/x-24.svg';
import AlertIcon from '../../assets/svg/alert-16.svg';
import Success from '../../assets/svg/check-circle-fill-24.svg';
import Failed from '../../assets/svg/x-circle-fill-24.svg';

import {LongBottomButton, PlainButton} from '../../components/button';

import Carousel from 'react-native-reanimated-carousel';
import {useTranslation} from 'react-i18next';
import {DisplaySatsAmount} from '../../components/balance';
import BigNumber from 'bignumber.js';

import {normalizeFiat} from '../../modules/transform';

import {capitalizeFirst} from '../../modules/transform';
import {AppStorageContext} from '../../class/storageContext';
import {
    prepareOnchainPayment,
    SwapAmountType,
    payOnchain,
    ReverseSwapInfo,
    PrepareOnchainPaymentResponse,
    PayOnchainResponse,
} from '@breeztech/react-native-breez-sdk';

import Toast, {ToastConfig} from 'react-native-toast-message';
import {toastConfig} from '../../components/toast';

type Props = NativeStackScreenProps<WalletParamList, 'SwapOut'>;
type Slide = () => ReactElement;

const SwapOut = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {
        getWalletData,
        currentWalletID,
        fiatRate,
        mempoolInfo,
        appFiatCurrency,
        updateWalletAddress,
    } = useContext(AppStorageContext);
    const wallet = getWalletData(currentWalletID);

    const navigation = useNavigation();
    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const [loadingTX, setLoadingTX] = useState<boolean>(false);
    const [fees, setFees] = useState<boolean>(true);
    const [statusMessage, setStatusMessage] = useState<string>();
    const [failedTx, setFailedTx] = useState<boolean>(false);
    const [errMessage, setErrMessage] = useState<string>();
    const [rvsSwapInfo, setRvsSwapInfo] = useState<ReverseSwapInfo>();
    const [prepSwap, setPrepSwap] = useState<PrepareOnchainPaymentResponse>();
    const [btcAddress, setBtcAddress] = useState<string>();

    // For now, only single sends are supported
    // Update wallet descriptors to private version
    const carouselRef = React.useRef(null);
    const progressValue = useSharedValue(0);

    const CardColor = ColorScheme.WalletColors[wallet.type][wallet.network];

    const handleCloseButton = () => {
        navigation.dispatch(StackActions.popToTop());
    };

    const getFeeInfo = async () => {
        const satPerVbyte = mempoolInfo.fastestFee;

        setStatusMessage('generating_fees');
        setFees(true);

        prepareOnchainPayment({
            amountSat: route.params.satsAmount,
            amountType: SwapAmountType.SEND,
            claimTxFeerate: satPerVbyte,
        })
            .then((value: PrepareOnchainPaymentResponse) => {
                setStatusMessage('found_fees');
                setFees(false);
                setPrepSwap(value);
            })
            .catch((e: any) => {
                console.log('[SwapOut] Error: ', e.message);
                setErrMessage(e.message);
                setFailedTx(false);
            });
    };

    const grabAndSetAddress = async () => {
        const _addressObj = await wallet.generateNewAddress();
        setBtcAddress(_addressObj.address);
        updateWalletAddress(_addressObj.index, _addressObj);
    };

    const execSwap = async () => {
        const _onchainRecipientAddress = wallet.address.address;
        const _prepSwap = prepSwap as PrepareOnchainPaymentResponse;

        setStatusMessage('executing_swap');
        setLoadingTX(true);

        payOnchain({
            recipientAddress: _onchainRecipientAddress,
            prepareRes: _prepSwap,
        })
            .then((value: PayOnchainResponse) => {
                const reverseSwapInfo = value.reverseSwapInfo;
                setRvsSwapInfo(reverseSwapInfo);
                setLoadingTX(false);
            })
            .catch((e: any) => {
                console.error('[SwapOut] error: ', e.message);
                setErrMessage(e.message);
                setFailedTx(true);
            });
    };

    const sendTx = useCallback(async () => {
        carouselRef.current?.next();

        try {
            execSwap();
        } catch (e: any) {
            setFailedTx(true);
            setErrMessage(e.message);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        grabAndSetAddress();
        getFeeInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Panels
    // Breakdown of the swap out process
    const breakdownPanel = useCallback((): ReactElement => {
        return (
            <View style={[tailwind('w-full h-full items-center')]}>
                {/* Main breakdown */}
                <View
                    style={[
                        tailwind(
                            'w-5/6 mt-6 items-center justify-center flex rounded-md py-2',
                        ),
                        {
                            borderColor: ColorScheme.Background.Greyed,
                            borderWidth: 1,
                            marginTop: 128,
                        },
                    ]}>
                    {/* Onchain amount */}
                    <View style={[tailwind('w-full px-4 py-2')]}>
                        <VText
                            style={[
                                tailwind('w-full text-sm font-semibold mb-1'),
                                {
                                    color: ColorScheme.Text.Default,
                                    textAlign:
                                        langDir === 'right' ? 'right' : 'left',
                                },
                            ]}>
                            {capitalizeFirst(t('amount'))}
                        </VText>
                        {prepSwap ? (
                            <View
                                style={[
                                    tailwind(
                                        `${
                                            langDir === 'right'
                                                ? 'flex-row-reverse'
                                                : 'flex-row'
                                        } mt-2`,
                                    ),
                                ]}>
                                <DisplaySatsAmount
                                    textColor={ColorScheme.Text.DescText}
                                    amount={
                                        new BigNumber(
                                            prepSwap?.senderAmountSat as number,
                                        )
                                    }
                                    fontSize={'text-sm'}
                                />
                                <View
                                    style={[
                                        tailwind(
                                            `rounded-full px-4 py-1 ${
                                                langDir === 'right'
                                                    ? 'mr-2'
                                                    : 'ml-2'
                                            }`,
                                        ),
                                        {
                                            backgroundColor:
                                                ColorScheme.Background.Greyed,
                                        },
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm font-bold'),
                                            {
                                                color: ColorScheme.Text.Default,
                                            },
                                        ]}>
                                        {`${
                                            appFiatCurrency.symbol
                                        } ${normalizeFiat(
                                            new BigNumber(
                                                prepSwap?.senderAmountSat as number,
                                            ),
                                            new BigNumber(fiatRate.rate),
                                        )}`}
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View
                                style={[
                                    tailwind('mt-2 rounded-sm'),
                                    {
                                        backgroundColor:
                                            ColorScheme.Background.Greyed,
                                        height: 32,
                                        width: 128,
                                    },
                                ]}
                            />
                        )}
                    </View>

                    {/* Onchain receiving address */}
                    <View style={[tailwind('w-full px-4 py-2')]}>
                        <VText
                            style={[
                                tailwind('w-full text-sm font-semibold'),
                                {
                                    color: ColorScheme.Text.Default,
                                    textAlign:
                                        langDir === 'right' ? 'right' : 'left',
                                },
                            ]}>
                            {t('onchain_address')}
                        </VText>
                        {prepSwap ? (
                            <VText
                                style={[
                                    tailwind(
                                        'w-full text-sm mt-2 font-semibold',
                                    ),
                                    {
                                        color: ColorScheme.Text.DescText,
                                        textAlign:
                                            langDir === 'right'
                                                ? 'right'
                                                : 'left',
                                    },
                                ]}>
                                {btcAddress}
                            </VText>
                        ) : (
                            <View
                                style={[
                                    tailwind('mt-2 rounded-sm w-full'),
                                    {
                                        backgroundColor:
                                            ColorScheme.Background.Greyed,
                                        height: 32,
                                    },
                                ]}
                            />
                        )}
                    </View>

                    {/* Onchain amount */}
                    <View style={[tailwind('w-full px-4 py-2')]}>
                        <VText
                            style={[
                                tailwind('w-full text-sm font-semibold mb-1'),
                                {
                                    color: ColorScheme.Text.Default,
                                    textAlign:
                                        langDir === 'right' ? 'right' : 'left',
                                },
                            ]}>
                            {capitalizeFirst(t('recv_amount'))}
                        </VText>
                        {prepSwap ? (
                            <View
                                style={[
                                    tailwind(
                                        `${
                                            langDir === 'right'
                                                ? 'flex-row-reverse'
                                                : 'flex-row'
                                        } mt-2`,
                                    ),
                                ]}>
                                <DisplaySatsAmount
                                    textColor={ColorScheme.Text.DescText}
                                    amount={
                                        new BigNumber(
                                            prepSwap?.recipientAmountSat as number,
                                        )
                                    }
                                    fontSize={'text-sm'}
                                />
                                <View
                                    style={[
                                        tailwind(
                                            `rounded-full px-4 py-1 ${
                                                langDir === 'right'
                                                    ? 'mr-2'
                                                    : 'ml-2'
                                            }`,
                                        ),
                                        {
                                            backgroundColor:
                                                ColorScheme.Background.Greyed,
                                        },
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm font-bold'),
                                            {
                                                color: ColorScheme.Text.Default,
                                            },
                                        ]}>
                                        {`${
                                            appFiatCurrency.symbol
                                        } ${normalizeFiat(
                                            new BigNumber(
                                                prepSwap?.recipientAmountSat as number,
                                            ),
                                            new BigNumber(fiatRate.rate),
                                        )}`}
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View
                                style={[
                                    tailwind('mt-2 rounded-sm'),
                                    {
                                        backgroundColor:
                                            ColorScheme.Background.Greyed,
                                        height: 32,
                                        width: 128,
                                    },
                                ]}
                            />
                        )}
                    </View>

                    {/* total fee */}
                    <View style={[tailwind('w-full mt-2 px-4 py-2')]}>
                        <VText
                            style={[
                                tailwind('w-full text-sm font-bold mb-1'),
                                {
                                    color: ColorScheme.Text.Default,
                                    textAlign:
                                        langDir === 'right' ? 'right' : 'left',
                                },
                            ]}>
                            {t('total_swapout_fees')}
                        </VText>
                        {prepSwap ? (
                            <View
                                style={[
                                    tailwind(
                                        `${
                                            langDir === 'right'
                                                ? 'flex-row-reverse'
                                                : 'flex-row'
                                        } mt-2 items-center`,
                                    ),
                                ]}>
                                <DisplaySatsAmount
                                    textColor={ColorScheme.Text.DescText}
                                    amount={new BigNumber(prepSwap.totalFees)}
                                    fontSize={'text-sm'}
                                />
                                <View
                                    style={[
                                        tailwind(
                                            `rounded-full px-4 py-1 ${
                                                langDir === 'right'
                                                    ? 'mr-2'
                                                    : 'ml-2'
                                            }`,
                                        ),
                                        {
                                            backgroundColor:
                                                ColorScheme.Background.Greyed,
                                        },
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm font-bold'),
                                            {
                                                color: ColorScheme.Text.Default,
                                            },
                                        ]}>
                                        {`${
                                            appFiatCurrency.symbol
                                        } ${normalizeFiat(
                                            new BigNumber(prepSwap.totalFees),
                                            new BigNumber(fiatRate.rate),
                                        )}`}
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View
                                style={[
                                    tailwind('mt-2 rounded-sm'),
                                    {
                                        backgroundColor:
                                            ColorScheme.Background.Greyed,
                                        height: 32,
                                        width: 128,
                                    },
                                ]}
                            />
                        )}
                    </View>
                </View>

                {/* Display network congestion */}
                {mempoolInfo.mempoolHighFeeEnv && (
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
                        <AlertIcon width={16} height={16} fill={CardColor} />
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
                                    color: CardColor,
                                },
                            ]}>
                            {t('mempool_high_fee')}
                        </Text>
                    </View>
                )}

                {/* Bottom Button */}
                <View
                    style={[
                        tailwind('absolute items-center w-full'),
                        {bottom: NativeWindowMetrics.bottomButtonOffset + 24},
                    ]}>
                    <LongBottomButton
                        disabled={loadingTX || fees}
                        onPress={sendTx}
                        backgroundColor={ColorScheme.Background.Inverted}
                        title={capitalizeFirst(t('swap'))}
                        textColor={ColorScheme.Text.Alt}
                    />
                </View>
            </View>
        );
    }, [
        tailwind,
        ColorScheme,
        langDir,
        t,
        prepSwap,
        appFiatCurrency.symbol,
        fiatRate.rate,
        btcAddress,
        mempoolInfo.mempoolHighFeeEnv,
        CardColor,
        loadingTX,
        fees,
        sendTx,
    ]);

    // Swapping Progress
    const inflightPanel = useCallback((): ReactElement => {
        return (
            <View style={[tailwind('w-full h-full items-center')]}>
                {loadingTX && (
                    <View
                        style={[
                            tailwind(
                                'items-center justify-center h-full w-full',
                            ),
                            {marginTop: -48},
                        ]}>
                        <ActivityIndicator
                            color={ColorScheme.Text.Default}
                            size="small"
                        />
                        <Text
                            style={[
                                tailwind('text-sm mt-2'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
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
                            style={[
                                tailwind(
                                    'w-5/6 mt-6 items-center justify-center flex rounded-md py-2',
                                ),
                                {
                                    borderColor: ColorScheme.Background.Greyed,
                                    borderWidth: 1,
                                },
                            ]}>
                            {/* TXID */}
                            <View
                                style={[
                                    tailwind('w-full justify-start px-4 py-2'),
                                ]}>
                                <VText
                                    style={[
                                        tailwind(
                                            'w-full text-sm font-semibold mb-1',
                                        ),
                                        {
                                            color: ColorScheme.Text.Default,
                                        },
                                    ]}>
                                    {capitalizeFirst(t('tx_id'))}
                                </VText>
                                <VText
                                    style={[
                                        tailwind('w-full text-sm'),
                                        {
                                            color: ColorScheme.Text.DescText,
                                        },
                                    ]}>
                                    {rvsSwapInfo?.id}
                                </VText>
                            </View>

                            {/* Onchain amount */}
                            <View style={[tailwind('w-full px-4 py-2')]}>
                                <VText
                                    style={[
                                        tailwind(
                                            'w-full text-sm font-semibold mb-1',
                                        ),
                                        {
                                            color: ColorScheme.Text.Default,
                                            textAlign:
                                                langDir === 'right'
                                                    ? 'right'
                                                    : 'left',
                                        },
                                    ]}>
                                    {capitalizeFirst(t('recv_amount'))}
                                </VText>
                                <View
                                    style={[
                                        tailwind(
                                            `${
                                                langDir === 'right'
                                                    ? 'flex-row-reverse'
                                                    : 'flex-row'
                                            } mt-2`,
                                        ),
                                    ]}>
                                    <DisplaySatsAmount
                                        textColor={ColorScheme.Text.DescText}
                                        amount={
                                            new BigNumber(
                                                rvsSwapInfo?.onchainAmountSat as number,
                                            )
                                        }
                                        fontSize={'text-sm'}
                                    />
                                    <View
                                        style={[
                                            tailwind(
                                                `rounded-full px-4 py-1 ${
                                                    langDir === 'right'
                                                        ? 'mr-2'
                                                        : 'ml-2'
                                                }`,
                                            ),
                                            {
                                                backgroundColor:
                                                    ColorScheme.Background
                                                        .Greyed,
                                            },
                                        ]}>
                                        <Text
                                            style={[
                                                tailwind('text-sm font-bold'),
                                                {
                                                    color: ColorScheme.Text
                                                        .Default,
                                                },
                                            ]}>
                                            {`${
                                                appFiatCurrency.symbol
                                            } ${normalizeFiat(
                                                new BigNumber(
                                                    rvsSwapInfo?.onchainAmountSat as number,
                                                ),
                                                new BigNumber(fiatRate.rate),
                                            )}`}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Status */}
                            <View
                                style={[
                                    tailwind('w-full justify-start px-4 py-2'),
                                ]}>
                                <VText
                                    style={[
                                        tailwind(
                                            'w-full text-sm font-semibold mb-1',
                                        ),
                                        {
                                            color: ColorScheme.Text.Default,
                                        },
                                    ]}>
                                    {t('status')}
                                </VText>
                                <VText
                                    style={[
                                        tailwind('w-full text-sm'),
                                        {
                                            color: ColorScheme.Text.DescText,
                                        },
                                    ]}>
                                    {rvsSwapInfo?.status}
                                </VText>
                            </View>
                        </View>

                        <View
                            style={[
                                tailwind('absolute items-center w-full'),
                                {
                                    bottom:
                                        NativeWindowMetrics.bottomButtonOffset +
                                        24,
                                },
                            ]}>
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
                    <View style={[tailwind('items-center'), {marginTop: 128}]}>
                        <Failed
                            width={128}
                            height={128}
                            fill={ColorScheme.SVG.Default}
                        />

                        <Text
                            style={[
                                tailwind('mt-4 text-center text-sm'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {errMessage}
                        </Text>
                    </View>
                )}
            </View>
        );
    }, [
        tailwind,
        loadingTX,
        ColorScheme,
        statusMessage,
        failedTx,
        t,
        rvsSwapInfo?.id,
        rvsSwapInfo?.onchainAmountSat,
        rvsSwapInfo?.status,
        langDir,
        appFiatCurrency.symbol,
        fiatRate.rate,
        errMessage,
        navigation,
    ]);

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
                style={[tailwind('w-full h-full items-center justify-center')]}>
                <View
                    style={[
                        tailwind(
                            'absolute top-6 z-10 w-full flex-row items-center justify-center',
                        ),
                    ]}>
                    <PlainButton
                        onPress={handleCloseButton}
                        style={[tailwind('absolute z-10 left-6')]}>
                        <Close fill={ColorScheme.SVG.Default} />
                    </PlainButton>
                    <Text
                        style={[
                            tailwind('text-base font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {capitalizeFirst(t('swap_in'))}
                    </Text>
                </View>

                {/* Carousel */}
                <View
                    style={[
                        styles.carouselContainer,
                        tailwind('h-full w-full items-center'),
                        {zIndex: -9},
                    ]}>
                    <Carousel
                        ref={carouselRef}
                        style={[tailwind('items-center')]}
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

                <Toast config={toastConfig as ToastConfig} />
            </View>
        </SafeAreaView>
    );
};

export default SwapOut;

const styles = StyleSheet.create({
    carouselContainer: {
        flex: 1,
    },
    dots: {
        flexDirection: 'row',
        alignSelf: 'center',
        width: 26,
        position: 'absolute',
    },
});
