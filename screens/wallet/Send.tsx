/* eslint-disable react-hooks/exhaustive-deps */
import React, {useCallback, useEffect, useState, useContext} from 'react';
import {
    StyleSheet,
    Text,
    View,
    useColorScheme,
    Platform,
    ActivityIndicator,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {getFeeRates} from '../../modules/mempool';
import {TMempoolFeeRates} from '../../types/wallet';
import {constructPSBT} from '../../modules/bdk';
import {getPrivateDescriptors} from '../../modules/descriptors';
import {TComboWallet} from '../../types/wallet';
import {PartiallySignedTransaction} from 'bdk-rn';

import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import NativeWindowMetrics from '../../constants/NativeWindowMetrics';

import {AppStorageContext} from '../../class/storageContext';
import {normalizeFiat} from '../../modules/transform';
import BigNumber from 'bignumber.js';

import {BottomSheetModal} from '@gorhom/bottom-sheet';
import FeeModal from '../../components/fee';
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
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {conservativeAlert} from '../../components/alert';

type Props = NativeStackScreenProps<WalletParamList, 'Send'>;

const SendView = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const [PSBTFee, setPSBTFee] = useState<BigNumber>();
    const [uPsbt, setUPsbt] = useState<PartiallySignedTransaction>();
    const [feeRates, setFeeRates] = useState<TMempoolFeeRates>({
        fastestFee: 2,
        halfHourFee: 1,
        hourFee: 1,
        economyFee: 1,
        minimumFee: 1,
    });
    const [selectedFeeRate, setSelectedFeeRate] = useState<number>(1);
    const [loadingPSBT, setLoadingPSBT] = useState<boolean>(true);

    const {electrumServerURL, fiatRate, appFiatCurrency, isAdvancedMode} =
        useContext(AppStorageContext);

    const sats = route.params.invoiceData.options?.amount || 0;

    const isMax =
        route.params.invoiceData.options?.amount?.toString() ===
        route.params.wallet.balance.toString();

    const createTransaction = async () => {
        // Navigate to status screen
        navigation.dispatch(
            CommonActions.navigate({
                name: 'TransactionStatus',
                params: {
                    unsignedPsbt: uPsbt?.base64,
                    wallet: route.params.wallet,
                    network: route.params.wallet.network,
                },
            }),
        );
    };

    const bottomFeeRef = React.useRef<BottomSheetModal>(null);
    const bottomExportRef = React.useRef<BottomSheetModal>(null);
    const [openModal, setOpenModal] = useState(-1);
    const [openExport, setOpenExport] = useState(-1);

    const openExportModal = () => {
        if (openExport !== 1) {
            bottomExportRef.current?.present();
        } else {
            bottomExportRef.current?.close();
        }
    };

    const openFeeModal = () => {
        if (openModal !== 1) {
            bottomFeeRef.current?.present();
        } else {
            bottomFeeRef.current?.close();
        }
    };

    // Get fee based on PSBT
    const calculatePSBTFee = async () => {
        try {
            const descriptors = getPrivateDescriptors(
                route.params.wallet.privateDescriptor,
            );

            let wallet = {
                ...route.params.wallet,
                externalDescriptor: descriptors.external,
                internalDescriptor: descriptors.internal,
            };

            const _psbt = await constructPSBT(
                sats.toString(),
                route.params.invoiceData.address,
                Number(selectedFeeRate) || 1,
                sats.toString() === route.params.wallet.balance.toString(),
                wallet as TComboWallet,
                electrumServerURL,
            );

            if (!_psbt) {
                conservativeAlert('Fee', 'Error fetching fee.');
                return;
            }

            // Grab fee amount
            const feeAmount = new BigNumber(await _psbt.feeAmount());

            // set PSBT info
            setUPsbt(_psbt);
            setPSBTFee(feeAmount);
            setLoadingPSBT(false);
        } catch (e: any) {
            conservativeAlert(
                'Error',
                `Error creating transaction. ${
                    isAdvancedMode ? e.message : ''
                }`,
            );

            // Clear loading and revert to wallet screen
            setLoadingPSBT(false);
            navigation.dispatch(StackActions.popToTop());
        }
    };

    const fetchFeeRates = async () => {
        let rates = feeRates;

        try {
            const fetchedRates = await getFeeRates(route.params.wallet.network);

            rates = fetchedRates as TMempoolFeeRates;
        } catch (e: any) {
            // Error assumed to be 503; mempool unavailable due to sync
            conservativeAlert(
                'Fee rate',
                'Error fetching fee rates, service unavailable.',
            );
        }

        // Set the fee rate from modal or use fastest
        setSelectedFeeRate(rates.fastestFee);
        setFeeRates(rates);
    };

    const exportUPsbt = async () => {
        if (!uPsbt) {
            conservativeAlert('Error', 'No PSBT data to export.');
            return;
        }

        // Sign the psbt adn write to file
        // Get txid and use it with wallet name to create a unique file name
        const txid = await uPsbt.txid();
        let pathData =
            RNFS.TemporaryDirectoryPath +
            `/${txid}-${route.params.wallet.name}.json`;

        const fileBackupData = (await uPsbt.jsonSerialize()) || '';

        if (Platform.OS === 'ios') {
            await RNFS.writeFile(pathData, fileBackupData, 'utf8').catch(e => {
                conservativeAlert('Error', e.message);
            });
            await Share.open({
                url: 'file://' + pathData,
                type: 'text/plain',
                title: 'Volt Wallet Descriptor Backup',
            })
                .catch(e => {
                    if (e.message !== 'User did not share') {
                        conservativeAlert('Error', e.message);
                    }
                })
                .finally(() => {
                    RNFS.unlink(pathData);
                });
        } else {
            conservativeAlert('Export', 'Not yet implemented on Android');
        }

        bottomExportRef.current?.close();
    };

    useEffect(() => {
        fetchFeeRates();

        calculatePSBTFee();
    }, []);

    const updateFeeRate = (fee: number) => {
        setSelectedFeeRate(fee);

        bottomFeeRef.current?.close();
    };

    const memoizedUpdateFeeRate = useCallback(updateFeeRate, []);

    return (
        <SafeAreaView edges={['bottom', 'left', 'right']}>
            <View
                style={[tailwind('w-full h-full items-center justify-center')]}>
                <BottomSheetModalProvider>
                    <View
                        style={[
                            tailwind(
                                'absolute top-6 w-full flex-row items-center justify-center',
                            ),
                        ]}>
                        {isAdvancedMode && PSBTFee ? (
                            <PlainButton
                                style={[tailwind('absolute right-6')]}
                                onPress={openExportModal}>
                                <ShareIcon
                                    width={32}
                                    fill={ColorScheme.SVG.Default}
                                />
                            </PlainButton>
                        ) : (
                            <></>
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
                            Transaction Summary
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
                                    Amount
                                </Text>
                            </View>
                            {isMax && (
                                <Text
                                    style={[
                                        tailwind('text-4xl'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    Max
                                </Text>
                            )}
                            {!isMax && (
                                <FiatBalance
                                    balance={sats}
                                    loading={false}
                                    balanceFontSize={'text-4xl'}
                                    fontColor={ColorScheme.Text.Default}
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

                        <View style={[tailwind('mt-12 w-4/5')]}>
                            <PlainButton onPress={() => {}}>
                                <View
                                    style={[
                                        tailwind('items-center flex-row mb-1'),
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind('text-sm mr-2'),
                                            {
                                                color: ColorScheme.Text
                                                    .GrayedText,
                                            },
                                        ]}>
                                        Address
                                    </Text>
                                </View>
                            </PlainButton>
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {route.params.invoiceData.address}
                            </Text>
                        </View>

                        {PSBTFee ? (
                            <View
                                style={[
                                    tailwind(
                                        'mt-6 items-center justify-between w-4/5 flex-row',
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind('text-sm font-bold'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    Fee
                                </Text>

                                <View
                                    style={[
                                        tailwind(
                                            'flex flex-row justify-center items-center',
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
                                        {PSBTFee
                                            ? `${
                                                  appFiatCurrency.symbol
                                              } ${normalizeFiat(
                                                  PSBTFee,
                                                  new BigNumber(fiatRate.rate),
                                              )}`
                                            : `${appFiatCurrency.symbol} ...`}
                                    </Text>

                                    <PlainButton
                                        style={[
                                            tailwind(
                                                'items-center justify-center',
                                            ),
                                        ]}
                                        onPress={openFeeModal}>
                                        <View
                                            style={[
                                                tailwind(
                                                    'rounded-full px-4 py-1',
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
                                                        color: ColorScheme.Text
                                                            .Alt,
                                                    },
                                                ]}>
                                                {`${selectedFeeRate} sat/vB`}
                                            </Text>
                                        </View>
                                    </PlainButton>
                                </View>
                            </View>
                        ) : (
                            <></>
                        )}

                        {route.params.invoiceData.options?.label ? (
                            <View
                                style={[
                                    tailwind('justify-between w-4/5 mt-4'),
                                ]}>
                                {route.params.invoiceData.options.label ? (
                                    <View
                                        style={[
                                            tailwind(
                                                'flex-row justify-between',
                                            ),
                                        ]}>
                                        <Text
                                            style={[
                                                tailwind('text-sm font-bold'),
                                                {
                                                    color: ColorScheme.Text
                                                        .Default,
                                                },
                                            ]}>
                                            Label
                                        </Text>

                                        <Text
                                            numberOfLines={1}
                                            ellipsizeMode={'middle'}
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
                                                route.params.invoiceData.options
                                                    ?.label
                                            }
                                        </Text>
                                    </View>
                                ) : (
                                    <></>
                                )}

                                {route.params.invoiceData.options.message ? (
                                    <View
                                        style={[
                                            styles.invoiceMessage,
                                            tailwind('w-full mt-6'),
                                        ]}>
                                        <Text
                                            style={[
                                                tailwind(
                                                    'text-sm mb-4 font-bold',
                                                ),
                                                {
                                                    color: ColorScheme.Text
                                                        .Default,
                                                },
                                            ]}>
                                            Message
                                        </Text>
                                        <Text
                                            numberOfLines={4}
                                            ellipsizeMode={'middle'}
                                            style={[
                                                tailwind('text-sm'),
                                                {
                                                    color: ColorScheme.Text
                                                        .DescText,
                                                },
                                            ]}>
                                            {
                                                route.params.invoiceData.options
                                                    ?.message
                                            }
                                        </Text>
                                    </View>
                                ) : (
                                    <></>
                                )}
                            </View>
                        ) : (
                            <></>
                        )}
                    </View>

                    {loadingPSBT ? (
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
                                size="small"
                                color={ColorScheme.SVG.Default}
                            />
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    {color: ColorScheme.Text.GrayedText},
                                ]}>
                                {`'Generating ${
                                    isAdvancedMode ? 'PSBT' : 'transaction'
                                }...'`}
                            </Text>
                        </View>
                    ) : (
                        <></>
                    )}

                    <LongBottomButton
                        disabled={PSBTFee === undefined}
                        onPress={createTransaction}
                        title={'Send'}
                        textColor={ColorScheme.Text.Alt}
                        backgroundColor={ColorScheme.Background.Inverted}
                    />

                    {/* Fee Modal */}
                    <View style={[tailwind('absolute bottom-0')]}>
                        <FeeModal
                            feeRef={bottomFeeRef}
                            feeRates={feeRates}
                            setFeeRate={memoizedUpdateFeeRate}
                            onUpdate={idx => {
                                setOpenModal(idx);
                            }}
                        />
                    </View>

                    {isAdvancedMode && PSBTFee ? (
                        <View style={[tailwind('absolute bottom-0')]}>
                            <ExportPsbt
                                exportRef={bottomExportRef}
                                triggerExport={exportUPsbt}
                                onSelectExport={idx => {
                                    setOpenExport(idx);
                                }}
                            />
                        </View>
                    ) : (
                        <></>
                    )}
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
