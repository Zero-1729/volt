import React, {useEffect, useState} from 'react';

import {Text, View, StyleSheet, useColorScheme} from 'react-native';
import {useNavigation, useIsFocused} from '@react-navigation/native';

import {useCameraDevices, Camera} from 'react-native-vision-camera';

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
                backgroundColor={ColorScheme.Background.Inverted}
                textColor={ColorScheme.Text.Alt}
                title={'Open Settings'}
            />
        </SafeAreaView>
    );
};

const Scan = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [grantedPermission, setGrantedPermission] = useState(false);

    useEffect(() => {
        (async () => {
            // Update value with actual device system state
            await Camera.requestCameraPermission().then(arg => {
                setGrantedPermission(arg === 'authorized');
            });
        })();
    }, [grantedPermission]);

    // Note, IOS simulator does not support the camera,
    // so you need a physical device to test.
    const devices = useCameraDevices();
    const camera = devices.back;

    const isFocused = useIsFocused();
    const navigation = useNavigation();

    const closeScreen = () => {
        // TODO: future proof navigation; return to screen that called this.
        navigation.goBack();
    };

    // Display loading view if loading, camera is not ready,
    // or if permission is not granted.
    if (!grantedPermission) {
        return <RequestPermView />;
    }

    if (isLoading || camera === undefined) {
        return <LoadingView props={camera} />;
    }

    return (
        <SafeAreaView>
            <View>
                <PlainButton
                    onPress={closeScreen}
                    style={[tailwind('absolute right-8 top-8')]}>
                    <Close fill={'white'} />
                </PlainButton>
                <Camera device={camera} isActive={isFocused} />
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
