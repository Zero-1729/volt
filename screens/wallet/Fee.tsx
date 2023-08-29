/* eslint-disable react-native/no-inline-styles */
import React, {useContext} from 'react';
import {Text, View, useColorScheme, Alert} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';
import {AppStorageContext} from '../../class/storageContext';

import {useNavigation, CommonActions} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

const {useTailwind} = require('tailwind-rn');
import Color from '../../constants/Color';
import Font from '../../constants/Font';

import {LongBottomButton, PlainButton} from '../../components/button';

import Close from '../../assets/svg/x-24.svg';

type Props = NativeStackScreenProps<WalletParamList, 'Fee'>;

const Fee = ({route}: Props) => {
    const tailwind = useTailwind();
    const navigation = useNavigation();
    const ColorScheme = Color(useColorScheme);

    const {isAdvancedMode} = useContext(AppStorageContext);

    const setFeeRate = (feeRate: number) => {
        navigation.dispatch(
            CommonActions.navigate({
                name: 'Send',
                params: {
                    invoiceData: route.params.invoiceData,
                    wallet: route.params.wallet,
                    feeRate: feeRate,
                },
            }),
        );
    };

    const openFeeModal = () => {
        Alert.prompt('Custom', 'Enter fee rate (sats/vB)', [
            {
                text: 'Cancel',
                onPress: () => {},
                style: 'cancel',
            },
            {
                text: 'Set',
                onPress: (value: string | undefined) => {
                    setFeeRate(Number(value));
                },
            },
        ]);
    };

    return (
        <SafeAreaView
            style={[tailwind('w-full h-full')]}
            edges={['bottom', 'left', 'right']}>
            <View
                style={[
                    tailwind('w-full h-full items-center'),
                    {
                        borderTopLeftRadius: 32,
                        borderTopRightRadius: 32,
                        backgroundColor: ColorScheme.Background.Primary,
                    },
                ]}>
                <View
                    style={[
                        tailwind(
                            'absolute top-6 w-full flex-row items-center justify-center',
                        ),
                    ]}>
                    <PlainButton
                        onPress={() =>
                            navigation.dispatch(CommonActions.goBack())
                        }
                        style={[tailwind('absolute z-10 left-6')]}>
                        <Close fill={ColorScheme.SVG.Default} />
                    </PlainButton>
                    <Text
                        style={[
                            tailwind('text-sm font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Fee Rate Selection
                    </Text>
                </View>

                <View
                    style={[
                        tailwind('w-4/5 px-6 py-8 rounded'),
                        {
                            borderWidth: 1,
                            borderColor: ColorScheme.Background.Greyed,
                            marginTop: 80,
                        },
                    ]}>
                    {/* Fee selection: 10 mins */}
                    <PlainButton
                        onPress={() => {
                            setFeeRate(route.params.feeRates.fastestFee);
                        }}>
                        <View style={[tailwind('items-center')]}>
                            <View
                                style={[
                                    tailwind(
                                        'flex-row justify-between items-center w-full',
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind(
                                            'text-left text-base font-semibold',
                                        ),
                                    ]}>
                                    High Priority
                                </Text>

                                <View
                                    style={[tailwind('items-center flex-row')]}>
                                    {isAdvancedMode ? (
                                        <Text
                                            style={[
                                                tailwind('text-sm mr-2'),
                                                {
                                                    color: ColorScheme.Text
                                                        .GrayedText,
                                                },
                                            ]}>
                                            ~10 mins
                                        </Text>
                                    ) : (
                                        <></>
                                    )}
                                    <View
                                        style={[
                                            tailwind('rounded-full px-4 py-1'),
                                            {
                                                backgroundColor:
                                                    ColorScheme.Background
                                                        .Inverted,
                                            },
                                        ]}>
                                        {isAdvancedMode ? (
                                            <Text
                                                style={[
                                                    tailwind(
                                                        'text-sm font-bold',
                                                    ),
                                                    {
                                                        color: ColorScheme.Text
                                                            .Alt,
                                                    },
                                                ]}>
                                                {
                                                    route.params.feeRates
                                                        .fastestFee
                                                }{' '}
                                                <Text
                                                    style={[
                                                        tailwind(
                                                            'text-sm self-baseline',
                                                        ),
                                                        Font.SatSymbol,
                                                    ]}>
                                                    s
                                                </Text>
                                                /vB
                                            </Text>
                                        ) : (
                                            <Text
                                                style={[
                                                    tailwind(
                                                        'text-sm font-bold',
                                                    ),
                                                    {
                                                        color: ColorScheme.Text
                                                            .Alt,
                                                    },
                                                ]}>
                                                ~10 mins
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </View>
                    </PlainButton>

                    <View
                        style={[
                            tailwind('w-full mt-6'),
                            {
                                height: 1,
                                backgroundColor: ColorScheme.Background.Greyed,
                            },
                        ]}
                    />

                    {/* Fee selection: Medium 30 minutes */}
                    <PlainButton
                        onPress={() => {
                            setFeeRate(route.params.feeRates.halfHourFee);
                        }}>
                        <View style={[tailwind('items-center mt-6')]}>
                            <View
                                style={[
                                    tailwind(
                                        'flex-row justify-between items-center w-full',
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind(
                                            'text-left text-base font-semibold',
                                        ),
                                    ]}>
                                    Slow
                                </Text>

                                <View
                                    style={[tailwind('items-center flex-row')]}>
                                    {isAdvancedMode ? (
                                        <Text
                                            style={[
                                                tailwind('text-sm mr-2'),
                                                {
                                                    color: ColorScheme.Text
                                                        .GrayedText,
                                                },
                                            ]}>
                                            ~30 mins
                                        </Text>
                                    ) : (
                                        <></>
                                    )}
                                    <View
                                        style={[
                                            tailwind('rounded-full px-4 py-1'),
                                            {
                                                backgroundColor:
                                                    ColorScheme.Background
                                                        .Inverted,
                                            },
                                        ]}>
                                        {isAdvancedMode ? (
                                            <Text
                                                style={[
                                                    tailwind(
                                                        'text-sm font-bold',
                                                    ),
                                                    {
                                                        color: ColorScheme.Text
                                                            .Alt,
                                                    },
                                                ]}>
                                                {
                                                    route.params.feeRates
                                                        .halfHourFee
                                                }{' '}
                                                <Text
                                                    style={[
                                                        tailwind(
                                                            'text-sm self-baseline',
                                                        ),
                                                        Font.SatSymbol,
                                                    ]}>
                                                    s
                                                </Text>
                                                /vB
                                            </Text>
                                        ) : (
                                            <Text
                                                style={[
                                                    tailwind(
                                                        'text-sm font-bold',
                                                    ),
                                                    {
                                                        color: ColorScheme.Text
                                                            .Alt,
                                                    },
                                                ]}>
                                                ~30 mins
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </View>
                    </PlainButton>

                    <View
                        style={[
                            tailwind('w-full mt-6'),
                            {
                                height: 1,
                                backgroundColor: ColorScheme.Background.Greyed,
                            },
                        ]}
                    />

                    {/* Fee selection: Slow 1 hour */}
                    <PlainButton
                        onPress={() => {
                            setFeeRate(route.params.feeRates.minimumFee);
                        }}>
                        <View style={[tailwind('items-center mt-6')]}>
                            <View
                                style={[
                                    tailwind(
                                        'flex-row justify-between items-center w-full',
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind(
                                            'text-left text-base font-semibold',
                                        ),
                                    ]}>
                                    Minimum
                                </Text>

                                <View
                                    style={[tailwind('items-center flex-row')]}>
                                    {isAdvancedMode ? (
                                        <Text
                                            style={[
                                                tailwind('text-sm mr-2'),
                                                {
                                                    color: ColorScheme.Text
                                                        .GrayedText,
                                                },
                                            ]}>
                                            ~1 day
                                        </Text>
                                    ) : (
                                        <></>
                                    )}
                                    <View
                                        style={[
                                            tailwind('rounded-full px-4 py-1'),
                                            {
                                                backgroundColor:
                                                    ColorScheme.Background
                                                        .Inverted,
                                            },
                                        ]}>
                                        {isAdvancedMode ? (
                                            <Text
                                                style={[
                                                    tailwind(
                                                        'text-sm font-bold',
                                                    ),
                                                    {
                                                        color: ColorScheme.Text
                                                            .Alt,
                                                    },
                                                ]}>
                                                {
                                                    route.params.feeRates
                                                        .minimumFee
                                                }{' '}
                                                <Text
                                                    style={[
                                                        tailwind(
                                                            'text-sm self-baseline',
                                                        ),
                                                        Font.SatSymbol,
                                                    ]}>
                                                    s
                                                </Text>
                                                /vB
                                            </Text>
                                        ) : (
                                            <Text
                                                style={[
                                                    tailwind(
                                                        'text-sm font-bold',
                                                    ),
                                                    {
                                                        color: ColorScheme.Text
                                                            .Alt,
                                                    },
                                                ]}>
                                                ~1 day
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </View>
                    </PlainButton>
                </View>

                {/* Fee selection: Custom */}
                <LongBottomButton
                    title={'Custom'}
                    onPress={openFeeModal}
                    backgroundColor={ColorScheme.Background.Inverted}
                    textColor={ColorScheme.Text.Alt}
                />
            </View>
        </SafeAreaView>
    );
};

export default Fee;
