/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useContext, useEffect} from 'react';
import {Text, View, useColorScheme, Platform, Dimensions} from 'react-native';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {InitStackParamList} from '../../Navigation';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation, CommonActions} from '@react-navigation/native';
import Carousel from 'react-native-reanimated-carousel';

import {AppStorageContext} from '../../class/storageContext';
import {conservativeAlert} from '../../components/alert';

import decodeURI from 'bip21';
import {getMiniWallet, checkInvoiceAndWallet} from '../../modules/wallet-utils';
import {convertBTCtoSats} from '../../modules/transform';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import {LongBottomButton} from '../../components/button';

import {WalletCard} from '../../components/card';
import {BaseWallet} from '../../class/wallet/base';
import {TInvoiceData} from '../../types/wallet';
import {useNetInfo} from '@react-native-community/netinfo';

type Props = NativeStackScreenProps<InitStackParamList, 'SelectWallet'>;

const SelectWallet = ({route}: Props) => {
    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const navigation = useNavigation();
    const [decodedInvoice, setDecodedInvoice] = useState<TInvoiceData>(
        {} as TInvoiceData,
    );

    const {wallets, hideTotalBalance, getWalletData, walletsIndex, walletMode} =
        useContext(AppStorageContext);

    const networkState = useNetInfo();

    const [walletId, updateWalletId] = useState(wallets[walletsIndex].id);

    const topPlatformOffset = 6 + (Platform.OS === 'android' ? 12 : 0);

    const AppScreenWidth = Dimensions.get('window').width;

    const cardHeight = 230;

    const decodeInvoice = (invoice: string) => {
        return decodeURI.decode(invoice) as TInvoiceData;
    };

    useEffect(() => {
        if (route.params?.invoice.startsWith('bitcoin:')) {
            setDecodedInvoice(decodeInvoice(route.params?.invoice));
        } else {
            conservativeAlert('Error', 'Invalid invoice format.');

            navigation.dispatch(CommonActions.navigate('HomeScreen'));
        }
    }, []);

    const handleRoute = () => {
        const wallet = getWalletData(walletId);
        const invoiceHasAmount = !!decodedInvoice?.options?.amount;

        // Check network connection first
        if (!networkState?.isInternetReachable) {
            conservativeAlert(
                'Error',
                'Please check your internet connection.',
            );
            return;
        }

        // Check wallet and invoice
        if (
            checkInvoiceAndWallet(
                wallet,
                decodedInvoice,
                (msg: string) => {
                    conservativeAlert('Error', msg);
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
                            wallet: getMiniWallet(wallet),
                        },
                    }),
                );
            } else {
                navigation.dispatch(
                    CommonActions.navigate('WalletRoot', {
                        screen: 'SendAmount',
                        params: {
                            invoiceData: decodedInvoice,
                            wallet: getMiniWallet(wallet),
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
                        {marginTop: topPlatformOffset + 12},
                    ]}>
                    <Text
                        style={[
                            tailwind('text-center font-bold text-xl w-full'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Select Wallet
                    </Text>
                </View>

                <View style={[tailwind('justify-center mt-12')]}>
                    {/** Carousel for 'BaseCard */}
                    {wallets.length > 0 ? (
                        <View
                            style={[
                                tailwind('self-center'),
                                {height: cardHeight},
                            ]}>
                            <Carousel
                                enabled={
                                    walletMode === 'multi' && wallets.length > 1
                                }
                                vertical={true}
                                autoPlay={false}
                                width={AppScreenWidth * 0.92}
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
                                defaultIndex={walletsIndex}
                            />
                        </View>
                    ) : (
                        <></>
                    )}
                </View>

                <LongBottomButton
                    title={'Pay Invoice'}
                    color={ColorScheme.Text.Default}
                    backgroundColor={ColorScheme.Background.Inverted}
                    onPress={handleRoute}
                />
            </View>
        </SafeAreaView>
    );
};

export default SelectWallet;
