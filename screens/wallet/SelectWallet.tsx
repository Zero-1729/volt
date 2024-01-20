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

import BigNumber from 'bignumber.js';
import decodeURI from 'bip21';
import {WalletTypeDetails, DUST_LIMIT} from '../../modules/wallet-defaults';
import {
    canSendToInvoice,
    prefixInfo,
    getMiniWallet,
} from '../../modules/wallet-utils';
import {convertBTCtoSats} from '../../modules/transform';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import {LongBottomButton} from '../../components/button';

import {WalletCard} from '../../components/card';
import {BaseWallet} from '../../class/wallet/base';
import {TInvoiceData} from '../../types/wallet';

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
        const balance = new BigNumber(wallet.balance);

        const invoiceHasAmount = !!decodedInvoice?.options?.amount;
        const invoiceAmount = new BigNumber(
            Number(decodedInvoice?.options?.amount),
        );

        const addressTip = decodedInvoice.address[0];
        const prefixStub =
            addressTip === 'b' || addressTip === 't'
                ? decodedInvoice.address.slice(0, 4)
                : addressTip;
        const addressType = prefixInfo[prefixStub].type;
        const addressTypeName = WalletTypeDetails[addressType][0];

        // Check balance if zero
        if (balance.isZero()) {
            conservativeAlert(
                'Error',
                'Wallet is empty, please select a different wallet or add funds.',
            );
            return;
        }

        // Check against dust limit
        if (
            invoiceHasAmount &&
            invoiceAmount
                .multipliedBy(100000000)
                .isLessThanOrEqualTo(DUST_LIMIT)
        ) {
            conservativeAlert('Error', 'Invoice amount is below dust limit');
            return;
        }

        // Check balance if less than invoice amount
        if (
            invoiceHasAmount &&
            invoiceAmount.multipliedBy(100000000).isGreaterThan(wallet.balance)
        ) {
            // Check balance
            conservativeAlert(
                'Error',
                'Wallet balance insufficient, select a different wallet or add funds.',
            );
            return;
        }

        // Check can pay invoice with wallet
        // Check can send to address
        if (!canSendToInvoice(decodedInvoice, wallet)) {
            conservativeAlert(
                'Error',
                `Wallet cannot pay to a ${addressTypeName} address`,
            );
            return;
        }

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
                                enabled={walletMode === 'multi'}
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
