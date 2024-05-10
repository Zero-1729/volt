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

import {LongBottomButton, PlainButton} from '../../components/button';

import Carousel from 'react-native-reanimated-carousel';
import {useTranslation} from 'react-i18next';
import {DisplayFiatAmount, DisplaySatsAmount} from '../../components/balance';
import BigNumber from 'bignumber.js';

import {calculateFiatEquivalent} from '../../modules/transform';

import {capitalizeFirst, formatFiat} from '../../modules/transform';
import {AppStorageContext} from '../../class/storageContext';
import {inProgressSwap} from '@breeztech/react-native-breez-sdk';

import Success from '../../assets/svg/check-circle-fill-24.svg';
import Failed from '../../assets/svg/x-circle-fill-24.svg';

import Toast, {ToastConfig} from 'react-native-toast-message';
import {toastConfig} from '../../components/toast';
import {getPrivateDescriptors} from '../../modules/descriptors';
import {TComboWallet} from '../../types/wallet';
import {SingleBDKSend, psbtFromInvoice} from '../../modules/bdk';
import {PartiallySignedTransaction} from 'bdk-rn';

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
    } = useContext(AppStorageContext);
    const wallet = getWalletData(currentWalletID);

    const navigation = useNavigation();
    const {t} = useTranslation('wallet');

    const [loadingTX, setLoadingTX] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>();
    const [failedTx, setFailedTx] = useState<boolean>(false);
    const [errMessage, setErrMessage] = useState<string>();
    const [txID, setTxID] = useState<string>();

    const swapInfo = route.params.swapMeta;
    const carouselRef = React.useRef(null);
    const progressValue = useSharedValue(0);
    const btcAddress = wallet.address.address;

    const handleCloseButton = () => {
        navigation.dispatch(StackActions.popToTop());
    };

    const sendTx = useCallback(async () => {
        setLoadingTX(true);
        carouselRef.current?.next();

        // For now, only single sends are supported
        // Update wallet descriptors to private version
        const descriptors = getPrivateDescriptors(wallet.privateDescriptor);

        setStatusMessage(t('generating_tx'));

        const _uPsbt = (await psbtFromInvoice(
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
        )) as PartiallySignedTransaction;

        setLoadingTX(false);

        try {
            let _w = {
                ...wallet,
                externalDescriptor: descriptors.external,
                internalDescriptor: descriptors.internal,
            };
            // We expect a signed PSBT to be passed in
            const {broadcasted, psbt, errorMessage} = await SingleBDKSend(
                _uPsbt.base64,
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

        inProgressSwap()
            .then((value: any) => {
                console.log('In progress (swapIn): ', value);
                setLoadingTX(false);
            })
            .catch((e: any) => {
                console.log('In progress (swapIn) error: ', e.message);
                setLoadingTX(false);
                setErrMessage(e.message);
            });
    }, [
        electrumServerURL,
        mempoolInfo.fastestFee,
        route.params.invoiceData,
        t,
        wallet,
    ]);

    // Panels
    // Breakdown of the swap out process
    const breakdownPanel = useCallback((): ReactElement => {
        return (
            <View style={[tailwind('w-full h-full items-center')]}>
                <View
                    style={[
                        tailwind('w-5/6 items-center justify-center'),
                        {marginTop: 98},
                    ]}>
                    <DisplayFiatAmount
                        amount={formatFiat(
                            calculateFiatEquivalent(
                                new BigNumber(
                                    route.params.invoiceData.options
                                        ?.amount as number,
                                ).toString(),
                                fiatRate.rate,
                            ),
                        )}
                        fontSize={'text-2xl'}
                    />
                </View>

                {/* Main breakdown */}
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
                    {/* Onchain sending (own) address */}
                    <View style={[tailwind('w-full justify-start px-4 py-2')]}>
                        <VText
                            style={[
                                tailwind('w-full text-sm font-semibold mb-1'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {capitalizeFirst(t('from'))}
                        </VText>
                        <VText
                            style={[
                                tailwind('w-full text-sm'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {btcAddress}
                        </VText>
                    </View>

                    {/* Onchain receiving address */}
                    <View style={[tailwind('w-full justify-start px-4 py-2')]}>
                        <VText
                            style={[
                                tailwind('w-full text-sm font-semibold mb-1'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {capitalizeFirst(t('to'))}
                        </VText>
                        <VText
                            style={[
                                tailwind('w-full text-sm'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {swapInfo.address}
                        </VText>
                    </View>

                    {/* Amount to swap */}
                    <View
                        style={[
                            tailwind('w-full mt-2 justify-start px-4 py-2'),
                        ]}>
                        <VText
                            style={[
                                tailwind('w-full text-sm font-bold mb-1'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('swap_amount_sats')}
                        </VText>
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
                    </View>

                    {/* onchain fee */}
                    <View
                        style={[
                            tailwind('w-full mt-2 justify-start px-4 py-2'),
                        ]}>
                        <VText
                            style={[
                                tailwind('w-full text-sm font-bold mb-1'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('onchain_fee_rate')}
                        </VText>
                        <Text
                            style={
                                (tailwind('text-sm'),
                                {color: ColorScheme.Text.DescText})
                            }>
                            {mempoolInfo.fastestFee} sats/vbyte
                        </Text>
                    </View>
                </View>

                {/* Bottom Button */}
                <View
                    style={[
                        tailwind('absolute items-center w-full'),
                        {bottom: NativeWindowMetrics.bottomButtonOffset + 24},
                    ]}>
                    <LongBottomButton
                        disabled={loadingTX}
                        onPress={sendTx}
                        backgroundColor={ColorScheme.Background.Inverted}
                        title={t('swap')}
                        textColor={ColorScheme.Text.Alt}
                    />
                </View>
            </View>
        );
    }, [
        tailwind,
        route.params.invoiceData.options?.amount,
        fiatRate.rate,
        ColorScheme,
        t,
        btcAddress,
        swapInfo.address,
        mempoolInfo.fastestFee,
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

                            {/* Amount to swap */}
                            <View
                                style={[
                                    tailwind(
                                        'w-full mt-2 justify-start px-4 py-2',
                                    ),
                                ]}>
                                <VText
                                    style={[
                                        tailwind(
                                            'w-full text-sm font-bold mb-1',
                                        ),
                                        {
                                            color: ColorScheme.Text.Default,
                                        },
                                    ]}>
                                    {t('onchain_amount_sat')}
                                </VText>
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
                                {t('swapout_message')}
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
        swapInfo.lockHeight,
        route.params.invoiceData.options?.amount,
        errMessage,
        navigation,
    ]);

    const panels = useMemo(
        (): Slide[] => [breakdownPanel, inflightPanel],
        [breakdownPanel, inflightPanel],
    );

    useEffect(() => {
        // create transaction and send
        // sendTx();
    }, [loadingTX]);

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
                        {capitalizeFirst(t('swap_out'))}
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
