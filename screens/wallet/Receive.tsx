/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useContext, useState, useEffect} from 'react';
import {useColorScheme, View, Text, Share} from 'react-native';

import {
    useNavigation,
    CommonActions,
    StackActions,
} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';

import BigNumber from 'bignumber.js';

import {useTailwind} from 'tailwind-rn';

import {formatFiat} from '../../modules/transform';

import Color from '../../constants/Color';

import {AppStorageContext} from '../../class/storageContext';

import QRCode from 'react-native-qrcode-svg';
import Close from '../../assets/svg/x-24.svg';

import {DisplayFiatAmount, DisplaySatsAmount} from '../../components/balance';

import ShareIcon from '../../assets/svg/share-android-24.svg';

import Clipboard from '@react-native-clipboard/clipboard';

import {PlainButton} from '../../components/button';

import bottomOffset from '../../constants/NativeWindowMetrics';

const Receive = ({route}) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const navigation = useNavigation();

    // Amount in sats
    const [bitcoinValue, setBitcoinValue] = useState(new BigNumber(0));
    const [fiatValue, setFiatValue] = useState(new BigNumber(0));

    useEffect(() => {
        // Update the request amount if it is passed in as a parameter
        // from the RequestAmount screen
        if (route.params?.amount) {
            setBitcoinValue(new BigNumber(route.params.sats));
            setFiatValue(new BigNumber(route.params.fiat));
        }
    }, [route.params]);

    const {currentWalletID, getWalletData, appFiatCurrency} =
        useContext(AppStorageContext);
    const walletData = getWalletData(currentWalletID);

    // Format as Bitcoin URI
    const getFormattedAddress = (address: string) => {
        let amount = bitcoinValue;

        if (amount.gt(0)) {
            // If amount is greater than 0, return a bitcoin payment request URI
            return `bitcoin:${address}?amount=${amount}`;
        }

        // If amount is 0, return a plain address
        // return a formatted bitcoin address to include the bitcoin payment request URI
        return `bitcoin:${address}`;
    };

    // Set the plain address and bitcoin invoice URI
    const [plainAddress, setPlainAddress] = useState('');
    const [BitcoinInvoice, setBitcoinInvoice] = useState(
        getFormattedAddress(walletData.address.address),
    );

    // Copy data to clipboard
    const copyDescToClipboard = () => {
        // Copy backup material to Clipboard
        // Temporarily set copied message
        // and revert after a few seconds
        Clipboard.setString(walletData.address.address);

        setPlainAddress('Copied to Clipboard');

        setTimeout(() => {
            setPlainAddress('');
        }, 450);
    };

    useEffect(() => {
        setBitcoinInvoice(getFormattedAddress(walletData.address.address));
    }, [bitcoinValue]);

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
                        Bitcoin Invoice
                    </Text>
                </View>

                {/* Click should toggle unit amount or display fiat amount below */}
                <View style={[tailwind('w-5/6 -mt-8 items-center')]}>
                    {!bitcoinValue.isZero() ? (
                        <View
                            style={[
                                tailwind(
                                    'mb-4 flex justify-center items-center',
                                ),
                            ]}>
                            <View style={[tailwind('opacity-40 mb-1')]}>
                                {/* Make it approx if it doesn't match bottom unit value for requested amount */}
                                <DisplayFiatAmount
                                    amount={formatFiat(fiatValue)}
                                    fontSize={'text-base'}
                                    isApprox={
                                        route.params.amount !==
                                        fiatValue.toString()
                                    }
                                    symbol={appFiatCurrency.symbol}
                                />
                            </View>
                            <View>
                                {/* Make it approx if it doesn't match bottom unit value for requested amount */}
                                <DisplaySatsAmount
                                    amount={bitcoinValue}
                                    fontSize={'text-2xl'}
                                    isApprox={
                                        route.params.amount !==
                                        bitcoinValue.toString()
                                    }
                                />
                            </View>
                        </View>
                    ) : (
                        <></>
                    )}

                    {/* QR code */}
                    <View
                        style={[
                            tailwind('rounded'),
                            {
                                borderWidth: 10,
                                borderColor: 'white',
                            },
                        ]}>
                        <QRCode value={BitcoinInvoice} size={225} />
                    </View>
                </View>

                {/* Bitcoin address info */}
                <View
                    style={[
                        tailwind('p-4 mt-6 rounded'),
                        {backgroundColor: ColorScheme.Background.Greyed},
                    ]}>
                    <Text
                        style={[
                            tailwind('text-left w-full mb-4 font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Invoice Address
                    </Text>
                    <PlainButton
                        style={[tailwind('w-3/5')]}
                        onPress={copyDescToClipboard}>
                        <Text
                            ellipsizeMode="middle"
                            numberOfLines={1}
                            style={[{color: ColorScheme.Text.Default}]}>
                            {walletData.address.address}
                        </Text>
                    </PlainButton>
                </View>

                {setPlainAddress.length > 0 ? (
                    <View>
                        <Text
                            style={[
                                tailwind('mt-4'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {plainAddress}
                        </Text>
                    </View>
                ) : (
                    <></>
                )}

                {/* Bottom buttons */}
                <View
                    style={[
                        tailwind('absolute'),
                        {bottom: bottomOffset.bottom},
                    ]}>
                    {/* Enter receive amount */}
                    <PlainButton
                        style={[tailwind('mb-6')]}
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate({
                                    name: 'RequestAmount',
                                }),
                            );
                        }}>
                        <Text
                            style={[
                                tailwind('font-bold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Request Amount
                        </Text>
                    </PlainButton>

                    {/* Share Button */}
                    <PlainButton
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
                                Share
                            </Text>
                            <ShareIcon fill={ColorScheme.SVG.Inverted} />
                        </View>
                    </PlainButton>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Receive;
