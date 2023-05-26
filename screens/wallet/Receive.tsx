/* eslint-disable react-native/no-inline-styles */
import React, {useContext, useState} from 'react';
import {useColorScheme, View, Text, Share} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import {AppStorageContext} from '../../class/storageContext';

import QRCode from 'react-native-qrcode-svg';

import ShareIcon from '../../assets/svg/share-android-24.svg';

import Clipboard from '@react-native-clipboard/clipboard';

import {PlainButton} from '../../components/button';

import bottomOffset from '../../constants/NativeWindowMetrics';

const Receive = () => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {currentWalletID, getWalletData} = useContext(AppStorageContext);
    const walletData = getWalletData(currentWalletID);

    // Format as Bitcoin URI
    const getFormattedAddress = (address: string) => {
        // return a formatted bitcoin address to include the bitcoin payment request URI
        return `bitcoin:${address}`;
    };

    // Set the plain address and bitcoin invoice URI
    const [plainAddress, setPlainAddress] = useState('');
    const [BitcoinInvoice, setBitcoinInvoice] = useState(
        getFormattedAddress(walletData.address),
    );

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

                {/* QR code */}
                <View
                    style={[
                        tailwind('rounded -mt-6'),
                        {
                            borderWidth: 10,
                            borderColor: 'white',
                        },
                    ]}>
                    <QRCode value={BitcoinInvoice} size={225} />
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

                {/* Share Button */}
                <PlainButton
                    style={[
                        tailwind('absolute'),
                        {bottom: bottomOffset.bottom},
                    ]}
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
        </SafeAreaView>
    );
};

export default Receive;
