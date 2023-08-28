/* eslint-disable react-native/no-inline-styles */
import React, {useContext, useState} from 'react';

import {StyleSheet, Text, View, useColorScheme} from 'react-native';

import {CommonActions} from '@react-navigation/native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import RNHapticFeedback from 'react-native-haptic-feedback';

import {RNHapticFeedbackOptions} from '../../constants/Haptic';

import {getBlockHeight} from '../../modules/bdk';

import {TextSingleInput} from '../../components/input';

import {useTailwind} from 'tailwind-rn';

import {AppStorageContext} from '../../class/storageContext';

import {PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

const Network = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const HeadingBar = {
        height: 2,
        backgroundColor: ColorScheme.HeadingBar,
    };

    const {electrumServerURL, setElectrumServerURL} =
        useContext(AppStorageContext);

    const [url, setURL] = useState('');
    const [status, setStatus] = useState(true);

    const updateURL = (text: string) => {
        if (text.length === 0) {
            clearURL();
        }

        setURL(text.trim());
    };

    const clearURL = () => {
        setURL('');
    };

    const onBlur = () => {
        const valueWithSingleWhitespace = url.replace(
            /^\s+|\s+$|\s+(?=\s)/g,
            '',
        );

        setURL(valueWithSingleWhitespace);

        return valueWithSingleWhitespace;
    };

    // Attempt to periodically connect to Electrum server
    useEffect(() => {
        const intervalCheck = setInterval(() => {
            getBlockHeight(
                electrumServerURL.bitcoin,
                (args: {status: boolean; blockHeight: number}) => {
                    console.log('[electrum] status: ', args.status);
                    setStatus(args.status);
                },
            );
        }, 1000 * 15);

        return () => {
            clearInterval(intervalCheck);
        };
    }, []);

    return (
        <SafeAreaView>
            <View
                style={[
                    tailwind('w-full h-full'),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <View
                    style={[
                        tailwind('w-full h-full mt-4 items-center'),
                        styles.Flexed,
                    ]}>
                    <View style={tailwind('w-5/6 mb-16')}>
                        <PlainButton
                            style={tailwind('items-center flex-row -ml-1')}
                            onPress={() => {
                                navigation.dispatch(CommonActions.goBack());
                            }}>
                            <Back
                                style={tailwind('mr-2')}
                                fill={ColorScheme.SVG.Default}
                            />
                            <Text
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                Settings
                            </Text>
                        </PlainButton>
                    </View>

                    <View
                        style={tailwind('justify-center w-full items-center')}>
                        <Text
                            style={[
                                tailwind('text-2xl mb-4 w-5/6 font-medium'),
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            Network
                        </Text>

                        <View style={[tailwind('w-full'), HeadingBar]} />
                    </View>

                    {/* Set Custom Electrum server */}
                    <View
                        style={tailwind(
                            'justify-center w-full items-center flex-row mt-8 mb-2',
                        )}>
                        <View style={tailwind('w-5/6')}>
                            <View
                                style={tailwind(
                                    'w-full flex-row items-center mb-2',
                                )}>
                                <Text
                                    style={[
                                        tailwind('text-sm font-medium mr-4'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    Electrum Server
                                </Text>

                                <View
                                    style={[
                                        tailwind('rounded-full'),
                                        {
                                            backgroundColor: status
                                                ? 'lightgreen'
                                                : '#ff4e4a',
                                        },
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind(
                                                'text-xs font-bold p-1 px-4',
                                            ),
                                            {
                                                color: status
                                                    ? 'darkgreen'
                                                    : 'black',
                                            },
                                        ]}>
                                        {status ? 'Connected' : 'Disconnected'}
                                    </Text>
                                </View>
                            </View>

                            <Text
                                style={[
                                    tailwind('text-sm mb-2 italic'),
                                    {color: ColorScheme.Text.GrayText},
                                ]}>
                                {`${electrumServerURL.bitcoin}`}
                            </Text>
                        </View>
                    </View>

                    {/* Set Custom Electrum server */}
                    <View
                        style={tailwind(
                            'justify-center w-full items-center flex-row mt-4',
                        )}>
                        <View style={tailwind('w-5/6')}>
                            <View
                                style={tailwind(
                                    'w-full flex-row items-center mb-4',
                                )}>
                                <Text
                                    style={[
                                        tailwind('text-sm font-medium mr-4'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    Custom Electrum Server
                                </Text>

                                {/* Save button */}
                                <PlainButton
                                    disabled={url.length === 0}
                                    style={[
                                        tailwind(
                                            `p-1 px-4 rounded ${
                                                url.length === 0
                                                    ? 'opacity-40'
                                                    : ''
                                            }`,
                                        ),
                                        {
                                            backgroundColor:
                                                ColorScheme.Background.Greyed,
                                        },
                                    ]}
                                    onPress={() => {
                                        const server = url;

                                        clearURL();

                                        setElectrumServerURL(server);

                                        RNHapticFeedback.trigger(
                                            'impactLight',
                                            RNHapticFeedbackOptions,
                                        );
                                    }}>
                                    <Text
                                        style={[
                                            tailwind('text-xs font-bold'),
                                            {color: ColorScheme.Text.Default},
                                        ]}>
                                        Save
                                    </Text>
                                </PlainButton>
                            </View>

                            {/* Input */}
                            <View
                                style={[
                                    tailwind('w-full px-2 mb-4'),
                                    {
                                        borderWidth: 1,
                                        borderRadius: 6,
                                        borderColor:
                                            url.length === 0
                                                ? ColorScheme.Background.Greyed
                                                : 'grey',
                                    },
                                ]}>
                                <TextSingleInput
                                    value={url}
                                    placeholder="ssl://..."
                                    placeholderTextColor={
                                        ColorScheme.Text.GrayedText
                                    }
                                    isEnabled={true}
                                    color={ColorScheme.Text.Default}
                                    onChangeText={updateURL}
                                    onBlur={onBlur}
                                />
                            </View>

                            <Text
                                style={[
                                    tailwind('text-xs'),
                                    {color: ColorScheme.Text.GrayedText},
                                ]}>
                                <Text
                                    style={[
                                        tailwind('text-xs'),
                                        {color: ColorScheme.Text.DescText},
                                    ]}>
                                    Warning:
                                </Text>{' '}
                                using a public server makes all your
                                transactions visible to them.
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Network;

const styles = StyleSheet.create({
    PaddedTop: {
        paddingTop: 16,
    },
    Flexed: {
        flex: 1,
    },
});
