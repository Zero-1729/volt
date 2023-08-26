/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useCallback, useEffect, useState} from 'react';

import {Text, View, StyleSheet, useColorScheme, Linking} from 'react-native';
import {
    useIsFocused,
    CommonActions,
    useNavigation,
} from '@react-navigation/native';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ScanParamList} from '../Navigation';

import {runOnJS} from 'react-native-reanimated';

import {RNHapticFeedbackOptions} from '../constants/Haptic';

import BigNumber from 'bignumber.js';

import decodeURI from 'bip21';

import {canSendToInvoice} from '../modules/wallet-utils';

import {
    useCameraDevices,
    Camera,
    CameraPermissionStatus,
    useFrameProcessor,
    CameraRuntimeError,
} from 'react-native-vision-camera';

// Revert to base package when require cycle is fixed:
// see https://github.com/rodgomesc/vision-camera-code-scanner/issues/55
import {
    BarcodeFormat,
    scanBarcodes,
    Barcode,
} from 'vision-camera-code-scanner-fix-55';

import RNHapticFeedback from 'react-native-haptic-feedback';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';

import {LongBottomButton, LongButton, PlainButton} from '../components/button';

import Close from '../assets/svg/x-24.svg';
import Color from '../constants/Color';
import InfoIcon from '../assets/svg/info-16.svg';

import {conservativeAlert} from '../components/alert';
import Clipboard from '@react-native-clipboard/clipboard';

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
                {backgroundColor: ColorScheme.Background.Primary},
                tailwind('justify-center items-center'),
            ]}>
            <Text
                style={[
                    {color: ColorScheme.Text.Default},
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
                    backgroundColor={ColorScheme.Background.Inverted}
                    textColor={ColorScheme.Text.Alt}
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
    const isFocused = useIsFocused();
    const tailwind = useTailwind();
    const navigation = useNavigation();
    const ColorScheme = Color(useColorScheme());

    // Assume Camera loading until we know otherwise
    // If unavailable, we'll show a message
    // Else, we'll cut it out and let Camera View take over
    const [isLoading, setIsLoading] = useState(true);
    const [grantedPermission, setGrantedPermission] =
        useState<CameraPermissionStatus>('not-determined');
    const [isCamAvailable, setCamAvailable] = useState<boolean | null>(null);

    const onError = useCallback(async (error: CameraRuntimeError) => {
        conservativeAlert('QR Scan', error.message);
    }, []);

    // We want to make sure it the scanner isn't constantly scanning the frame
    // in the background, so we'll lock it until the user closes the alert
    const [scanLock, setScanLock] = useState(false);
    const [scannerAlertMsg, setScannerAlertMsg] = useState('');

    const clearScannerAlert = () => {
        setScannerAlertMsg('');
        setScanLock(false);
    };

    const updateScannerAlert = (message: string) => {
        setScannerAlertMsg(message);
        setScanLock(true);

        // Lock for 5 seconds
        setTimeout(() => {
            clearScannerAlert();
        }, 1000 * 5);
    };

    const handleInvalidInvoice = (invoice: string) => {
        let decodedInvoice;
        let amount!: BigNumber;

        try {
            decodedInvoice = decodeURI.decode(invoice);

            amount = new BigNumber(
                decodedInvoice.options ? decodedInvoice.options.amount : '0',
            );
        } catch (e) {
            updateScannerAlert('Detected an invalid invoice');
            return;
        }

        // Check whether too broke for tx
        if (
            amount
                .multipliedBy(100000000)
                .isGreaterThan(route.params.wallet.balance)
        ) {
            updateScannerAlert(
                'You do not have enough funds to send this transaction',
            );
            return;
        }

        // Check can send to address
        if (!canSendToInvoice(decodedInvoice, route.params.wallet)) {
            updateScannerAlert(
                'Selected wallet cannot send to invoice address type',
            );
            return;
        }

        return decodedInvoice;
    };

    const convertBTCtoSats = (btc: string) => {
        const btcAmount = new BigNumber(btc);

        return btcAmount.multipliedBy(100000000).toString();
    };

    const onQRDetected = useCallback(async (QR: Barcode[]) => {
        const rawQRData = QR[0].content.data as string;

        const decodedQR = handleInvalidInvoice(rawQRData);

        if (decodedQR) {
            // To highlight the successful scan, we'll trigger a success haptic
            RNHapticFeedback.trigger('impactLight', RNHapticFeedbackOptions);

            const amount = decodedQR.options.amount;

            if (amount) {
                // Route to Send screen with amount
                // Update amount to sats
                decodedQR.options.amount = convertBTCtoSats(amount);

                runOnJS(navigation.dispatch)(
                    CommonActions.navigate('WalletRoot', {
                        screen: 'Send',
                        params: {
                            invoiceData: decodedQR,
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
                            invoiceData: decodedQR,
                            wallet: route.params.wallet,
                        },
                    }),
                );
            }
        }
    }, []);

    const closeScreen = () => {
        navigation.dispatch(CommonActions.goBack());
    };

    // Update permission state when permission changes.
    const updatePermissions = useCallback(async () => {
        const status = await Camera.requestCameraPermission();

        setGrantedPermission(status);
    }, []);

    const updateCameraAvail = useCallback(async () => {
        // Get available camera devices
        const device = await Camera.getAvailableCameraDevices();

        // If array empty, we assume no camera is available
        setCamAvailable(device.length > 0);
    }, []);

    // Note, IOS simulator does not support the camera,
    // so you need a physical device to test.
    const devices = useCameraDevices();
    const camera = devices.back;

    useEffect(() => {
        // Update camera availability if not determined.
        updateCameraAvail();

        // If camera available initialized
        // cut out of loading
        if (isCamAvailable !== null) {
            setIsLoading(false);
        }
    }, [isCamAvailable, updateCameraAvail]);

    useEffect(() => {
        // Update permission setting if not determined.
        if (grantedPermission === 'not-determined') {
            updatePermissions();
        }
    }, [grantedPermission, updatePermissions]);

    const frameProcessor = useFrameProcessor(
        frame => {
            'worklet';

            // If scan lock is true, we'll skip processing
            if (!scanLock) {
                const digestedFrame = scanBarcodes(frame, [
                    BarcodeFormat.QR_CODE,
                ]);

                // Only attempt to handle QR if any detected in-frame
                if (digestedFrame.length > 0) {
                    // Pass detected QR to processing function
                    runOnJS(onQRDetected)(digestedFrame);
                }
            }
        },
        [onQRDetected],
    );

    // Display if permission is not granted,
    // then, request permission if not determined.
    if (grantedPermission === 'denied') {
        return <RequestPermView />;
    }

    // Display loading or camera unavailable; handle differently
    if (isLoading || camera === undefined) {
        return <LoadingView isCamAvailable={isCamAvailable} />;
    }

    const handleClipboard = async () => {
        const clipboardData = await Clipboard.getString();

        const decodedInvoice = handleInvalidInvoice(clipboardData);

        if (decodedInvoice) {
            // To highlight the successful scan, we'll trigger a success haptic
            RNHapticFeedback.trigger(
                'notificationSuccess',
                RNHapticFeedbackOptions,
            );

            // Return clipboard data
            runOnJS(navigation.dispatch)(
                CommonActions.navigate('WalletRoot', {
                    screen: 'Send',
                    params: {
                        invoiceData: decodedInvoice,
                        wallet: route.params.wallet,
                    },
                }),
            );
        }
    };

    const dynamicHeading =
        route.params.screen === 'send' ? 'Scan Invoice QR' : 'Scan QR Code';

    // Display Camera view if camera available
    return (
        <SafeAreaView
            style={[styles.flexed]}
            edges={['bottom', 'left', 'right']}>
            <View
                style={[
                    tailwind('items-center justify-center h-full w-full'),
                    styles.flexed,
                    {backgroundColor: ColorScheme.Background.Primary},
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
                        <Close fill={ColorScheme.SVG.Default} />
                    </PlainButton>
                    {/* Screen header */}
                    <Text
                        style={[
                            tailwind('text-sm font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
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
                    {/* Scan description */}
                    {scannerAlertMsg ? (
                        <PlainButton
                            style={[
                                tailwind('absolute w-full items-center'),
                                {top: 90},
                            ]}
                            onPress={clearScannerAlert}>
                            <View
                                style={[
                                    tailwind(
                                        'w-4/5 flex-row items-center justify-around rounded px-1 py-3',
                                    ),
                                    {
                                        backgroundColor:
                                            ColorScheme.Background.Inverted,
                                    },
                                ]}>
                                <InfoIcon
                                    height={18}
                                    width={18}
                                    fill={ColorScheme.SVG.Inverted}
                                />
                                <Text
                                    style={[
                                        tailwind('text-sm w-5/6'),
                                        {
                                            color: ColorScheme.Text.Alt,
                                        },
                                    ]}>
                                    {scannerAlertMsg}
                                </Text>
                            </View>
                        </PlainButton>
                    ) : (
                        <></>
                    )}

                    <Text
                        style={[
                            tailwind('text-sm mb-4'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Scan a Bitcoin invoice or address to pay
                    </Text>

                    {/* Scan Area */}
                    <View
                        style={[
                            tailwind('h-2/5 w-4/5 border'),
                            {
                                borderWidth: 2,
                                borderColor: ColorScheme.Background.Inverted,
                                borderRadius: 12,
                            },
                        ]}>
                        <Camera
                            style={[styles.flexed, {borderRadius: 11}]}
                            device={camera}
                            isActive={isFocused}
                            frameProcessor={frameProcessor}
                            frameProcessorFps={1}
                            onError={onError}
                        />
                    </View>
                </View>

                <LongBottomButton
                    onPress={handleClipboard}
                    title={'Paste'}
                    textColor={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    flexed: {
        flex: 1,
    },
});

export default Scan;
