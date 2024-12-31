import React, {useCallback, useContext, useEffect, useState} from 'react';

import {
    Text,
    View,
    StyleSheet,
    useColorScheme,
    Linking,
    Platform,
} from 'react-native';
import {CommonActions, useNavigation} from '@react-navigation/native';

import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

import {parseInvoice} from '@breeztech/react-native-breez-sdk';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ScanParamList} from '../Navigation';

import {runOnJS} from 'react-native-reanimated';

import {RNHapticFeedbackOptions} from '../constants/Haptic';

import {useTranslation} from 'react-i18next';

import decodeURI from 'bip21';

import {
    checkInvoiceAndWallet,
    isValidAddress,
    decodeInvoiceType,
    isLNAddress,
} from '../modules/wallet-utils';

import RNHapticFeedback from 'react-native-haptic-feedback';

import {SafeAreaView} from 'react-native-safe-area-context';
import NativeWindowMetrics from '../constants/NativeWindowMetrics';

import {useTailwind} from 'tailwind-rn';

import {LongBottomButton, LongButton, PlainButton} from '../components/button';

import Close from '../assets/svg/x-24.svg';
import Color from '../constants/Color';

import Clipboard from '@react-native-clipboard/clipboard';

import {capitalizeFirst, convertBTCtoSats} from '../modules/transform';

import {Toasts} from '@backpackapp-io/react-native-toast';
import {LiberalToast} from '../components/toast';

import TorchIcon from '../assets/svg/light-bulb-24.svg';

import {Camera, useCameraDevice, useCodeScanner, CodeScanner, Code} from 'react-native-vision-camera';
import { AppStorageContext } from '../class/storageContext';

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
    const ColorScheme = Color(useColorScheme());

    const {t} = useTranslation('wallet');
    const {t: e} = useTranslation('errors');

    const isGenericScan = route.params.screen === 'home';

    const device = useCameraDevice('back');

    const {currentWalletID,
            getWalletData,
        } = useContext(AppStorageContext);

    const walletData = getWalletData(currentWalletID);

    // Assume Camera loading until we know otherwise
    // If unavailable, we'll show a message
    // Else, we'll cut it out and let Camera View take over
    const [grantedPermission, setGrantedPermission] = useState<Status>(
        Status.UNKNOWN,
    );
    const [flashOn, setFlashOn] = useState<boolean>(false);

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
        setQRData('');
    }, []);

    const updateScannerMessage = useCallback((text: string) => {
        setScannerAlertMsg(text);
        setScanLock(true);
    }, []);

    useEffect(() => {
        if (scannerAlertMsg) {
            runOnJS(LiberalToast)(capitalizeFirst(t('scanner')),scannerAlertMsg, {
                duration: 3000,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scannerAlertMsg]);

    const updateToast = useCallback(
        (message: string) => {
            updateScannerMessage(e(message));
        },
        [e, updateScannerMessage],
    );

    const processAndRoute = useCallback(
        async (decodedQRState: {
            decodedInvoice: any;
            isOnchain: boolean | null;
            error: boolean;
        }) => {
            // Note: Check and report if broke, according to wallet and invoice type
            // I.e. do not go through if LN broke and LN invoice, etc.
            if (!decodedQRState.error) {
                // To highlight the successful scan, we'll trigger a success haptic
                RNHapticFeedback.trigger(
                    'impactLight',
                    RNHapticFeedbackOptions,
                );

                // If Onchain
                if (decodedQRState.isOnchain) {
                    if (walletData.balance.onchain.isZero()) {
                        updateScannerMessage(e('insufficient_funds'));
                        return;
                    }

                    const amount = decodedQRState.decodedInvoice.options.amount;

                    if (amount) {
                        // Route to Fee screen with amount (onChain)
                        // Update amount to sats
                        decodedQRState.decodedInvoice.options.amount =
                            convertBTCtoSats(amount);

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
                    if (walletData.balance.lightning.isZero()) {
                        updateScannerMessage(e('insufficient_funds'));
                        return;
                    }

                    const LNinvoice = decodedQRState.decodedInvoice;

                    const isBolt11 = !!LNinvoice?.bolt11;
                    const isLNA = !isBolt11 ? isLNAddress(LNinvoice) : false;
                    // Bech32 encoded LNURL withdraw (LUD-1) or LNURL-withdraw (LUD-17)
                    const isLNW = !isBolt11 && !isLNA ?
                          LNinvoice.startsWith('lnurl1d') ||
                          LNinvoice.startsWith('lnurlw://')
                        : false;

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

                    // Handle LNURL
                    if (isLNW) {
                        const lnurlRaw = LNinvoice;

                        runOnJS(navigation.dispatch)(
                            CommonActions.navigate('WithdrawLNURL', {
                                params: {
                                    lnurl: lnurlRaw,
                                },
                            }),
                        );
                    }

                    if (!isLNA && !isBolt11 && !isLNW) {
                        updateScannerMessage(t('lightning_not_support'));
                    }
                }
            }
        },
        [e, navigation.dispatch, route.params.wallet, t, updateScannerMessage, walletData.balance.lightning, walletData.balance.onchain],
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

                // LNURL (Withdraw)
                if (invoiceType.spec === 'lnurl') {
                    // LNURL Withdraw
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
        async (code: Code) => {
            // Move if locked or no value
            if (scanLock || !code.value) {
                return;
            }

            const qrData = code.value as string;

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleClipboard = async () => {
        const clipboardData = (await Clipboard.getString()).trim();

        const invoiceState = await handleInvoice(clipboardData);
        await processAndRoute(invoiceState);
    };

    const dynamicHeading =
        route.params.screen === 'send' ? t('qr_scan_invoice') : t('qr_scan');

    const codeScanner: CodeScanner = useCodeScanner({
        codeTypes: ['qr'],
        onCodeScanned: (codes: Code[]) => {
            // Note: only handles single code
            // i,.e. only one QR code at a time; the first prioritized
            if (codes.length > 0) {
                const code = codes[0];
                handleQR(code);
            }
        },
    });

    // Display Camera view if camera available
    return (
        <SafeAreaView
            style={[styles.flexed]}
            edges={['top', 'bottom', 'left', 'right']}>
            {grantedPermission === Status.AUTHORIZED && (
                <View
                    style={[
                        tailwind(
                            'items-center justify-center h-full w-full',
                        ),
                        {backgroundColor: ColorScheme.Background.Primary},
                        styles.flexed,
                    ]}>
                    <View
                        style={[
                            tailwind(
                                'absolute z-10 w-full items-center justify-center',
                            ),
                            styles.headerContent,
                        ]}>
                        <View
                            style={[
                                tailwind(
                                    'flex-row w-full items-center justify-center',
                                ),
                            ]}>
                            {/* Screen header */}
                            <View style={[
                                tailwind('items-center rounded-full p-3'),
                                styles.scannerHeader,
                            ]}>
                                <Text
                                    style={[
                                        tailwind('text-sm font-bold'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    {dynamicHeading}
                                </Text>
                            </View>
                        </View>

                        <View style={[tailwind('mt-4 p-3 rounded-full'), styles.qrHelpText]}>
                            <Text
                                style={[
                                    tailwind('text-sm text-center'),
                                    {color: ColorScheme.Text.DescText},
                                ]}>
                                {!isGenericScan ? t('scan_message_generic') : t('scan_message')}
                            </Text>
                        </View>
                    </View>

                    <View style={[tailwind('absolute items-center'), styles.cameraContainer]}>
                        <PlainButton
                            onPress={closeScreen}
                            style={[tailwind('absolute z-10 top-6 left-6 rounded-full p-3'), styles.opaqueBG]}>
                            <Close fill={'white'} />
                        </PlainButton>

                        {/* Flash Button */}
                        <PlainButton
                                onPress={() => {
                                    setFlashOn(!flashOn);
                                }}
                                style={[
                                    tailwind('absolute z-10 top-6 right-6 rounded-full p-3'),
                                    // eslint-disable-next-line react-native/no-inline-styles
                                    {
                                        backgroundColor: !flashOn ? '#00000080' : '#FFFFFFFF',
                                    },
                                ]}>
                                    <TorchIcon
                                        fill={!flashOn ? 'white' : 'black'}
                                    />
                            </PlainButton>

                        {/* Camera Scan View Container */}
                        {device && (
                            <Camera
                                style={[
                                    tailwind('w-full h-full'),
                                    {backgroundColor: ColorScheme.Background.Primary},
                                    styles.cameraFlexed,
                                ]}
                                device={device}
                                isActive={true}
                                codeScanner={codeScanner}
                                onError={onError}
                                torch={flashOn ? 'on' : 'off'}
                                resizeMode={'cover'}
                            />
                        )}
                    </View>

                    <LongBottomButton
                        onPress={handleClipboard}
                        title={capitalizeFirst(t('paste'))}
                        textColor={ColorScheme.Text.Alt}
                        backgroundColor={ColorScheme.Background.Inverted}
                    />
                </View>
            )}

            {/* Display if permission is not granted,
            then, request permission if not determined. */}
            {grantedPermission === Status.NOT_AUTHORIZED && <RequestPermView />}

            {/* Display loading or camera unavailable; handle differently */}
            {!Camera && <LoadingView isCamAvailable={true} />}

            <Toasts onToastHide={clearScannerAlert} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    fullSize: {
        height: '100%',
        width: '100%',
        flex: 1,
    },
    flexed: {
        flex: 1,
        height: '100%',
        width: '100%',
    },
    cameraContainer: {
        height: 400,
        width: '90%',
        flex: 1,
        overflow: 'hidden',
        borderRadius: 16,
    },
    opaqueBG: {
        backgroundColor: '#00000080',
    },
    cameraFlexed: {
        borderRadius: 16,
        borderWidth: 3,
        borderColor: 'white',
    },
    headerContent: {
        top: NativeWindowMetrics.height * 0.05,
    },
    scannerHeader: {
        width: NativeWindowMetrics.width * 0.5,
    },
    qrHelpText: {
        width: NativeWindowMetrics.width * 0.86,
    },
});

export default Scan;
