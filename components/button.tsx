import React from 'react';

import {TouchableOpacity, View, Text} from 'react-native';

import NativeWindowMetrics from '../constants/NativeWindowMetrics';

import {BaseProps, ButtonProps} from '../types/props';

export const PlainButton = (props: BaseProps) => {
    return <TouchableOpacity activeOpacity={props.activeOpacity} {...props} />;
};

export const Button = (props: ButtonProps) => {
    return (
        <TouchableOpacity className="items-center flex-row" {...props}>
            <View
                className="px-4 py-2 w-2/6 rounded mb-6 mt-4 items-center"
                style={{
                        backgroundColor: props.backgroundColor,
                    }}>
                <Text
                    className="text-xs font-medium"
                    style={{color: props.color}}>
                    {props.title}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export const LongButton = (props: ButtonProps) => {
    return (
        <TouchableOpacity
            {...props}
            className="w-full rounded-full items-center"
            style={{
                    backgroundColor: props.backgroundColor,
            }}>
            <View className="w-full self-center items-center">
                <Text
                    className="px-4 py-4 font-bold"
                    style={{
                            color: props.textColor,
                        }}>
                    {props.title}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export const LongBottomButton = (props: ButtonProps) => {
    return (
        <TouchableOpacity
            {...props}
            className="w-5/6 absolute rounded-full"
            // eslint-disable-next-line react-native/no-inline-styles
            style={{
                    bottom: NativeWindowMetrics.bottomButtonOffset,
                    backgroundColor: props.backgroundColor,
                    opacity: props.disabled ? 0.2 : 1,
                }}>
            <View className="w-full self-center items-center">
                <Text
                    className="px-4 py-4 font-bold"
                    style={{
                            color: props.textColor,
                        }}>
                    {props.title}
                </Text>
            </View>
        </TouchableOpacity>
    );
};
