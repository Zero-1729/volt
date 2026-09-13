/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import {
    StyleSheet,
    Text,
    View,
    useColorScheme,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import React, {
    useContext,
    useRef,
    useState,
    ReactElement,
    useEffect,
} from 'react';

import {useNavigation, CommonActions} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';
import Color from '../../constants/Color';

import {AppStorageContext} from '../../class/storageContext';

import {
    capitalizeFirst,
    normalizeFiat,
    formatSats,
    i18nNumber,
} from '../../modules/transform';
import {useTranslation} from 'react-i18next';

import {PlainButton, LongBottomButton} from '../../components/button';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {InitStackParamList} from '../../Navigation';

import Close from '../../assets/svg/x-24.svg';
import InfoIcon from '../../assets/svg/info-16.svg';

import {TextSingleInput} from '../../components/input';
import VText from '../../components/text';

import {
    checkNetworkIsReachable,
    getMiniWallet,
    isLNAddress,
} from '../../modules/wallet-utils';
import {DisplayFiatAmount} from '../../components/balance';
import BigNumber from 'bignumber.js';

import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {biometricAuth} from '../../modules/shared';

import PINPass from '../../components/pinpass';
import {useNetInfo} from '@react-native-community/netinfo';
import { InputType_Tags, SdkEvent_Tags } from '@breeztech/breez-sdk-spark-react-native';
import { useWallet } from '../../contexts/walletContext';
import { useBreezEvent } from '../../contexts/BreezEventContext';

type Props = NativeStackScreenProps<InitStackParamList, 'PayLNURL'>;

const InputPanel = (props: {address: string}): ReactElement => {
    const navigation = useNavigation();
    const ColorScheme = Color(useColorScheme());

    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const [inputText, setInputText] = useState<string>(
        props.address ? props.address : '',
    );
    const [descriptionText, setDescriptionText] = useState<string>('');

    const {getWalletData, currentWalletID, appLanguage} =
        useContext(AppStorageContext);
    const wallet = getWalletData(currentWalletID);

    const networkState = useNetInfo();
    const isNetOn = checkNetworkIsReachable(networkState);

    const mainInputRef = useRef(null);

    const DESCRIPTION_LENGTH_LIMIT = 32;

    const clearText = () => {
        setInputText('');
    };

    const mutateText = (text: string) => {
        if (inputText.length === 0) {
            clearText();
        }

        setInputText(text);
    };
    const mutateDescription = (text: string) => {
        if (descriptionText.length === 0) {
            clearDesc();
        }

        setDescriptionText(text);
    };

    const clearDesc = () => {
        setDescriptionText('');
    };

    const isLnurlpURI = (text: string) => {
        // return if string is a valid lnurlp URI
        return text.startsWith('lnurlp:');
    };

    const isLnurlAddress = (text: string) => {
        // return if string is a valid lnurl address
        return isLNAddress(text);
    };

    const isValidLnurlp = isLnurlpURI(inputText) || isLnurlAddress(inputText);

    const handleAmount = () => {
        const minWallet = getMiniWallet(wallet);

        navigation.dispatch(
            CommonActions.navigate('WalletRoot', {
                screen: 'SendAmount',
                params: {
                    invoiceData: {},
                    wallet: minWallet,
                    isLightning: true,
                    isLnManual: true,
                    lnManualPayload: {
                        amount: 0,
                        kind: 'address',
                        text: inputText,
                        description: descriptionText,
                    },
                },
            }),
        );
    };

    return (
        <View
            className="self-center w-full h-full relative items-center">
            <View className="w-5/6" style={[styles.mainContainer]}>
                <VText
                    className="font-bold w-full mb-4"
                    style={{color: ColorScheme.Text.Default}}>
                    {capitalizeFirst(t('to'))}
                </VText>

                <View
                    className="w-full rounded-md px-2"
                    style={{
                        borderColor: ColorScheme.Background.Greyed,
                        borderWidth: 1,
                    }}>
                    <TextSingleInput
                        color={ColorScheme.Text.Default}
                        placeholder={t('manual_placeholder')}
                        placeholderTextColor={ColorScheme.Text.GrayedText}
                        value={inputText}
                        onChangeText={mutateText}
                        refs={mainInputRef}
                        disabled={!!props.address}
                    />
                </View>
            </View>

            {isValidLnurlp && isNetOn && (
                <View className="w-5/6 items-center mt-12">
                    <VText
                        className="font-bold w-full mb-4"
                        style={{color: ColorScheme.Text.Default}}>
                        {capitalizeFirst(t('description'))}
                    </VText>

                    <View
                        className={
                            `w-full rounded-md px-2 ${
                                langDir === 'right'
                                    ? 'flex-row-reverse'
                                    : 'flex-row'
                            }`
                        }
                        style={{
                            borderColor: ColorScheme.Background.Greyed,
                            borderWidth: 1,
                        }}>
                        <TextSingleInput
                            color={ColorScheme.Text.Default}
                            placeholder={capitalizeFirst(t('description'))}
                            placeholderTextColor={ColorScheme.Text.GrayedText}
                            value={descriptionText}
                            onChangeText={mutateDescription}
                            maxLength={DESCRIPTION_LENGTH_LIMIT}
                        />
                        {descriptionText.length > 0 && (
                            <View
                                className="absolute right-4 justify-center h-full">
                                <Text
                                    className="text-sm opacity-60"
                                    style={{
                                        color: ColorScheme.Text.DescText,
                                    }}>
                                    (
                                    {i18nNumber(
                                        descriptionText.length,
                                        appLanguage.code,
                                    )}
                                    /
                                    {i18nNumber(
                                        DESCRIPTION_LENGTH_LIMIT,
                                        appLanguage.code,
                                    )}
                                    )
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            )}

            {isValidLnurlp && !isNetOn && (
                <View
                    className={
                        `mt-6 items-center ${
                            langDir === 'right'
                                ? 'flex-row-reverse'
                                : 'flex-row'
                        }`
                    }>
                    <InfoIcon width={16} fill={ColorScheme.SVG.GrayFill} />
                    <VText
                        className={
                            `text-sm ${
                                langDir === 'right' ? 'mr-2' : 'ml-2'
                            }`
                        }
                        style={{color: ColorScheme.Text.DescText}}>
                        {t('no_internet_cannot_pay')}
                    </VText>
                </View>
            )}

            <LongBottomButton
                disabled={!isValidLnurlp || !isNetOn}
                onPress={handleAmount}
                title={capitalizeFirst(t('continue'))}
                textColor={ColorScheme.Text.Alt}
                backgroundColor={ColorScheme.Background.Inverted}
            />
        </View>
    );
};

const SummaryPanel = (props: {
    text: string | undefined;
    kind: string | undefined;
    amount: number | undefined;
    description: string | undefined;
    loadingPay: boolean;
    authAndPay: () => void;
    statusMsg: string;
    errorMessage: string;
    handleError: () => void;
}): ReactElement => {
    const ColorScheme = Color(useColorScheme());
    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const {fiatRate} = useContext(AppStorageContext);

    const fiatAmount = normalizeFiat(
        new BigNumber(props.amount as number),
        fiatRate.rate,
    );

    return (
        <View className="items-center w-full h-full">
            <View
                className="w-full items-center"
                style={[
                    styles.summaryContainer,
                ]}>
                {/* Not loading summary */}
                <View className="items-center h-full w-full">
                    <View className="mb-6">
                        <DisplayFiatAmount
                            amount={fiatAmount}
                            fontSize={'text-3xl'}
                        />
                    </View>

                    <View
                        className="w-5/6 mt-4 rounded-md"
                        style={{
                            borderWidth: 1,
                            borderColor: ColorScheme.Background.Greyed,
                        }}>
                        <View
                            className={
                                `${
                                    langDir === 'right'
                                        ? 'flex-row-reverse'
                                        : 'flex-row'
                                } p-4 justify-between`
                            }
                            style={{
                                borderBottomWidth: 1,
                                borderBottomColor:
                                    ColorScheme.Background.Greyed,
                            }}>
                            <Text
                                className="text-sm"
                                style={{color: ColorScheme.Text.DescText}}>
                                {t('amount_sats')}
                            </Text>
                            <Text
                                className="text-sm"
                                style={{color: ColorScheme.Text.Default}}>
                                {formatSats(
                                    new BigNumber(props.amount as number),
                                )}
                            </Text>
                        </View>
                        <View
                            className={
                                `${
                                    langDir === 'right'
                                        ? 'flex-row-reverse'
                                        : 'flex-row'
                                } p-4 justify-between`
                            }
                            style={[
                                props.description
                                    ? {
                                          borderBottomWidth: 1,
                                          borderBottomColor:
                                              ColorScheme.Background.Greyed,
                                      }
                                    : {},
                            ]}>
                            <Text
                                className="text-sm"
                                style={{color: ColorScheme.Text.DescText}}>
                                {t('lightning_address')}
                            </Text>
                            <Text
                                numberOfLines={2}
                                ellipsizeMode="middle"
                                className="text-sm w-1/2"
                                style={[
                                    {
                                        color: ColorScheme.Text.Default,
                                        textAlign:
                                            langDir === 'right'
                                                ? 'left'
                                                : 'right',
                                    },
                                ]}>
                                {props.text}
                            </Text>
                        </View>
                        {props.description && (
                            <View
                                className={
                                    `${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } p-4 justify-between`
                                }>
                                <Text
                                    className="text-sm"
                                    style={{color: ColorScheme.Text.DescText}}>
                                    {t('description')}
                                </Text>
                                <Text
                                    className="text-sm"
                                    style={{color: ColorScheme.Text.Default}}>
                                    {props.description}
                                </Text>
                            </View>
                        )}
                    </View>
                    {props.loadingPay && (
                        <View className="items-center mt-6 flex-row">
                            <Text
                                className="text-sm mr-2"
                                style={{color: ColorScheme.Text.GrayedText}}>
                                {props.statusMsg}
                            </Text>
                            <ActivityIndicator />
                        </View>
                    )}

                    {/* Lnurl Error */}
                    {!!props.errorMessage && (
                        <View
                            className="w-5/6 mt-6">
                            <VText
                                className="font-bold text-lg w-full text-center mb-2"
                                style={{color: ColorScheme.Text.Default}}>
                                {capitalizeFirst(t('error'))}
                            </VText>
                            <VText
                                className="w-full text-center"
                                style={{color: ColorScheme.Text.Default}}>
                                {props.errorMessage}
                            </VText>
                        </View>
                    )}
                </View>

                <LongBottomButton
                    disabled={props.loadingPay}
                    onPress={props.errorMessage === '' ? props.authAndPay : props.handleError}
                    title={props.errorMessage === '' ? capitalizeFirst(t('pay')) : capitalizeFirst(t('cancel'))}
                    textColor={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                />
            </View>
        </View>
    );
};

const PayLNURL = ({route}: Props) => {
    const navigation = useNavigation();
    const ColorScheme = Color(useColorScheme());

    const _wallet = useWallet();
    const {breezEvent} = useBreezEvent();

    const {isBiometricsActive} = useContext(AppStorageContext);
    const [loadingPay, setLoadingPay] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [lnurlError, setLNURLError] = useState(false);
    const [lnurlErrorText, setLNURLErrorText] = useState('');

    const {t} = useTranslation('wallet');

    useEffect(() => {
        if (breezEvent?.tag === SdkEvent_Tags.PaymentSucceeded) {
            // Serialize BigInt
            const txDetails = {...breezEvent.inner, amount: Number(breezEvent.inner.payment.amount)};

            // Route to LN payment status screen
            navigation.dispatch(
                CommonActions.navigate('LNTransactionStatus', {
                    status: true,
                    details: txDetails,
                    tag: breezEvent.tag,
                    detailsType: breezEvent.inner.payment.paymentType,
                    error: null,
                }),
            );
            return;
        }

        if (breezEvent?.tag === SdkEvent_Tags.PaymentFailed) {
            // Serialize BigInt
            const txDetails = {...breezEvent.inner, amount: Number(breezEvent.inner.payment.amount)};

            // Route to LN payment status screen
            navigation.dispatch(
                CommonActions.navigate('LNTransactionStatus', {
                    status: false,
                    details: txDetails,
                    tag: breezEvent.tag,
                    detailsType: breezEvent.inner.payment.paymentType,
                    error: lnurlErrorText,
                }),
            );
            return;
        }
    }, [breezEvent]);

    const bottomPINPassRef = useRef<BottomSheetModal>(null);
    const [pinIdx, setPINIdx] = useState(-1);

    const manualKind = route.params?.lnManualPayload?.kind;
    const manualText = route.params?.lnManualPayload?.text;
    const manualDescription = route.params?.lnManualPayload?.description;
    const manualAmount = route.params?.lnManualPayload?.amount;

    const togglePINPassModal = () => {
        if (pinIdx !== 1) {
            bottomPINPassRef.current?.present();
        } else {
            bottomPINPassRef.current?.close();
        }
    };

    const handlePINSuccess = async () => {
        handlePayment();
        bottomPINPassRef.current?.close();
    };

    const authAndPay = () => {
        if (isBiometricsActive) {
            biometricAuth(
                success => {
                    if (success) {
                        handlePayment();
                    }
                },
                // prompt response callback
                () => {
                    togglePINPassModal();
                },
                // prompt error callback
                error => {
                    setLNURLErrorText(error.message);
                    setLNURLError(true);
                },
            );

            return;
        }

        togglePINPassModal();
    };

    const handlePayment = async () => {
        setLoadingPay(true);

        // Make payment to address
        payLNAddress(
            manualText as string,
            manualAmount as number,
            manualDescription,
        );
    };

    const handleLNURL = async () => {
        if (lnurlError) {
            navigation.dispatch(
                CommonActions.navigate('HomeScreen'),
            );

            setLNURLError(false);
        }
    };

    const payLNAddress = async (
        lnurlPayURL: string,
        amtSats: number,
        comment?: string,
    ) => {
        try {
            setStatusMessage(t('parsing_ln_address'));
            const input = await _wallet.parseInput(lnurlPayURL);

            if (input.tag !== InputType_Tags.LightningAddress) {
                throw new Error(t('not_ln_address'));
            }

            // LN Address (LNURLPay)
            if (input.tag === InputType_Tags.LightningAddress) {
                const payRequest = input.inner[0].payRequest;

                setStatusMessage(t('checking if amount within limit'));
                if (amtSats > input.inner[0].payRequest.maxSendable) {
                    setLNURLErrorText(t('amount_above_max_spendable'));
                }

                setStatusMessage(t('preparing pay request and fees'));

                const prepResp = await _wallet.prepareLnurlPay({
                    amountSats: BigInt(amtSats),
                    payRequest: payRequest,
                    comment: comment,
                    validateSuccessActionUrl: true,
                });

                const feeSats = prepResp.feeSats

                setStatusMessage(t(`attempting to pay ${prepResp.payRequest.address} with fee: ${feeSats} sats`))

                const resp = await _wallet.lnurlPay({
                    prepareResponse: prepResp,
                    idempotencyKey: undefined,
                });

                setStatusMessage(t(`${resp.successAction?.inner}`));

                setLoadingPay(false);
            }
        } catch (error: any) {
            const errMsg = error.message.includes('Failed to parse') ? t('no_lnurl_found') : error?.inner[0];

            setLNURLErrorText(errMsg);
            setLNURLError(true);
            setLoadingPay(false);
        }
    };

    return (
        <SafeAreaView
            edges={['top', 'left', 'right', 'bottom']}
            style={[{backgroundColor: ColorScheme.Background.Primary}]}>
            <StatusBar barStyle={ColorScheme.BarStyle.Inverted} />
            <BottomSheetModalProvider>
                <View className="h-full w-full items-center">
                    <View
                        className="absolute top-6 w-full flex-row items-center justify-center"
                        style={{zIndex: 999}}>
                        <PlainButton
                            onPress={() =>
                                navigation.dispatch(CommonActions.goBack())
                            }
                            className="absolute left-6">
                            <Close fill={ColorScheme.SVG.Default} />
                        </PlainButton>
                        <Text
                            className="text-base font-bold"
                            style={{color: ColorScheme.Text.Default}}>
                            Send
                        </Text>
                    </View>

                    {(!route.params?.lnManualPayload ||
                        (route.params.lnManualPayload?.amount === 0 &&
                            route.params.lnManualPayload.kind ===
                                'address')) && (
                        <InputPanel
                            address={
                                route.params?.lnManualPayload?.text as string
                            }
                        />
                    )}

                    {route.params?.lnManualPayload && (
                        <SummaryPanel
                            authAndPay={authAndPay}
                            loadingPay={loadingPay}
                            amount={manualAmount}
                            kind={manualKind}
                            text={manualText}
                            description={manualDescription}
                            statusMsg={statusMessage}
                            errorMessage={lnurlErrorText}
                            handleError={handleLNURL}
                        />
                    )}
                </View>

                <PINPass
                    pinPassRef={bottomPINPassRef}
                    triggerSuccess={handlePINSuccess}
                    onSelectPinPass={setPINIdx}
                    pinMode={false}
                />
            </BottomSheetModalProvider>
        </SafeAreaView>
    );
};

export default PayLNURL;

const styles = StyleSheet.create({
    mainContainer: {
        marginTop: 128,
        zIndex: -999,
    },
    summaryContainer: {
        marginTop: 110,
        zIndex: -999,
    },
    bottomButton: {
        bottom: 32,
        position: 'absolute',
    },
});
