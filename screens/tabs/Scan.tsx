/* eslint-disable react-hooks/exhaustive-deps */
import React, {useCallback, useEffect, useState} from 'react';

import {Text, View, StyleSheet, useColorScheme, Linking} from 'react-native';
import {useIsFocused, CommonActions} from '@react-navigation/native';

import {runOnJS} from 'react-native-reanimated';

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

import {LongButton, PlainButton} from '../../components/button';

import Close from '../../assets/svg/x-circle-fill-24.svg';
import Color from '../../constants/Color';

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
        </SafeAreaView>
    );
};

const openSettings = () => {
    Linking.openSettings();
};

const Scan = ({navigation, route}) => {
    const isFocused = useIsFocused();

    const tailwind = useTailwind();

    const RNHapticFeedbackOptions = {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
    };

    // Assume Camera loading until we know otherwise
    // If unavailable, we'll show a message
    // Else, we'll cut it out and let Camera View take over
    const [isLoading, setIsLoading] = useState(true);
    const [grantedPermission, setGrantedPermission] =
        useState<CameraPermissionStatus>('not-determined');
    const [isCamAvailable, setCamAvailable] = useState<boolean | null>(null);

    const onError = useCallback(async (error: CameraRuntimeError) => {
        // TODO: Push to handle in UI, maybe as modal or something similar
        console.error(
            `[Scanner] Camera Error: (${error.code}) ${error.message}`,
        );
    }, []);

    const onQRDetected = useCallback(async (data: Barcode[]) => {
        // TODO: Handle only first item detected
        for (let qr of data) {
            console.info(`[Scanner] Detected QR Raw Data: ${qr.rawValue}`);
        }

        // To highlight the successful scan, we'll trigger a success haptic
        RNHapticFeedback.trigger(
            'notificationSuccess',
            RNHapticFeedbackOptions,
        );

        // Head back home after attempted scan
        // TODO: Gracefully return with scanned data
        // Ideally, we'd head to a wallet screen with scanned data
        runOnJS(navigation.dispatch)(
            CommonActions.navigate({
                name: 'HomeScreen',
                params: {QR: data},
            }),
        );
    }, []);

    const closeScreen = () => {
        // If from Wallet, go back to Wallet
        if (route.params?.key === 'Wallet') {
            navigation.dispatch(
                CommonActions.navigate('WalletRoot', {screen: 'WalletView'}),
            );
        } else {
            // Otherwise, go back to Home
            navigation.dispatch(CommonActions.goBack());
        }
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

            const digestedFrame = scanBarcodes(frame, [BarcodeFormat.QR_CODE]);

            // Only attempt to handle QR if any detected in-frame
            if (digestedFrame.length > 0) {
                // Pass detected QR to processing function
                runOnJS(onQRDetected)(digestedFrame);
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

    // Display Camera view if camera available
    return (
        <SafeAreaView style={[styles.flexed]}>
            <View style={styles.flexed}>
                <Camera
                    style={[styles.flexed]}
                    device={camera}
                    isActive={isFocused}
                    frameProcessor={frameProcessor}
                    frameProcessorFps={1}
                    onError={onError}
                />
                <PlainButton
                    onPress={closeScreen}
                    style={[tailwind('absolute right-8 top-5 z-10')]}>
                    <Close fill={'white'} />
                </PlainButton>

                {/* TODO: Reduce focus frame to middle of screen */}
                {/* Screen header */}
                <View
                    style={[
                        tailwind(
                            'absolute top-0 h-16 w-full bg-black opacity-70 items-center justify-center',
                        ),
                        styles.flexed,
                    ]}>
                    <Text style={[tailwind('text-lg text-white')]}>
                        Scan QR
                    </Text>
                </View>

                {/* Screen footer */}
                <View
                    style={[
                        tailwind(
                            'absolute bottom-0 h-28 w-full bg-black opacity-70',
                        ),
                    ]}
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
