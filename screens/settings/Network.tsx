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

import {AppStorageContext} from '../../class/storageContext';

import {PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

import {useNetInfo} from '@react-native-community/netinfo';
import {
    nodeInfo,
    serviceHealthCheck,
    HealthCheckStatus,
} from '@breeztech/react-native-breez-sdk';

import {capitalizeFirst} from '../../modules/transform';
import {checkNetworkIsReachable} from '../../modules/wallet-utils';
import {_BREEZ_SDK_API_KEY_} from '../../modules/env';

const Network = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const {t, i18n} = useTranslation('settings');
    const {t: e} = useTranslation('errors');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const netInfo = useNetInfo();
    const isNetOn = checkNetworkIsReachable(netInfo);
    const [breezConnected, setBreezConnected] = useState(isNetOn);
    const [breezAvailable, setBreezAvailable] = useState<HealthCheckStatus>(
        HealthCheckStatus.OPERATIONAL,
    );

    const checkStatusTrans = {
        operational: [capitalizeFirst(t('healthy')), 'white', 'dodgerblue'],
        maintenance: [capitalizeFirst(t('maintenance')), 'white', 'orange'],
        serviceDisruption: [
            capitalizeFirst(t('service_disruption')),
            'black',
            '#ff4e4a',
        ],
    };

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
            console.log('[Breez Connection]: ', error.message);
        }
    }, []);

    const checkBreezAvailability = useCallback(async () => {
        try {
            const response = await serviceHealthCheck(_BREEZ_SDK_API_KEY_);
            setBreezAvailable(response.status);
        } catch (error: any) {
            console.log('[Breez Health Check]: ', error.message);
        }
    }, []);

    const testElectrumService = useCallback(async () => {
        getBlockHeight(
            electrumServerURL.bitcoin,
            (args: {status: boolean; blockHeight: number}) => {
                setStatus(args.status);
            },
        );
    }, []);

    // Attempt to periodically connect to Electrum server
    useEffect(() => {
        const intervalCheck = setInterval(() => {
            testElectrumService();
        }, 1000 * 15);

        checkBreezServices();
        checkBreezAvailability();

        return () => {
            clearInterval(intervalCheck);
        };
    }, []);

    useEffect(() => {
        checkBreezServices();
        checkBreezAvailability();
        testElectrumService();
    }, [isNetOn]);

    return (
        <SafeAreaView>
            <View
                className="w-full h-full"
                style={{backgroundColor: ColorScheme.Background.Primary}}>
                <View
                    className="w-full h-full mt-4 items-center"
                    style={[
                        styles.flexed,
                    ]}>
                    <View className="w-5/6 mb-16">
                        <PlainButton
                            className="items-center flex-row -ml-1"
                            onPress={() => {
                                navigation.dispatch(CommonActions.goBack());
                            }}>
                            <Back
                                fill={ColorScheme.SVG.Default}
                            />
                            <VText
                                className="ml-2 text-sm font-medium"
                                style={[
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {capitalizeFirst(t('settings'))}
                            </VText>
                        </PlainButton>
                    </View>

                    <View
                        className="justify-center w-full items-center">
                        <VText
                            className="text-2xl mb-4 w-5/6 font-medium"
                            style={[
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            {capitalizeFirst(t('network'))}
                        </VText>

                        <View className="w-full" style={[HeadingBar]} />
                    </View>

                    {/* Breez */}
                    <View
                        className="justify-center w-full items-center flex-row mt-8 mb-8">
                        <View className="w-5/6">
                            <View
                                className={
                                    `w-full ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } items-center mb-4`}>
                                <VText
                                    className={
                                        `text-sm font-medium ${
                                            langDir === 'right'
                                                ? ''
                                                : 'mr-4'
                                        }`
                                    }
                                    style={{color: ColorScheme.Text.Default}}>
                                    Breez SDK
                                </VText>

                                <View
                                    className={
                                        `rounded-full ${
                                                langDir === 'right'
                                                    ? 'mr-2'
                                                    : ''
                                            }`
                                    }
                                    style={{
                                            backgroundColor:
                                                isNetOn && breezConnected
                                                    ? 'lightgreen'
                                                    : '#ff4e4a',
                                    }}>
                                    <VText
                                        className="text-xs font-bold p-1 px-4"
                                        style={{
                                                color:
                                                    isNetOn && breezConnected
                                                        ? 'darkgreen'
                                                        : 'black',
                                        }}>
                                        {isNetOn && breezConnected
                                            ? capitalizeFirst(t('connected'))
                                            : capitalizeFirst(
                                                  t('disconnected'),
                                              )}
                                    </VText>
                                </View>

                                <View
                                    className={
                                        `rounded-full ${
                                                langDir === 'right'
                                                    ? ''
                                                    : 'ml-2'
                                            }`
                                    }
                                    style={{
                                            backgroundColor:
                                                isNetOn && breezAvailable
                                                    ? checkStatusTrans[
                                                          breezAvailable
                                                      ][2]
                                                    : '#ff4e4a',
                                    }}>
                                    <VText
                                        className="text-xs font-bold p-1 px-4"
                                        style={{
                                                color: isNetOn
                                                    ? checkStatusTrans[
                                                          breezAvailable
                                                      ][1]
                                                    : 'black',
                                        }}>
                                        {isNetOn
                                            ? checkStatusTrans[
                                                  breezAvailable
                                              ][0]
                                            : capitalizeFirst(t('unavailable'))}
                                    </VText>
                                </View>
                            </View>

                            <VText
                                className="text-xs"
                                style={{color: ColorScheme.Text.DescText}}>
                                {t('breez_sdk_info')}
                            </VText>
                        </View>
                    </View>

                    {/* Mempool */}
                    <View
                        className="justify-center w-full items-center flex-row mb-8">
                        <View className="w-5/6">
                            <View
                                className={
                                    `w-full ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } items-center mb-4`}>
                                <VText
                                    className={
                                        `text-sm font-medium ${
                                                langDir === 'right'
                                                    ? ''
                                                    : 'mr-4'
                                            }`
                                    }
                                    style={{color: ColorScheme.Text.Default}}>
                                    Mempool.space
                                </VText>

                                <View
                                    className={
                                        `rounded-full ${
                                                langDir === 'right'
                                                    ? 'mr-2'
                                                    : ''
                                            }`
                                    }
                                    style={{
                                            backgroundColor:
                                                isNetOn && mempoolInfo.connected
                                                    ? 'lightgreen'
                                                    : '#ff4e4a',
                                    }}>
                                    <VText
                                        className="text-xs font-bold p-1 px-4"
                                        style={{
                                                color:
                                                    isNetOn &&
                                                    mempoolInfo.connected
                                                        ? 'darkgreen'
                                                        : 'black',
                                        }}>
                                        {isNetOn && mempoolInfo.connected
                                            ? capitalizeFirst(t('connected'))
                                            : capitalizeFirst(
                                                  t('disconnected'),
                                              )}
                                    </VText>
                                </View>
                            </View>

                            <VText
                                className="text-xs"
                                style={{color: ColorScheme.Text.DescText}}>
                                {t('mempool_connection_info')}
                            </VText>
                        </View>
                    </View>

                    <View className="w-full mb-8" style={[HeadingBar]} />

                    {/* Electrum server */}
                    <View
                        className="justify-center w-full items-center flex-row mb-2">
                        <View className="w-5/6">
                            <View
                                className={`w-full ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } items-center mb-2`}>
                                <VText
                                    className={
                                        `text-sm font-medium ${
                                                langDir === 'right'
                                                    ? ''
                                                    : 'mr-4'
                                            }`
                                    }
                                    style={{color: ColorScheme.Text.Default}}>
                                    {t('electrum_server')}
                                </VText>

                                <View
                                    className={
                                        `rounded-full ${
                                            langDir === 'right'
                                                ? 'mr-2'
                                                : ''
                                        }`
                                    }
                                    style={
                                        {
                                            backgroundColor:
                                                isNetOn && status
                                                    ? 'lightgreen'
                                                    : '#ff4e4a',
                                    }}>
                                    <VText
                                        className="text-xs font-bold p-1 px-4"
                                        style={{
                                                color:
                                                    isNetOn && status
                                                        ? 'darkgreen'
                                                        : 'black',
                                        }}>
                                        {isNetOn && status
                                            ? capitalizeFirst(t('connected'))
                                            : capitalizeFirst(
                                                  t('disconnected'),
                                              )}
                                    </VText>
                                </View>
                            </View>

                            <VText
                                className="text-sm mb-2 italic"
                                style={{color: ColorScheme.Text.DescText}}>
                                {`${electrumServerURL.bitcoin}`}
                            </VText>
                        </View>
                    </View>

                    {/* Set Custom Electrum server */}
                    <View
                        className="justify-center w-full items-center flex-row mt-4">
                        <View className="w-5/6">
                            <View
                                className={
                                    `w-full ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } items-center mb-4`
                                }>
                                <VText
                                    className="text-sm font-medium mr-4"
                                    style={{color: ColorScheme.Text.Default}}>
                                    {t('custom_electrum_server')}
                                </VText>

                                {/* Save button */}
                                <PlainButton
                                    disabled={url.length === 0}
                                    className={
                                        `p-1 px-4 rounded ${
                                                url.length === 0
                                                    ? 'opacity-40'
                                                    : ''
                                            }`
                                    }
                                    style={{
                                            backgroundColor:
                                                ColorScheme.Background.Greyed,
                                    }}
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
                                        className="text-xs font-bold"
                                        style={{color: ColorScheme.Text.Default}}>
                                        {capitalizeFirst(t('save'))}
                                    </VText>
                                </PlainButton>
                            </View>

                            {/* Input */}
                            <View
                                className="w-full px-2 mb-4"
                                style={[
                                    styles.inputContainer,
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
                                className="text-xs"
                                style={{color: ColorScheme.Text.GrayedText}}>
                                <VText
                                    className="text-xs"
                                    style={{color: ColorScheme.Text.DescText}}>
                                    {capitalizeFirst(t('warning'))}
                                    {':'}
                                </VText>{' '}
                                {e('default_testnet_warn')}
                            </VText>
                        </View>
                    </View>
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
