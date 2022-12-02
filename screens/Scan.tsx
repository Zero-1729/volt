import React, {SetStateAction, useState} from 'react';

import {Text, View, StyleSheet} from 'react-native';
import {
    useNavigation,
    useIsFocused,
    CommonActions,
} from '@react-navigation/native';
import {RNCamera} from 'react-native-camera';
import {SafeAreaView} from 'react-native-safe-area-context';

import tailwind from 'tailwind-rn';

import {PlainButton} from '../components/button';

import Close from './../assets/svg/x-circle-fill-24.svg';

const Scan = () => {
    const [camStatus, setCamStatus] = useState(
        RNCamera.Constants.CameraStatus.PENDING_AUTHORIZATION,
    );
    const [isLoading, setIsLoading] = useState(false);
    const isFocused = useIsFocused();
    const navigation = useNavigation();

    interface CamEventType extends Event {
        camStatus: SetStateAction<RNCamera.Constants.CameraStatus>;
    }

    const handleCameraStatChange = (event: CamEventType) => {
        setCamStatus(event.camStatus);
    };

    const onQRCodeRead = (qr: {data: string}) => {
        setIsLoading(true);
        // We are simply interested in the following props 'data', 'rawData', and 'type' (i.e. 'QR_CODE')
        // TODO: handle actual decoding logic here; return to screen that called this.
        setIsLoading(false);

        navigation.dispatch(CommonActions.navigate({name: 'Home'}));
    };

    const closeScreen = () => {
        // TODO: future proof navigation; return to screen that called this.
        navigation.goBack();
    };

    return isLoading ? (
        <SafeAreaView style={[styles.flexed, tailwind('bg-white')]}>
            <Text>Loading</Text>
        </SafeAreaView>
    ) : (
        <SafeAreaView style={styles.flexed}>
            <View style={styles.flexed}>
                {(isFocused && camStatus) !==
                    RNCamera.Constants.CameraStatus.NOT_AUTHORIZED && (
                    <RNCamera
                        autoFocus={'on'}
                        captureAudio={false}
                        androidCameraPermissionOptions={{
                            title: 'Bitcoin QR Scan',
                            message:
                                'You need to enable camera permissions to scan QR Code',
                            buttonPositive: 'Ok',
                            buttonNegative: 'Cancel',
                        }}
                        style={styles.flexed}
                        onBarCodeRead={onQRCodeRead}
                        barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
                        onStatusChange={handleCameraStatChange}
                    />
                )}
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
