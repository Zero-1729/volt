/* eslint-disable react-native/no-inline-styles */
import {Text, View, useColorScheme, Linking} from 'react-native';
import React, {useContext} from 'react';

import {useNavigation, StackActions} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

import {AppStorageContext} from '../../class/storageContext';

import {SafeAreaView} from 'react-native-safe-area-context';

import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';

Dayjs.extend(calendar);
Dayjs.extend(LocalizedFormat);

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../../constants/Haptic';
import NativeOffsets from '../../constants/NativeWindowMetrics';

import {useTailwind} from 'tailwind-rn';
import Color from '../../constants/Color';

import {ENet} from '../../types/enums';

import {LongBottomButton, PlainButton} from '../../components/button';

import Success from '../../assets/svg/check-circle-fill-24.svg';
import Failed from '../../assets/svg/x-circle-fill-24.svg';

type Props = NativeStackScreenProps<WalletParamList, 'TransactionStatus'>;

const TransactionStatus = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const navigation = useNavigation();

    const {isAdvancedMode} = useContext(AppStorageContext);

    const buttonText = isAdvancedMode ? 'View on Mempool.space' : 'See more';

    // Get URL for mempool.space
    const openMempoolSpace = (txid: string) => {
        RNHapticFeedback.trigger('impactLight', RNHapticFeedbackOptions);

        Linking.openURL(
            `https://mempool.space/${
                route.params.network === ENet.Testnet ? 'testnet/' : ''
            }tx/${txid}`,
        );
    };

    const bottomOffset = NativeOffsets.bottom + 96;

    return (
        <SafeAreaView edges={['right', 'left', 'bottom']}>
            <View
                style={[
                    tailwind('w-full h-full relative justify-center'),
                    {
                        borderTopLeftRadius: 32,
                        borderTopRightRadius: 32,
                        backgroundColor: ColorScheme.Background.Primary,
                    },
                ]}>
                <Text
                    style={[
                        tailwind(
                            'text-lg font-bold absolute text-center w-full top-6 px-4',
                        ),
                        {color: ColorScheme.Text.Default},
                    ]}>
                    Status
                </Text>

                <View
                    style={[
                        tailwind('-mt-12 justify-center px-4 items-center'),
                    ]}>
                    <View style={[tailwind('items-center')]}>
                        {route.params.status === 'failed' ? (
                            <Failed
                                style={[tailwind('self-center')]}
                                fill={ColorScheme.SVG.Default}
                                height={128}
                                width={128}
                            />
                        ) : (
                            <></>
                        )}
                        {route.params.status === 'success' ? (
                            <Success
                                style={[tailwind('self-center')]}
                                fill={ColorScheme.SVG.Default}
                                height={128}
                                width={128}
                            />
                        ) : (
                            <></>
                        )}
                    </View>

                    <View style={[tailwind('w-4/5 mt-4 items-center')]}>
                        <Text
                            style={[
                                tailwind('text-lg font-bold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {route.params.status === 'success'
                                ? 'Transaction sent'
                                : 'Transaction failed to send'}
                        </Text>
                    </View>

                    {isAdvancedMode ? (
                        <View style={[tailwind('items-center w-4/5')]}>
                            <Text
                                style={[
                                    tailwind('text-sm text-center mt-4'),
                                    {color: ColorScheme.Text.GrayedText},
                                ]}>
                                {route.params.status === 'success'
                                    ? `Successfully Sent Tranasction with id: ${route.params.txId}`
                                    : `Failed to send transaction: ${route.params.message}`}
                            </Text>
                        </View>
                    ) : (
                        <></>
                    )}
                </View>

                {route.params.status === 'success' ? (
                    <PlainButton
                        style={[
                            tailwind('absolute self-center'),
                            {bottom: bottomOffset},
                        ]}
                        onPress={() => {
                            openMempoolSpace(route.params.txId);
                        }}>
                        <Text style={[tailwind('font-bold text-sm')]}>
                            {buttonText}
                        </Text>
                    </PlainButton>
                ) : (
                    <></>
                )}

                <View
                    style={[tailwind('absolute bottom-0 items-center w-full')]}>
                    <LongBottomButton
                        onPress={() => {
                            navigation.dispatch(StackActions.popToTop());
                        }}
                        title={'Back to Wallet'}
                        textColor={ColorScheme.Text.Alt}
                        backgroundColor={ColorScheme.Background.Inverted}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

export default TransactionStatus;
