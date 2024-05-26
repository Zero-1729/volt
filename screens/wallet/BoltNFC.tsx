import {Linking, Platform, Text, View, useColorScheme} from 'react-native';
import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {PlainButton} from '../../components/button';

import {SafeAreaView} from 'react-native-safe-area-context';
import {CommonActions, useNavigation} from '@react-navigation/native';

import {
    BreezEventVariant,
    InputTypeVariant,
    LnUrlWithdrawResultVariant,
    parseInput,
    withdrawLnurl,
} from '@breeztech/react-native-breez-sdk';
import {extractNFCTagData} from '../../modules/nfc';
import NFCManager, {NfcTech} from 'react-native-nfc-manager';

import Color from '../../constants/Color';
import {useTailwind} from 'tailwind-rn';
import {useTranslation} from 'react-i18next';

import Back from '../../assets/svg/arrow-left-24.svg';
import BoltIcon from '../../assets/svg/bolt-mono.svg';

import {capitalizeFirst, formatSats} from '../../modules/transform';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

import {VTextSingle} from '../../components/text';
import {DisplaySatsAmount, FiatBalance} from '../../components/balance';

import {AppStorageContext} from '../../class/storageContext';
import BigNumber from 'bignumber.js';

import {EBreezDetails} from '../../types/enums';
import NativeWindowMetrics from '../../constants/NativeWindowMetrics';

type Props = NativeStackScreenProps<WalletParamList, 'BoltNFC'>;

const BoltNFC = ({route}: Props) => {
    const ColorScheme = Color(useColorScheme());
    const tailwind = useTailwind();
    const {t} = useTranslation('wallet');

    const {breezEvent} = useContext(AppStorageContext);

    const navigation = useNavigation();
    const amountMsat = useMemo(
        () => new BigNumber(route.params?.amountMsat),
        [route.params?.amountMsat],
    );
    const amountSats = amountMsat.div(1_000);

    const [statusMessage, setStatusMessage] = useState<string>(
        t('check_nfc_supported'),
    );
    const [loading, setLoading] = useState<boolean>();

    const isEnabled = useMemo(async () => await NFCManager.isEnabled(), []);

    const unsupportedNFC = statusMessage === t('nfc_unsupported');
    const isInError =
        statusMessage.toLowerCase().includes('error') ||
        statusMessage.toLowerCase().includes('failed') ||
        statusMessage.toLowerCase().includes('limit');
    const isInactive =
        statusMessage === t('bolt_nfc_parking') || unsupportedNFC;
    // Description for LNURL Withdrawal
    const description = route.params?.description
        ? route.params.description
        : `Volt ${formatSats(amountSats)} sats Withdrawal`;

    const buttonText =
        statusMessage === t('bolt_nfc_parking')
            ? capitalizeFirst(t('scan'))
            : !unsupportedNFC
            ? capitalizeFirst(t('cancel'))
            : route.params.fromQuickActions
            ? t('return_home')
            : capitalizeFirst(t('back'));

    const goToSettings = useCallback(() => {
        if (Platform.OS === 'android') {
            NFCManager.goToNfcSetting();
        } else {
            Linking.openSettings();
        }
    }, []);

    const routeHome = useCallback(() => {
        navigation.dispatch(CommonActions.navigate('HomeScreen'));
    }, [navigation]);

    const routeBack = useCallback(() => {
        navigation.dispatch(CommonActions.goBack());
    }, [navigation]);

    const handleBack = useCallback(() => {
        if (unsupportedNFC) {
            routeHome();
        } else {
            routeBack();
        }
    }, [routeBack, routeHome, unsupportedNFC]);

    const handleWithdraw = useCallback(
        async (lnurl: string) => {
            try {
                setStatusMessage(t('retrieving_lnurl_data'));

                const input = await parseInput(lnurl);

                if (input.type === InputTypeVariant.LN_URL_WITHDRAW) {
                    setStatusMessage(t('processing_lnurl_withdraw'));
                    const maxAmount = input.data.maxWithdrawable; // in sats

                    // Check if above limit
                    if (amountSats.gt(maxAmount)) {
                        setStatusMessage(
                            t('above_lnurl_withdraw_limit', {
                                amount: amountSats,
                                maxAmount: maxAmount,
                            }),
                        );
                        setLoading(false);
                        return;
                    }

                    const lnUrlWithdrawResult = await withdrawLnurl({
                        data: input.data,
                        amountMsat: amountSats.toNumber(),
                        description: description,
                    });

                    if (
                        lnUrlWithdrawResult.type ===
                        LnUrlWithdrawResultVariant.OK
                    ) {
                        setStatusMessage(t('lnurl_withdrawal_success'));
                        setLoading(false);
                    } else {
                        setStatusMessage(
                            t('lnurl_withdrawal_failed', {
                                reason: lnUrlWithdrawResult.data.reason,
                            }),
                        );
                        setLoading(false);
                    }
                }
            } catch (error: any) {
                setStatusMessage(`Error: ${error.message}`);
                setLoading(false);
            }
        },
        [amountSats, description, t],
    );

    const readNFC = useCallback(async () => {
        if (unsupportedNFC) {
            if (route.params.fromQuickActions) {
                routeHome();
            } else {
                routeBack();
            }

            return;
        }

        if (loading) {
            // Stop loading
            setLoading(false);
            setStatusMessage('');
            NFCManager.cancelTechnologyRequest();
            return;
        }

        // Check if NFC is enabled
        const enabled = await NFCManager.isEnabled();

        if (!enabled) {
            setStatusMessage(t('nfc_disabled'));
            setLoading(false);
            return;
        }

        // Start loading
        setLoading(true);

        // Start processing the NFC
        NFCManager.start();

        try {
            setStatusMessage(t('nfc_read_message'));
            // register for the NFC tag with NDEF in it
            await NFCManager.requestTechnology(NfcTech.Ndef);
            // the resolved tag object will contain `ndefMessage` property
            const tag = await NFCManager.getTag();

            if (tag !== null) {
                setStatusMessage(t('processing_nfc_tag'));
                const tagData = extractNFCTagData(tag);

                if (!tagData.lnurl) {
                    setStatusMessage(t('no_lnurl_data_found'));
                    setLoading(false);
                    return;
                }

                handleWithdraw(tagData.lnurl);
            } else {
                setStatusMessage(t('no_nfc_tag_found'));
                setLoading(false);
            }
        } catch (error: any) {
            setStatusMessage(t('nfc_tag_error', {error: error.message}));
            setLoading(false);
        } finally {
            // stop the nfc scanning
            NFCManager.cancelTechnologyRequest();
            setLoading(false);
        }
    }, [
        handleWithdraw,
        loading,
        route.params.fromQuickActions,
        routeBack,
        routeHome,
        t,
        unsupportedNFC,
    ]);

    const checkNFCSupport = async () => {
        const supported = await NFCManager.isSupported();

        if (!supported) {
            setStatusMessage(t('nfc_unsupported'));
            setLoading(false);
            return;
        } else {
            setStatusMessage(t('bolt_nfc_parking'));
        }
    };

    useEffect(() => {
        checkNFCSupport();

        return () => {
            NFCManager.cancelTechnologyRequest();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (breezEvent.type === BreezEventVariant.INVOICE_PAID) {
            // Route to LN payment status screen
            navigation.dispatch(
                CommonActions.navigate('LNTransactionStatus', {
                    status: true,
                    details: breezEvent.details,
                    detailsType: EBreezDetails.Received,
                }),
            );
            return;
        }
    }, [breezEvent, navigation]);

    return (
        <SafeAreaView
            style={[
                // eslint-disable-next-line react-native/no-inline-styles
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            {/* Display Wallet Info, addresses, and other related data / settings */}
            <View
                style={[
                    tailwind('absolute w-full h-16 top-0'),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}
            />
            <View
                style={[tailwind('w-full h-full items-center justify-center')]}>
                <View
                    style={[
                        tailwind(
                            'w-5/6 justify-center items-center absolute top-6 flex',
                        ),
                    ]}>
                    <PlainButton
                        style={[tailwind('absolute left-0 top-0 z-10')]}
                        onPress={handleBack}>
                        <Back fill={ColorScheme.SVG.Default} />
                    </PlainButton>

                    <Text
                        style={[
                            tailwind('text-lg font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {t('bolt_nfc')}
                    </Text>

                    {/* Amount summary */}
                    {!unsupportedNFC && (
                        <>
                            <View style={[tailwind('items-center mt-12')]}>
                                <Text
                                    style={[
                                        tailwind('text-base mb-1'),
                                        {
                                            color: ColorScheme.Text.GrayedText,
                                        },
                                    ]}>
                                    {capitalizeFirst(t('amount'))}
                                </Text>
                                <FiatBalance
                                    balance={amountSats.toNumber()}
                                    loading={false}
                                    balanceFontSize={'text-4xl'}
                                    fontColor={ColorScheme.Text.Default}
                                    ignoreHideBalance={true}
                                />
                                <DisplaySatsAmount
                                    amount={amountSats}
                                    fontSize={'text-sm'}
                                    textColor={ColorScheme.Text.DescText}
                                />
                            </View>

                            <View
                                style={[tailwind('w-full items-center mt-6')]}>
                                <VTextSingle
                                    style={[
                                        tailwind('text-sm'),
                                        {
                                            color: ColorScheme.Text.DescText,
                                        },
                                    ]}>
                                    {description}
                                </VTextSingle>
                            </View>
                        </>
                    )}
                </View>

                {/* Bolt Icon and status message */}
                <View
                    style={[
                        tailwind(
                            `items-center flex ${
                                !unsupportedNFC ? 'mt-12' : '-mt-12'
                            }`,
                        ),
                    ]}>
                    <BoltIcon
                        fill={
                            isInactive
                                ? ColorScheme.SVG.GrayFill
                                : ColorScheme.SVG.Default
                        }
                        width={92}
                        height={98}
                    />
                    <Text
                        style={[
                            tailwind('text-sm w-5/6'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {statusMessage}
                    </Text>
                </View>

                {/* Settings button */}
                {!unsupportedNFC && !isEnabled && (
                    <View
                        style={[
                            tailwind('absolute'),
                            {bottom: NativeWindowMetrics.bottom + 80},
                        ]}>
                        <PlainButton onPress={goToSettings}>
                            <Text
                                style={[
                                    tailwind('text-sm font-bold'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {t('go_to_nfc_settings')}
                            </Text>
                        </PlainButton>
                    </View>
                )}

                {/* Scan button */}
                {(isInactive || isInError) && (
                    <PlainButton
                        onPress={readNFC}
                        style={[
                            tailwind(
                                'absolute bottom-6 px-8 py-3 rounded-full',
                            ),
                            {
                                backgroundColor:
                                    ColorScheme.Background.Inverted,
                            },
                        ]}>
                        <Text
                            style={[
                                tailwind('font-bold'),
                                {color: ColorScheme.Text.Alt},
                            ]}>
                            {buttonText}
                        </Text>
                    </PlainButton>
                )}
            </View>
        </SafeAreaView>
    );
};

export default BoltNFC;
