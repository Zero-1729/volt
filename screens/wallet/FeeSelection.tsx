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
} from 'react-native';

import {
    CommonActions,
    useNavigation,
    StackActions,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStorageContext} from '../../class/storageContext';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WalletParamList} from '../../Navigation';

import BigNumber from 'bignumber.js';
import Color from '../../constants/Color';

import {LongBottomButton, PlainButton} from '../../components/button';
import {conservativeAlert} from '../../components/alert';
import Prompt from 'react-native-prompt-android';

import {useTailwind} from 'tailwind-rn';

import {TMempoolFeeRates} from '../../types/wallet';
import {getFeeRates} from '../../modules/mempool';
import {normalizeFiat, addCommas} from '../../modules/transform';

import SelectedIcon from './../../assets/svg/check-circle-fill-24.svg';
import Close from '../../assets/svg/x-24.svg';

type Props = NativeStackScreenProps<WalletParamList, 'FeeSelection'>;

const FeeSelection = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const isAndroid = Platform.OS === 'android';

    const {fiatRate, appFiatCurrency} = useContext(AppStorageContext);
    const [selectedFeeRate, setSelectedFeeRate] = useState<number>(1);
    const [selectedFeeRateType, setSelectedFeeRateType] = useState<string>();
    const [psbtVSize, setPsbtVSize] = useState<number>(1);
    const [feeRates, setFeeRates] = useState<TMempoolFeeRates>({
        fastestFee: 2,
        halfHourFee: 1,
        hourFee: 1,
        economyFee: 1,
        minimumFee: 1,
    });

    const fetchFeeRates = async () => {
        let rates = feeRates;

        try {
            const fetchedRates = await getFeeRates(route.params.wallet.network);

            rates = fetchedRates as TMempoolFeeRates;
        } catch (e: any) {
            // Error assumed to be 503; mempool unavailable due to sync
            conservativeAlert(
                'Fee rate',
                'Error fetching fee rates, service unavailable.',
            );
        }

        // Set the fee rate from modal or use fastest
        setSelectedFeeRate(rates.fastestFee);
        setFeeRates(rates);
    };

    const updateCustomFeeRate = (value: string | undefined) => {
        const rate = Number(value);

        // Warn user that fee rate invalid
        if (Number.isNaN(rate)) {
            conservativeAlert(
                'Invalid fee rate',
                'Please enter a valid fee rate',
            );

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
            return '~10 mins';
        } else if (rate >= feeRates.halfHourFee) {
            return '~30 mins';
        } else if (rate >= feeRates.hourFee) {
            return '~1 hour';
        } else if (rate >= feeRates.minimumFee) {
            return '~24 hours';
        } else {
            return 'more than 24 hours';
        }
    };

    const openFeeModal = () => {
        if (isAndroid) {
            Prompt(
                'Custom',
                'Enter fee rate (sats/vB)',
                [
                    {text: 'Cancel'},
                    {
                        text: 'Set',
                        onPress: updateCustomFeeRate,
                    },
                ],
                {
                    type: 'numeric',
                },
            );
        } else {
            Alert.prompt(
                'Custom',
                'Enter fee rate (sats/vB)',
                [
                    {
                        text: 'Cancel',
                        onPress: () => {},
                        style: 'cancel',
                    },
                    {
                        text: 'Set',
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
    }, []);

    return (
        <SafeAreaView edges={['bottom', 'left', 'right']}>
            <View
                style={[
                    tailwind('w-full h-full items-center relative'),
                    {
                        backgroundColor: ColorScheme.Background.Primary,
                    },
                ]}>
                <View
                    style={[
                        tailwind(
                            'absolute w-full top-6 flex-row items-center justify-center',
                        ),
                    ]}>
                    <PlainButton
                        onPress={() =>
                            navigation.dispatch(StackActions.popToTop())
                        }
                        style={[tailwind('absolute z-10 left-6')]}>
                        <Close fill={ColorScheme.SVG.Default} />
                    </PlainButton>
                    <Text
                        style={[
                            tailwind('text-sm font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Select Fee rate
                    </Text>
                </View>

                <View
                    style={[
                        tailwind('w-full px-6 py-8 justify-center relative'),
                        {top: 100},
                    ]}>
                    {/* Fee selection: 10 mins */}
                    <PlainButton
                        onPress={() => {
                            setFeeRate(feeRates.fastestFee, 'priority');
                        }}>
                        <View>
                            <View
                                style={[
                                    tailwind(
                                        'flex-row justify-between items-center w-full',
                                    ),
                                ]}>
                                <View
                                    style={[
                                        tailwind(
                                            'flex-row justify-center items-center',
                                        ),
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind(
                                                'text-left text-sm font-semibold mr-2',
                                            ),
                                            {color: ColorScheme.Text.Default},
                                        ]}>
                                        High Priority
                                    </Text>

                                    {selectedFeeRateType === 'priority' && (
                                        <SelectedIcon
                                            height={16}
                                            width={16}
                                            fill={ColorScheme.SVG.Default}
                                        />
                                    )}
                                </View>

                                <View
                                    style={[tailwind('items-center flex-row')]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm mr-2'),
                                            {
                                                color: ColorScheme.Text
                                                    .GrayedText,
                                            },
                                        ]}>
                                        {`${addCommas(
                                            feeRates.fastestFee.toString(),
                                        )} sat/vB`}
                                    </Text>
                                </View>
                            </View>

                            <View style={[tailwind('w-4/5 mt-2')]}>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        {
                                            color: ColorScheme.Text.GrayedText,
                                        },
                                    ]}>
                                    Expected confirmation time is ~10 mins
                                </Text>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        {
                                            color: ColorScheme.Text.GrayedText,
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
                                </Text>
                            </View>
                        </View>
                    </PlainButton>

                    <View
                        style={[
                            styles.divider,
                            tailwind('w-full mt-6'),
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
                        <View style={[tailwind('mt-6')]}>
                            <View
                                style={[
                                    tailwind(
                                        'flex-row justify-between items-center w-full',
                                    ),
                                ]}>
                                <View
                                    style={[
                                        tailwind(
                                            'flex-row justify-center items-center',
                                        ),
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind(
                                                'text-left text-sm font-semibold mr-2',
                                            ),
                                            {color: ColorScheme.Text.Default},
                                        ]}>
                                        Economic
                                    </Text>

                                    {selectedFeeRateType === 'economic' && (
                                        <SelectedIcon
                                            height={16}
                                            width={16}
                                            fill={ColorScheme.SVG.Default}
                                        />
                                    )}
                                </View>

                                <View
                                    style={[tailwind('items-center flex-row')]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm mr-2'),
                                            {
                                                color: ColorScheme.Text
                                                    .GrayedText,
                                            },
                                        ]}>
                                        {`${addCommas(
                                            feeRates.economyFee.toString(),
                                        )} sat/vB`}
                                    </Text>
                                </View>
                            </View>

                            <View style={[tailwind('w-4/5 mt-2')]}>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        {
                                            color: ColorScheme.Text.GrayedText,
                                        },
                                    ]}>
                                    Expected confirmation time is ~30 mins
                                </Text>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        {
                                            color: ColorScheme.Text.GrayedText,
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
                                            psbtVSize * feeRates.economyFee,
                                        ),
                                        new BigNumber(fiatRate.rate),
                                    )})`}
                                </Text>
                            </View>
                        </View>
                    </PlainButton>

                    <View
                        style={[
                            styles.divider,
                            tailwind('w-full mt-6'),
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
                            // setFeeRate(feeRates.minimumFee);
                        }}>
                        <View style={[tailwind('mt-6')]}>
                            <View
                                style={[
                                    tailwind(
                                        'flex-row justify-between items-center w-full',
                                    ),
                                ]}>
                                <View
                                    style={[
                                        tailwind(
                                            'flex-row justify-center items-center',
                                        ),
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind(
                                                'text-left text-sm font-semibold mr-2',
                                            ),
                                            {color: ColorScheme.Text.Default},
                                        ]}>
                                        Custom Fee
                                    </Text>

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
                                        style={[
                                            tailwind('items-center flex-row'),
                                        ]}>
                                        <Text
                                            style={[
                                                tailwind('text-sm mr-2'),
                                                {
                                                    color: ColorScheme.Text
                                                        .GrayedText,
                                                },
                                            ]}>
                                            {`${addCommas(
                                                selectedFeeRate.toString(),
                                            )} sat/vB`}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {selectedFeeRateType === 'custom' && (
                                <View style={[tailwind('w-4/5 mt-2')]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm'),
                                            {
                                                color: ColorScheme.Text
                                                    .GrayedText,
                                            },
                                        ]}>
                                        {/* Make text variable */}
                                        {`Expected confirmation time is ${getFeeRateTime(
                                            selectedFeeRate,
                                        )}`}
                                    </Text>
                                    <Text
                                        style={[
                                            tailwind('text-sm'),
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
                                                psbtVSize * selectedFeeRate,
                                            ),
                                            new BigNumber(fiatRate.rate),
                                        )})`}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </PlainButton>
                </View>

                <LongBottomButton
                    onPress={() => {
                        CommonActions.navigate({
                            name: 'Send',
                            params: {
                                feeRate: selectedFeeRate,
                                invoiceData: route.params.invoiceData,
                                miniWallet: route.params.wallet,
                            },
                        });
                    }}
                    title={'Continue'}
                    textColor={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                />
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
