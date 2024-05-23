import React, {useCallback, useEffect, useState} from 'react';

import {
    Text,
    View,
    StyleSheet,
    useColorScheme,
    Linking,
    Platform,
} from 'react-native';
import {
    CommonActions,
    StackActions,
    useNavigation,
} from '@react-navigation/native';

import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

import {parseInvoice} from '@breeztech/react-native-breez-sdk';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ScanParamList} from '../Navigation';

import {runOnJS} from 'react-native-reanimated';

import {RNHapticFeedbackOptions} from '../constants/Haptic';

import Toast, {ToastConfig} from 'react-native-toast-message';

import {useTranslation} from 'react-i18next';

import decodeURI from 'bip21';

import {
    checkInvoiceAndWallet,
    isValidAddress,
    decodeInvoiceType,
    isLNAddress,
} from '../modules/wallet-utils';

import {Camera, CameraType} from 'react-native-camera-kit';

import RNHapticFeedback from 'react-native-haptic-feedback';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';

import {LongBottomButton, LongButton, PlainButton} from '../components/button';

import Close from '../assets/svg/x-24.svg';
import Color from '../constants/Color';

import Clipboard from '@react-native-clipboard/clipboard';

import {capitalizeFirst, convertBTCtoSats} from '../modules/transform';
import {toastConfig} from '../components/toast';

enum Status {
    AUTHORIZED = 'AUTHORIZED',
    NOT_AUTHORIZED = 'NOT_AUTHORIZED',
    UNKNOWN = 'UNKNOWN',
}

type Props = NativeStackScreenProps<ScanParamList, 'Scan'>;

const LoadingView = (props: any) => {
    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    return (
        <SafeAreaView
            style={[
                styles.flexed,
                {backgroundColor: ColorScheme.Background.Primary},
                tailwind('justify-center items-center'),
            ]}>
            <Text
                style={[
                    {color: ColorScheme.Text.DescText},
                    tailwind('text-sm text-center'),
                ]}>
                {/* Only show loading if actually loading */}
                {props.isCamAvailable === false
                    ? 'Camera is not available'
                    : 'Loading...'}
            </Text>
        </SafeAreaView>
    );
};

const RequestPermView = () => {
    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    return (
        <SafeAreaView
            style={[
                styles.flexed,
                tailwind('justify-center items-center bg-black'),
            ]}>
            <Text
                style={[
                    {color: ColorScheme.Text.Alt},
                    tailwind('text-sm text-center mb-6'),
                ]}>
                Camera Permission Denied
            </Text>

            <View style={[tailwind('w-4/5')]}>
                <LongButton
                    style={[
                        {color: ColorScheme.Text.DescText},
                        tailwind('text-sm text-center'),
                    ]}
                    onPress={openSettings}
                    backgroundColor={'white'}
                    textColor={'black'}
                    title={'Open Settings'}
                />
            </View>
        </SafeAreaView>
    );
};

const openSettings = () => {
    Linking.openSettings();
};

const Scan = ({route}: Props) => {
    const tailwind = useTailwind();
    const navigation = useNavigation();

    const {t} = useTranslation('wallet');
    const {t: e} = useTranslation('errors');

    // Assume Camera loading until we know otherwise
    // If unavailable, we'll show a message
    // Else, we'll cut it out and let Camera View take over
    const [grantedPermission, setGrantedPermission] = useState<Status>(
        Status.UNKNOWN,
    );
    const cameraRef = React.useRef<Camera>(null);

    const onError = (error: any) => {
        updateScannerMessage(error.message);
    };

    const requestCamPerms = async () => {
        const CamPermission =
            Platform.OS === 'ios'
                ? PERMISSIONS.IOS.CAMERA
                : PERMISSIONS.ANDROID.CAMERA;

        const checkResult = await check(CamPermission);

        switch (checkResult) {
            case RESULTS.BLOCKED:
                setGrantedPermission(Status.NOT_AUTHORIZED);
                break;
            case RESULTS.UNAVAILABLE:
            case RESULTS.DENIED:
                const permRequest = await request(CamPermission, {
                    title: 'Camera Permission',
                    message: 'Allow Camera to Scan QR Codes',
                    buttonPositive: 'OK',
                    buttonNegative: 'Cancel',
                });

                setGrantedPermission(
                    permRequest === RESULTS.GRANTED
                        ? Status.AUTHORIZED
                        : Status.NOT_AUTHORIZED,
                );
                break;
            case RESULTS.LIMITED:
            case RESULTS.GRANTED:
                setGrantedPermission(Status.AUTHORIZED);
                break;
        }
    };

    // We want to make sure it the scanner isn't constantly scanning the frame
    // in the background, so we'll lock it until the user closes the alert
    const [scanLock, setScanLock] = useState(false);
    const [scannerAlertMsg, setScannerAlertMsg] = useState<string>('');
    const [_qrData, setQRData] = useState<string>('');

    const clearScannerAlert = useCallback(() => {
        setScannerAlertMsg('');
        setScanLock(false);
    }, []);

    const updateScannerMessage = useCallback((text: string) => {
        setScannerAlertMsg(text);
        setScanLock(true);
    }, []);

    useEffect(() => {
        if (scannerAlertMsg) {
            runOnJS(Toast.show)({
                topOffset: 54,
                type: 'Liberal',
                text1: capitalizeFirst(t('scanner')),
                text2: scannerAlertMsg,
                visibilityTime: 1750,
                onHide: () => {
                    clearScannerAlert();
                },
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scannerAlertMsg]);

    const updateToast = useCallback(
        (message: string) => {
            updateScannerMessage(message);
        },
        [updateScannerMessage],
    );

    const processAndRoute = useCallback(
        async (decodedQRState: {
            decodedInvoice: any;
            isOnchain: boolean | null;
            error: boolean;
        }) => {
            if (!decodedQRState.error) {
                // To highlight the successful scan, we'll trigger a success haptic
                RNHapticFeedback.trigger(
                    'impactLight',
                    RNHapticFeedbackOptions,
                );

                // If Onchain
                if (decodedQRState.isOnchain) {
                    const amount = decodedQRState.decodedInvoice.options.amount;

                    if (amount) {
                        // Route to Fee screen with amount (onChain)
                        // Update amount to sats
                        decodedQRState.decodedInvoice.options.amount =
                            convertBTCtoSats(amount);

                        if (route.params.screen === 'home') {
                            runOnJS(navigation.dispatch)(
                                StackActions.popToTop(),
                            );
                        }

                        runOnJS(navigation.dispatch)(
                            CommonActions.navigate('WalletRoot', {
                                screen: 'FeeSelection',
                                params: {
                                    invoiceData: decodedQRState.decodedInvoice,
                                    wallet: route.params.wallet,
                                },
                            }),
                        );
                    } else {
                        // Route to SendAmount screen
                        if (route.params.screen === 'home') {
                            runOnJS(navigation.dispatch)(
                                StackActions.popToTop(),
                            );
                        }

                        runOnJS(navigation.dispatch)(
                            CommonActions.navigate('WalletRoot', {
                                screen: 'SendAmount',
                                params: {
                                    invoiceData: decodedQRState.decodedInvoice,
                                    wallet: route.params.wallet,
                                    isLightning: false,
                                },
                            }),
                        );
                    }
                } else {
                    const LNinvoice = decodedQRState.decodedInvoice;

                    const isBolt11 = !!LNinvoice?.bolt11;
                    const isLNA = !isBolt11 ? isLNAddress(LNinvoice) : false;

                    if (isBolt11) {
                        // If LN Invoice
                        // call on breez to attempt to pay and route screen
                        const parsedBolt11Invoice = LNinvoice;
                        const bolt11Msat = parsedBolt11Invoice.amountMsat;

                        if (!bolt11Msat) {
                            updateScannerMessage(
                                e('missing_bolt11_invoice_amount'),
                            );
                        }

                        // Navigate to send screen to handle LN payment
                        if (route.params.screen === 'home') {
                            runOnJS(navigation.dispatch)(
                                StackActions.popToTop(),
                            );
                        }

                        runOnJS(navigation.dispatch)(
                            CommonActions.navigate('WalletRoot', {
                                screen: 'Send',
                                params: {
                                    wallet: route.params.wallet,
                                    feeRate: 0,
                                    dummyPsbtVsize: 0,
                                    invoiceData: null,
                                    bolt11: parsedBolt11Invoice,
                                },
                            }),
                        );
                    }

                    if (isLNA) {
                        // Assumed an LN Address
                        if (route.params.screen === 'home') {
                            runOnJS(navigation.dispatch)(
                                StackActions.popToTop(),
                            );
                        }

                        runOnJS(navigation.dispatch)(
                            CommonActions.navigate('WalletRoot', {
                                screen: 'SendLN',
                                params: {
                                    lnManualPayload: {
                                        kind: 'address',
                                        text: LNinvoice,
                                        description: '',
                                        amount: 0,
                                    },
                                },
                            }),
                        );
                    }

                    if (!isLNA && !isBolt11) {
                        updateScannerMessage(t('lightning_not_support'));
                    }
                }
            }
        },
        [
            e,
            navigation.dispatch,
            route.params.screen,
            route.params.wallet,
            t,
            updateScannerMessage,
        ],
    );

    const handleInvoice = useCallback(
        async (
            invoice: string,
        ): Promise<{
            decodedInvoice: any;
            isOnchain: boolean | null;
            error: any;
        }> => {
            let decodedInvoice;

            // See if single BTC address
            // Handle single btc supported address
            if (isValidAddress(invoice.toLowerCase())) {
                invoice = 'bitcoin:' + invoice;
            }

            const invoiceType = await decodeInvoiceType(invoice);

            // Only support:
            // - Bolt 11 Invoice
            // - Unified and regular BIP21 Invoice
            // - LNURL
            if (
                !(
                    invoiceType.type === 'bitcoin' ||
                    invoiceType.type === 'lightning' ||
                    invoiceType.type === 'unified' ||
                    invoiceType.spec === 'lnurl'
                )
            ) {
                updateScannerMessage(e('unsupported_invoice_type'));
                return {decodedInvoice: '', isOnchain: null, error: true};
            }

            // Check if LN invoice and handle separately
            // Call on Breez to work on this
            if (invoiceType.type === 'lightning') {
                const parsedLNURL = invoiceType.invoice.startsWith('lightning:')
                    ? invoiceType.invoice.split('lightning:')[1]
                    : invoiceType.invoice;

                // Only support bolt11 for now
                if (invoiceType.spec === 'bolt11') {
                    try {
                        const parsedBolt11Invoice = await parseInvoice(invoice);

                        return {
                            decodedInvoice: parsedBolt11Invoice,
                            isOnchain: false,
                            error: false,
                        };
                    } catch (err: any) {
                        updateScannerMessage(err.message);
                        return {
                            decodedInvoice: '',
                            isOnchain: null,
                            error: true,
                        };
                    }
                }

                if (invoiceType.spec === 'lnurl' && isLNAddress(parsedLNURL)) {
                    // LN Address
                    return {
                        decodedInvoice: parsedLNURL,
                        isOnchain: false,
                        error: false,
                    };
                }

                updateScannerMessage(e('unsupported_invoice_type'));
                return {decodedInvoice: '', isOnchain: null, error: true};
            }

            // Bip21
            if (
                invoiceType.type === 'bitcoin' ||
                invoiceType.type === 'unified'
            ) {
                // Handle LN if unified wallet and ln balance sufficient
                if (invoiceType.type === 'unified') {
                    if (route.params.wallet.balanceLightning > 0) {
                        // attempt LN
                        const bolt11 = (
                            invoiceType.invoice
                                .split('lightning=')
                                .pop() as string
                        ).toLowerCase();

                        try {
                            const parsedBolt11Invoice = await parseInvoice(
                                bolt11,
                            );

                            return {
                                decodedInvoice: parsedBolt11Invoice,
                                isOnchain: false,
                                error: false,
                            };
                        } catch (err: any) {
                            // continue to bip21 below
                        }
                    }
                }

                // Attempt to decode BIP21 QR
                try {
                    decodedInvoice = decodeURI.decode(invoice);

                    // BIP21 QR could contain upper case address, so we'll convert to lower case
                    if (!isValidAddress(decodedInvoice.address.toLowerCase())) {
                        updateScannerMessage(e('invalid_invoice_error'));
                        return {
                            decodedInvoice: '',
                            isOnchain: null,
                            error: true,
                        };
                    }
                } catch (err: any) {
                    updateScannerMessage(e('invalid_invoice_error'));
                    return {decodedInvoice: '', isOnchain: null, error: true};
                }
            }

            // Check and report errors from wallet and invoice
            if (
                !checkInvoiceAndWallet(
                    route.params.wallet,
                    decodedInvoice,
                    updateToast,
                )
            ) {
                return {decodedInvoice: '', isOnchain: null, error: true};
            }

            // TODO: check if this is a fallback for Bip21
            return {
                decodedInvoice: decodedInvoice,
                isOnchain: true,
                error: false,
            };
        },
        [e, route.params.wallet, updateScannerMessage, updateToast],
    );

    const handleQR = useCallback(
        async (event: any) => {
            if (scanLock) {
                return;
            }

            const qrData = event.nativeEvent.codeStringValue;

            if (qrData !== _qrData) {
                setQRData(qrData);

                const handledInvoice = await handleInvoice(qrData);
                await processAndRoute(handledInvoice);
            }
        },
        [_qrData, handleInvoice, processAndRoute, scanLock],
    );

    const closeScreen = () => {
        navigation.dispatch(CommonActions.goBack());
    };

    useEffect(() => {
        requestCamPerms();
    }, []);

    const handleClipboard = async () => {
        const clipboardData = await Clipboard.getString();

        const invoiceState = await handleInvoice(clipboardData);
        await processAndRoute(invoiceState);
    };

    const dynamicHeading =
        route.params.screen === 'send' ? t('qr_scan_invoice') : t('qr_scan');

    // Display Camera view if camera available
    return (
        <SafeAreaView
            style={[styles.flexed, tailwind('bg-black')]}
            edges={['bottom', 'left', 'right']}>
            {grantedPermission === Status.AUTHORIZED && (
                <View
                    style={[
                        tailwind(
                            'items-center justify-center h-full w-full bg-black',
                        ),
                        styles.flexed,
                    ]}>
                    <View
                        style={[
                            tailwind(
                                'absolute top-6 z-10 w-full flex-row items-center justify-center',
                            ),
                        ]}>
                        <PlainButton
                            onPress={closeScreen}
                            style={[tailwind('absolute z-10 left-6')]}>
                            <Close fill={'white'} />
                        </PlainButton>
                        {/* Screen header */}
                        <Text
                            style={[tailwind('text-sm font-bold text-white')]}>
                            {dynamicHeading}
                        </Text>
                    </View>

                    {/* Scan midsection */}
                    <View
                        style={[
                            tailwind(
                                'items-center justify-center w-full h-full -mt-8',
                            ),
                        ]}>
                        <Text style={[tailwind('text-sm mb-4 text-white')]}>
                            {t('scan_message')}
                        </Text>

                        {/* Scan Area */}
                        <View
                            style={[
                                tailwind('h-2/5 w-4/5 border'),
                                styles.scanAreaBorder,
                            ]}>
                            <Camera
                                style={styles.flexed}
                                onError={onError}
                                CameraType={CameraType.Back}
                                ref={cameraRef}
                                flashMode={'off'} // TODO: Add flash mode
                                scanBarcode={true}
                                focusMode={'on'}
                                onReadCode={handleQR}
                            />
                        </View>
                    </View>

                    <LongBottomButton
                        onPress={handleClipboard}
                        title={capitalizeFirst(t('paste'))}
                        textColor={'black'}
                        backgroundColor={'white'}
                    />
                </View>
            )}

            {/* Display if permission is not granted,
            then, request permission if not determined. */}
            {grantedPermission === Status.NOT_AUTHORIZED && <RequestPermView />}

            {/* Display loading or camera unavailable; handle differently */}
            {!Camera && <LoadingView isCamAvailable={true} />}

            <Toast config={toastConfig as ToastConfig} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    flexed: {
        flex: 1,
    },
    scanMessage: {
        top: 90,
    },
    scanAreaBorder: {
        borderWidth: 4,
        borderColor: 'white',
    },
});

export default Scan;
