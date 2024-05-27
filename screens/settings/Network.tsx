/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useContext, useEffect, useState} from 'react';

import {StyleSheet, View, useColorScheme} from 'react-native';

import VText from '../../components/text';

import {CommonActions} from '@react-navigation/native';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import RNHapticFeedback from 'react-native-haptic-feedback';

import {RNHapticFeedbackOptions} from '../../constants/Haptic';

import {useTranslation} from 'react-i18next';

import {getBlockHeight} from '../../modules/bdk';

import {TextSingleInput} from '../../components/input';

import {useTailwind} from 'tailwind-rn';

import {AppStorageContext} from '../../class/storageContext';

import {PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

import {useNetInfo} from '@react-native-community/netinfo';
import {nodeInfo} from '@breeztech/react-native-breez-sdk';

import {capitalizeFirst} from '../../modules/transform';
import {checkNetworkIsReachable} from '../../modules/wallet-utils';

const Network = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {t, i18n} = useTranslation('settings');
    const {t: e} = useTranslation('errors');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const netInfo = useNetInfo();
    const isNetOn = checkNetworkIsReachable(netInfo);
    const [breezConnected, setBreezConnected] = useState(isNetOn);

    const HeadingBar = {
        height: 2,
        backgroundColor: ColorScheme.HeadingBar,
    };

    const {electrumServerURL, setElectrumServerURL, mempoolInfo} =
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

    const checkBreezServices = useCallback(async () => {
        try {
            await nodeInfo();
            setBreezConnected(true);
        } catch (error: any) {
            setBreezConnected(false);
        }
    }, []);

    // Attempt to periodically connect to Electrum server
    useEffect(() => {
        const intervalCheck = setInterval(() => {
            getBlockHeight(
                electrumServerURL.bitcoin,
                (args: {status: boolean; blockHeight: number}) => {
                    console.log(
                        `[Electrum Server] Status: ${
                            args.status ? 'Connected' : 'Disconnected'
                        }`,
                    );
                    setStatus(args.status);
                },
            );
        }, 1000 * 15);

        checkBreezServices();

        return () => {
            clearInterval(intervalCheck);
        };
    }, []);

    useEffect(() => {
        checkBreezServices();
    }, [isNetOn]);

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
                        styles.flexed,
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
                            <VText
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {capitalizeFirst(t('settings'))}
                            </VText>
                        </PlainButton>
                    </View>

                    <View
                        style={tailwind('justify-center w-full items-center')}>
                        <VText
                            style={[
                                tailwind('text-2xl mb-4 w-5/6 font-medium'),
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            {capitalizeFirst(t('network'))}
                        </VText>

                        <View style={[tailwind('w-full'), HeadingBar]} />
                    </View>

                    {/* Breez */}
                    <View
                        style={tailwind(
                            'justify-center w-full items-center flex-row mt-8 mb-8',
                        )}>
                        <View style={tailwind('w-5/6')}>
                            <View
                                style={tailwind(
                                    `w-full ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } items-center mb-4`,
                                )}>
                                <VText
                                    style={[
                                        tailwind(
                                            `text-sm font-medium ${
                                                langDir === 'right'
                                                    ? ''
                                                    : 'mr-4'
                                            }`,
                                        ),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    Breez SDK
                                </VText>

                                <View
                                    style={[
                                        tailwind(
                                            `rounded-full ${
                                                langDir === 'right'
                                                    ? 'mr-2'
                                                    : ''
                                            }`,
                                        ),
                                        {
                                            backgroundColor:
                                                isNetOn && breezConnected
                                                    ? 'lightgreen'
                                                    : '#ff4e4a',
                                        },
                                    ]}>
                                    <VText
                                        style={[
                                            tailwind(
                                                'text-xs font-bold p-1 px-4',
                                            ),
                                            {
                                                color:
                                                    isNetOn && breezConnected
                                                        ? 'darkgreen'
                                                        : 'black',
                                            },
                                        ]}>
                                        {isNetOn && breezConnected
                                            ? capitalizeFirst(t('connected'))
                                            : capitalizeFirst(
                                                  t('disconnected'),
                                              )}
                                    </VText>
                                </View>
                            </View>

                            <VText
                                style={[
                                    tailwind('text-xs'),
                                    {color: ColorScheme.Text.DescText},
                                ]}>
                                {t('breez_sdk_info')}
                            </VText>
                        </View>
                    </View>

                    {/* Mempool */}
                    <View
                        style={tailwind(
                            'justify-center w-full items-center flex-row mb-8',
                        )}>
                        <View style={tailwind('w-5/6')}>
                            <View
                                style={tailwind(
                                    `w-full ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } items-center mb-4`,
                                )}>
                                <VText
                                    style={[
                                        tailwind(
                                            `text-sm font-medium ${
                                                langDir === 'right'
                                                    ? ''
                                                    : 'mr-4'
                                            }`,
                                        ),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    Mempool.space
                                </VText>

                                <View
                                    style={[
                                        tailwind(
                                            `rounded-full ${
                                                langDir === 'right'
                                                    ? 'mr-2'
                                                    : ''
                                            }`,
                                        ),
                                        {
                                            backgroundColor:
                                                isNetOn && mempoolInfo.connected
                                                    ? 'lightgreen'
                                                    : '#ff4e4a',
                                        },
                                    ]}>
                                    <VText
                                        style={[
                                            tailwind(
                                                'text-xs font-bold p-1 px-4',
                                            ),
                                            {
                                                color:
                                                    isNetOn &&
                                                    mempoolInfo.connected
                                                        ? 'darkgreen'
                                                        : 'black',
                                            },
                                        ]}>
                                        {isNetOn && mempoolInfo.connected
                                            ? capitalizeFirst(t('connected'))
                                            : capitalizeFirst(
                                                  t('disconnected'),
                                              )}
                                    </VText>
                                </View>
                            </View>

                            <VText
                                style={[
                                    tailwind('text-xs'),
                                    {color: ColorScheme.Text.DescText},
                                ]}>
                                {t('mempool_connection_info')}
                            </VText>
                        </View>
                    </View>

                    <View style={[tailwind('w-full mb-8'), HeadingBar]} />

                    {/* Electrum server */}
                    <View
                        style={tailwind(
                            'justify-center w-full items-center flex-row mb-2',
                        )}>
                        <View style={tailwind('w-5/6')}>
                            <View
                                style={tailwind(
                                    `w-full ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } items-center mb-2`,
                                )}>
                                <VText
                                    style={[
                                        tailwind(
                                            `text-sm font-medium ${
                                                langDir === 'right'
                                                    ? ''
                                                    : 'mr-4'
                                            }`,
                                        ),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    {t('electrum_server')}
                                </VText>

                                <View
                                    style={[
                                        tailwind(
                                            `rounded-full ${
                                                langDir === 'right'
                                                    ? 'mr-2'
                                                    : ''
                                            }`,
                                        ),
                                        {
                                            backgroundColor:
                                                isNetOn && status
                                                    ? 'lightgreen'
                                                    : '#ff4e4a',
                                        },
                                    ]}>
                                    <VText
                                        style={[
                                            tailwind(
                                                'text-xs font-bold p-1 px-4',
                                            ),
                                            {
                                                color:
                                                    isNetOn && status
                                                        ? 'darkgreen'
                                                        : 'black',
                                            },
                                        ]}>
                                        {isNetOn && status
                                            ? capitalizeFirst(t('connected'))
                                            : capitalizeFirst(
                                                  t('disconnected'),
                                              )}
                                    </VText>
                                </View>
                            </View>

                            <VText
                                style={[
                                    tailwind('text-sm mb-2 italic'),
                                    {color: ColorScheme.Text.DescText},
                                ]}>
                                {`${electrumServerURL.bitcoin}`}
                            </VText>
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
                                    `w-full ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } items-center mb-4`,
                                )}>
                                <VText
                                    style={[
                                        tailwind('text-sm font-medium mr-4'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    {t('custom_electrum_server')}
                                </VText>

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
                                    <VText
                                        style={[
                                            tailwind('text-xs font-bold'),
                                            {color: ColorScheme.Text.Default},
                                        ]}>
                                        {capitalizeFirst(t('save'))}
                                    </VText>
                                </PlainButton>
                            </View>

                            {/* Input */}
                            <View
                                style={[
                                    styles.inputContainer,
                                    tailwind('w-full px-2 mb-4'),
                                    {
                                        borderColor:
                                            url.length === 0
                                                ? ColorScheme.Background.Greyed
                                                : 'grey',
                                    },
                                ]}>
                                <TextSingleInput
                                    noTrans={true}
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

                            <VText
                                style={[
                                    tailwind('text-xs'),
                                    {color: ColorScheme.Text.GrayedText},
                                ]}>
                                <VText
                                    style={[
                                        tailwind('text-xs'),
                                        {color: ColorScheme.Text.DescText},
                                    ]}>
                                    {capitalizeFirst(t('warning'))}
                                    {':'}
                                </VText>{' '}
                                {e('default_testnet_warn')}
                            </VText>
                        </View>
                    </View>

                    {/* <View style={[tailwind(' mt-8 mb-8 w-full'), HeadingBar]} /> */}
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Network;

const styles = StyleSheet.create({
    flexed: {
        flex: 1,
    },
    inputContainer: {
        borderWidth: 1,
        borderRadius: 6,
    },
});
