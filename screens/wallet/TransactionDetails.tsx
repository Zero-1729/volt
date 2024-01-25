/* eslint-disable react-native/no-inline-styles */
import {Text, View, useColorScheme, Linking, StyleSheet} from 'react-native';
import React, {useContext, useRef, useState} from 'react';

import {useNavigation, CommonActions} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';
import Clipboard from '@react-native-clipboard/clipboard';

import {AppStorageContext} from '../../class/storageContext';

import {SafeAreaView, Edges} from 'react-native-safe-area-context';

import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';

import {conservativeAlert} from '../../components/alert';

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
import Pending from '../../assets/svg/hourglass-24.svg';
import Broadcasted from '../../assets/svg/megaphone-24.svg';
import CopyIcon from '../../assets/svg/copy-16.svg';

import {capitalizeFirst, formatLocaleDate} from '../../modules/transform';
import {getScreenEdges} from '../../modules/screen';

type Props = NativeStackScreenProps<WalletParamList, 'TransactionDetails'>;

const TransactionDetailsView = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {t, i18n} = useTranslation('wallet');
    const {t: e} = useTranslation('errors');

    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const bumpFeeRef = useRef<BottomSheetModal>(null);
    const [openBump, setOpenBump] = useState(-1);

    const navigation = useNavigation();

    const {isAdvancedMode} = useContext(AppStorageContext);

    const [txIdText, setTxIdText] = React.useState<string>('');

    const buttonText = isAdvancedMode ? t('view_on_mempool') : t('see_more');

    const displayFeeBump = !route.params.tx.confirmed && route.params.tx.rbf;

    const openBumpFee = () => {
        if (openBump !== 1) {
            bumpFeeRef.current?.present();
        } else {
            bumpFeeRef.current?.close();
        }
    };

    const handleBumpFee = (status: {
        broadcasted: boolean;
        errorMessage: string;
    }) => {
        // if bump fee was successful, close the modal
        bumpFeeRef.current?.close();

        // If already confirmed, route back to wallet view
        let isConfirmedAlready = status.errorMessage.includes('confirmed');

        if (isConfirmedAlready) {
            conservativeAlert(
                capitalizeFirst(t('warning')),
                e('tx_already_confirmed_error'),
                capitalizeFirst(t('cancel')),
            );
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
            conservativeAlert(
                capitalizeFirst(t('error')),
                e('bump_fee_error'),
                capitalizeFirst(t('cancel')),
            );

            console.log('[Fee Bump] Could not bump fee: ', status.errorMessage);
        }
    };

    const getTxTimestamp = (time: Date) => {
        return formatLocaleDate(i18n.language, time);
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

    const copyIdToClipboard = () => {
        // Copy backup material to Clipboard
        // Temporarily set copied message
        // and revert after a few seconds
        Clipboard.setString(route.params.tx.txid);

        setTxIdText(t('copied_tx_id'));

        setTimeout(() => {
            setTxIdText('');
        }, 450);
    };

    // We need to make adjustments to the screen based on the source caller.
    // conservative - from the wallet view
    // liberal - from home screen
    const edges: Edges = getScreenEdges(route.params.source);

    const confirmationCount =
        route.params.tx.confirmations > 6
            ? '6+'
            : capitalizeFirst(t('unconfirmed'));
    const confirmationText = route.params.tx.confirmed
        ? `${
              route.params.tx.confirmations === 1
                  ? t('confirmation')
                  : t('confirmations')
          }`
        : isAdvancedMode
        ? t('waiting_in_mempool')
        : '';

    return (
        <SafeAreaView edges={edges}>
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
                        {route.params.tx.confirmed
                            ? getTxTimestamp(route.params.tx.timestamp)
                            : t('pending')}
                    </Text>

                    <View
                        style={[
                            tailwind(
                                `${
                                    displayFeeBump ? '-mt-16' : '-mt-8'
                                } justify-center px-4`,
                            ),
                        ]}>
                        <View style={[tailwind('items-center')]}>
                            {route.params.tx.confirmations > 0 &&
                            route.params.tx.confirmations <= 6 ? (
                                <Pending
                                    style={[tailwind('self-center')]}
                                    fill={ColorScheme.SVG.Default}
                                    height={128}
                                    width={128}
                                />
                            ) : (
                                <></>
                            )}
                            {route.params.tx.confirmations === 0 ? (
                                <Broadcasted
                                    style={[tailwind('self-center')]}
                                    fill={ColorScheme.SVG.Default}
                                    height={128}
                                    width={128}
                                />
                            ) : (
                                <></>
                            )}
                            {route.params.tx.confirmations > 6 ? (
                                <Success
                                    style={[tailwind('self-center')]}
                                    fill={ColorScheme.SVG.Default}
                                    height={128}
                                    width={128}
                                />
                            ) : (
                                <></>
                            )}
                            {/* We only show the amount if it is not a CPFP, which shows zero */}
                            {!route.params.tx.isSelfOrBoost ? (
                                <FiatBalance
                                    style={[tailwind('mt-6')]}
                                    balance={route.params.tx.value}
                                    loading={false}
                                    amountSign={
                                        route.params.tx.type === 'inbound'
                                            ? '+'
                                            : '-'
                                    }
                                    balanceFontSize={'text-2xl'}
                                    fontColor={ColorScheme.Text.Default}
                                />
                            ) : !isAdvancedMode ? (
                                <View style={[tailwind('flex-row mt-6 ')]}>
                                    <Text
                                        style={[
                                            tailwind('text-base font-bold'),
                                            {
                                                color: ColorScheme.Text.Default,
                                            },
                                        ]}>
                                        {t('fee_boost_tx')}
                                    </Text>
                                </View>
                            ) : (
                                <></>
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
                                {confirmationText}
                            </Text>
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
                        </View>

                        {/* Transaction type flags for RBF and CPFP */}
                        {isAdvancedMode && route.params.tx.rbf ? (
                            <View style={[tailwind('flex-row self-center')]}>
                                {route.params.tx.isSelfOrBoost ? (
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
                                ) : (
                                    <></>
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
                        ) : (
                            <></>
                        )}

                        {/* More dev info */}
                        {isAdvancedMode ? (
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
                                        onPress={copyIdToClipboard}
                                        style={[tailwind('w-full mb-6')]}>
                                        <Text
                                            numberOfLines={1}
                                            ellipsizeMode="middle"
                                            style={[
                                                tailwind('font-bold w-full'),
                                                {
                                                    color: ColorScheme.Text
                                                        .Default,
                                                },
                                            ]}>
                                            <Text
                                                style={[
                                                    tailwind('font-normal'),
                                                ]}>
                                                Tx ID:{' '}
                                            </Text>
                                            {route.params.tx.txid}
                                            <CopyIcon
                                                style={[tailwind('ml-4 mr-0')]}
                                                width={16}
                                                height={16}
                                                fill={ColorScheme.SVG.GrayFill}
                                            />
                                        </Text>
                                    </PlainButton>
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
                                            size
                                        </Text>
                                        <Text
                                            style={[
                                                tailwind('font-bold'),
                                                {
                                                    color: ColorScheme.Text
                                                        .Default,
                                                },
                                            ]}>
                                            {route.params.tx.size + ' B'}
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
                                                tailwind('text-sm font-normal'),
                                                {
                                                    color: ColorScheme.Text
                                                        .Default,
                                                },
                                            ]}>
                                            virtual size
                                        </Text>
                                        <Text
                                            style={[
                                                tailwind('font-bold'),
                                                {
                                                    color: ColorScheme.Text
                                                        .Default,
                                                },
                                            ]}>
                                            {route.params.tx.vsize + ' vB'}
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
                                                tailwind('text-sm font-normal'),
                                                {
                                                    color: ColorScheme.Text
                                                        .Default,
                                                },
                                            ]}>
                                            weight units
                                        </Text>
                                        <Text
                                            style={[
                                                tailwind('font-bold'),
                                                {
                                                    color: ColorScheme.Text
                                                        .Default,
                                                },
                                            ]}>
                                            {route.params.tx.weight + ' WU'}
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
                                            {route.params.tx.fee}
                                        </Text>
                                    </View>
                                </View>

                                {txIdText.length > 0 ? (
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
                                        {txIdText}
                                    </Text>
                                ) : (
                                    <></>
                                )}
                            </View>
                        ) : (
                            <></>
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

                    <View
                        style={[
                            tailwind('absolute bottom-0 items-center w-full'),
                        ]}>
                        <LongBottomButton
                            onPress={() => {
                                openMempoolSpace(route.params.tx.txid);
                            }}
                            title={buttonText}
                            textColor={ColorScheme.Text.Alt}
                            backgroundColor={ColorScheme.Background.Inverted}
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
