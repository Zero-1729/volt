/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    useState,
    useContext,
    useEffect,
    useRef,
    useCallback,
} from 'react';
import {
    StyleSheet,
    Text,
    View,
    useColorScheme,
    Platform,
    ActivityIndicator,
    StatusBar,
} from 'react-native';

import VText, {VTextSingle, VTextMulti} from '../../components/text';

import {SafeAreaView} from 'react-native-safe-area-context';

import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import {AppStorageContext} from '../../class/storageContext';
import {capitalizeFirst, normalizeFiat} from '../../modules/transform';
import BigNumber from 'bignumber.js';

import {
    createBDKWallet,
    psbtFromInvoice,
    syncBdkWallet,
} from './../../modules/bdk';
import {getPrivateDescriptors} from './../../modules/descriptors';
import {TComboWallet} from '../../types/wallet';

import ExportPsbt from '../../components/psbt';
import {FiatBalance, DisplaySatsAmount} from '../../components/balance';

import {
    useNavigation,
    StackActions,
    CommonActions,
} from '@react-navigation/native';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import {PlainButton, LongBottomButton} from '../../components/button';

import Close from '../../assets/svg/x-24.svg';
import ShareIcon from '../../assets/svg/share-24.svg';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';
import {Address, PartiallySignedTransaction} from 'bdk-rn';
import NativeWindowMetrics from '../../constants/NativeWindowMetrics';
import {useTranslation} from 'react-i18next';
import {
    sendPayment,
    BreezEventVariant,
    nodeInfo,
} from '@breeztech/react-native-breez-sdk';
import {EBreezDetails, ENet} from '../../types/enums';
import ExpiryTimer from '../../components/expiry';

import Toast from 'react-native-toast-message';

import {
    isInvoiceExpired,
    getCountdownStart,
    checkNetworkIsReachable,
} from '../../modules/wallet-utils';

import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {biometricAuth} from '../../modules/shared';
import PINPass from '../../components/pinpass';

import netInfo from '@react-native-community/netinfo';

type Props = NativeStackScreenProps<WalletParamList, 'Send'>;

const SendView = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const [uPsbt, setUPsbt] = useState<PartiallySignedTransaction>();
    const [loadingPsbt, setLoadingPsbt] = useState(true);
    const [loading, setLoading] = useState(false);

    const {
        fiatRate,
        appFiatCurrency,
        isAdvancedMode,
        electrumServerURL,
        breezEvent,
        isBiometricsActive,
    } = useContext(AppStorageContext);

    const isLightning = !!route.params.bolt11;

    const isExpired = isInvoiceExpired(
        route.params.bolt11?.timestamp as number,
        route.params.bolt11?.expiry as number,
    );

    const expiryEpoch = getCountdownStart(
        route.params.bolt11?.timestamp as number,
        route.params.bolt11?.expiry as number,
    );

    const screenTitle = isLightning
        ? t('lightning_invoice')
        : t('transaction_summary');
    const hasLabel = route.params.invoiceData?.options?.label ?? '';
    const hasMessage = isLightning
        ? route.params.bolt11.description
        : route.params.invoiceData?.options?.message;
    const messageTitle = isLightning
        ? capitalizeFirst(t('invoice_description'))
        : capitalizeFirst(t('message'));
    const messageText = isLightning
        ? route.params.bolt11.description
        : route.params.invoiceData?.options?.message;
    const loadingMessage = isLightning
        ? t('paying')
        : `${capitalizeFirst(t('generating'))} ${
              isAdvancedMode
                  ? t('psbt').toUpperCase()
                  : capitalizeFirst(t('transaction'))
          }...`;

    const sats = new BigNumber(
        isLightning
            ? (route.params.bolt11?.amountMsat as number) / 1_000
            : route.params.invoiceData?.options?.amount || 0,
    );

    const [paymentToSelf, setPaymentToSelf] = useState(true);
    const [paySelfMessage, setPaySelfMessage] = useState('');
    const [alreadyPaidInvoice, setAlreadyPaidInvoice] = useState(false);

    const bottomExportRef = useRef<BottomSheetModal>(null);
    const bottomPINPassRef = useRef<BottomSheetModal>(null);
    const [openExport, setOpenExport] = useState(-1);
    const [pinIdx, setPINIdx] = useState(-1);

    const togglePINPassModal = () => {
        if (pinIdx !== 1) {
            bottomPINPassRef.current?.present();
        } else {
            bottomPINPassRef.current?.close();
        }
    };

    const handlePINSuccess = async () => {
        handleSend();
        bottomPINPassRef.current?.close();
    };

    const authAndPay = () => {
        if (isBiometricsActive) {
            biometricAuth(
                success => {
                    if (success) {
                        handleSend();
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

    // Note: this is just a match check to determine if 'Max' entered in prev screen.
    // For onchain BDK will handle max
    // For Breez, we need to do some work
    const isMax = isLightning
        ? route.params.wallet?.balanceLightning ===
          (route.params.bolt11?.amountMsat as number) / 1_000
        : route.params.invoiceData?.options?.amount?.toString() ===
          route.params.wallet?.balanceOnchain.toString();

    const createTransaction = async () => {
        // Navigate to status screen
        navigation.dispatch(
            CommonActions.navigate({
                name: 'TransactionStatus',
                params: {
                    unsignedPsbt: uPsbt?.base64,
                    wallet: route.params.wallet,
                    network: route.params.wallet?.network,
                },
            }),
        );
    };

    const handleBolt11Payment = async () => {
        // Handle if wallet broke and warn
        const walletBalanceLN = route.params.wallet?.balanceLightning as number;
        const bolt11AmountSats =
            (route.params.bolt11?.amountMsat as number) / 1_000;

        if (walletBalanceLN < bolt11AmountSats) {
            Toast.show({
                topOffset: 54,
                type: 'Liberal',
                text1: capitalizeFirst(t('error')),
                text2: t('ln_insufficient_funds'),
                visibilityTime: 1750,
            });

            setLoading(false);
            return;
        }

        try {
            const bolt11 = route.params.bolt11;
            const result = await sendPayment({
                bolt11: bolt11?.bolt11 as string,
            });

            if (result.payment.status === 'complete') {
                setLoading(false);
            } else {
                Toast.show({
                    topOffset: 54,
                    type: 'Liberal',
                    text1: capitalizeFirst(t('error')),
                    text2: result.payment.error as string,
                    visibilityTime: 2000,
                });
                setLoading(false);
                console.log(
                    '[Send] Error sending payment: ',
                    result.payment.error,
                );
            }
        } catch (error: any) {
            if (error.message === 'Invoice already paid') {
                setAlreadyPaidInvoice(true);
            }
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (isLightning) {
            setLoading(true);
            handleBolt11Payment();
        } else {
            createTransaction();
        }
    };

    const openExportModal = () => {
        if (openExport !== 1) {
            bottomExportRef.current?.present();
        } else {
            bottomExportRef.current?.close();
        }
    };

    const exportUPsbt = async () => {
        // Sign the psbt adn write to file
        // Get txid and use it with wallet name to create a unique file name
        const txid = await uPsbt?.txid();

        let status = true;
        let errorMsg = '';

        const pathData =
            RNFS.TemporaryDirectoryPath +
            `/${txid}-${route.params.wallet?.name}.json`;

        const fileExportData = (await uPsbt?.jsonSerialize()) || '';

        if (Platform.OS === 'ios') {
            await RNFS.writeFile(pathData, fileExportData, 'utf8').catch(e => {
                errorMsg = e.message;
                status = false;
            });

            await Share.open({
                url: 'file://' + pathData,
                type: 'text/plain',
                title: 'PSBT export',
            })
                .catch(e => {
                    if (e.message !== 'User did not share') {
                        errorMsg = e.message;
                        status = false;
                    }
                })
                .finally(() => {
                    RNFS.unlink(pathData);
                });
        } else {
            errorMsg = 'Not yet implemented on Android';
            status = false;
        }

        bottomExportRef.current?.close();

        // Navigate to status screen
        navigation.dispatch(
            CommonActions.navigate({
                name: 'TransactionExported',
                params: {
                    status: status,
                    errorMsg: errorMsg,
                    fname: 'file://' + pathData,
                },
            }),
        );
    };

    const loadUPsbt = async () => {
        if (route.params.wallet) {
            // Check if payment is to self first
            await checkIfSelfOnchain();

            if (paymentToSelf) {
                setLoadingPsbt(false);
                return;
            }

            const descriptors = getPrivateDescriptors(
                route.params.wallet.privateDescriptor,
            );

            const _uPsbt = (await psbtFromInvoice(
                descriptors,
                route.params.feeRate,
                route.params.invoiceData,
                route.params.wallet as TComboWallet,
                new BigNumber(route.params.wallet.balanceOnchain),
                electrumServerURL,
                (error: any) => {
                    Toast.show({
                        topOffset: 54,
                        type: 'Liberal',
                        text1: capitalizeFirst(t('error')),
                        text2: t('tx_fail_creation_error'),
                        visibilityTime: 2000,
                    });

                    console.log(
                        '[Send] Error creating transaction: ',
                        error.message,
                    );

                    // Stop loading
                    setLoadingPsbt(false);
                },
            )) as PartiallySignedTransaction;

            setUPsbt(_uPsbt);
            setLoadingPsbt(false);
        }
    };

    const checkIfSelfLN = useCallback(async () => {
        const _bolt11 = route.params.bolt11;
        const _nodeID = await nodeInfo();

        // Check if bolt11 is self
        if (_bolt11?.payeePubkey !== _nodeID.id) {
            setPaymentToSelf(false);
        } else {
            setPaySelfMessage(t('payment_to_self_detected'));
        }
    }, []);

    const checkIfSelfOnchain = useCallback(async () => {
        const _netInfo = await netInfo.fetch();

        if (!checkNetworkIsReachable(_netInfo)) {
            return;
        }

        const wallet = route.params.wallet;
        const network =
            wallet?.network === 'testnet' ? ENet.Testnet : ENet.Bitcoin;

        try {
            let _w = await createBDKWallet(wallet as TComboWallet);
            _w = await syncBdkWallet(_w, () => {}, network, electrumServerURL);

            const bdkAddr = await new Address().create(
                route.params.invoiceData.address,
            );
            const script = await bdkAddr.scriptPubKey();

            const isOwnedByYou = await _w.isMine(script);

            if (isOwnedByYou) {
                setPaySelfMessage(t('payment_to_self_detected'));
            } else {
                setPaymentToSelf(false);
            }
        } catch (error: any) {}
    }, []);

    useEffect(() => {
        // Create Psbt if onchain
        if (!route.params.bolt11) {
            loadUPsbt();
        } else {
            checkIfSelfLN();
        }
    }, []);

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

    return (
        <SafeAreaView
            edges={['bottom', 'top', 'left', 'right']}
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <StatusBar barStyle={ColorScheme.BarStyle.Inverted} />
            <View
                style={[
                    tailwind('w-full h-full items-center justify-center'),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <BottomSheetModalProvider>
                    <View
                        style={[
                            tailwind(
                                'absolute top-6 w-full flex-row items-center justify-center',
                            ),
                        ]}>
                        {!loadingPsbt && (
                            <PlainButton
                                style={[tailwind('absolute right-6')]}
                                onPress={openExportModal}>
                                <ShareIcon
                                    width={32}
                                    fill={ColorScheme.SVG.Default}
                                />
                            </PlainButton>
                        )}
                        <PlainButton
                            onPress={() =>
                                navigation.dispatch(
                                    CommonActions.navigate('HomeScreen'),
                                )
                            }
                            style={[tailwind('absolute z-10 left-6')]}>
                            <Close fill={ColorScheme.SVG.Default} />
                        </PlainButton>

                        <Text
                            style={[
                                tailwind('text-sm font-bold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {screenTitle}
                        </Text>

                        {isLightning && (
                            <View
                                style={[
                                    tailwind('absolute right-6 justify-center'),
                                ]}>
                                <ExpiryTimer expiryDate={expiryEpoch} />
                            </View>
                        )}
                    </View>
                    <View
                        style={[
                            tailwind(
                                `-mt-12 items-center w-full h-4/6 relative ${
                                    isLightning && !hasMessage
                                        ? 'justify-center'
                                        : ''
                                }`,
                            ),
                        ]}>
                        <View style={[tailwind('items-center')]}>
                            <View style={[tailwind('items-center flex-row')]}>
                                <Text
                                    style={[
                                        tailwind('text-base mb-1'),
                                        {
                                            color: ColorScheme.Text.GrayedText,
                                        },
                                    ]}>
                                    {capitalizeFirst(t('amount'))}
                                </Text>
                            </View>
                            {isMax && (
                                <Text
                                    style={[
                                        tailwind('text-4xl'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    {capitalizeFirst(t('max'))}
                                </Text>
                            )}
                            {!isMax && (
                                <FiatBalance
                                    balance={sats.toNumber()}
                                    loading={false}
                                    balanceFontSize={'text-4xl'}
                                    fontColor={ColorScheme.Text.Default}
                                    ignoreHideBalance={true}
                                />
                            )}
                            {!isMax && (
                                <DisplaySatsAmount
                                    amount={sats}
                                    fontSize={'text-sm'}
                                    textColor={ColorScheme.Text.DescText}
                                />
                            )}
                        </View>

                        {!isLightning && (
                            <View style={[tailwind('mt-12 w-4/5')]}>
                                <PlainButton onPress={() => {}}>
                                    <View
                                        style={[
                                            tailwind(
                                                'items-center flex-row mb-1',
                                            ),
                                        ]}>
                                        <VText
                                            style={[
                                                tailwind('text-sm w-full mr-2'),
                                                {
                                                    color: ColorScheme.Text
                                                        .GrayedText,
                                                },
                                            ]}>
                                            {capitalizeFirst(t('address'))}
                                        </VText>
                                    </View>
                                </PlainButton>
                                <VText
                                    style={[
                                        tailwind('text-sm'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    {route.params.invoiceData?.address}
                                </VText>
                            </View>
                        )}

                        {!isLightning && (
                            <View
                                style={[
                                    tailwind(
                                        `mt-6 items-center justify-between w-4/5 ${
                                            langDir === 'right'
                                                ? 'flex-row-reverse'
                                                : 'flex-row'
                                        }`,
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind('text-sm font-bold'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    {capitalizeFirst(t('fee'))}
                                </Text>

                                <View
                                    style={[
                                        tailwind(
                                            `flex ${
                                                langDir === 'right'
                                                    ? 'flex-row-reverse'
                                                    : 'flex-row'
                                            } justify-center items-center`,
                                        ),
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind(
                                                'text-sm px-2 mr-2 rounded-full',
                                            ),
                                            {
                                                color: ColorScheme.Text
                                                    .GrayText,
                                            },
                                        ]}>
                                        {`${
                                            appFiatCurrency.symbol
                                        } ${normalizeFiat(
                                            new BigNumber(
                                                route.params.feeRate *
                                                    route.params.dummyPsbtVSize,
                                            ),
                                            new BigNumber(fiatRate.rate),
                                        )}`}
                                    </Text>

                                    <View
                                        style={[
                                            tailwind(
                                                'items-center justify-center rounded-full px-4 py-1',
                                            ),
                                            {
                                                backgroundColor:
                                                    ColorScheme.Background
                                                        .Inverted,
                                            },
                                        ]}>
                                        <Text
                                            style={[
                                                tailwind('text-sm'),
                                                {
                                                    color: ColorScheme.Text.Alt,
                                                },
                                            ]}>
                                            {`${route.params.feeRate} ${t(
                                                'sat_vbyte',
                                            )}`}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {(hasLabel.length > 0 || isLightning) && (
                            <View
                                style={[
                                    tailwind('justify-between w-4/5 mt-4'),
                                ]}>
                                {hasLabel.length > 0 && (
                                    <View
                                        style={[
                                            tailwind(
                                                `${
                                                    langDir === 'right'
                                                        ? 'flex-row-reverse'
                                                        : 'flex-row'
                                                } justify-between`,
                                            ),
                                        ]}>
                                        <VText
                                            style={[
                                                tailwind('text-sm font-bold'),
                                                {
                                                    color: ColorScheme.Text
                                                        .Default,
                                                },
                                            ]}>
                                            {capitalizeFirst(t('label'))}
                                        </VText>

                                        <VTextSingle
                                            style={[
                                                tailwind(
                                                    'text-sm w-3/5 text-right',
                                                ),
                                                {
                                                    color: ColorScheme.Text
                                                        .DescText,
                                                },
                                            ]}>
                                            {
                                                route.params.invoiceData
                                                    ?.options?.label
                                            }
                                        </VTextSingle>
                                    </View>
                                )}

                                {hasMessage && (
                                    <View
                                        style={[
                                            styles.invoiceMessage,
                                            tailwind('w-full mt-6'),
                                        ]}>
                                        <VText
                                            style={[
                                                tailwind(
                                                    'text-sm mb-4 font-bold',
                                                ),
                                                {
                                                    color: ColorScheme.Text
                                                        .Default,
                                                },
                                            ]}>
                                            {messageTitle}
                                        </VText>
                                        <VTextMulti
                                            style={[
                                                tailwind('text-sm'),
                                                {
                                                    color: ColorScheme.Text
                                                        .DescText,
                                                },
                                            ]}>
                                            {messageText}
                                        </VTextMulti>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {((isLightning && loading) ||
                        (!isLightning && loadingPsbt)) &&
                        !paySelfMessage && (
                            <View
                                style={[
                                    tailwind('absolute'),
                                    {
                                        bottom:
                                            NativeWindowMetrics.bottomButtonOffset +
                                            76,
                                    },
                                ]}>
                                <ActivityIndicator
                                    style={[tailwind('mb-4')]}
                                    size={'small'}
                                    color={ColorScheme.Text.Default}
                                />
                                <Text
                                    style={[
                                        tailwind('text-sm'),
                                        {color: ColorScheme.Text.GrayedText},
                                    ]}>
                                    {loadingMessage}
                                </Text>
                            </View>
                        )}

                    {isLightning && paySelfMessage && (
                        <View
                            style={[
                                tailwind(
                                    `mt-6 w-full ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } items-center justify-center absolute`,
                                ),
                                {
                                    bottom:
                                        NativeWindowMetrics.bottomButtonOffset +
                                        76,
                                },
                            ]}>
                            <VText
                                style={[
                                    tailwind('text-sm text-center w-5/6'),
                                    {
                                        color: ColorScheme.Text.DescText,
                                    },
                                ]}>
                                {paySelfMessage}
                            </VText>
                        </View>
                    )}

                    {isLightning && alreadyPaidInvoice && (
                        <View
                            style={[
                                tailwind(
                                    `mt-6 w-full ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } items-center justify-center absolute`,
                                ),
                                {
                                    bottom:
                                        NativeWindowMetrics.bottomButtonOffset +
                                        76,
                                },
                            ]}>
                            <VText
                                style={[
                                    tailwind('text-sm text-center w-5/6'),
                                    {
                                        color: ColorScheme.Text.DescText,
                                    },
                                ]}>
                                {t('already_paid_ln_invoice')}
                            </VText>
                        </View>
                    )}

                    <LongBottomButton
                        disabled={
                            loading ||
                            (!isLightning && loadingPsbt) ||
                            isExpired ||
                            paymentToSelf ||
                            alreadyPaidInvoice
                        }
                        onPress={authAndPay}
                        title={capitalizeFirst(t('send'))}
                        textColor={ColorScheme.Text.Alt}
                        backgroundColor={ColorScheme.Background.Inverted}
                    />

                    <View style={[tailwind('absolute bottom-0')]}>
                        <ExportPsbt
                            exportRef={bottomExportRef}
                            triggerExport={exportUPsbt}
                            onSelectExport={idx => {
                                setOpenExport(idx);
                            }}
                        />
                    </View>

                    <PINPass
                        pinPassRef={bottomPINPassRef}
                        triggerSuccess={handlePINSuccess}
                        onSelectPinPass={setPINIdx}
                        pinMode={false}
                    />
                </BottomSheetModalProvider>
            </View>
        </SafeAreaView>
    );
};

export default SendView;

const styles = StyleSheet.create({
    invoiceMessage: {
        height: 128,
    },
});
