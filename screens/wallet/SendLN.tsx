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

import {
    useNavigation,
    StackActions,
    CommonActions,
} from '@react-navigation/native';

import {
    BreezEventVariant,
    InputTypeVariant,
    TlvEntry,
    parseInput,
    payLnurl,
    sendSpontaneousPayment,
} from '@breeztech/react-native-breez-sdk';

import {SafeAreaView} from 'react-native-safe-area-context';
import Color from '../../constants/Color';
import {useTailwind} from 'tailwind-rn';

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
import {WalletParamList} from '../../Navigation';

import Close from '../../assets/svg/x-24.svg';
import {TextSingleInput} from '../../components/input';
import VText from '../../components/text';

import {getMiniWallet} from '../../modules/wallet-utils';
import Toast, {ToastConfig} from 'react-native-toast-message';
import {EBreezDetails} from '../../types/enums';
import {toastConfig} from '../../components/toast';
import {DisplayFiatAmount} from '../../components/balance';
import BigNumber from 'bignumber.js';

import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {biometricAuth} from '../../modules/shared';

import PINPass from '../../components/pinpass';

type Props = NativeStackScreenProps<WalletParamList, 'SendLN'>;

const InputPanel = (): ReactElement => {
    const navigation = useNavigation();
    const ColorScheme = Color(useColorScheme());
    const tailwind = useTailwind();

    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const [inputText, setInputText] = useState<string>('');
    const [descriptionText, setDescriptionText] = useState<string>('');

    const {getWalletData, currentWalletID, appLanguage} =
        useContext(AppStorageContext);
    const wallet = getWalletData(currentWalletID);

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

    const handleAmount = () => {
        const minWallet = getMiniWallet(wallet);

        navigation.dispatch(
            CommonActions.navigate('SendAmount', {
                invoiceData: {},
                wallet: minWallet,
                isLightning: true,
                isLnManual: true,
                lnManualPayload: {
                    amount: 0,
                    kind: isLNAddress(inputText) ? 'address' : 'Node_ID',
                    text: inputText,
                    description: descriptionText,
                },
            }),
        );
    };

    const isLNAddress = (address: string): boolean => {
        const splitted = address.split('@');

        if (splitted.length !== 2) {
            return false;
        }

        const isNonEmpty = !!splitted[0].trim() && !!splitted[1].trim();

        const mailRegExp = new RegExp(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        );

        return isNonEmpty && mailRegExp.test(address);
    };

    const isNodeID = (text: string): boolean => {
        // create regex for lightning network public node ID
        const nodeIDRegExp = new RegExp(/^[0-9a-fA-F]{66}$/);

        return text.length === 66 && nodeIDRegExp.test(text);
    };

    return (
        <View
            style={[
                tailwind('self-center w-full h-full relative items-center'),
            ]}>
            <View style={[tailwind('w-5/6'), styles.mainContainer]}>
                <VText
                    style={[
                        tailwind('font-bold w-full mb-4'),
                        {color: ColorScheme.Text.Default},
                    ]}>
                    {capitalizeFirst(t('to'))}
                </VText>

                <View
                    style={[
                        tailwind('w-full rounded-md px-2'),
                        {
                            borderColor: ColorScheme.Background.Greyed,
                            borderWidth: 1,
                        },
                    ]}>
                    <TextSingleInput
                        color={ColorScheme.Text.Default}
                        placeholder={t('manual_placeholder')}
                        placeholderTextColor={ColorScheme.Text.GrayedText}
                        value={inputText}
                        onChangeText={mutateText}
                        refs={mainInputRef}
                    />
                </View>
            </View>

            {(isLNAddress(inputText) || isNodeID(inputText)) && (
                <View style={[tailwind('w-5/6 items-center mt-12')]}>
                    <VText
                        style={[
                            tailwind('font-bold w-full mb-4'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {capitalizeFirst(t('description'))}
                    </VText>

                    <View
                        style={[
                            tailwind(
                                `w-full rounded-md px-2 ${
                                    langDir === 'right'
                                        ? 'flex-row-reverse'
                                        : 'flex-row'
                                }`,
                            ),
                            {
                                borderColor: ColorScheme.Background.Greyed,
                                borderWidth: 1,
                            },
                        ]}>
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
                                style={[
                                    tailwind(
                                        'absolute right-4 justify-center h-full',
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind('text-sm opacity-60'),
                                        {
                                            color: ColorScheme.Text.DescText,
                                        },
                                    ]}>
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

            <LongBottomButton
                disabled={!(isLNAddress(inputText) || isNodeID(inputText))}
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
}): ReactElement => {
    const ColorScheme = Color(useColorScheme());
    const tailwind = useTailwind();
    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const {fiatRate} = useContext(AppStorageContext);

    const fiatAmount = normalizeFiat(
        new BigNumber(props.amount as number),
        fiatRate.rate,
    );

    return (
        <View style={[tailwind('items-center w-full h-full')]}>
            <View
                style={[
                    tailwind('w-full items-center'),
                    styles.summaryContainer,
                ]}>
                {/* Not loading summary */}
                <View style={[tailwind('items-center h-full w-full')]}>
                    <View style={[tailwind('mb-6')]}>
                        <DisplayFiatAmount
                            amount={fiatAmount}
                            fontSize={'text-3xl'}
                        />
                    </View>

                    <View
                        style={[
                            tailwind('w-5/6 mt-4 rounded-md'),
                            {
                                borderWidth: 1,
                                borderColor: ColorScheme.Background.Greyed,
                            },
                        ]}>
                        <View
                            style={[
                                tailwind(
                                    `${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } p-4 justify-between`,
                                ),
                                {
                                    borderBottomWidth: 1,
                                    borderBottomColor:
                                        ColorScheme.Background.Greyed,
                                },
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    {color: ColorScheme.Text.DescText},
                                ]}>
                                {t('amount_sats')}
                            </Text>
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {formatSats(
                                    new BigNumber(props.amount as number),
                                )}
                            </Text>
                        </View>
                        <View
                            style={[
                                tailwind(
                                    `${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } p-4 justify-between`,
                                ),
                                props.description
                                    ? {
                                          borderBottomWidth: 1,
                                          borderBottomColor:
                                              ColorScheme.Background.Greyed,
                                      }
                                    : {},
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    {color: ColorScheme.Text.DescText},
                                ]}>
                                {props.kind === 'address'
                                    ? t('lightning_address')
                                    : t('node_id')}
                            </Text>
                            <Text
                                numberOfLines={2}
                                ellipsizeMode="middle"
                                style={[
                                    tailwind('text-sm w-1/2'),
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
                                style={[
                                    tailwind(
                                        `${
                                            langDir === 'right'
                                                ? 'flex-row-reverse'
                                                : 'flex-row'
                                        } p-4 justify-between`,
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        {color: ColorScheme.Text.DescText},
                                    ]}>
                                    {t('description')}
                                </Text>
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    {props.description}
                                </Text>
                            </View>
                        )}
                    </View>
                    {props.loadingPay && (
                        <View style={[tailwind('items-center mt-6 flex-row')]}>
                            <Text
                                style={[
                                    tailwind('text-sm mr-2'),
                                    {color: ColorScheme.Text.GrayedText},
                                ]}>
                                {props.kind === 'address'
                                    ? t('paying_ln_address')
                                    : t('paying_node_id')}
                            </Text>
                            <ActivityIndicator />
                        </View>
                    )}
                </View>

                <LongBottomButton
                    disabled={props.loadingPay}
                    onPress={props.authAndPay}
                    title={capitalizeFirst(t('pay'))}
                    textColor={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                />
            </View>
        </View>
    );
};

const SendLN = ({route}: Props) => {
    const navigation = useNavigation();
    const ColorScheme = Color(useColorScheme());
    const tailwind = useTailwind();

    const {breezEvent, isBiometricsActive} = useContext(AppStorageContext);
    const [loadingPay, setLoadingPay] = useState(false);

    const {t} = useTranslation('wallet');

    useEffect(() => {
        if (breezEvent.type === BreezEventVariant.PAYMENT_SUCCEED) {
            // Route to LN payment status screen
            navigation.dispatch(StackActions.popToTop());
            navigation.dispatch(
                CommonActions.navigate('LNTransactionStatus', {
                    status: true,
                    details: breezEvent.details,
                    detailsType: EBreezDetails.Success,
                }),
            );
            return;
        }

        if (breezEvent.type === BreezEventVariant.PAYMENT_FAILED) {
            // Route to LN payment status screen
            navigation.dispatch(StackActions.popToTop());
            navigation.dispatch(
                CommonActions.navigate('LNTransactionStatus', {
                    status: false,
                    details: breezEvent.details,
                    detailsType: EBreezDetails.Failed,
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
                    Toast.show({
                        topOffset: 54,
                        type: 'Liberal',
                        text1: t('Biometrics'),
                        text2: error.message,
                        visibilityTime: 1750,
                    });
                },
            );

            return;
        }

        togglePINPassModal();
    };

    const handlePayment = async () => {
        setLoadingPay(true);

        // Make payment
        if (manualKind === 'address') {
            // Make payment to address
            payLNAddress(
                manualText as string,
                manualAmount as number,
                manualDescription,
            );
        } else {
            // Make payment to Node ID
            payNodeID(
                manualText as string,
                manualAmount as number,
                manualDescription as string,
            );
        }
    };

    const payLNAddress = async (
        lnurlPayURL: string,
        amtSats: number,
        comment?: string,
    ) => {
        try {
            const input = await parseInput(lnurlPayURL);

            if (input.type === InputTypeVariant.LN_URL_ERROR) {
                throw new Error(t('not_ln_address'));
            }

            // LN Address
            if (input.type === InputTypeVariant.LN_URL_PAY) {
                const canComment = input.data.commentAllowed;

                // Note: min spendable is in Msat
                const minAmountSats = input.data.minSendable / 1_000;
                const amountMSats = amtSats * 1_000;

                if (amtSats < minAmountSats) {
                    Toast.show({
                        topOffset: 54,
                        type: 'Liberal',
                        text1: 'LNURL Pay Error',
                        text2: t('amount_below_min_spendable'),
                        visibilityTime: 1750,
                    });
                }

                await payLnurl({
                    data: input.data,
                    amountMsat: amountMSats,
                    comment: canComment ? comment || '' : '',
                });

                setLoadingPay(false);
            }
        } catch (error: any) {
            Toast.show({
                topOffset: 54,
                type: 'Liberal',
                text1: 'Lightning Address',
                text2: error.message,
                visibilityTime: 2100,
                onHide: () => {
                    navigation.dispatch(
                        CommonActions.navigate('WalletRoot', {
                            screen: 'WalletView',
                        }),
                    );
                },
            });

            setLoadingPay(false);
        }
    };

    const stringToBytes = (text: string) => {
        const encoder = new TextEncoder();

        return Array.from(encoder.encode(text));
    };

    const payNodeID = async (
        nodeID: string,
        amount: number,
        description: string,
    ) => {
        // Make payment to Node ID
        const amountMsat = amount * 1_000;
        const bytesValue = stringToBytes(description);

        try {
            const extraTlvs: TlvEntry[] = [
                {fieldNumber: 34349334, value: bytesValue},
            ];

            await sendSpontaneousPayment({
                nodeId: nodeID,
                amountMsat,
                extraTlvs,
            });

            setLoadingPay(false);
        } catch (err: any) {
            setLoadingPay(false);
        }
    };

    return (
        <SafeAreaView
            edges={['top', 'left', 'right', 'bottom']}
            style={[{backgroundColor: ColorScheme.Background.Primary}]}>
            <StatusBar barStyle={ColorScheme.BarStyle.Inverted} />
            <BottomSheetModalProvider>
                <View style={[tailwind('h-full w-full items-center')]}>
                    <View
                        style={[
                            tailwind(
                                'absolute top-6 w-full flex-row items-center justify-center',
                            ),
                            {zIndex: 999},
                        ]}>
                        <PlainButton
                            onPress={() =>
                                navigation.dispatch(StackActions.popToTop())
                            }
                            style={[tailwind('absolute left-6')]}>
                            <Close fill={ColorScheme.SVG.Default} />
                        </PlainButton>
                        <Text
                            style={[
                                tailwind('text-base font-bold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Send
                        </Text>
                    </View>

                    {!route.params?.lnManualPayload && <InputPanel />}

                    {route.params?.lnManualPayload && (
                        <SummaryPanel
                            authAndPay={authAndPay}
                            loadingPay={loadingPay}
                            amount={manualAmount}
                            kind={manualKind}
                            text={manualText}
                            description={manualDescription}
                        />
                    )}
                </View>

                <PINPass
                    pinPassRef={bottomPINPassRef}
                    triggerSuccess={handlePINSuccess}
                    onSelectPinPass={setPINIdx}
                    pinMode={false}
                />

                <Toast config={toastConfig as ToastConfig} />
            </BottomSheetModalProvider>
        </SafeAreaView>
    );
};

export default SendLN;

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
