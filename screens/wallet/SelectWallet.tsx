/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useContext, useEffect} from 'react';
import {
    Text,
    View,
    useColorScheme,
    Platform,
    Dimensions,
    StyleSheet,
} from 'react-native';

import VText from '../../components/text';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {InitStackParamList} from '../../Navigation';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation, CommonActions} from '@react-navigation/native';
import Carousel from 'react-native-reanimated-carousel';

import {AppStorageContext} from '../../class/storageContext';
import {conservativeAlert} from '../../components/alert';

import {useTranslation} from 'react-i18next';

import decodeURI from 'bip21';
import {getMiniWallet, checkInvoiceAndWallet} from '../../modules/wallet-utils';
import {capitalizeFirst, convertBTCtoSats} from '../../modules/transform';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import BigNumber from 'bignumber.js';

import {LongBottomButton, PlainButton} from '../../components/button';
import {FiatBalance, DisplaySatsAmount} from '../../components/balance';

import {WalletCard} from '../../components/card';
import {BaseWallet} from '../../class/wallet/base';
import {TInvoiceData} from '../../types/wallet';
import {useNetInfo} from '@react-native-community/netinfo';

import InfoIcon from '../../assets/svg/info-16.svg';
import NativeWindowMetrics from '../../constants/NativeWindowMetrics';

type Props = NativeStackScreenProps<InitStackParamList, 'SelectWallet'>;

const SelectWallet = ({route}: Props) => {
    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {t, i18n} = useTranslation('wallet');
    const {t: e} = useTranslation('errors');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const navigation = useNavigation();
    const [decodedInvoice, setDecodedInvoice] = useState<TInvoiceData>(
        {} as TInvoiceData,
    );

    const {wallets, hideTotalBalance, getWalletData, walletsIndex, walletMode} =
        useContext(AppStorageContext);

    const networkState = useNetInfo();

    const walletModeIndex = walletMode === 'multi' ? walletsIndex : 0;

    const [walletId, updateWalletId] = useState(wallets[walletsIndex].id);

    const topPlatformOffset = 6 + (Platform.OS === 'android' ? 12 : 0);

    const AppScreenWidth = Dimensions.get('window').width;

    const cardHeight = 220;

    const decodeInvoice = (invoice: string) => {
        // TODO: handle decoding Lightning invoices
        return decodeURI.decode(invoice) as TInvoiceData;
    };

    useEffect(() => {
        if (
            route.params?.invoice.startsWith('lightning') ||
            route.params?.invoice.startsWith('lnurl') ||
            route.params?.invoice.startsWith('lnbc') ||
            route.params?.invoice.startsWith('bitcoin:')
        ) {
            // If LN report we aren't supporting it yet
            if (!route.params?.invoice.startsWith('bitcoin:')) {
                conservativeAlert(
                    capitalizeFirst(t('error')),
                    e('unsupported_invoice_type'),
                    capitalizeFirst(t('cancel')),
                );

                navigation.dispatch(CommonActions.navigate('HomeScreen'));

                return;
            }

            setDecodedInvoice(decodeInvoice(route.params?.invoice));
        } else {
            conservativeAlert(
                capitalizeFirst(t('error')),
                e('invalid_invoice_error'),
                capitalizeFirst(t('cancel')),
            );

            navigation.dispatch(CommonActions.navigate('HomeScreen'));
        }
    }, []);

    const handleRoute = () => {
        const wallet = getMiniWallet(getWalletData(walletId));
        const invoiceHasAmount = !!decodedInvoice?.options?.amount;

        // Check network connection first
        if (!networkState?.isInternetReachable) {
            conservativeAlert(
                capitalizeFirst(t('error')),
                e('no_internet_message'),
                capitalizeFirst(t('cancel')),
            );
            return;
        }

        // Check wallet and invoice
        if (
            checkInvoiceAndWallet(
                wallet,
                decodedInvoice,
                (msg: string) => {
                    // TODO: Check and translate error
                    conservativeAlert(
                        capitalizeFirst(t('error')),
                        msg,
                        capitalizeFirst(t('cancel')),
                    );

                    // route home
                    navigation.dispatch(
                        CommonActions.navigate('HomeScreen', {
                            screen: 'HomeScreen',
                        }),
                    );

                    return;
                },
                walletMode === 'single',
            )
        ) {
            // Navigate handling
            if (invoiceHasAmount) {
                // convert btc to sats
                if (decodedInvoice.options) {
                    decodedInvoice.options.amount = Number(
                        convertBTCtoSats(
                            decodedInvoice.options?.amount?.toString() as string,
                        ),
                    );
                }

                navigation.dispatch(
                    CommonActions.navigate('WalletRoot', {
                        screen: 'FeeSelection',
                        params: {
                            invoiceData: decodedInvoice,
                            wallet: wallet,
                            source: 'liberal',
                        },
                    }),
                );
            } else {
                navigation.dispatch(
                    CommonActions.navigate('WalletRoot', {
                        screen: 'SendAmount',
                        params: {
                            invoiceData: decodedInvoice,
                            wallet: wallet,
                            source: 'liberal',
                        },
                    }),
                );
            }
        }
    };

    const renderCard = ({item}: {item: BaseWallet}) => {
        return (
            <View style={[tailwind('w-full absolute')]}>
                <WalletCard
                    loading={false}
                    maxedCard={
                        item.balance.isZero() && item.transactions.length > 0
                    }
                    balance={item.balance}
                    network={item.network}
                    isWatchOnly={item.isWatchOnly}
                    label={item.name}
                    walletBalance={item.balance}
                    walletType={item.type}
                    hideBalance={hideTotalBalance}
                    unit={item.units}
                    navCallback={() => {}}
                />
            </View>
        );
    };

    const sats = decodedInvoice.options?.amount
        ? decodedInvoice.options?.amount * 100_000_000
        : undefined;

    const invoiceOptionsEmpty = decodedInvoice.options
        ? Object.keys(decodedInvoice.options).length === 0
        : true;

    return (
        <SafeAreaView>
            <View
                style={[
                    tailwind(
                        'h-full w-full items-center justify-start relative',
                    ),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <View
                    style={[
                        tailwind('w-5/6 items-center flex-row justify-between'),
                        {marginTop: topPlatformOffset},
                    ]}>
                    <Text
                        style={[
                            tailwind('text-center font-bold text-xl w-full'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {t('select_wallet_title')}
                    </Text>
                </View>

                {/*Display the invoice data */}
                <View
                    style={[
                        tailwind(
                            `${
                                invoiceOptionsEmpty ? 'w-5/6 p-2' : 'w-5/6 p-6'
                            } items-center flex justify-between rounded mt-4`,
                        ),
                    ]}>
                    {decodedInvoice.options?.label && (
                        <Text
                            numberOfLines={1}
                            ellipsizeMode="middle"
                            style={[
                                tailwind(
                                    'w-full text-center font-bold text-lg mb-2',
                                ),
                                {
                                    color: ColorScheme.Text.Default,
                                },
                            ]}>
                            {decodedInvoice.options.label}
                        </Text>
                    )}
                    {decodedInvoice.options?.amount && sats && (
                        <View
                            style={[tailwind('w-full items-center flex mb-2')]}>
                            <FiatBalance
                                balance={sats}
                                loading={false}
                                balanceFontSize={'text-4xl'}
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
                                        'w-full items-center flex-row justify-between mt-4',
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
                                    amount={new BigNumber(sats)}
                                    fontSize="text-sm"
                                    isApprox={false}
                                    textColor={ColorScheme.Text.GrayText}
                                />
                            </View>
                        </View>
                    )}

                    <View
                        style={[
                            tailwind(
                                'w-full items-center flex justify-between mb-4',
                            ),
                        ]}>
                        <VText
                            style={[
                                tailwind('font-bold w-full mb-2'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Address
                        </VText>
                        <VText
                            style={[
                                tailwind('w-full'),
                                {color: ColorScheme.Text.GrayText},
                            ]}>
                            {decodedInvoice.address}
                        </VText>
                    </View>

                    {/* Display the message */}
                    {decodedInvoice.options?.message && (
                        <>
                            <View
                                style={[
                                    tailwind('w-full mb-6 opacity-20'),
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
                                    {color: ColorScheme.Text.GrayText},
                                ]}>
                                {decodedInvoice.options.message}
                            </Text>
                        </>
                    )}
                </View>

                <View style={[tailwind('w-5/6 justify-center mt-2')]}>
                    {/** Carousel for 'BaseCard */}
                    <View
                        style={[tailwind('self-center'), {height: cardHeight}]}>
                        <Carousel
                            enabled={
                                walletMode === 'multi' && wallets.length > 1
                            }
                            vertical={true}
                            autoPlay={false}
                            width={AppScreenWidth * 0.9}
                            height={cardHeight}
                            data={
                                walletMode === 'single'
                                    ? [wallets[walletsIndex]]
                                    : [...wallets]
                            }
                            renderItem={renderCard}
                            pagingEnabled={true}
                            mode={'vertical-stack'}
                            modeConfig={{
                                snapDirection: 'left',
                                stackInterval: 8,
                            }}
                            onScrollEnd={index => {
                                updateWalletId(wallets[index].id);
                            }}
                            defaultIndex={walletModeIndex}
                        />
                    </View>

                    {walletMode === 'multi' && (
                        <View
                            style={[
                                tailwind(
                                    `w-full ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } justify-center items-center`,
                                ),
                            ]}>
                            <InfoIcon
                                style={[
                                    tailwind(
                                        `${
                                            langDir === 'right'
                                                ? 'ml-2'
                                                : 'mr-2'
                                        }`,
                                    ),
                                ]}
                                width={14}
                                height={14}
                                fill={ColorScheme.SVG.GrayFill}
                            />
                            <Text
                                style={[
                                    tailwind('text-sm'),
                                    {color: ColorScheme.Text.DescText},
                                ]}>
                                {t('select_wallet_swipe_notice')}
                            </Text>
                        </View>
                    )}
                </View>

                <View
                    style={[
                        tailwind('absolute'),
                        {bottom: NativeWindowMetrics.bottomButtonOffset + 72},
                    ]}>
                    <PlainButton
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate('HomeScreen', {
                                    screen: 'HomeScreen',
                                }),
                            );
                        }}>
                        <Text
                            style={[
                                tailwind('text-sm font-bold'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {capitalizeFirst(t('cancel'))}
                        </Text>
                    </PlainButton>
                </View>

                <LongBottomButton
                    title={'Pay Invoice'}
                    textColor={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                    onPress={handleRoute}
                />
            </View>
        </SafeAreaView>
    );
};

export default SelectWallet;

const styles = StyleSheet.create({
    invoiceLineBreaker: {
        borderBottomWidth: 1,
        opacity: 0.1,
    },
});
