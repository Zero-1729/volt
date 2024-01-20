import React, {useEffect, useState} from 'react';

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

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ScanParamList} from '../Navigation';

import {runOnJS} from 'react-native-reanimated';

import {RNHapticFeedbackOptions} from '../constants/Haptic';

import decodeURI from 'bip21';

import {checkInvoiceAndWallet, isValidAddress} from '../modules/wallet-utils';

import {Camera, CameraType} from 'react-native-camera-kit';

import RNHapticFeedback from 'react-native-haptic-feedback';

import {useNetInfo} from '@react-native-community/netinfo';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';

import {LongBottomButton, LongButton, PlainButton} from '../components/button';

import Close from '../assets/svg/x-24.svg';
import Color from '../constants/Color';
import InfoIcon from '../assets/svg/info-16.svg';

import {conservativeAlert} from '../components/alert';
import Clipboard from '@react-native-clipboard/clipboard';

import {prefixInfo} from '../modules/wallet-utils';
import {WalletTypeDetails, DUST_LIMIT} from '../modules/wallet-defaults';
import {convertBTCtoSats} from '../modules/transform';

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

    const [isOnchain, setIsOnChain] = useState<boolean>(true);

    // Assume Camera loading until we know otherwise
    // If unavailable, we'll show a message
    // Else, we'll cut it out and let Camera View take over
    const [grantedPermission, setGrantedPermission] = useState<Status>(
        Status.UNKNOWN,
    );
    const cameraRef = React.useRef<Camera>(null);

    const onError = (error: any) => {
        conservativeAlert('QR Scan', error.message);
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
    const [scannerAlertMsg, setScannerAlertMsg] = useState('');
    const networkState = useNetInfo();

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

        // Handle single btc supported address
        if (!invoice.startsWith('bitcoin:')) {
            let btcAddress = invoice;

            if (!isValidAddress(btcAddress)) {
                updateScannerAlert('Detected an invalid address');
                return;
            }

            invoice = 'bitcoin:' + btcAddress;
        }

        try {
            decodedInvoice = decodeURI.decode(invoice);

            if (!isValidAddress(decodedInvoice.address)) {
                updateScannerAlert('Detected an invalid invoice');
                return;
            }
        } catch (e) {
            updateScannerAlert('Detected an invalid invoice');
            return;
        }

        if (!invoice.startsWith('bitcoin:')) {
            setIsOnChain(false);
        }

        // Check and report errors from wallet and invoice
        checkInvoiceAndWallet(
            route.params.wallet,
            decodedInvoice,
            conservativeAlert,
        );

        return decodedInvoice;
    };

    const onQRDetected = (event: any) => {
        if (scanLock) {
            return;
        }

        const _QR = event.nativeEvent.codeStringValue;

        const decodedQR = handleInvalidInvoice(_QR);

        if (decodedQR) {
            // To highlight the successful scan, we'll trigger a success haptic
            RNHapticFeedback.trigger('impactLight', RNHapticFeedbackOptions);

            const amount = decodedQR.options.amount;

            if (isOnchain) {
                if (amount) {
                    // Route to Fee screen with amount (onChain)
                    // Update amount to sats

                    // If Onchain
                    decodedQR.options.amount = convertBTCtoSats(amount);

                    if (networkState?.isInternetReachable) {
                        runOnJS(navigation.dispatch)(
                            CommonActions.navigate('WalletRoot', {
                                screen: 'FeeSelection',
                                params: {
                                    invoiceData: decodedQR,
                                    wallet: route.params.wallet,
                                },
                            }),
                        );
                    } else {
                        conservativeAlert(
                            'Network',
                            'Please check your internet connection',
                        );
                    }
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
            } else {
                // If LN Invoice
                conservativeAlert('Warning', 'Lightning is not yet supported');
            }
        }
    };

    const closeScreen = () => {
        navigation.dispatch(CommonActions.goBack());
    };

    useEffect(() => {
        requestCamPerms();
    }, []);

    const handleClipboard = async () => {
        const clipboardData = await Clipboard.getString();

        const decodedInvoice = handleInvalidInvoice(clipboardData);

        if (decodedInvoice) {
            // To highlight the successful scan, we'll trigger a success haptic
            RNHapticFeedback.trigger(
                'notificationSuccess',
                RNHapticFeedbackOptions,
            );

            if (decodedInvoice.options.amount) {
                // Update amount to sats
                decodedInvoice.options.amount = convertBTCtoSats(
                    decodedInvoice.options.amount,
                );

                runOnJS(navigation.dispatch)(
                    CommonActions.navigate('WalletRoot', {
                        screen: 'FeeSelection',
                        params: {
                            invoiceData: decodedInvoice,
                            wallet: route.params.wallet,
                        },
                    }),
                );
            } else {
                runOnJS(navigation.dispatch)(
                    CommonActions.navigate('WalletRoot', {
                        screen: 'SendAmount',
                        params: {
                            invoiceData: decodedInvoice,
                            wallet: route.params.wallet,
                        },
                    }),
                );
            }
        }
    };

    const dynamicHeading =
        route.params.screen === 'send' ? 'Scan Invoice QR' : 'Scan QR Code';

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
                        {/* Scan description */}
                        {scannerAlertMsg ? (
                            <PlainButton
                                style={[
                                    tailwind('absolute w-full items-center'),
                                    styles.scanMessage,
                                ]}
                                onPress={clearScannerAlert}>
                                <View
                                    style={[
                                        tailwind(
                                            'w-4/5 flex-row items-center justify-around rounded px-1 py-3 bg-white',
                                        ),
                                    ]}>
                                    <InfoIcon
                                        height={18}
                                        width={18}
                                        fill={'black'}
                                    />
                                    <Text
                                        style={[
                                            tailwind(
                                                'text-sm w-5/6 text-black',
                                            ),
                                        ]}>
                                        {scannerAlertMsg}
                                    </Text>
                                </View>
                            </PlainButton>
                        ) : (
                            <></>
                        )}

                        <Text style={[tailwind('text-sm mb-4 text-white')]}>
                            Scan a Bitcoin invoice or address to pay
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
                                onReadCode={onQRDetected}
                            />
                        </View>
                    </View>

                    <LongBottomButton
                        onPress={handleClipboard}
                        title={'Paste'}
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
