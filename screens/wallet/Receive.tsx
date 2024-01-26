/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */

import React, {
    useContext,
    useState,
    useEffect,
    useMemo,
    useReducer,
} from 'react';
import {useColorScheme, View, Text, Share, StyleSheet} from 'react-native';

import {
    useNavigation,
    CommonActions,
    StackActions,
} from '@react-navigation/native';

import VText from '../../components/text';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

import {SafeAreaView} from 'react-native-safe-area-context';

import BigNumber from 'bignumber.js';

import {useTailwind} from 'tailwind-rn';

import {useTranslation} from 'react-i18next';

import {
    capitalizeFirst,
    formatFiat,
    SATS_TO_BTC_RATE,
} from '../../modules/transform';

import Color from '../../constants/Color';

import {AppStorageContext} from '../../class/storageContext';

import QRCodeStyled from 'react-native-qrcode-styled';
import Close from '../../assets/svg/x-24.svg';

import {DisplayFiatAmount, DisplaySatsAmount} from '../../components/balance';

import ShareIcon from '../../assets/svg/share-android-24.svg';

import Clipboard from '@react-native-clipboard/clipboard';

import {PlainButton} from '../../components/button';

import bottomOffset from '../../constants/NativeWindowMetrics';

// Prop type for params passed to this screen
// from the RequestAmount screen
type Props = NativeStackScreenProps<WalletParamList, 'Receive'>;

const Receive = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const navigation = useNavigation();

    const {t} = useTranslation('wallet');

    const initialState = {
        // Amount in sats
        bitcoinValue: new BigNumber(0),
        fiatValue: new BigNumber(0),
    };

    const reducer = (state: any, action: any) => {
        switch (action.type) {
            case 'SET_BITCOIN_VALUE':
                return {
                    ...state,
                    bitcoinValue: action.payload,
                };
            case 'SET_FIAT_VALUE':
                return {
                    ...state,
                    fiatValue: action.payload,
                };
            default:
                return state;
        }
    };

    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        // Update the request amount if it is passed in as a parameter
        // from the RequestAmount screen
        if (route.params?.amount) {
            dispatch({
                type: 'SET_BITCOIN_VALUE',
                payload: new BigNumber(route.params.sats),
            });
            dispatch({
                type: 'SET_FIAT_VALUE',
                payload: new BigNumber(route.params.fiat),
            });
        }
    }, [route.params]);

    const {currentWalletID, getWalletData, appFiatCurrency} =
        useContext(AppStorageContext);
    const walletData = getWalletData(currentWalletID);

    // Format as Bitcoin URI
    const getFormattedAddress = (address: string) => {
        let amount = state.bitcoinValue;

        if (amount.gt(0)) {
            // If amount is greater than 0, return a bitcoin payment request URI
            return `bitcoin:${address}?amount=${amount.div(SATS_TO_BTC_RATE)}`;
        }

        // If amount is 0, return a plain address
        // return a formatted bitcoin address to include the bitcoin payment request URI
        return `bitcoin:${address}`;
    };

    // Set the plain address and bitcoin invoice URI
    const [plainAddress, setPlainAddress] = useState('');
    const BitcoinInvoice = useMemo(
        () => getFormattedAddress(walletData.address.address),
        [state.bitcoinValue],
    );

    // Copy data to clipboard
    const copyDescToClipboard = () => {
        // Copy backup material to Clipboard
        // Temporarily set copied message
        // and revert after a few seconds
        Clipboard.setString(walletData.address.address);

        setPlainAddress(capitalizeFirst(t('copied_to_clipboard')));

        setTimeout(() => {
            setPlainAddress('');
        }, 450);
    };

    return (
        <SafeAreaView edges={['bottom', 'right', 'left']}>
            <View
                style={[
                    tailwind('w-full h-full items-center justify-center'),
                    {backgroundColor: ColorScheme.Background.Default},
                ]}>
                <View
                    style={[
                        tailwind(
                            'w-5/6 justify-between items-center absolute top-6 flex',
                        ),
                    ]}>
                    <PlainButton
                        style={[tailwind('absolute left-0 z-10')]}
                        onPress={() => {
                            navigation.dispatch(StackActions.popToTop());
                        }}>
                        <Close fill={ColorScheme.SVG.Default} width={32} />
                    </PlainButton>
                    <Text
                        style={[
                            tailwind('text-lg w-full text-center font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {t('bitcoin_invoice')}
                    </Text>
                </View>

                {/* Click should toggle unit amount or display fiat amount below */}
                <View style={[tailwind('w-5/6 -mt-8 items-center')]}>
                    {!state.bitcoinValue.isZero() && (
                        <View
                            style={[
                                tailwind(
                                    'mb-4 flex justify-center items-center',
                                ),
                            ]}>
                            <View style={[tailwind('opacity-40 mb-1')]}>
                                {/* Make it approx if it doesn't match bottom unit value for requested amount */}
                                <DisplayFiatAmount
                                    amount={formatFiat(state.fiatValue)}
                                    fontSize={'text-base'}
                                    isApprox={
                                        route.params.amount !==
                                        state.fiatValue.toString()
                                    }
                                    symbol={appFiatCurrency.symbol}
                                />
                            </View>
                            <View>
                                {/* Make it approx if it doesn't match bottom unit value for requested amount */}
                                <DisplaySatsAmount
                                    amount={state.bitcoinValue}
                                    fontSize={'text-2xl'}
                                    isApprox={
                                        route.params.amount !==
                                        state.bitcoinValue.toString()
                                    }
                                />
                            </View>
                        </View>
                    )}

                    {/* QR code */}
                    <View
                        style={[
                            styles.qrCodeContainer,
                            tailwind('rounded'),
                            {borderColor: ColorScheme.Background.QRBorder},
                        ]}>
                        <QRCodeStyled
                            style={{
                                backgroundColor: 'white',
                            }}
                            data={BitcoinInvoice}
                            padding={10}
                            pieceSize={6}
                            color={ColorScheme.Background.Default}
                            pieceCornerType={'rounded'}
                            isPiecesGlued={true}
                            pieceBorderRadius={4}
                        />
                    </View>
                </View>

                {/* Bitcoin address info */}
                <View
                    style={[
                        tailwind('p-4 mt-6 w-3/5 rounded'),
                        {backgroundColor: ColorScheme.Background.Greyed},
                    ]}>
                    <VText
                        style={[
                            tailwind('mb-4 font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {t('invoice_address')}
                    </VText>
                    <PlainButton
                        style={[tailwind('w-full')]}
                        onPress={copyDescToClipboard}>
                        <Text
                            ellipsizeMode="middle"
                            numberOfLines={1}
                            style={[{color: ColorScheme.Text.Default}]}>
                            {walletData.address.address}
                        </Text>
                    </PlainButton>
                </View>

                {setPlainAddress.length > 0 && (
                    <View>
                        <Text
                            style={[
                                tailwind('mt-4'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {plainAddress}
                        </Text>
                    </View>
                )}

                {/* Bottom buttons */}
                <View
                    style={[
                        tailwind('absolute'),
                        {bottom: bottomOffset.bottom},
                    ]}>
                    {/* Share Button */}
                    <PlainButton
                        style={[tailwind('mb-6')]}
                        onPress={() => {
                            Share.share({
                                message: BitcoinInvoice,
                                title: 'Share Address',
                                url: BitcoinInvoice,
                            });
                        }}>
                        <View
                            style={[
                                tailwind(
                                    'rounded-full items-center flex-row justify-center px-6 py-3',
                                ),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Inverted,
                                },
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm mr-2 font-bold'),
                                    {
                                        color: ColorScheme.Text.Alt,
                                    },
                                ]}>
                                {capitalizeFirst(t('share'))}
                            </Text>
                            <ShareIcon fill={ColorScheme.SVG.Inverted} />
                        </View>
                    </PlainButton>

                    {/* Enter receive amount */}
                    <PlainButton
                        style={[tailwind('mb-4')]}
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate({
                                    name: 'RequestAmount',
                                }),
                            );
                        }}>
                        <Text
                            style={[
                                tailwind('font-bold text-center'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('edit_amount')}
                        </Text>
                    </PlainButton>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Receive;

const styles = StyleSheet.create({
    qrCodeContainer: {
        borderWidth: 2,
    },
});
