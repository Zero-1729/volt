import React, {useContext, useState} from 'react';
import {Text, View, useColorScheme} from 'react-native';
import {AppStorageContext} from '../../class/storageContext';

import {SafeAreaView} from 'react-native-safe-area-context';

import {
    useNavigation,
    StackActions,
    CommonActions,
} from '@react-navigation/native';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

import {PlainButton, LongBottomButton} from '../../components/button';

import Close from '../../assets/svg/x-24.svg';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

import {SingleBDKSend} from '../../modules/bdk';
import {getPrivateDescriptors} from '../../modules/descriptors';
import {TComboWallet} from '../../types/wallet';

type Props = NativeStackScreenProps<WalletParamList, 'Send'>;

const SendView = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const {electrumServerURL} = useContext(AppStorageContext);
    const [loading, setLoaing] = useState(false);
    const [statusMessage, setStatuseMessage] = useState('');

    const sats = route.params?.invoiceData?.options?.amount;

    const amt =
        sats === route.params.wallet.balance.toString()
            ? 'max'
            : sats + ' sats';

    const createTransaction = async () => {
        // Lock load
        setLoaing(true);

        // Update wallet descriptors to private version
        const descriptors = await getPrivateDescriptors(
            route.params.wallet.privateDescriptor,
        );

        let wallet = {
            ...route.params.wallet,
            externalDescriptor: descriptors.external,
            internalDescriptor: descriptors.internal,
        };

        const {broadcasted, psbt, errorMessage} = await SingleBDKSend(
            sats,
            route.params.invoiceData.address,
            wallet as TComboWallet,
            electrumServerURL,
            msg => {
                setStatuseMessage(msg);
            },
        );

        // Set txid
        let txid!: string;
        if (!errorMessage && psbt) {
            txid = await psbt.txid();
        }

        let message = errorMessage ? errorMessage : statusMessage;
        // Unlock load
        setLoaing(false);

        // Navigate to status screen
        navigation.dispatch(
            CommonActions.navigate({
                name: 'TransactionStatus',
                params: {
                    status: broadcasted ? 'success' : 'failed',
                    message: message,
                    txId: txid,
                    network: route.params.wallet.network,
                },
            }),
        );
    };

    return (
        <SafeAreaView edges={['bottom', 'left', 'right']}>
            <View
                style={[tailwind('w-full h-full items-center justify-center')]}>
                <View
                    style={[
                        tailwind(
                            'absolute top-6 w-full flex-row items-center justify-center',
                        ),
                    ]}>
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
                        Send Transaction
                    </Text>
                </View>

                <View style={[tailwind('items-center justify-center w-full')]}>
                    <Text
                        style={[
                            tailwind('text-base text-center w-4/5'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Transaction with {`'${route.params?.wallet?.name}'`}{' '}
                        wallet
                        {'\n\n'}
                        Sending {sats ? `'${amt}'` : ''} to address:{' '}
                        {route.params?.invoiceData?.address}{' '}
                    </Text>

                    {statusMessage ? (
                        <Text style={[tailwind('mt-4 text-sm font-bold')]}>
                            Status: {statusMessage}
                        </Text>
                    ) : (
                        <></>
                    )}
                </View>

                <LongBottomButton
                    disabled={loading}
                    onPress={createTransaction}
                    title={'Send'}
                    textColor={ColorScheme.Text.Alt}
                    backgroundColor={ColorScheme.Background.Inverted}
                />
            </View>
        </SafeAreaView>
    );
};

export default SendView;
