import {StyleSheet, Text, View, useColorScheme} from 'react-native';
import React from 'react';

import {useNavigation, CommonActions} from '@react-navigation/native';

import {useTailwind} from 'tailwind-rn';

import {PlainButton} from './button';

import {Balance} from './balance';

import {WalletCardProps} from '../types/props';

import Font from '../constants/Font';
import Color from '../constants/Color';

export const EmptyCard = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const altGray = {
        backgroundColor: ColorScheme.isDarkMode ? '#2C2C2C' : '#ededed',
    };

    return (
        <View style={tailwind('w-full h-48 relative items-center')}>
            <View
                style={[
                    tailwind(
                        'w-11/12 h-full absolute -bottom-2 rounded-md z-20 opacity-60',
                    ),
                    styles.DarkGrayCard,
                ]}
            />

            <View
                style={[tailwind('w-full h-48 p-6 rounded-md z-30'), altGray]}>
                <Text
                    style={[
                        tailwind('text-lg w-full text-left mb-2 font-medium'),
                        {color: ColorScheme.Text.Default},
                        Font.RobotoText,
                    ]}>
                    Add new wallet
                </Text>
                <Text
                    style={[
                        tailwind('text-xs w-full text-left'),
                        {color: ColorScheme.Text.DescText},
                        Font.RobotoText,
                    ]}>
                    Click the 'add' button to create a new wallet
                </Text>

                <PlainButton
                    style={[
                        tailwind(
                            'absolute bottom-6 left-6 px-8 py-2 rounded-full',
                        ),
                        {
                            backgroundColor: ColorScheme.Background.Inverted,
                        },
                    ]}
                    onPress={() => {
                        navigation.dispatch(
                            CommonActions.navigate({name: 'AddWalletRoot'}),
                        );
                    }}>
                    <Text
                        style={[
                            tailwind('text-xs font-bold'),
                            {color: ColorScheme.Text.Alt},
                            Font.RobotoText,
                        ]}>
                        Add
                    </Text>
                </PlainButton>
            </View>
        </View>
    );
};

export const WalletCard = (props: WalletCardProps) => {
    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    return (
        <PlainButton
            onPress={() => {
                if (props.navCallback) {
                    props.navCallback();
                }
            }}
            activeOpacity={1}>
            <View style={tailwind('w-full h-48 relative items-center')}>
                <View
                    style={[
                        tailwind('w-full h-48 rounded-md z-50 px-6'),
                        {
                            backgroundColor:
                                ColorScheme.WalletColors[props.walletType],
                        },
                    ]}>
                    <Text
                        numberOfLines={1}
                        ellipsizeMode="middle"
                        style={[
                            tailwind(
                                'pt-4 mt-1 text-xl w-full text-left font-medium text-white',
                            ),
                            Font.RobotoText,
                        ]}>
                        {props.label}
                    </Text>

                    {props.isWatchOnly ? (
                        <View
                            style={[
                                tailwind(
                                    'bg-black absolute left-6 top-14 rounded-full opacity-50',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind(
                                        'text-xs text-white font-bold px-4 py-1',
                                    ),
                                    Font.RobotoText,
                                ]}>
                                {`${props.isWatchOnly ? 'Watch only' : ''}`}
                            </Text>
                        </View>
                    ) : (
                        <></>
                    )}

                    {/* Balance */}
                    <View style={tailwind('w-full absolute mx-6 bottom-5')}>
                        <Balance
                            id={props.id}
                            BalanceFontSize={'text-2xl'}
                            disableFiat={true}
                            loading={props.loading}
                        />
                    </View>
                </View>
            </View>
        </PlainButton>
    );
};

const styles = StyleSheet.create({
    DarkGrayCard: {
        backgroundColor: '#B5B5B5',
    },
});
