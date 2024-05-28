/* eslint-disable react-native/no-inline-styles */
import {Text, View, useColorScheme, Linking, StyleSheet} from 'react-native';
import React, {useContext, useEffect, useRef, useState} from 'react';

import {useNavigation, CommonActions} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';
import Clipboard from '@react-native-clipboard/clipboard';

import {AppStorageContext} from '../../class/storageContext';

import {SafeAreaView, Edges} from 'react-native-safe-area-context';

import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';

import Toast from 'react-native-toast-message';

import BumpFee from '../../components/bump';

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../../constants/Haptic';

import {useTailwind} from 'tailwind-rn';
import Color from '../../constants/Color';

import {ENet} from '../../types/enums';

import NativeWindowMetrics from '../../constants/NativeWindowMetrics';

import {
    LongBottomButton,
    LongButton,
    PlainButton,
} from '../../components/button';
import {FiatBalance} from '../../components/balance';

import {useTranslation} from 'react-i18next';

import CloseIcon from '../../assets/svg/x-24.svg';
import Success from '../../assets/svg/check-circle-fill-24.svg';
import Failed from '../../assets/svg/x-circle-fill-24.svg';
import Pending from '../../assets/svg/hourglass-24.svg';
import Broadcasted from '../../assets/svg/megaphone-24.svg';
import CopyIcon from '../../assets/svg/copy-16.svg';
import SwapIcon from '../../assets/svg/arrow-switch-24.svg';

import {
    capitalizeFirst,
    formatLocaleDate,
    formatSats,
    i18nNumber,
} from '../../modules/transform';
import {getScreenEdges} from '../../modules/screen';
import BigNumber from 'bignumber.js';

import {nodeInfo, LnPaymentDetails} from '@breeztech/react-native-breez-sdk';
import {
    SWAP_IN_LN_DESCRIPTION,
    SWAP_OUT_LN_DESCRIPTION,
} from '../../modules/wallet-defaults';

type Props = NativeStackScreenProps<WalletParamList, 'TransactionDetails'>;

const TransactionDetailsView = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const HeadingBar = {
        height: 2,
        backgroundColor: ColorScheme.Background.CardGreyed,
    };

    const {t, i18n} = useTranslation('wallet');
    const {t: e} = useTranslation('errors');

    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const bumpFeeRef = useRef<BottomSheetModal>(null);
    const [openBump, setOpenBump] = useState(-1);

    const navigation = useNavigation();

    const {isAdvancedMode} = useContext(AppStorageContext);

    const [clippyData, setClippyData] = React.useState<string>('');
    const [nodeId, setNodeId] = React.useState<string>('');

    const buttonText = isAdvancedMode ? t('view_on_mempool') : t('see_more');

    const displayFeeBump =
        !route.params.tx.confirmed &&
        route.params.tx.rbf &&
        !route.params.tx.received;

    const openBumpFee = () => {
        if (openBump !== 1) {
            bumpFeeRef.current?.present();
        } else {
            bumpFeeRef.current?.close();
        }
    };

    const isLNTx = route.params.tx.isLightning;
    const invoiceAmount = isLNTx
        ? route.params.tx.amountMsat / 1000
        : route.params.tx.value;
    const txInbound = isLNTx
        ? route.params.tx.paymentType === 'received'
        : route.params.tx.type === 'inbound';

    const getTxTimestamp = (time: number) => {
        return formatLocaleDate(i18n.language, time);
    };

    const titleDescText = isLNTx
        ? getTxTimestamp(route.params.tx.paymentTime)
        : route.params.tx.confirmed
        ? getTxTimestamp(route.params.tx.timestamp)
        : t('pending');

    const txIdTitle = isLNTx ? 'ID' : 'Tx ID';
    const txId = isLNTx ? route.params.tx.id : route.params.tx.txid;
    const txFee = new BigNumber(
        isLNTx ? route.params.tx.feeMsat / 1000 : route.params.tx.fee,
    );

    const isSwapInTx = route.params.tx.description === SWAP_IN_LN_DESCRIPTION;
    const isSwapOutTx = route.params.tx.description === SWAP_OUT_LN_DESCRIPTION;

    const paymentPreimage = route.params.tx.details?.data
        ? (route.params.tx.details?.data as LnPaymentDetails).paymentPreimage
        : '';

    const handleBumpFee = (status: {
        broadcasted: boolean;
        errorMessage: string;
    }) => {
        // if bump fee was successful, close the modal
        bumpFeeRef.current?.close();

        // If already confirmed, route back to wallet view
        let isConfirmedAlready = status.errorMessage.includes('confirmed');

        if (isConfirmedAlready) {
            Toast.show({
                topOffset: 54,
                type: 'Liberal',
                text1: capitalizeFirst(t('dust_limit_title')),
                text2: e('tx_already_confirmed_error'),
                visibilityTime: 1750,
            });
        }

        if (status.broadcasted || isConfirmedAlready) {
            // route back to wallet view
            navigation.dispatch(
                CommonActions.navigate('WalletRoot', {
                    screen: 'WalletView',
                    params: {
                        reload: true,
                    },
                }),
            );
        } else {
            // show error alert
            Toast.show({
                topOffset: 54,
                type: 'Liberal',
                text1: capitalizeFirst(t('error')),
                text2: e('bump_fee_error'),
                visibilityTime: 1750,
            });

            console.log('[Fee Bump] Could not bump fee: ', status.errorMessage);
        }
    };

    // Get URL for mempool.space
    const openMempoolSpace = (txid: string) => {
        RNHapticFeedback.trigger('impactLight', RNHapticFeedbackOptions);

        Linking.openURL(
            `https://mempool.space/${
                route.params.tx.network === ENet.Testnet ? 'testnet/' : ''
            }tx/${txid}`,
        );
    };

    const copyNodeId = () => {
        copyToClipboard(nodeId);
    };

    const copyPreimage = () => {
        copyToClipboard(paymentPreimage);
    };

    const copyTxId = () => {
        copyToClipboard(txId);
    };

    const copyToClipboard = (data: string) => {
        // Copy material to Clipboard
        // Temporarily set copied message
        // and revert after a few seconds
        Clipboard.setString(data);

        setClippyData(t('copied_to_clipboard'));

        setTimeout(() => {
            setClippyData('');
        }, 450);
    };

    // We need to make adjustments to the screen based on the source caller.
    // conservative - from the wallet view
    // liberal - from home screen
    const edges: Edges = getScreenEdges(route.params.source);

    const txPending = isLNTx
        ? route.params.tx.status === 'pending'
        : route.params.tx.confirmations > 0 &&
          route.params.tx.confirmations <= 6;

    const txSuccess = isLNTx
        ? route.params.tx.status === 'complete'
        : route.params.tx.confirmations > 6;

    const txFailed = isLNTx && route.params.tx.status === 'failed';

    const confirmationCount =
        route.params.tx.confirmations > 6
            ? '6+'
            : route.params.tx.confirmed
            ? i18nNumber(route.params.tx.confirmations, i18n.language)
            : isAdvancedMode
            ? ''
            : capitalizeFirst(t('unconfirmed'));

    const onchainStatusMessage =
        route.params.tx.status === 'pending'
            ? t('pending_conf')
            : t(route.params.tx.status);

    const confirmationInfo = isLNTx
        ? isSwapOutTx
            ? capitalizeFirst(t(route.params.tx.status))
            : onchainStatusMessage
        : route.params.tx.confirmed
        ? `${
              route.params.tx.confirmations === 1
                  ? t('confirmation')
                  : t('confirmations')
          }`
        : isAdvancedMode
        ? t('waiting_in_mempool')
        : '';

    const topMargin = isLNTx ? 'mt-10' : displayFeeBump ? '-mt-16' : '-mt-8';

    const loadNodeInfo = async () => {
        const node = await nodeInfo();

        setNodeId(node.id);
    };

    useEffect(() => {
        if (isLNTx) {
            loadNodeInfo();
        }
    });

    return (
        <SafeAreaView
            edges={edges}
            style={[
                {flex: 1, backgroundColor: ColorScheme.Background.Primary},
            ]}>
            <BottomSheetModalProvider>
                <View
                    style={[
                        styles.transactionDetailContainer,
                        tailwind('w-full h-full relative justify-center'),
                        {
                            backgroundColor: ColorScheme.Background.Primary,
                        },
                    ]}>
                    <PlainButton
                        style={[tailwind('absolute top-6 z-50'), {left: 16}]}
                        onPress={() => {
                            navigation.dispatch(CommonActions.goBack());
                        }}>
                        <CloseIcon fill={ColorScheme.SVG.Default} />
                    </PlainButton>

                    <Text
                        style={[
                            tailwind(
                                'text-lg font-bold absolute text-center w-full top-6 px-4',
                            ),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {t('summary')}
                    </Text>

                    <Text
                        style={[
                            tailwind(
                                'text-sm w-full text-center absolute top-16',
                            ),
                            {color: ColorScheme.Text.GrayedText},
                        ]}>
                        {titleDescText}
                    </Text>

                    <View
                        style={[tailwind(`${topMargin} justify-center px-4`)]}>
                        <View style={[tailwind('items-center')]}>
                            {txPending && (
                                <Pending
                                    style={[tailwind('self-center')]}
                                    fill={ColorScheme.SVG.Default}
                                    height={128}
                                    width={128}
                                />
                            )}
                            {route.params.tx.confirmations === 0 && (
                                <Broadcasted
                                    style={[tailwind('self-center')]}
                                    fill={ColorScheme.SVG.Default}
                                    height={128}
                                    width={128}
                                />
                            )}
                            {txSuccess && (
                                <Success
                                    style={[tailwind('self-center')]}
                                    fill={ColorScheme.SVG.Default}
                                    height={128}
                                    width={128}
                                />
                            )}
                            {isLNTx && txFailed && (
                                <Failed
                                    style={[tailwind('self-center')]}
                                    fill={ColorScheme.SVG.Default}
                                    height={128}
                                    width={128}
                                />
                            )}
                            {/* We only show the amount if it is not a CPFP, which shows zero */}
                            {!route.params.tx.isSelfOrBoost ? (
                                <FiatBalance
                                    style={[tailwind('mt-6')]}
                                    balance={invoiceAmount}
                                    loading={false}
                                    amountSign={txInbound ? '+' : '-'}
                                    balanceFontSize={'text-2xl'}
                                    fontColor={ColorScheme.Text.Default}
                                />
                            ) : (
                                !isAdvancedMode && (
                                    <View style={[tailwind('flex-row mt-6 ')]}>
                                        <Text
                                            style={[
                                                tailwind('text-base font-bold'),
                                                {
                                                    color: ColorScheme.Text
                                                        .Default,
                                                },
                                            ]}>
                                            {t('fee_boost_tx')}
                                        </Text>
                                    </View>
                                )
                            )}
                        </View>
                        <View
                            style={[
                                tailwind(
                                    `justify-center ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    }`,
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind(
                                        `text-sm mx-1 text-center ${
                                            route.params.tx.isSelfOrBoost &&
                                            isAdvancedMode
                                                ? 'mt-1 mb-2'
                                                : ''
                                        }`,
                                    ),
                                    {color: ColorScheme.Text.GrayedText},
                                ]}>
                                {confirmationInfo}
                            </Text>
                            {!isLNTx && (
                                <Text
                                    style={[
                                        tailwind(
                                            `text-sm text-center ${
                                                route.params.tx.isSelfOrBoost &&
                                                isAdvancedMode
                                                    ? 'mt-1 mb-2'
                                                    : ''
                                            }`,
                                        ),
                                        {color: ColorScheme.Text.GrayedText},
                                    ]}>
                                    {confirmationCount}
                                </Text>
                            )}
                        </View>

                        {/* LN invoice description */}
                        {isLNTx && (
                            <View
                                style={[tailwind('items-center mt-6 w-full')]}>
                                {isSwapInTx || isSwapOutTx ? (
                                    <View
                                        style={[
                                            tailwind(
                                                'flex-row items-center justify-center',
                                            ),
                                        ]}>
                                        <SwapIcon
                                            fill={ColorScheme.SVG.GrayFill}
                                        />
                                        <Text
                                            style={[
                                                tailwind('text-sm ml-2'),
                                                {
                                                    color: ColorScheme.Text
                                                        .DescText,
                                                },
                                            ]}>
                                            {isSwapInTx
                                                ? t('bitcoin_swapin')
                                                : t('ln_swapout')}
                                        </Text>
                                    </View>
                                ) : (
                                    <Text
                                        ellipsizeMode="middle"
                                        numberOfLines={2}
                                        style={[
                                            tailwind(
                                                'text-sm w-4/5 text-center',
                                            ),
                                            {color: ColorScheme.Text.DescText},
                                        ]}>
                                        {route.params.tx.description}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Transaction type flags for RBF and CPFP */}
                        {isAdvancedMode && route.params.tx.rbf && (
                            <View style={[tailwind('flex-row self-center')]}>
                                {route.params.tx.isSelfOrBoost && (
                                    <View
                                        style={[
                                            tailwind(
                                                'rounded-full px-4 py-1 self-center mt-4 mr-2',
                                            ),
                                            {
                                                backgroundColor:
                                                    ColorScheme.Background
                                                        .CardGreyed,
                                            },
                                        ]}>
                                        <Text
                                            style={[
                                                tailwind('font-bold'),
                                                {
                                                    color: ColorScheme.Text
                                                        .GrayText,
                                                },
                                            ]}>
                                            CPFP
                                        </Text>
                                    </View>
                                )}

                                <View
                                    style={[
                                        tailwind('rounded-full px-4 py-1 mt-4'),
                                        {
                                            backgroundColor:
                                                ColorScheme.Background
                                                    .CardGreyed,
                                        },
                                    ]}>
                                    <Text
                                        style={[
                                            tailwind('font-bold'),
                                            {
                                                color: ColorScheme.Text
                                                    .GrayText,
                                            },
                                        ]}>
                                        {`RBF ${t('enabled')}`}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* More dev info */}
                        {isAdvancedMode && (
                            <View style={[tailwind('w-full mt-4')]}>
                                <View
                                    style={[
                                        tailwind(
                                            'w-4/5 relative self-center rounded p-6',
                                        ),
                                        {
                                            backgroundColor:
                                                ColorScheme.Background.Greyed,
                                        },
                                    ]}>
                                    <PlainButton
                                        onPress={copyTxId}
                                        style={[
                                            tailwind('w-full mb-6 flex-row'),
                                        ]}>
                                        <Text
                                            style={[
                                                tailwind('font-normal mr-2'),
                                                {
                                                    color: ColorScheme.Text
                                                        .Default,
                                                },
                                            ]}>
                                            {txIdTitle}
                                        </Text>
                                        <Text
                                            numberOfLines={1}
                                            ellipsizeMode="middle"
                                            style={[
                                                tailwind('font-bold w-5/6'),
                                                {
                                                    color: ColorScheme.Text
                                                        .Default,
                                                },
                                            ]}>
                                            {txId}
                                        </Text>
                                        <CopyIcon
                                            width={16}
                                            height={16}
                                            fill={ColorScheme.SVG.GrayFill}
                                        />
                                    </PlainButton>
                                    {isLNTx ? (
                                        <>
                                            <View
                                                style={[
                                                    tailwind(
                                                        'w-full flex-row items-center justify-between',
                                                    ),
                                                ]}>
                                                <Text
                                                    style={[
                                                        tailwind('text-sm'),
                                                        {
                                                            color: ColorScheme
                                                                .Text.Default,
                                                        },
                                                    ]}>{`${capitalizeFirst(
                                                    t('amount'),
                                                )} (${t('satoshi')})`}</Text>
                                                <Text
                                                    style={[
                                                        tailwind(
                                                            'text-sm font-bold',
                                                        ),
                                                        {
                                                            color: ColorScheme
                                                                .Text.Default,
                                                        },
                                                    ]}>
                                                    {formatSats(
                                                        new BigNumber(
                                                            route.params.tx
                                                                .amountMsat /
                                                                1_000,
                                                        ),
                                                    )}
                                                </Text>
                                            </View>
                                        </>
                                    ) : (
                                        <>
                                            <View
                                                style={[
                                                    tailwind(
                                                        'w-full flex-row items-center justify-between',
                                                    ),
                                                ]}>
                                                <Text
                                                    style={[
                                                        tailwind(
                                                            'text-sm font-normal',
                                                        ),
                                                        {
                                                            color: ColorScheme
                                                                .Text.Default,
                                                        },
                                                    ]}>
                                                    size
                                                </Text>
                                                <Text
                                                    style={[
                                                        tailwind('font-bold'),
                                                        {
                                                            color: ColorScheme
                                                                .Text.Default,
                                                        },
                                                    ]}>
                                                    {route.params.tx.size +
                                                        ' B'}
                                                </Text>
                                            </View>

                                            <View
                                                style={[
                                                    tailwind(
                                                        'w-full flex-row items-center justify-between',
                                                    ),
                                                ]}>
                                                <Text
                                                    style={[
                                                        tailwind(
                                                            'text-sm font-normal',
                                                        ),
                                                        {
                                                            color: ColorScheme
                                                                .Text.Default,
                                                        },
                                                    ]}>
                                                    virtual size
                                                </Text>
                                                <Text
                                                    style={[
                                                        tailwind('font-bold'),
                                                        {
                                                            color: ColorScheme
                                                                .Text.Default,
                                                        },
                                                    ]}>
                                                    {route.params.tx.vsize +
                                                        ' vB'}
                                                </Text>
                                            </View>

                                            <View
                                                style={[
                                                    tailwind(
                                                        'w-full flex-row items-center justify-between',
                                                    ),
                                                ]}>
                                                <Text
                                                    style={[
                                                        tailwind(
                                                            'text-sm font-normal',
                                                        ),
                                                        {
                                                            color: ColorScheme
                                                                .Text.Default,
                                                        },
                                                    ]}>
                                                    weight units
                                                </Text>
                                                <Text
                                                    style={[
                                                        tailwind('font-bold'),
                                                        {
                                                            color: ColorScheme
                                                                .Text.Default,
                                                        },
                                                    ]}>
                                                    {route.params.tx.weight +
                                                        ' WU'}
                                                </Text>
                                            </View>
                                        </>
                                    )}

                                    <View
                                        style={[
                                            tailwind(
                                                'w-full flex-row items-center justify-between',
                                            ),
                                        ]}>
                                        <Text
                                            style={[
                                                tailwind('text-sm font-normal'),
                                                {
                                                    color: ColorScheme.Text
                                                        .Default,
                                                },
                                            ]}>
                                            fee
                                        </Text>
                                        <Text
                                            style={[
                                                tailwind('font-bold'),
                                                {
                                                    color: ColorScheme.Text
                                                        .Default,
                                                },
                                            ]}>
                                            {formatSats(txFee)}
                                        </Text>
                                    </View>

                                    {isLNTx && (
                                        <>
                                            <View
                                                style={[
                                                    tailwind(
                                                        'w-full mt-4 mb-4',
                                                    ),
                                                    HeadingBar,
                                                ]}
                                            />
                                            <>
                                                {/* Payment Pre image & Node ID */}
                                                <PlainButton
                                                    onPress={copyPreimage}
                                                    style={[
                                                        tailwind(
                                                            'w-full mb-4 flex justify-between',
                                                        ),
                                                    ]}>
                                                    <Text
                                                        style={[
                                                            tailwind(
                                                                'font-normal mr-2 mb-2',
                                                            ),
                                                            {
                                                                color: ColorScheme
                                                                    .Text
                                                                    .Default,
                                                            },
                                                        ]}>
                                                        Payment Preimage
                                                    </Text>

                                                    <View
                                                        style={[
                                                            tailwind(
                                                                'w-full justify-between flex-row',
                                                            ),
                                                        ]}>
                                                        <Text
                                                            numberOfLines={1}
                                                            ellipsizeMode="middle"
                                                            style={[
                                                                tailwind(
                                                                    'font-bold w-4/5',
                                                                ),
                                                                {
                                                                    color: ColorScheme
                                                                        .Text
                                                                        .Default,
                                                                },
                                                            ]}>
                                                            {paymentPreimage}
                                                        </Text>
                                                        <CopyIcon
                                                            width={16}
                                                            height={16}
                                                            fill={
                                                                ColorScheme.SVG
                                                                    .GrayFill
                                                            }
                                                        />
                                                    </View>
                                                </PlainButton>

                                                <PlainButton
                                                    onPress={copyNodeId}
                                                    style={[
                                                        tailwind(
                                                            'w-full flex justify-between',
                                                        ),
                                                    ]}>
                                                    <Text
                                                        style={[
                                                            tailwind(
                                                                'font-normal mr-2 mb-2',
                                                            ),
                                                            {
                                                                color: ColorScheme
                                                                    .Text
                                                                    .Default,
                                                            },
                                                        ]}>
                                                        Node ID
                                                    </Text>
                                                    <View
                                                        style={[
                                                            tailwind(
                                                                'w-full justify-between flex-row',
                                                            ),
                                                        ]}>
                                                        <Text
                                                            numberOfLines={1}
                                                            ellipsizeMode="middle"
                                                            style={[
                                                                tailwind(
                                                                    'font-bold w-4/5',
                                                                ),
                                                                {
                                                                    color: ColorScheme
                                                                        .Text
                                                                        .Default,
                                                                },
                                                            ]}>
                                                            {nodeId}
                                                        </Text>
                                                        <CopyIcon
                                                            width={16}
                                                            height={16}
                                                            fill={
                                                                ColorScheme.SVG
                                                                    .GrayFill
                                                            }
                                                        />
                                                    </View>
                                                </PlainButton>
                                            </>
                                        </>
                                    )}
                                </View>

                                {clippyData.length > 0 && (
                                    <Text
                                        style={[
                                            tailwind(
                                                'text-sm text-center mt-4',
                                            ),
                                            {
                                                color: ColorScheme.Text
                                                    .GrayedText,
                                            },
                                        ]}>
                                        {clippyData}
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Show bump fee button when tx still in mempool */}
                    {/*{!route.params.tx.confirmed && (
                     */}
                    {displayFeeBump && (
                        <View
                            style={[
                                tailwind(
                                    'absolute self-center items-center w-5/6',
                                ),
                                {
                                    bottom:
                                        NativeWindowMetrics.bottomButtonOffset +
                                        64,
                                },
                            ]}>
                            <LongButton
                                title={t('bump_fee')}
                                textColor={ColorScheme.Text.Default}
                                backgroundColor={ColorScheme.Background.Greyed}
                                onPress={openBumpFee}
                            />
                        </View>
                    )}

                    {!isLNTx && (
                        <>
                            <View
                                style={[
                                    tailwind(
                                        'absolute bottom-0 items-center w-full',
                                    ),
                                ]}>
                                <LongBottomButton
                                    onPress={() => {
                                        openMempoolSpace(route.params.tx.txid);
                                    }}
                                    title={buttonText}
                                    textColor={ColorScheme.Text.Alt}
                                    backgroundColor={
                                        ColorScheme.Background.Inverted
                                    }
                                />
                            </View>

                            <View style={[tailwind('absolute bottom-0')]}>
                                <BumpFee
                                    bumpRef={bumpFeeRef}
                                    triggerBump={handleBumpFee}
                                    onSelectBump={idx => {
                                        setOpenBump(idx);
                                    }}
                                    walletId={route.params.walletId}
                                    tx={route.params.tx}
                                />
                            </View>
                        </>
                    )}
                </View>
            </BottomSheetModalProvider>
        </SafeAreaView>
    );
};

export default TransactionDetailsView;

const styles = StyleSheet.create({
    transactionDetailContainer: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
});
