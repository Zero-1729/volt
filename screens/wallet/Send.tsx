/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useContext, useEffect} from 'react';
import {
    StyleSheet,
    Text,
    View,
    useColorScheme,
    Platform,
    ActivityIndicator,
} from 'react-native';

import VText, {VTextSingle, VTextMulti} from '../../components/text';

import {SafeAreaView, Edges} from 'react-native-safe-area-context';

import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import {AppStorageContext} from '../../class/storageContext';
import {capitalizeFirst, normalizeFiat} from '../../modules/transform';
import BigNumber from 'bignumber.js';

import {psbtFromInvoice} from './../../modules/bdk';
import {getPrivateDescriptors} from './../../modules/descriptors';
import {TComboWallet} from '../../types/wallet';

import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import ExportPsbt from '../../components/psbt';
import {FiatBalance, Balance} from '../../components/balance';

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
import {conservativeAlert} from '../../components/alert';
import {PartiallySignedTransaction} from 'bdk-rn';
import NativeWindowMetrics from '../../constants/NativeWindowMetrics';
import {useTranslation} from 'react-i18next';
import {sendPayment} from '@breeztech/react-native-breez-sdk';
import {getScreenEdges} from '../../modules/screen';

type Props = NativeStackScreenProps<WalletParamList, 'Send'>;

const SendView = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const edges: Edges = getScreenEdges(route.params.source as string);

    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const [uPsbt, setUPsbt] = useState<PartiallySignedTransaction>();
    const [loadingPsbt, setLoadingPsbt] = useState(true);
    const [loading, setLoading] = useState(false);

    const {fiatRate, appFiatCurrency, isAdvancedMode, electrumServerURL} =
        useContext(AppStorageContext);

    const isLightning = !!route.params.bolt11;

    const screenTitle = isLightning
        ? t('lightning_invoice')
        : t('transaction_summary');
    const hasLabel = route.params.invoiceData?.options?.label;
    const hasMessage = isLightning
        ? isLightning
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

    const sats = route.params.bolt11?.amountMsat
        ? route.params.bolt11?.amountMsat / 1_000
        : route.params.invoiceData?.options?.amount || 0;

    const isMax = isLightning
        ? false
        : route.params.invoiceData?.options?.amount?.toString() ===
          route.params.wallet?.balance.toString();

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
        try {
            const bolt11 = route.params.bolt11;
            const result = await sendPayment({
                bolt11: bolt11?.bolt11 as string,
            });

            if (result.payment.status === 'complete') {
                setLoading(false);
            } else {
                conservativeAlert(
                    capitalizeFirst(t('error')),
                    result.payment.error as string,
                    capitalizeFirst(t('cancel')),
                );
                setLoading(false);
            }
        } catch (error: any) {
            conservativeAlert(
                capitalizeFirst(t('error')),
                error,
                capitalizeFirst(t('cancel')),
            );
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

    const bottomExportRef = React.useRef<BottomSheetModal>(null);
    const [openExport, setOpenExport] = useState(-1);

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
            const descriptors = getPrivateDescriptors(
                route.params.wallet.privateDescriptor,
            );

            const _uPsbt = (await psbtFromInvoice(
                descriptors,
                route.params.feeRate,
                route.params.invoiceData,
                route.params.wallet as TComboWallet,
                new BigNumber(route.params.wallet.balance),
                electrumServerURL,
                (e: any) => {
                    conservativeAlert(
                        capitalizeFirst(t('error')),
                        t('tx_fail_creation_error'),
                        capitalizeFirst(t('cancel')),
                    );

                    console.log(
                        '[Send] Error creating transaction: ',
                        e.message,
                    );

                    // Stop loading
                    setLoadingPsbt(false);
                },
            )) as PartiallySignedTransaction;

            setUPsbt(_uPsbt);
            setLoadingPsbt(false);
        }
    };

    useEffect(() => {
        // Create Psbt if onchain
        if (!route.params.bolt11) {
            loadUPsbt();
        }
    }, []);

    return (
        <SafeAreaView edges={edges}>
            <View
                style={[tailwind('w-full h-full items-center justify-center')]}>
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
                                navigation.dispatch(StackActions.popToTop())
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
                    </View>
                    <View
                        style={[
                            tailwind(
                                '-mt-12 items-center w-full h-4/6 relative',
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
                                    {t('amount')}
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
                                    balance={sats}
                                    loading={false}
                                    balanceFontSize={'text-4xl'}
                                    fontColor={ColorScheme.Text.Default}
                                    ignoreHideBalance={true}
                                />
                            )}
                            {!isMax && (
                                <Balance
                                    loading={false}
                                    disableFiat={true}
                                    balance={sats}
                                    balanceFontSize={'text-sm'}
                                    fontColor={ColorScheme.Text.DescText}
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

                        {(hasLabel || isLightning) && (
                            <View
                                style={[
                                    tailwind('justify-between w-4/5 mt-4'),
                                ]}>
                                {hasLabel && (
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
                        (!isLightning && loadingPsbt)) && (
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
                    <LongBottomButton
                        disabled={loading || (!isLightning && loadingPsbt)}
                        onPress={handleSend}
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
