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

import Toast, {ToastConfig} from 'react-native-toast-message';
import {toastConfig} from '../../components/toast';
import {getPrivateDescriptors} from '../../modules/descriptors';
import {TComboWallet} from '../../types/wallet';
import {SingleBDKSend, psbtFromInvoice} from '../../modules/bdk';
import {PartiallySignedTransaction} from 'bdk-rn';
import {openChannelFee} from '@breeztech/react-native-breez-sdk';

type Props = NativeStackScreenProps<WalletParamList, 'SwapIn'>;
type Slide = () => ReactElement;

const SwapIn = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {
        getWalletData,
        currentWalletID,
        fiatRate,
        electrumServerURL,
        mempoolInfo,
        appFiatCurrency,
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
    const carouselRef = React.useRef(null);
    const progressValue = useSharedValue(0);

    const CardColor = ColorScheme.WalletColors[wallet.type][wallet.network];

    const handleCloseButton = () => {
        navigation.dispatch(StackActions.popToTop());
    };

    const getChannelOpeningFees = async () => {
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
    };

    const generatePsbt = async () => {
        setLoadingTX(true);

        psbtFromInvoice(
            descriptors,
            mempoolInfo.fastestFee,
            route.params.invoiceData,
            wallet as TComboWallet,
            new BigNumber(wallet.balance.onchain),
            electrumServerURL,
            (e: any) => {
                Toast.show({
                    topOffset: 54,
                    type: 'Liberal',
                    text1: capitalizeFirst(t('error')),
                    text2: t('tx_fail_creation_error'),
                    visibilityTime: 2000,
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
    };

    const setPsbtVsize = async () => {
        const psbt = _uPsbt as PartiallySignedTransaction;

        try {
            const vsize = await (await psbt.extractTx()).size();

            _setUPVS(vsize);
        } catch (e: any) {
            console.log('[Error]: ', e.message);
        }
    };

    const sendTx = useCallback(async () => {
        carouselRef.current?.next();

        try {
            let _w = {
                ...wallet,
                externalDescriptor: descriptors.external,
                internalDescriptor: descriptors.internal,
            };

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
                    {/* LN amount */}
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
                                        route.params.invoiceData.options
                                            ?.amount as number,
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
                        <VText
                            style={[
                                tailwind('w-full text-sm mt-2'),
                                {
                                    color: ColorScheme.Text.DescText,
                                    textAlign:
                                        langDir === 'right' ? 'right' : 'left',
                                },
                            ]}>
                            {swapInfo.address}
                        </VText>
                    </View>

                    {/* onchain fee */}
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
                            {t('onchain_fee_rate')}
                        </VText>
                        {_uPsbt && _uPsbtVSize ? (
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
                                <Text
                                    style={[
                                        {color: ColorScheme.Text.DescText},
                                    ]}>
                                    {`${addCommas(
                                        mempoolInfo.fastestFee.toString(),
                                    )} sats/vB`}
                                </Text>
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

                    {/* Amount to swap */}
                    {loadingChanFees ? (
                        <View
                            style={[
                                tailwind(
                                    'self-start ml-4 w-5/6 rounded-sm mt-4 mb-4',
                                ),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                    height: 48,
                                },
                            ]}
                        />
                    ) : (
                        <View
                            style={[
                                tailwind('w-full mt-2 justify-start px-4 py-2'),
                            ]}>
                            <VText
                                style={[
                                    tailwind('w-full text-sm font-bold mb-1'),
                                    {
                                        color: ColorScheme.Text.Default,
                                        textAlign:
                                            langDir === 'right'
                                                ? 'right'
                                                : 'left',
                                    },
                                ]}>
                                {t('channel_fee')}
                            </VText>
                            {channelOpeningFees > 0 ? (
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
                                            new BigNumber(channelOpeningFees)
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
                                                    channelOpeningFees,
                                                ),
                                                new BigNumber(fiatRate.rate),
                                            )}`}
                                        </Text>
                                    </View>
                                </View>
                            ) : (
                                <Text
                                    style={[
                                        tailwind('text-sm mt-1 mb-2'),
                                        {
                                            color: ColorScheme.Text.DescText,
                                            textAlign:
                                                langDir === 'right'
                                                    ? 'right'
                                                    : 'left',
                                        },
                                    ]}>
                                    -
                                </Text>
                            )}
                        </View>
                    )}
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
        tailwind,
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
                                    {txID}
                                </VText>
                            </View>

                            {/* LN amount */}
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
                                                route.params.invoiceData.options
                                                    ?.amount as number,
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
                                    {t('lock_height')}
                                </VText>
                                <VText
                                    style={[
                                        tailwind('w-full text-sm'),
                                        {
                                            color: ColorScheme.Text.DescText,
                                        },
                                    ]}>
                                    {swapInfo.lockHeight}
                                </VText>
                            </View>
                        </View>

                        <View
                            style={[
                                tailwind('items-center w-5/6 mt-4 flex-row'),
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm text-center ml-2'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {t('swapout_message', {n: i18nNumber(6)})}
                            </Text>
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
        txID,
        langDir,
        route.params.invoiceData.options?.amount,
        appFiatCurrency.symbol,
        fiatRate.rate,
        swapInfo.lockHeight,
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

export default SwapIn;

const styles = StyleSheet.create({
    carouselContainer: {
        flex: 1,
    },
});
