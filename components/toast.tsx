/* eslint-disable react-native/no-inline-styles */
import React, {ReactElement} from 'react';
import {View, useColorScheme} from 'react-native';
import VText, {VTextMulti, VTextDouble} from './text';

import Color from '../constants/Color';

import {toast, resolveValue, Toast as ToastT, ToastOptions} from '@backpackapp-io/react-native-toast';

import NativeWindowMetrics from '../constants/NativeWindowMetrics';

export const LiberalCustomToast = (t: ToastT): ReactElement => {
    const colorScheme = Color(useColorScheme());

    const rawToastMessage = resolveValue(t.message, t) as string;
    const toastMessages = JSON.parse(rawToastMessage);

    const isBreezError = toastMessages.text2.includes('(Greenlight)');

    return (
        <View
            className="rounded px-4 justify-center"
            style={{
                        height: isBreezError ? 120 : 80,
                        width: NativeWindowMetrics.width * 0.92,
                        backgroundColor: colorScheme.Background.Secondary,
                        margin: 0,
                        padding: 0,
                        top: 0,
                    }}>
                <VText
                    className="text-base font-bold"
                    style={{color: colorScheme.Text.Default}}>
                    {toastMessages.text1}
                </VText>
                {isBreezError ? (
                    <VTextMulti
                        className="text-sm"
                        style={{color: colorScheme.Text.DescText}}>
                        {toastMessages.text2}
                    </VTextMulti>
                ) : (
                    <VTextDouble
                        className="text-sm"
                        style={{color: colorScheme.Text.DescText}}>
                    {toastMessages.text2}
                </VTextDouble>
            )}
        </View>
    );
};

export const LiberalToast = (msg: string, sub: string, toastProps: ToastOptions) => {
    return toast(JSON.stringify({text1: msg, text2: sub}), {
        ...toastProps,
        isSwipeable: true,
        customToast: LiberalCustomToast,
    });
};
