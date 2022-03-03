import React from 'react';

import {TouchableOpacity, View, Text} from 'react-native';

import tailwind from 'tailwind-rn';

import NativeWindowMetrics from '../constants/NativeWindowMetrics';

export const PlainButton = props => {
    return <TouchableOpacity {...props} />;
};

export const PaddedButton = props => {
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

export const LongBottomButton = props => {
    return (
        <TouchableOpacity
            {...props}
            style={[
                tailwind('w-5/6 absolute rounded'),
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
