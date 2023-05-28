/* eslint-disable react-native/no-inline-styles */
import React, {useContext, useState, useEffect} from 'react';
import {useColorScheme, View, Text, Share} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import {AppStorageContext} from '../../class/storageContext';

import QRCode from 'react-native-qrcode-svg';

import Font from '../../constants/Font';

import ShareIcon from '../../assets/svg/share-android-24.svg';

import Clipboard from '@react-native-clipboard/clipboard';

import {PlainButton} from '../../components/button';

import bottomOffset from '../../constants/NativeWindowMetrics';

const Receive = () => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {currentWalletID, getWalletData, useSatSymbol} =
        useContext(AppStorageContext);
    const walletData = getWalletData(currentWalletID);

    // Format as Bitcoin URI
    const getFormattedAddress = (address: string) => {
        let amount = BitcoinAmount;

        if (amount > 0) {
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
        getFormattedAddress(walletData.address),
    );
    // Amount in sats
    const [BitcoinAmount, setBitcoinAmount] = useState(0);

    // Copy data to clipboard
    const copyDescToClipboard = () => {
        // Copy backup material to Clipboard
        // Temporarily set copied message
        // and revert after a few seconds
        Clipboard.setString(walletData.address);

        setPlainAddress('Copied to Clipboard');

        setTimeout(() => {
            setPlainAddress('');
        }, 450);
    };

    useEffect(() => {
        setBitcoinInvoice(getFormattedAddress(walletData.address));
    }, [BitcoinAmount]);

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
                    <View
                        style={[
                            tailwind('w-16 h-1 rounded-full opacity-40 mb-4'),
                            {backgroundColor: ColorScheme.Background.Inverted},
                        ]}
                    />
                    <Text
                        style={[
                            tailwind('text-lg w-full text-center font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Receive Bitcoin
                    </Text>
                </View>

                {/* Click should toggle unit amount or display fiat amount below */}
                <View style={[tailwind('w-5/6 -mt-8 items-center')]}>
                    {BitcoinAmount !== 0 ? (
                        <View
                            style={[
                                tailwind(
                                    'mb-4 flex-row justify-center items-center',
                                ),
                            ]}>
                            {useSatSymbol ? (
                                <Text
                                    style={[
                                        tailwind('font-bold text-xl mr-2'),
                                        {
                                            color: ColorScheme.Text.Default,
                                            ...Font.SatSymbol,
                                        },
                                    ]}>
                                    S
                                </Text>
                            ) : (
                                <></>
                            )}
                            <Text
                                style={[
                                    tailwind('font-bold text-xl'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {BitcoinAmount}
                            </Text>
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
                            {walletData.address}
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
                        style={[tailwind('mb-8')]}
                        onPress={() => {
                            setBitcoinAmount(2000);
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
