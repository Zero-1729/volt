/* eslint-disable no-lone-blocks */
import React from 'react';

import {View, useColorScheme, Platform} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {CommonActions, useNavigation} from '@react-navigation/native';

import {useTailwind} from 'tailwind-rn';

import Color from '../constants/Color';

import {PlainButton} from '../components/button';

import WindowMetrics from '../constants/NativeWindowMetrics';

import FingerPrint from '../assets/svg/touch-id-24.svg';
import FaceId from '../assets/svg/face-id-24.svg';
import AppIcon from '../assets/svg/volt-text.svg';

const Lock = () => {
    const ColorScheme = Color(useColorScheme());
    const BottomOffset = WindowMetrics.navBottom + 20;

    const tailwind = useTailwind();

    const navigation = useNavigation();

    const OpenApp = () => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{name: 'HomeScreen'}],
            }),
        );
    };

    {
        /* TODO: Switch to pin code as fallback */
    }
    return (
        <SafeAreaView>
            <View style={[tailwind('w-full h-full justify-center')]}>
                <AppIcon
                    style={[tailwind('self-center')]}
                    width={128}
                    fill={ColorScheme.SVG.Default}
                />
                <View
                    style={[
                        tailwind('absolute self-center items-center'),
                        {bottom: BottomOffset},
                    ]}>
                    {Platform.OS === 'android' ? (
                        <PlainButton onPress={OpenApp}>
                            <FingerPrint
                                style={[tailwind('mb-4')]}
                                fill={ColorScheme.SVG.Default}
                                width={64}
                            />
                        </PlainButton>
                    ) : (
                        <PlainButton onPress={OpenApp}>
                            <FaceId
                                style={[tailwind('mb-4')]}
                                fill={ColorScheme.SVG.Default}
                                width={64}
                            />
                        </PlainButton>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Lock;
