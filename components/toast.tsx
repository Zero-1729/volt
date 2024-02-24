/* eslint-disable react-native/no-inline-styles */
import React, {ReactElement} from 'react';
import {View, useColorScheme} from 'react-native';
import VText from './text';
import {
    BaseToast,
    ErrorToast,
    ToastProps,
    InfoToast,
} from 'react-native-toast-message';

import Color from '../constants/Color';
import {useTailwind} from 'tailwind-rn';

export const toastConfig = {
    success: (props: ToastProps) => <BaseToast {...props} />,
    error: (props: ToastProps) => <ErrorToast {...props} />,
    info: (props: ToastProps) => <InfoToast {...props} />,
    Liberal: ({text1, text2}: {text1: string; text2: string}): ReactElement => {
        const colorScheme = Color(useColorScheme());
        const tailwind = useTailwind();

        return (
            <View
                style={[
                    tailwind('rounded px-4 justify-center'),
                    {
                        height: 80,
                        width: '92%',
                        backgroundColor: colorScheme.Background.Secondary,
                    },
                ]}>
                <VText
                    style={[
                        tailwind('text-base font-bold'),
                        {color: colorScheme.Text.Default},
                    ]}>
                    {text1}
                </VText>
                <VText
                    numberOfLines={2}
                    style={[
                        tailwind('text-sm'),
                        {color: colorScheme.Text.DescText},
                    ]}>
                    {text2}
                </VText>
            </View>
        );
    },
};
