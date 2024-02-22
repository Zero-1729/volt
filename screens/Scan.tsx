import React, {useEffect, useState, useContext} from 'react';

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

import {AppStorageContext} from '../class/storageContext';

import Toast, { ToastConfig } from 'react-native-toast-message';

import {useTranslation} from 'react-i18next';

import decodeURI from 'bip21';

import {
    checkInvoiceAndWallet,
    isValidAddress,
    decodeInvoiceType,
} from '../modules/wallet-utils';

import {Camera, CameraType} from 'react-native-camera-kit';

import RNHapticFeedback from 'react-native-haptic-feedback';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';

import {LongBottomButton, LongButton, PlainButton} from '../components/button';

import Close from '../assets/svg/x-24.svg';
import Color from '../constants/Color';
import InfoIcon from '../assets/svg/info-16.svg';

import {conservativeAlert} from '../components/alert';
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

    const {walletMode} = useContext(AppStorageContext);

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
        conservativeAlert(
            t('qr_scan'),
            error.message,
            capitalizeFirst(t('ok')),
        );
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

    const handleInvalidInvoice = async (invoice: string) => {
        // TODO: update to handle unified invoice format (LN & BTC)
        //       Make ln priority if unified or LN wallet
        let decodedInvoice;

        // See if single BTC address
        // Handle single btc supported address
        if (isValidAddress(invoice.toLowerCase())) {
            invoice = 'bitcoin:' + invoice;
        }

        const invoiceType = await decodeInvoiceType(invoice);

        // Only support:
        // - Unified and regular BIP21 Invoice
        // - Bolt11 Invoice
        // - LNURL
        if (
            !(
                invoiceType.type === 'bitcoin' ||
                invoiceType.type === 'lightning'
            )
        ) {
            Toast.show({
                topOffset: 54,
                type: 'Liberal',
                text1: t('Scanner'),
                text2: e('unsupported_invoice_type'),
            });
            return {decodedInvoice: null, isOnchain: null};
        }

        // Check if LN invoice and handle separately
        // Call on Breez to work on this
        if (
            invoiceType.type === 'lightning' ||
            invoiceType.type === 'bitcoin'
        ) {
            // Only support bolt11 for now
            if (invoiceType.spec === 'bolt11') {
                try {
                    const parsedBolt11Invoice = await parseInvoice(invoice);

                    return {
                        decodedInvoice: parsedBolt11Invoice,
                        isOnchain: false,
                    };
                } catch (err: any) {
                    Toast.show({
                        topOffset: 54,
                        type: 'Liberal',
                        text1: t('Scanner'),
                        text2: err,
                    });
                    return {decodedInvoice: null, isOnchain: null};
                }
            } else {
                Toast.show({
                    topOffset: 54,
                    type: 'Liberal',
                    text1: t('Scanner'),
                    text2: e('lightning_not_support'),
                });
                return {decodedInvoice: null, isOnchain: null};
            }
        }

        if (invoiceType.type === 'bitcoin') {
            // Attempt to decode BIP21 QR
            try {
                decodedInvoice = decodeURI.decode(invoice);

                // BIP21 QR could contain upper case address, so we'll convert to lower case
                if (!isValidAddress(decodedInvoice.address.toLowerCase())) {
                    Toast.show({
                        topOffset: 54,
                        type: 'Liberal',
                        text1: t('Scanner'),
                        text2: e('invalid_invoice_error'),
                    });
                    return {decodedInvoice: null, isOnchain: null};
                }
            } catch (err: any) {
                Toast.show({
                    topOffset: 54,
                    type: 'Liberal',
                    text1: t('Scanner'),
                    text2: e('invalid_invoice_error'),
                });
                return {decodedInvoice: null, isOnchain: null};
            }
        }

        // Check and report errors from wallet and invoice
        // TODO: fix to use toast
        if (
            !checkInvoiceAndWallet(
                route.params.wallet,
                decodedInvoice,
                updateScannerAlert,
                walletMode === 'single',
            )
        ) {
            return {decodedInvoice: null, isOnchain: null};
        }

        return {decodedInvoice: decodedInvoice, isOnchain: true};
    };

    const onQRDetected = async (event: any) => {
        if (scanLock) {
            return;
        }

        const _QR = event.nativeEvent.codeStringValue;

        const decodedQRState: {
            decodedInvoice: any;
            isOnchain: boolean | null;
        } = await handleInvalidInvoice(_QR);

        if (decodedQRState.decodedInvoice) {
            // To highlight the successful scan, we'll trigger a success haptic
            RNHapticFeedback.trigger('impactLight', RNHapticFeedbackOptions);

            if (decodedQRState.isOnchain) {
                const amount = decodedQRState.decodedInvoice.options.amount;

                if (amount) {
                    // Route to Fee screen with amount (onChain)
                    // Update amount to sats

                    // If Onchain
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
                // If LN Invoice
                // call on breez to attempt to pay and route screen
                try {
                    const parsedBolt11Invoice = decodedQRState.decodedInvoice;
                    const bolt11Msat = parsedBolt11Invoice.amountMsat;

                    if (!bolt11Msat) {
                        Toast.show({
                            topOffset: 54,
                            type: 'Liberal',
                            text1: t('Scanner'),
                            text2: e('missing_bolt11_invoice_amount'),
                        });
                        return;
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
                } catch (err: any) {
                    Toast.show({
                        topOffset: 54,
                        type: 'Liberal',
                        text1: t('Scanner'),
                        text2: e('lightning_not_support'),
                    });
                    return;
                }
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

        const {decodedInvoice, isOnchain} = await handleInvalidInvoice(
            clipboardData,
        );

        if (decodedInvoice) {
            // To highlight the successful scan, we'll trigger a success haptic
            RNHapticFeedback.trigger(
                'notificationSuccess',
                RNHapticFeedbackOptions,
            );

            // Lightning handling
            if (!isOnchain) {
                // call on breez to attempt to pay and route screen
                const parsedBolt11Invoice = decodedInvoice;
                const bolt11Msat = parsedBolt11Invoice.amountMsat;

                if (!bolt11Msat) {
                    Toast.show({
                        topOffset: 54,
                        type: 'Liberal',
                        text1: t('Scanner'),
                        text2: e('missing_bolt11_invoice_amount'),
                    });
                    return;
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
            } else {
                // BTC handling
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
                                source: 'conservative',
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
                                isLightning: false,
                                source: 'conserative',
                            },
                        }),
                    );
                }
            }
        }
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
                        {/* Scan description */}
                        {scannerAlertMsg && (
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
                        )}

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
                                onReadCode={onQRDetected}
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
