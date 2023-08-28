import React from 'react';

import {TouchableOpacity, View, Text} from 'react-native';

import {useTailwind} from 'tailwind-rn';

import NativeWindowMetrics from '../constants/NativeWindowMetrics';

import {BaseProps, ButtonProps} from '../types/props';

export const PlainButton = (props: BaseProps) => {
    return <TouchableOpacity activeOpacity={props.activeOpacity} {...props} />;
};

export const Button = (props: ButtonProps) => {
    const tailwind = useTailwind();

    return (
        <TouchableOpacity style={tailwind('items-center flex-row')} {...props}>
            <View
                style={[
                    tailwind('px-4 py-2 w-2/6 rounded mb-6 mt-4 items-center'),
                    {
                        backgroundColor: props.backgroundColor,
                    },
                ]}>
                <Text
                    style={[
                        tailwind('text-xs font-medium'),
                        {color: props.color},
                    ]}>
                    {props.title}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export const LongButton = (props: ButtonProps) => {
    const tailwind = useTailwind();

    return (
        <TouchableOpacity
            {...props}
            style={[
                tailwind('w-full rounded-full items-center'),
                {
                    backgroundColor: props.backgroundColor,
                },
            ]}>
            <View style={[tailwind('w-full self-center items-center')]}>
                <Text
                    style={[
                        tailwind('px-4 py-4 font-medium'),
                        {
                            color: props.textColor,
                        },
                    ]}>
                    {props.title}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export const LongBottomButton = (props: ButtonProps) => {
    const tailwind = useTailwind();

    return (
        <TouchableOpacity
            {...props}
            style={[
                tailwind(
                    `w-5/6 absolute rounded-full ${
                        props.disabled ? 'opacity-20' : ''
                    }`,
                ),
                {
                    bottom: NativeWindowMetrics.bottomButtonOffset,
                    backgroundColor: props.backgroundColor,
                },
            ]}>
            <View style={[tailwind('w-full self-center items-center')]}>
                <Text
                    style={[
                        tailwind('px-4 py-4 font-bold'),
                        {
                            color: props.textColor,
                        },
                    ]}>
                    {props.title}
                </Text>
            </View>
        </TouchableOpacity>
    );
};
