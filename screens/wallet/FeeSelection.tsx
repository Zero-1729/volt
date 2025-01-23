/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useContext, useState, useEffect} from 'react';
import {
    Text,
    View,
    useColorScheme,
    Alert,
    Platform,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';

import VText from './../../components/text';

import {useTranslation} from 'react-i18next';

import {CommonActions, useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStorageContext} from '../../class/storageContext';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WalletParamList} from '../../Navigation';

import BigNumber from 'bignumber.js';
import {TComboWallet} from '../../types/wallet';

import {LongBottomButton, PlainButton} from '../../components/button';
import Prompt from 'react-native-prompt-android';

import Color from '../../constants/Color';

import {TMempoolFeeRates} from '../../types/wallet';
import {getFeeRates} from '../../modules/mempool';
import {
    normalizeFiat,
    addCommas,
    capitalizeFirst,
} from '../../modules/transform';

import SelectedIcon from './../../assets/svg/check-circle-fill-24.svg';
import Close from '../../assets/svg/x-24.svg';

import NativeWindowMetrics from '../../constants/NativeWindowMetrics';
import {getPrivateDescriptors} from '../../modules/descriptors';
import {psbtFromInvoice} from '../../modules/bdk';

import {LiberalToast} from '../../components/toast';

import Info from '../../assets/svg/info-16.svg';
import AlertIcon from '../../assets/svg/alert-16.svg';
import { Toasts } from '@backpackapp-io/react-native-toast';

type Props = NativeStackScreenProps<WalletParamList, 'FeeSelection'>;

const FeeSelection = ({route}: Props) => {
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const {t, i18n} = useTranslation('wallet');
    const {t: e} = useTranslation('errors');

    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const isAndroid = Platform.OS === 'android';

    const {
        fiatRate,
        appFiatCurrency,
        electrumServerURL,
        mempoolInfo,
        currentWalletID,
        getWalletData,
        isAdvancedMode,
    } = useContext(AppStorageContext);
    const [selectedFeeRate, setSelectedFeeRate] = useState<number>(1);
    const [selectedFeeRateType, setSelectedFeeRateType] = useState<string>();
    const [psbtVSize, setPsbtVSize] = useState<number>(1);
    const [loadingData, setLoadingData] = useState<boolean>(true);
    const [feeRates, setFeeRates] = useState<TMempoolFeeRates>({
        fastestFee: 2,
        halfHourFee: 1,
        hourFee: 1,
        economyFee: 1,
        minimumFee: 1,
    });

    const walletData = getWalletData(currentWalletID);

    const CardColor =
        ColorScheme.WalletColors[walletData.type][walletData.network];

    const isFeeTooHigh = (fee: number, isMaxAmount: boolean) => {
        const amount = Number(route.params.invoiceData.options?.amount);

        const balance = new BigNumber(route.params.wallet.balanceOnchain);

        return isMaxAmount ? balance.lte(fee) : balance.lte(fee + amount);
    };

    const calculateUPsbt = async () => {
        const descriptors = getPrivateDescriptors(
            route.params.wallet.privateDescriptor,
        );

        const _psbtVsize = await psbtFromInvoice(
            descriptors,
            selectedFeeRate,
            route.params.invoiceData,
            route.params.wallet as TComboWallet,
            new BigNumber(route.params.wallet.balanceOnchain),
            electrumServerURL,
            (err: any) => {
                if (isAdvancedMode) {
                    LiberalToast(capitalizeFirst(t('error')), e('tx_fail_creation_error'), {
                        duration: 3000,
                    });
                }

                console.log(
                    '[Fee Selection] Failed to create tx: ',
                    err.message,
                );

                // Stop loading
                setLoadingData(false);
            },
            true,
        );

        // Set psbt vsize
        setPsbtVSize(_psbtVsize as number);

        // Select fastest fee
        setSelectedFeeRateType('priority');

        // Stop loading
        setLoadingData(false);
    };

    const fetchFeeRates = async () => {
        let rates = feeRates;

        try {
            const fetchedRates = await getFeeRates(route.params.wallet.network);

            rates = fetchedRates as TMempoolFeeRates;
        } catch (err: any) {
            // Error assumed to be 503; mempool unavailable due to sync
            LiberalToast(t('feerate'), e('failed_fee_rate_fetch'), {
                duration: 3000,
            });
        }

        // Set the fee rate from modal or use fastest
        setSelectedFeeRate(rates.fastestFee);
        setFeeRates(rates);
    };

    const updateCustomFeeRate = (value: string | undefined) => {
        const rate = Number(value);
        const amount = Number(route.params.invoiceData.options?.amount);
        const isMaxSend = new BigNumber(route.params.wallet.balanceOnchain).eq(
            amount,
        );
        const fee = rate * psbtVSize;

        // Warn user that fee rate invalid
        if (Number.isNaN(rate)) {
            LiberalToast(e('invalid_fee_rate'), e('invalid_fee_rate_message'), {
                duration: 3000,
            });

            return;
        }

        // Avoid too high fee rate
        if (isFeeTooHigh(fee, isMaxSend)) {
            LiberalToast(capitalizeFirst(t('error')), e('fee_too_high_error'), {
                duration: 3000,
            });
            return;
        }

        setFeeRate(rate, 'custom');
    };

    const setFeeRate = (rate: number, rateType: string) => {
        setSelectedFeeRate(rate);
        setSelectedFeeRateType(rateType);
    };

    const getFeeRateTime = (rate: number) => {
        if (rate >= feeRates.fastestFee) {
            return t('ten_mins');
        } else if (rate >= feeRates.halfHourFee) {
            return t('thirty_mins');
        } else if (rate >= feeRates.hourFee) {
            return t('one_hour');
        } else if (rate >= feeRates.minimumFee) {
            return t('one_day');
        } else {
            return t('over_one_day');
        }
    };

    const openFeeModal = () => {
        if (isAndroid) {
            Prompt(
                t('custom'),
                t('custom_fee_alert_message'),
                [
                    {text: capitalizeFirst(t('cancel'))},
                    {
                        text: t('set'),
                        onPress: updateCustomFeeRate,
                    },
                ],
                {
                    type: 'numeric',
                },
            );
        } else {
            Alert.prompt(
                t('custom'),
                t('custom_fee_alert_message'),
                [
                    {
                        text: capitalizeFirst(t('cancel')),
                        onPress: () => {},
                        style: 'cancel',
                    },
                    {
                        text: t('set'),
                        onPress: updateCustomFeeRate,
                    },
                ],
                'plain-text',
                '',
                'number-pad',
            );
        }
    };

    useEffect(() => {
        fetchFeeRates();
        calculateUPsbt();
    }, []);

    return (
        <SafeAreaView
            edges={['top', 'left', 'bottom', 'right']}
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View
                className="w-full h-full items-center relative"
                style={{
                    backgroundColor: ColorScheme.Background.Primary,
                }}>
                <View
                    className="absolute w-full top-6 flex-row items-center justify-center">
                    <PlainButton
                        onPress={() =>
                            navigation.dispatch(CommonActions.goBack())
                        }
                        className="absolute z-10 left-6">
                        <Close fill={ColorScheme.SVG.Default} />
                    </PlainButton>
                    <Text
                        className="text-sm font-bold"
                        style={{color: ColorScheme.Text.Default}}>
                        {t('select_fee_rate_title')}
                    </Text>
                </View>

                <View
                    className="w-full px-6 py-8 justify-center relative"
                    style={{top: 100}}>
                    {/* Fee selection: 10 mins */}
                    <PlainButton
                        onPress={() => {
                            setFeeRate(feeRates.fastestFee, 'priority');
                        }}>
                        <View>
                            <View
                                className={
                                    `${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } justify-between items-center w-full`
                                }>
                                <View
                                    className={
                                        `${
                                            langDir === 'right'
                                                ? 'flex-row-reverse'
                                                : 'flex-row'
                                        } justify-center items-center`
                                    }>
                                    <VText
                                        className={
                                            `text-left ${
                                                langDir === 'right'
                                                    ? 'ml-2'
                                                    : 'mr-2'
                                            }  text-sm font-semibold`
                                        }
                                        style={{color: ColorScheme.Text.Default}}>
                                        {t('high_priority_fee')}
                                    </VText>

                                    {/* Faux loading placeholder */}
                                    {loadingData && (
                                        <View
                                            className="absolute items-center w-full"
                                            style={{
                                                height: 20,
                                                backgroundColor:
                                                    ColorScheme.Background
                                                        .Greyed,
                                            }}
                                        />
                                    )}

                                    {selectedFeeRateType === 'priority' && (
                                        <SelectedIcon
                                            height={16}
                                            width={16}
                                            fill={ColorScheme.SVG.Default}
                                        />
                                    )}
                                </View>

                                {!loadingData && (
                                    <View
                                        className="items-center flex-row">
                                        <Text
                                            className="text-sm mr-2"
                                            style={{
                                                color: ColorScheme.Text
                                                    .GrayedText,
                                            }}>
                                            {`${addCommas(
                                                feeRates.fastestFee.toString(),
                                            )} ${t('sat_vbyte')}`}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {!loadingData && (
                                <View className="w-full mt-2">
                                    <VText
                                        className="text-sm"
                                        style={{
                                            color: ColorScheme.Text
                                                .GrayedText,
                                        }}>
                                        {t('priority_fee_description')}
                                    </VText>
                                    <VText
                                        className="text-sm"
                                        style={[
                                            {
                                                color: ColorScheme.Text
                                                    .GrayedText,
                                            },
                                        ]}>
                                        {`~${addCommas(
                                            (
                                                psbtVSize * feeRates.fastestFee
                                            ).toString(),
                                        )} sats (${
                                            appFiatCurrency.symbol
                                        } ${normalizeFiat(
                                            new BigNumber(
                                                psbtVSize * feeRates.fastestFee,
                                            ),
                                            new BigNumber(fiatRate.rate),
                                        )})`}
                                    </VText>
                                </View>
                            )}
                        </View>
                    </PlainButton>

                    <View
                        className="w-full mt-6"
                        style={[
                            styles.divider,
                            {
                                backgroundColor: ColorScheme.Background.Greyed,
                            },
                        ]}
                    />

                    {/* Fee selection: Medium 30 minutes */}
                    <PlainButton
                        onPress={() => {
                            setFeeRate(feeRates.halfHourFee, 'economic');
                        }}>
                        <View className="mt-6">
                            <View
                                className={
                                    `${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    }  justify-between items-center w-full`
                                }>
                                <View
                                    className={
                                        `${
                                            langDir === 'right'
                                                ? 'flex-row-reverse'
                                                : 'flex-row'
                                        }  justify-center items-center`
                                    }>
                                    <VText
                                        className={
                                            `text-left ${
                                                langDir === 'right'
                                                    ? 'ml-2'
                                                : 'mr-2'
                                            }  text-sm font-semibold`
                                        }
                                        style={{color: ColorScheme.Text.Default}}>
                                        {t('economic_fee')}
                                    </VText>

                                    {/* Faux loading placeholder */}
                                    {loadingData && (
                                        <View
                                            className="absolute items-center w-full"
                                            style={{
                                                height: 20,
                                                backgroundColor:
                                                    ColorScheme.Background
                                                        .Greyed,
                                            }}
                                        />
                                    )}

                                    {selectedFeeRateType === 'economic' && (
                                        <SelectedIcon
                                            height={16}
                                            width={16}
                                            fill={ColorScheme.SVG.Default}
                                        />
                                    )}
                                </View>

                                {!loadingData && (
                                    <View
                                        className="items-center flex-row">
                                        <Text
                                            className="text-sm mr-2"
                                            style={{
                                                color: ColorScheme.Text
                                                    .GrayedText,
                                            }}>
                                            {`${addCommas(
                                                feeRates.economyFee.toString(),
                                            )} ${t('sat_vbyte')}`}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {!loadingData && (
                                <View className="w-full mt-2">
                                    <VText
                                        className="text-sm"
                                        style={{
                                            color: ColorScheme.Text
                                                .GrayedText,
                                        }}>
                                        {t('economic_fee_description')}
                                    </VText>
                                    <VText
                                        className="text-sm"
                                        style={{
                                            color: ColorScheme.Text
                                                .GrayedText,
                                        }}>
                                        {`~${addCommas(
                                            (
                                                psbtVSize * feeRates.fastestFee
                                            ).toString(),
                                        )} sats (${
                                            appFiatCurrency.symbol
                                        } ${normalizeFiat(
                                            new BigNumber(
                                                psbtVSize * feeRates.economyFee,
                                            ),
                                            new BigNumber(fiatRate.rate),
                                        )})`}
                                    </VText>
                                </View>
                            )}
                        </View>
                    </PlainButton>

                    <View
                        className="w-full mt-6"
                        style={[
                            styles.divider,
                            {
                                backgroundColor: ColorScheme.Background.Greyed,
                            },
                        ]}
                    />

                    {/* Custom Fee selection */}
                    {/* Calculate fee & time (comp against fetched feerates) */}
                    <PlainButton
                        onPress={() => {
                            openFeeModal();
                        }}>
                        <View className="mt-6">
                            <View
                                className={
                                    `${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } justify-between items-center w-full`
                                }>
                                <View
                                    className="flex-row justify-center items-center">
                                    <VText
                                        className="text-left text-sm font-semibold mr-2"
                                        style={{color: ColorScheme.Text.Default}}>
                                        {t('custom_fee')}
                                    </VText>

                                    {/* Faux loading placeholder */}
                                    {loadingData && (
                                        <View
                                            className="absolute items-center w-full"
                                            style={{
                                                height: 20,
                                                backgroundColor:
                                                    ColorScheme.Background
                                                        .Greyed,
                                            }}
                                        />
                                    )}

                                    {selectedFeeRateType === 'custom' && (
                                        <SelectedIcon
                                            height={16}
                                            width={16}
                                            fill={ColorScheme.SVG.Default}
                                        />
                                    )}
                                </View>

                                {selectedFeeRateType === 'custom' && (
                                    <View
                                        className="items-center flex-row">
                                        <Text
                                            className="text-sm mr-2"
                                            style={{
                                                color: ColorScheme.Text
                                                    .GrayedText,
                                            }}>
                                            {`${addCommas(
                                                selectedFeeRate.toString(),
                                            )} ${t('sat_vbyte')}`}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {selectedFeeRateType === 'custom' && (
                                <View className="w-full mt-2">
                                    <VText
                                        className="text-sm"
                                        style={{
                                            color: ColorScheme.Text
                                                .GrayedText,
                                        }}>
                                        {/* Make text variable */}
                                        {`${t(
                                            'expected_fee_confirmation',
                                        )} ${getFeeRateTime(selectedFeeRate)}`}
                                    </VText>
                                    <VText
                                        className="text-sm"
                                        style={{
                                            color: ColorScheme.Text
                                                .GrayedText,
                                        }}>
                                        {`~${addCommas(
                                            (
                                                psbtVSize * selectedFeeRate
                                            ).toString(),
                                        )} sats (${
                                            appFiatCurrency.symbol
                                        } ${normalizeFiat(
                                            new BigNumber(
                                                psbtVSize * selectedFeeRate,
                                            ),
                                            new BigNumber(fiatRate.rate),
                                        )})`}
                                    </VText>
                                </View>
                            )}
                        </View>
                    </PlainButton>
                </View>

                {/* Loading psbt text */}
                {loadingData && (
                    <View
                        className="absolute"
                        style={{
                            bottom:
                                NativeWindowMetrics.bottomButtonOffset + 76,
                        }}>
                        <ActivityIndicator
                            className="mb-4"
                            size="small"
                            color={ColorScheme.SVG.Default}
                        />
                        <Text
                            className="text-sm"
                            style={{color: ColorScheme.Text.GrayedText}}>
                            {t('fee_loading_message')}
                        </Text>
                    </View>
                )}

                {/* Show message if in high-fee or congested mempool environment and display warn message here */}
                {!loadingData && mempoolInfo.mempoolCongested && (
                    <View
                        className={
                            `absolute w-5/6 ${
                                langDir === 'right'
                                    ? 'flex-row-reverse'
                                    : 'flex-row'
                            } items-center justify-center`
                        }
                        style={{bottom: NativeWindowMetrics.bottom + 110}}>
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

                {!loadingData && mempoolInfo.mempoolHighFeeEnv && (
                    <View
                        className={
                            `absolute w-5/6 ${
                                langDir === 'right'
                                    ? 'flex-row-reverse'
                                    : 'flex-row'
                            } items-center justify-center`
                        }
                        style={{bottom: NativeWindowMetrics.bottom + 146}}>
                        <AlertIcon width={16} height={16} fill={CardColor} />
                        <Text
                            className={
                                `${
                                    langDir === 'right'
                                        ? 'mr-2'
                                        : 'ml-2 text-center'
                                } text-sm`
                            }
                            style={{
                                color: CardColor,
                            }}>
                            {t('mempool_high_fee')}
                        </Text>
                    </View>
                )}

                <LongBottomButton
                    disabled={loadingData}
                    onPress={() => {
                        navigation.dispatch(
                            CommonActions.navigate('WalletRoot', {
                                screen: 'Send',
                                params: {
                                    feeRate: selectedFeeRate,
                                    dummyPsbtVSize: psbtVSize,
                                    invoiceData: route.params.invoiceData,
                                    wallet: route.params.wallet,
                                },
                            }),
                        );
                    }}
                    title={capitalizeFirst(t('continue'))}
                    textColor={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                />

                <Toasts extraInsets={{top: NativeWindowMetrics.height * -0.075}} />
            </View>
        </SafeAreaView>
    );
};

export default FeeSelection;

const styles = StyleSheet.create({
    divider: {
        height: 1,
    },
});
