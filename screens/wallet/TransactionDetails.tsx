/* eslint-disable react-native/no-inline-styles */
import {Text, View, useColorScheme, Linking} from 'react-native';
import React, {useContext} from 'react';

import {useNavigation, CommonActions} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';
import Clipboard from '@react-native-clipboard/clipboard';

import {AppStorageContext} from '../../class/storageContext';

import {Edges, SafeAreaView} from 'react-native-safe-area-context';

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
import CopyIcon from '../../assets/svg/copy-16.svg';

type Props = NativeStackScreenProps<WalletParamList, 'TransactionView'>;

const TransactionDetailsView = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const navigation = useNavigation();

    const {isAdvancedMode} = useContext(AppStorageContext);

    const [txIdText, setTxIdText] = React.useState<string>('');

    const buttonText = isAdvancedMode ? 'View on Mempool.space' : 'See more';

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

    const copyIdToClipboard = () => {
        // Copy backup material to Clipboard
        // Temporarily set copied message
        // and revert after a few seconds
        Clipboard.setString(route.params.tx.txid);

        setTxIdText('Copied Transaction Id!');

        setTimeout(() => {
            setTxIdText('');
        }, 450);
    };

    // We need to make adjustments to the screen based on the source caller.
    // conservative - from the wallet view
    // liberal - from home screen
    const edges: Edges =
        route.params.source === 'liberal'
            ? ['top', 'bottom', 'left', 'right']
            : ['bottom', 'right', 'left'];

    return (
        <SafeAreaView edges={edges}>
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
                        {color: ColorScheme.Text.Default},
                    ]}>
                    Summary
                </Text>

                <Text
                    style={[
                        tailwind('text-sm w-full text-center absolute top-16'),
                        {color: ColorScheme.Text.GrayedText},
                    ]}>
                    {route.params.tx.confirmed
                        ? getTxTimestamp(route.params.tx.timestamp)
                        : 'Pending confirmation'}
                </Text>

                <View style={[tailwind('-mt-8 justify-center px-4')]}>
                    <View style={[tailwind('items-center')]}>
                        {route.params.tx.confirmations > 0 &&
                        route.params.tx.confirmations <= 6 ? (
                            <Pending
                                style={[tailwind('self-center mb-6')]}
                                fill={ColorScheme.SVG.Default}
                                height={128}
                                width={128}
                            />
                        ) : (
                            <></>
                        )}
                        {!route.params.tx.confirmed ? (
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
                            showMinus={route.params.tx.type === 'outbound'}
                            BalanceFontSize={'text-2xl'}
                            fontColor={ColorScheme.Text.Default}
                        />
                    </View>
                    <Text
                        style={[
                            tailwind('text-sm text-center'),
                            {color: ColorScheme.Text.GrayedText},
                        ]}>
                        {route.params.tx.confirmations > 6
                            ? '6+'
                            : route.params.tx.confirmations}{' '}
                        confirmations
                    </Text>

                    {isAdvancedMode && route.params.tx.rbf ? (
                        <View
                            style={[
                                tailwind(
                                    'rounded-full px-4 py-1 self-center mt-4',
                                ),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.CardGreyed,
                                },
                            ]}>
                            <Text
                                style={[
                                    tailwind('font-bold'),
                                    {
                                        color: ColorScheme.Text.GrayText,
                                    },
                                ]}>
                                RBF Enabled
                            </Text>
                        </View>
                    ) : (
                        <></>
                    )}

                    {/* More dev info */}
                    {isAdvancedMode ? (
                        <View style={[tailwind('w-full mt-4')]}>
                            <View
                                style={[
                                    tailwind(
                                        'w-4/5 relative self-center rounded p-6',
                                    ),
                                    {
                                        backgroundColor:
                                            ColorScheme.Background.Greyed,
                                    },
                                ]}>
                                <PlainButton
                                    onPress={copyIdToClipboard}
                                    style={[tailwind('w-full mb-6')]}>
                                    <Text
                                        numberOfLines={1}
                                        ellipsizeMode="middle"
                                        style={[
                                            tailwind('font-bold w-full'),
                                            {color: ColorScheme.Text.Default},
                                        ]}>
                                        <Text style={[tailwind('font-normal')]}>
                                            Tx ID:{' '}
                                        </Text>
                                        {route.params.tx.txid}
                                        <CopyIcon
                                            style={[tailwind('ml-4 mr-0')]}
                                            width={16}
                                            height={16}
                                            fill={ColorScheme.SVG.GrayFill}
                                        />
                                    </Text>
                                </PlainButton>
                                <View
                                    style={[
                                        tailwind(
                                            'w-full flex-row items-center justify-between',
                                        ),
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm font-normal'),
                                            {color: ColorScheme.Text.Default},
                                        ]}>
                                        size
                                    </Text>
                                    <Text
                                        style={[
                                            tailwind('font-bold'),
                                            {color: ColorScheme.Text.Default},
                                        ]}>
                                        {route.params.tx.size + ' B'}
                                    </Text>
                                </View>

                                <View
                                    style={[
                                        tailwind(
                                            'w-full flex-row items-center justify-between',
                                        ),
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm font-normal'),
                                            {color: ColorScheme.Text.Default},
                                        ]}>
                                        virtual size
                                    </Text>
                                    <Text
                                        style={[
                                            tailwind('font-bold'),
                                            {color: ColorScheme.Text.Default},
                                        ]}>
                                        {route.params.tx.vsize + ' vB'}
                                    </Text>
                                </View>

                                <View
                                    style={[
                                        tailwind(
                                            'w-full flex-row items-center justify-between',
                                        ),
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm font-normal'),
                                            {color: ColorScheme.Text.Default},
                                        ]}>
                                        weight units
                                    </Text>
                                    <Text
                                        style={[
                                            tailwind('font-bold'),
                                            {color: ColorScheme.Text.Default},
                                        ]}>
                                        {route.params.tx.weight + ' WU'}
                                    </Text>
                                </View>

                                <View
                                    style={[
                                        tailwind(
                                            'w-full flex-row items-center justify-between',
                                        ),
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm font-normal'),
                                            {color: ColorScheme.Text.Default},
                                        ]}>
                                        fee
                                    </Text>
                                    <Text
                                        style={[
                                            tailwind('font-bold'),
                                            {color: ColorScheme.Text.Default},
                                        ]}>
                                        {route.params.tx.fee}
                                    </Text>
                                </View>
                            </View>

                            {txIdText.length > 0 ? (
                                <Text
                                    style={[
                                        tailwind('text-sm text-center mt-4'),
                                        {color: ColorScheme.Text.GrayedText},
                                    ]}>
                                    {txIdText}
                                </Text>
                            ) : (
                                <></>
                            )}
                        </View>
                    ) : (
                        <></>
                    )}
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
