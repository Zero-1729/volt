import React, {useCallback, useEffect, useState} from 'react';

import {Text, View, StyleSheet, useColorScheme, Linking} from 'react-native';
import {useNavigation, useIsFocused} from '@react-navigation/native';

import {
    useCameraDevices,
    Camera,
    CameraPermissionStatus,
    useFrameProcessor,
} from 'react-native-vision-camera';

import {SafeAreaView} from 'react-native-safe-area-context';

import tailwind from 'tailwind-rn';

import {LongButton, PlainButton} from '../components/button';

import Close from './../assets/svg/x-circle-fill-24.svg';
import Color from '../constants/Color';

const LoadingView = (props: any) => {
    const ColorScheme = Color(useColorScheme());

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
                {!props.camera ? 'Camera is not available' : 'Loading...'}
            </Text>
        </SafeAreaView>
    );
};

const RequestPermView = () => {
    const ColorScheme = Color(useColorScheme());

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

const Scan = () => {
    const isFocused = useIsFocused();
    const navigation = useNavigation();

    const [isLoading, setIsLoading] = useState(false);
    const [grantedPermission, setGrantedPermission] =
        useState<CameraPermissionStatus>('not-determined');

    const closeScreen = () => {
        // TODO: future proof navigation; return to screen that called this.
        navigation.goBack();
    };

    // Update permission state when permission changes.
    const updatePermissions = useCallback(async () => {
        const status = await Camera.requestCameraPermission();

        setGrantedPermission(status);
    }, []);

    // Note, IOS simulator does not support the camera,
    // so you need a physical device to test.
    const devices = useCameraDevices();
    const camera = devices.back;

    useEffect(() => {
        if (grantedPermission === 'not-determined') {
            updatePermissions();
        }
    }, [grantedPermission, updatePermissions]);

    const frameProcessor = useFrameProcessor(frame => {
        'worklet';

        // TODO: Scan frame for QR Code
        console.log('frame: ', frame);
    }, []);

    // Display if permission is not granted,
    // then, request permission if not determined.
    if (grantedPermission === 'denied') {
        return <RequestPermView />;
    }

    // Display loading or camera unavailable; handle differently
    if (isLoading || camera === undefined) {
        return <LoadingView props={camera} />;
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
                />
                <PlainButton
                    onPress={closeScreen}
                    style={[tailwind('absolute right-8 top-8')]}>
                    <Close fill={'white'} />
                </PlainButton>
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
