/* eslint-disable react-native/no-inline-styles */
import {Text, View, useColorScheme, Linking} from 'react-native';
import React, {useContext} from 'react';

import {useNavigation, CommonActions} from '@react-navigation/native';
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

import {useTailwind} from 'tailwind-rn';
import Color from '../../constants/Color';

import {Net} from '../../types/enums';

import {LongBottomButton, PlainButton} from '../../components/button';
import {FiatBalance} from '../../components/balance';

import CloseIcon from '../../assets/svg/x-24.svg';
import Success from '../../assets/svg/check-circle-fill-24.svg';
import Pending from '../../assets/svg/hourglass-24.svg';
import Broadcasted from '../../assets/svg/megaphone-24.svg';

type Props = NativeStackScreenProps<WalletParamList, 'TransactionView'>;

const TransactionDetailsView = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const navigation = useNavigation();

    const {isAdvancedMode} = useContext(AppStorageContext);

    const buttonText = isAdvancedMode ? 'Open on Mempool' : 'See more';

    const getTxTimestamp = (time: Date) => {
        const date = +time * 1000;
        const isToday = Dayjs(date).isSame(Dayjs(), 'day');

        return isToday ? Dayjs(date).calendar() : Dayjs(date).format('LLL');
    };

    // Get URL for mempool.space
    const openMempoolSpace = (txid: string) => {
        RNHapticFeedback.trigger('impactLight', RNHapticFeedbackOptions);

        Linking.openURL(
            `https://mempool.space/${
                route.params.tx.network === Net.Testnet ? 'testnet/' : ''
            }tx/${txid}`,
        );
    };

    return (
        <SafeAreaView edges={['bottom', 'right', 'left']}>
            <View
                style={[
                    tailwind('w-full h-full relative justify-center'),
                    {
                        borderTopLeftRadius: 32,
                        borderTopRightRadius: 32,
                        backgroundColor: ColorScheme.Background.Primary,
                    },
                ]}>
                <PlainButton
                    style={[tailwind('absolute top-6 z-50'), {left: 16}]}
                    onPress={() => {
                        navigation.dispatch(CommonActions.goBack());
                    }}>
                    <CloseIcon fill={ColorScheme.SVG.Default} />
                </PlainButton>

                <Text
                    style={[
                        tailwind(
                            'text-lg font-bold absolute text-center w-full top-6 px-4',
                        ),
                        {color: ColorScheme.Text.Primary},
                    ]}>
                    Summary
                </Text>

                <Text
                    style={[
                        tailwind('text-sm w-full text-center absolute top-16'),
                        {color: ColorScheme.Text.GrayedText},
                    ]}>
                    {getTxTimestamp(route.params.tx.timestamp)}
                </Text>

                <View style={[tailwind('-mt-8 justify-center px-4')]}>
                    <View style={[tailwind('items-center')]}>
                        {route.params.tx.confirmations > 1 &&
                        route.params.tx.confirmations < 6 ? (
                            <Pending
                                style={[tailwind('self-center mb-6')]}
                                fill={ColorScheme.SVG.Default}
                                height={128}
                                width={128}
                            />
                        ) : (
                            <></>
                        )}
                        {route.params.tx.confirmations === 1 ? (
                            <Broadcasted
                                style={[tailwind('self-center mb-6')]}
                                fill={ColorScheme.SVG.Default}
                                height={128}
                                width={128}
                            />
                        ) : (
                            <></>
                        )}
                        {route.params.tx.confirmations > 6 ? (
                            <Success
                                style={[tailwind('self-center mb-6')]}
                                fill={ColorScheme.SVG.Default}
                                height={128}
                                width={128}
                            />
                        ) : (
                            <></>
                        )}
                        <FiatBalance
                            balance={route.params.tx.value}
                            loading={false}
                            BalanceFontSize={'text-2xl'}
                            fontColor={ColorScheme.Text.Default}
                        />
                    </View>
                </View>

                <View
                    style={[tailwind('absolute bottom-0 items-center w-full')]}>
                    <LongBottomButton
                        onPress={() => {
                            openMempoolSpace(route.params.tx.txid);
                        }}
                        title={buttonText}
                        textColor={ColorScheme.Text.Alt}
                        backgroundColor={ColorScheme.Background.Inverted}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

export default TransactionDetailsView;
