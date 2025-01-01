/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useCallback} from 'react';
import {Text, View, useColorScheme, StyleSheet, ActivityIndicator} from 'react-native';

import VText from '../../components/text';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {InitStackParamList} from '../../Navigation';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation, CommonActions} from '@react-navigation/native';

import {useTranslation} from 'react-i18next';

import netInfo, {useNetInfo} from '@react-native-community/netinfo';
import {checkNetworkIsReachable} from '../../modules/wallet-utils';

import {capitalizeFirst} from '../../modules/transform';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import Close from '../../assets/svg/x-24.svg';

import {LongBottomButton, PlainButton} from '../../components/button';
import {FiatBalance, DisplaySatsAmount} from '../../components/balance';

import NativeWindowMetrics from '../../constants/NativeWindowMetrics';
import {
    parseInput,
    InputTypeVariant,
    withdrawLnurl,
    LnUrlWithdrawRequestData,
    LnUrlWithdrawResultVariant,
} from '@breeztech/react-native-breez-sdk';

import BigNumber from 'bignumber.js';

type Props = NativeStackScreenProps<InitStackParamList, 'WithdrawLNURL'>;

const WithdrawLNURL = ({route}: Props) => {
    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {t} = useTranslation('wallet');
    const {t: e} = useTranslation('errors');

    const navigation = useNavigation();
    const isNetOn = useNetInfo();

    const [description, setDescription] = useState('');
    const [maxAmountMsat, setMaxAmountMsat] = useState(0);
    const [lnurlData, setLnurlData] = useState<LnUrlWithdrawRequestData>();
    const [loadingWithdrawal, setLoadingWithdrawal] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [fetchErrorMessage, setFetchErrorMessage] = useState('');
    const [processingWithdraw, setProcessingWithdraw] = useState(false);

    const grabLNURL = useCallback(async () => {
        const _netInfo = await netInfo.fetch();
        if (!checkNetworkIsReachable(_netInfo)) {
            setFetchError(true);
            setFetchErrorMessage(e('no_internet_message'));
            setLoadingWithdrawal(false);
            return;
        }

        try {
            const input = await parseInput(route.params.lnurl);

            // handle soft error
            if (input.type === InputTypeVariant.LN_URL_ERROR) {
                if (input.data.reason.includes('Replayed or expired query')) {
                    setFetchErrorMessage(e('lnurl_replay_error'));
                } else {
                    setFetchErrorMessage(input.data.reason);
                }

                setFetchError(true);
                setLoadingWithdrawal(false);
            }

            // Note: We are only interested in the withdraw variant
            // and taking the max amount from the data
            if (input.type === InputTypeVariant.LN_URL_WITHDRAW) {
                setDescription(input.data.defaultDescription);
                setMaxAmountMsat(input.data.minWithdrawable === 0 ? input.data.maxWithdrawable : input.data.minWithdrawable);
                setLnurlData(input.data);

                setLoadingWithdrawal(false);
            }
        } catch (err: any) {
            if (err.message.includes('Failed to parse response')) {
                setFetchError(true);
                setFetchErrorMessage(e('no_lnurl_response'));
            } else {
                setFetchError(true);
                setFetchErrorMessage(err.message);
            }
        }
    }, [e, route.params.lnurl]);

    const handleLNURL = useCallback(async () => {
        setProcessingWithdraw(true);

        try {
            const amountMsat = maxAmountMsat;
            const lnUrlWithdrawResult = await withdrawLnurl({
                data: lnurlData as LnUrlWithdrawRequestData,
                amountMsat,
                description: '',
            });

            if (lnUrlWithdrawResult.type === LnUrlWithdrawResultVariant.OK) {
                navigation.dispatch(CommonActions.reset({
                    index: 0,
                    routes: [{name: 'HomeScreen'}],
                }));
            }

            setProcessingWithdraw(false);
        } catch (err: any) {
            setFetchError(true);
            setFetchErrorMessage(err.message);
            setProcessingWithdraw(false);
        }
    }, [lnurlData, maxAmountMsat, navigation]);

    useEffect(() => {
        grabLNURL();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <SafeAreaView
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <View
                style={[
                    tailwind(
                        'h-full w-full items-center justify-center',
                    ),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <PlainButton
                    onPress={() => {
                        navigation.dispatch(CommonActions.reset({
                            index: 0,
                            routes: [{name: 'HomeScreen'}],
                        }));
                    }}
                    style={[tailwind('absolute top-6 left-6 rounded-full p-3'), {flex: 1}]}>
                    <Close fill={'white'} />
                </PlainButton>

                {/*Display the invoice data */}
                <View
                    style={[
                        tailwind(
                            'w-5/6 p-6 items-center flex justify-between rounded',
                        ),
                        styles.mainContainer,
                    ]}>
                    {/* Loading LNURL data */}
                    {loadingWithdrawal && !fetchError && (
                        <View style={[tailwind('w-full items-center justify-center flex-row')]}>
                            <VText
                                style={[
                                    tailwind('font-bold'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {t('loading_lnurlwithdraw_data')}
                            </VText>
                            <ActivityIndicator color={ColorScheme.Background.Default} style={tailwind('ml-2')} />
                        </View>
                    )}

                    {/* Loading withdraw */}
                    {processingWithdraw && !fetchError && (
                        <View style={[tailwind('w-full items-center justify-center flex-row')]}>
                            <VText
                                style={[
                                    tailwind('font-bold'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {t('loading_lnurlwithdraw')}
                            </VText>
                            <ActivityIndicator color={ColorScheme.Background.Default} style={tailwind('ml-2')} />
                        </View>
                    )}

                    {/* Display error */}
                    {fetchError && (
                        <View style={[tailwind('w-full items-center justify-center flex')]}>
                            <VText
                                style={[
                                    tailwind('font-bold text-xl mb-2'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {capitalizeFirst(e('error'))}
                            </VText>
                            <VText
                                style={[
                                    tailwind('text-base'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {fetchErrorMessage}
                            </VText>
                        </View>
                    )}

                    {!!maxAmountMsat && !processingWithdraw && (
                        <View
                            style={[tailwind('w-full items-center flex mb-2')]}>
                            <FiatBalance
                                balance={ new BigNumber(maxAmountMsat / 1_000).toNumber()}
                                loading={false}
                                balanceFontSize={'text-3xl'}
                                fontColor={ColorScheme.Text.Default}
                                ignoreHideBalance={true}
                            />
                            <View
                                style={[
                                    tailwind('w-full mt-4'),
                                    styles.invoiceLineBreaker,
                                    {
                                        borderColor:
                                            ColorScheme.Background.Inverted,
                                    },
                                ]}
                            />
                            <View
                                style={[
                                    tailwind(
                                        'w-full items-center flex-row justify-between mt-4 mb-2',
                                    ),
                                ]}>
                                <VText
                                    style={[
                                        tailwind('font-bold'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    Amount
                                </VText>
                                <DisplaySatsAmount
                                    amount={
                                        new BigNumber(maxAmountMsat / 1_000)
                                    }
                                    fontSize="text-sm"
                                    isApprox={false}
                                    textColor={ColorScheme.Text.GrayText}
                                />
                            </View>
                        </View>
                    )}

                    {/* Display the message */}
                    {!processingWithdraw && description && (
                        <>
                            <View
                                style={[
                                    tailwind('w-full mb-4 opacity-20'),
                                    styles.invoiceLineBreaker,
                                    {
                                        borderColor:
                                            ColorScheme.Background.Inverted,
                                    },
                                ]}
                            />

                            <Text
                                numberOfLines={2}
                                ellipsizeMode="middle"
                                style={[
                                    tailwind('font-bold'),
                                    {color: ColorScheme.Text.DescText},
                                ]}>
                                {description}
                            </Text>
                        </>
                    )}
                </View>

                <LongBottomButton
                    disabled={!isNetOn || loadingWithdrawal || fetchError}
                    title={capitalizeFirst(t('withdraw'))}
                    textColor={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                    onPress={handleLNURL}
                />
            </View>
        </SafeAreaView>
    );
};

export default WithdrawLNURL;

const styles = StyleSheet.create({
    invoiceLineBreaker: {
        borderBottomWidth: 1,
        opacity: 0.1,
    },
    mainContainer: {
        marginTop: NativeWindowMetrics.height * -0.1,
    },
});
