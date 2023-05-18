import {StyleSheet, Text, View, useColorScheme} from 'react-native';
import React, {useContext} from 'react';

import {useNavigation, CommonActions} from '@react-navigation/native';

import {useTailwind} from 'tailwind-rn';

import {PlainButton, Button} from './button';

import {AppStorageContext} from '../class/storageContext';

import {Balance} from './balance';

import {WalletCardProps} from '../types/props';

import Font from '../constants/Font';
import Color from '../constants/Color';

import {WalletTypeNames} from '../modules/wallet-utils';

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

                <Button
                    style={[tailwind('absolute bottom-0 left-6 w-full')]}
                    onPress={() => {
                        navigation.dispatch(
                            CommonActions.navigate({name: 'AddWalletRoot'}),
                        );
                    }}
                    title={'Add'}
                    color={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                />
            </View>
        </View>
    );
};

export const WalletCard = (props: WalletCardProps) => {
    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {isAdvancedMode} = useContext(AppStorageContext);

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
                                `pt-4 ${
                                    props.isWatchOnly ? '' : 'mt-1'
                                } text-2xl w-full text-left font-medium text-white`,
                            ),
                            Font.RobotoText,
                        ]}>
                        {props.label}
                    </Text>

                    <View
                        style={[
                            tailwind(
                                'bg-black absolute left-6 top-14 rounded-sm opacity-50',
                            ),
                        ]}>
                        <Text
                            style={[
                                tailwind(
                                    'text-xs text-white font-bold px-2 py-1',
                                ),
                                Font.RobotoText,
                            ]}>
                            {`${WalletTypeNames[props.walletType][0]}${
                                isAdvancedMode
                                    ? ' (' +
                                      WalletTypeNames[props.walletType][1] +
                                      ')'
                                    : ''
                            }`}
                        </Text>
                    </View>

                    {/* Balance */}
                    <View
                        style={tailwind(
                            `w-full absolute mx-6 ${
                                props.isWatchOnly ? 'bottom-9' : 'bottom-6'
                            }`,
                        )}>
                        <Balance
                            id={props.id}
                            BalanceFontSize={'text-3xl'}
                            disableFiat={true}
                            loading={props.loading}
                        />
                    </View>

                    {props.isWatchOnly ? (
                        <View
                            style={[
                                tailwind(
                                    'left-0 bg-white w-full py-1 rounded-bl-md rounded-tr-sm absolute bottom-0 self-center opacity-60',
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind(
                                        'text-xs self-end pr-4 font-medium text-black',
                                    ),
                                    Font.RobotoText,
                                ]}>
                                Watch-only
                            </Text>
                        </View>
                    ) : (
                        <></>
                    )}
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
