/* eslint-disable react-hooks/exhaustive-deps */
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

import {useNavigation, StackActions} from '@react-navigation/native';

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

import Dot from '../../components/dots';
import {calculateFiatEquivalent} from '../../modules/transform';

import {capitalizeFirst, formatFiat} from '../../modules/transform';
import {AppStorageContext} from '../../class/storageContext';
import {ReverseSwapInfo, sendOnchain} from '@breeztech/react-native-breez-sdk';

import {TMempoolFeeRates} from '../../types/wallet';
import {getFeeRates} from '../../modules/mempool';

import Toast, {ToastConfig} from 'react-native-toast-message';
import {toastConfig} from '../../components/toast';

type Props = NativeStackScreenProps<WalletParamList, 'SwapOut'>;
type Slide = () => ReactElement;

const SwapOut = ({route}: Props) => {
    // TODO: add case to handle max swap "maxReverseSwapAmount"
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {getWalletData, currentWalletID, fiatRate} =
        useContext(AppStorageContext);
    const wallet = getWalletData(currentWalletID);

    const navigation = useNavigation();
    const {t} = useTranslation('wallet');
    const {t: e} = useTranslation('errors');

    const [swapLoading, setSwapLoading] = useState(false);
    const [swapInfo, setSwapInfo] = useState({} as ReverseSwapInfo);
    const [satsPerVB, setSatsPerVB] = useState(0);

    const carouselRef = React.useRef(null);

    const progressValue = useSharedValue(0);

    const amount = new BigNumber(
        route.params.satsAmount > 0 ? route.params.satsAmount : 56_000,
    );
    const btcAddress = wallet.address.address;

    const handleCloseButton = () => {
        navigation.dispatch(StackActions.popToTop());
    };

    // Panels
    // Breakdown of the swap out process
    const breakdownPanel = useCallback((): ReactElement => {
        const initSwap = async (): Promise<void> => {
            setSwapLoading(true);

            try {
                const _info = await sendOnchain({
                    amountSat: amount.toNumber(),
                    onchainRecipientAddress: btcAddress,
                    pairHash: route.params.fees.feesHash,
                    satPerVbyte: satsPerVB,
                });

                setSwapInfo(_info.reverseSwapInfo);

                setSwapLoading(false);

                carouselRef.current?.next();
            } catch (error: any) {
                // Show toast
                Toast.show({
                    topOffset: 54,
                    type: 'Liberal',
                    text1: t('feerate'),
                    text2: error.message,
                    visibilityTime: 2000,
                });

                setSwapLoading(false);
            }
        };

        return (
            <View
                style={[tailwind('w-full h-full items-center justify-center')]}>
                <View style={[tailwind('w-5/6 items-center justify-center')]}>
                    <Text style={[tailwind('text-lg font-semibold mb-2')]}>
                        {t('swap_amount')}
                    </Text>
                    <DisplayFiatAmount
                        amount={formatFiat(
                            calculateFiatEquivalent(
                                amount.toString(),
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
                            'w-5/6 mt-12 items-center justify-center flex rounded-md py-2',
                        ),
                        {
                            borderColor: ColorScheme.Background.Greyed,
                            borderWidth: 1,
                        },
                    ]}>
                    {/* Onchain address */}
                    <View style={[tailwind('w-full justify-start px-4 py-2')]}>
                        <VText
                            style={[
                                tailwind('w-full text-sm font-semibold mb-1'),
                            ]}>
                            {t('onchain_address')}
                        </VText>
                        <VText
                            style={[
                                tailwind('w-full text-sm'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {btcAddress}
                        </VText>
                    </View>

                    {/* Amount to swap */}
                    <View
                        style={[
                            tailwind('w-full mt-2 justify-start px-4 py-2'),
                        ]}>
                        <VText
                            style={[tailwind('w-full text-sm font-bold mb-1')]}>
                            {t('swap_amount_sats')}
                        </VText>
                        <DisplaySatsAmount
                            textColor={ColorScheme.Text.DescText}
                            amount={amount}
                            fontSize={'text-sm'}
                        />
                    </View>

                    {/* Channel Fee */}
                    <View
                        style={[
                            tailwind('w-full mt-2 justify-start px-4 py-2'),
                        ]}>
                        <VText
                            style={[tailwind('w-full text-sm font-bold mb-1')]}>
                            {t('channel_fee')}
                        </VText>
                        <DisplaySatsAmount
                            textColor={ColorScheme.Text.DescText}
                            amount={
                                new BigNumber(
                                    route.params.fees
                                        .totalEstimatedFees as number,
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
                            style={[tailwind('w-full text-sm font-bold mb-1')]}>
                            {t('onchain_fee_rate')}
                        </VText>
                        <Text
                            style={
                                (tailwind('text-sm'),
                                {color: ColorScheme.Text.DescText})
                            }>
                            {satsPerVB} sats/vbyte
                        </Text>
                    </View>
                </View>

                {swapLoading && (
                    <View
                        style={[
                            tailwind('absolute'),
                            {bottom: NativeWindowMetrics.bottom + 116},
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
                            {t('creating_swap...')}
                        </Text>
                    </View>
                )}

                {/* Bottom Button */}
                <View
                    style={[
                        tailwind('absolute items-center w-full'),
                        {bottom: NativeWindowMetrics.bottom},
                    ]}>
                    <LongBottomButton
                        disabled={swapLoading}
                        onPress={initSwap}
                        backgroundColor={ColorScheme.Background.Inverted}
                        title={t('swap')}
                        textColor={ColorScheme.Text.Alt}
                    />
                </View>
            </View>
        );
    }, [
        tailwind,
        t,
        amount,
        fiatRate.rate,
        btcAddress,
        route.params.fees.totalEstimatedFees,
        route.params.fees.feesHash,
        satsPerVB,
        swapLoading,
    ]);

    // Swapping Progress
    const inflightPanel = useCallback((): ReactElement => {
        return (
            <View
                style={[tailwind('w-full h-full items-center justify-center')]}>
                <View style={[tailwind('text-center')]}>
                    {/* <FlatList data={listOfSwaps} renderItem={undefined} /> */}
                </View>

                {/* Main breakdown */}
                <View
                    style={[
                        tailwind(
                            'w-5/6 mt-12 items-center justify-center flex rounded-md py-2',
                        ),
                        {
                            borderColor: ColorScheme.Background.Greyed,
                            borderWidth: 1,
                        },
                    ]}>
                    <Text
                        style={[
                            tailwind('text-lg font-semibold mt-4 mb-6'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {t('swap_details')}
                    </Text>
                    {/* ID */}
                    <View style={[tailwind('w-full justify-start px-4 py-2')]}>
                        <VText
                            style={[
                                tailwind('w-full text-sm font-semibold mb-1'),
                            ]}>
                            {t('id')}
                        </VText>
                        <VText
                            style={[
                                tailwind('w-full text-sm'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {swapInfo.id}
                        </VText>
                    </View>

                    {/* Status */}
                    <View style={[tailwind('w-full justify-start px-4 py-2')]}>
                        <VText
                            style={[
                                tailwind('w-full text-sm font-semibold mb-1'),
                            ]}>
                            {t('status')}
                        </VText>
                        <VText
                            style={[
                                tailwind('w-full text-sm'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {swapInfo.status}
                        </VText>
                    </View>

                    {/* Amount to swap */}
                    <View
                        style={[
                            tailwind('w-full mt-2 justify-start px-4 py-2'),
                        ]}>
                        <VText
                            style={[tailwind('w-full text-sm font-bold mb-1')]}>
                            {t('onchain_amount_sat')}
                        </VText>
                        <DisplaySatsAmount
                            textColor={ColorScheme.Text.DescText}
                            amount={new BigNumber(swapInfo.onchainAmountSat)}
                            fontSize={'text-sm'}
                        />
                    </View>

                    {/* lockupTxid */}
                    <View style={[tailwind('w-full justify-start px-4 py-2')]}>
                        <VText
                            style={[
                                tailwind('w-full text-sm font-semibold mb-1'),
                            ]}>
                            {t('lockup_tx_id')}
                        </VText>
                        <VText
                            style={[
                                tailwind('w-full text-sm'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {swapInfo.lockupTxid}
                        </VText>
                    </View>

                    {/* claimTxid */}
                    <View style={[tailwind('w-full justify-start px-4 py-2')]}>
                        <VText
                            style={[
                                tailwind('w-full text-sm font-semibold mb-1'),
                            ]}>
                            {t('claim_tx_id')}
                        </VText>
                        <VText
                            style={[
                                tailwind('w-full text-sm'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {swapInfo.claimTxid}
                        </VText>
                    </View>

                    {/* claimPubkey */}
                    <View style={[tailwind('w-full justify-start px-4 py-2')]}>
                        <VText
                            style={[
                                tailwind('w-full text-sm font-semibold mb-1'),
                            ]}>
                            {t('claimPubKey')}
                        </VText>
                        <VText
                            style={[
                                tailwind('w-full text-sm'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {swapInfo.claimPubkey}
                        </VText>
                    </View>
                </View>

                {/* Swap details */}
                <View style={[tailwind('items-center mt-6')]}>
                    <ActivityIndicator
                        color={ColorScheme.Text.Default}
                        size="small"
                    />
                    <Text
                        style={[
                            tailwind('text-lg font-semibold mt-2'),
                            {color: ColorScheme.Text.DescText},
                        ]}>
                        {t('swapping...')}
                    </Text>
                </View>
            </View>
        );
    }, []);

    const panels = useMemo(
        (): Slide[] => [breakdownPanel, inflightPanel],
        [breakdownPanel, inflightPanel],
    );

    const getOnchainFeerate = async () => {
        try {
            let rates: TMempoolFeeRates;

            try {
                const fetchedRates = await getFeeRates(wallet.network);

                rates = fetchedRates as TMempoolFeeRates;

                setSatsPerVB(rates.fastestFee);
            } catch (err: any) {
                // Error assumed to be 503; mempool unavailable due to sync
                Toast.show({
                    topOffset: 54,
                    type: 'Liberal',
                    text1: t('feerate'),
                    text2: e('failed_fee_rate_fetch'),
                    visibilityTime: 1750,
                });
            }
        } catch (error: any) {
            // Show toast
            Toast.show({
                topOffset: 54,
                type: 'Liberal',
                text1: t('feerate'),
                text2: error.message,
                visibilityTime: 2000,
            });
        }
    };

    useEffect(() => {
        getOnchainFeerate();
    }, []);

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

                    <View
                        style={[
                            styles.dots,
                            tailwind('items-center justify-center'),
                            {bottom: NativeDims.bottom + 12},
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
