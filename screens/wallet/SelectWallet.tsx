import React, {useState, useContext} from 'react';
import {Text, View, useColorScheme, Platform, Dimensions} from 'react-native';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {InitStackParamList} from '../../Navigation';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation, CommonActions} from '@react-navigation/native';
import Carousel from 'react-native-reanimated-carousel';

import {AppStorageContext} from '../../class/storageContext';
import {conservativeAlert} from '../../components/alert';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import {LongBottomButton} from '../../components/button';

import {WalletCard} from '../../components/card';
import {BaseWallet} from '../../class/wallet/base';
import {TComboWallet, TInvoiceData} from '../../types/wallet';
import BigNumber from 'bignumber.js';

type Props = NativeStackScreenProps<InitStackParamList, 'SelectWallet'>;

const SelectWallet = ({route}: Props) => {
    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const navigation = useNavigation();

    // TODO: handle view if wallet single
    const {wallets, hideTotalBalance, getWalletData, walletsIndex} =
        useContext(AppStorageContext);

    const [walletId, updateWalletId] = useState('');

    const topPlatformOffset = 6 + (Platform.OS === 'android' ? 12 : 0);

    const AppScreenWidth = Dimensions.get('window').width;

    const cardHeight = 230;

    const decodeInvoice = (invoice: TInvoiceData) => {
        return {} as TInvoiceData;
    };

    const handleRoute = () => {
        const wallet = getWalletData(walletId);
        const balance = new BigNumber(wallet.balance);

        const decodedInvoice = decodeInvoice(route.params?.invoice);
        const invoiceHasAmount = decodedInvoice?.options?.amount;

        // Check balance if zero
        if (balance.isZero()) {
            conservativeAlert(
                'Error',
                'Wallet is empty, please select a different wallet or add funds.',
            );
            return;
        }

        // Check balance if less than invoice amount
        if (
            invoiceHasAmount &&
            balance.lt(Number(decodedInvoice?.options?.amount))
        ) {
            // Check balance
            conservativeAlert(
                'Error',
                'Wallet balance insufficient, select a different wallet or add funds.',
            );
            return;
        }

        // Navigate handling
        if (invoiceHasAmount) {
            navigation.dispatch(
                CommonActions.navigate('WalletRoot', {
                    screen: 'FeeSelection',
                    params: {
                        invoiceData: decodedInvoice,
                        wallet: wallet,
                    },
                }),
            );
        } else {
            navigation.dispatch(
                CommonActions.navigate('WalletRoot', {
                    screen: 'SendAmount',
                    params: {
                        invoiceData: decodedInvoice,
                        wallet: wallet as TComboWallet,
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
                                enabled={wallets.length > 1}
                                vertical={true}
                                autoPlay={false}
                                width={AppScreenWidth * 0.92}
                                height={cardHeight}
                                data={[...wallets]}
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
