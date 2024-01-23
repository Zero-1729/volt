import React, {useState, useContext, useRef} from 'react';
import {
    Text,
    useColorScheme,
    View,
    ActivityIndicator,
    StyleSheet,
    TextInput,
} from 'react-native';

import VText from '../../components/text';

import {AppStorageContext} from '../../class/storageContext';

import {CommonActions, useNavigation} from '@react-navigation/native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNetInfo} from '@react-native-community/netinfo';
import {checkNetworkIsReachable} from '../../modules/wallet-utils';

import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {useTailwind} from 'tailwind-rn';
import Color from '../../constants/Color';

import {useTranslation} from 'react-i18next';

import {LongBottomButton, PlainButton} from '../../components/button';
import {TextSingleInput} from '../../components/input';

import {ENet} from '../../types/enums';
import {TComboWallet} from '../../types/wallet';
import {createBDKWallet, syncBdkWallet} from '../../modules/bdk';
import {Address} from 'bdk-rn';

import Close from '../../assets/svg/x-24.svg';
import {WalletParamList} from '../../Navigation';
import {errorAlert} from '../../components/alert';

import {capitalizeFirst} from '../../modules/transform';

type Props = NativeStackScreenProps<WalletParamList, 'AddressOwnership'>;

const AddressOwnership = ({route}: Props) => {
    const [resultMessage, setResultMessage] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);

    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const {t} = useTranslation('wallet');
    const {t: e} = useTranslation('errors'); 

    const navigation = useNavigation();

    const {electrumServerURL} = useContext(AppStorageContext);

    const networkState = useNetInfo();

    const addressInputRef = useRef<TextInput>(null);

    const handleButtonCheck = () => {
        if (!resultMessage) {
            checkAddressOwnership();
        } else {
            clearText();
            updateText('');
            addressInputRef.current?.clear();
        }
    };

    const checkAddressOwnership = async () => {
        if (!checkNetworkIsReachable(networkState)) {
            errorAlert(
                capitalizeFirst(t('network')),
                e('no_internet_message'),
                capitalizeFirst(t('cancel')),
            );
            return;
        }

        setLoading(true);

        const wallet = route.params.wallet;
        const network =
            route.params.wallet.network === 'testnet'
                ? ENet.Testnet
                : ENet.Bitcoin;

        setResultMessage(t('scanning_addresses'));

        try {
            let _w = await createBDKWallet(wallet as TComboWallet);
            _w = await syncBdkWallet(_w, () => {}, network, electrumServerURL);

            const bdkAddr = await new Address().create(address);
            const script = await bdkAddr.scriptPubKey();

            const isOwnedByYou = await _w.isMine(script);

            if (isOwnedByYou) {
                setResultMessage(t('wallet_is_owner'));
            } else {
                setResultMessage(t('wallet_is_not_owner'));
            }
        } catch (err: any) {
            // TODO: translate error
            errorAlert(
                capitalizeFirst(t('network')),
                err.message,
                capitalizeFirst(t('cancel')),
            );
        }

        setLoading(false);
    };

    const updateText = (text: string) => {
        if (text.length === 0) {
            clearText();
        }

        setAddress(text);
    };

    const clearText = () => {
        // Clear address
        setAddress('');

        // Clear result message
        setResultMessage('');
    };

    const onBlur = () => {
        const valueWithSingleWhitespace = address.replace(
            /^\s+|\s+$|\s+(?=\s)/g,
            '',
        );

        setAddress(valueWithSingleWhitespace);

        return valueWithSingleWhitespace;
    };

    return (
        <SafeAreaView edges={['bottom', 'right', 'left']}>
            <View style={[tailwind('w-full h-full items-center')]}>
                <View
                    style={[
                        tailwind(
                            'flex-row items-center justify-center relative mt-6 w-5/6',
                        ),
                    ]}>
                    <Text
                        style={[
                            tailwind('text-lg font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {t('address_ownership')}
                    </Text>

                    <PlainButton
                        style={[tailwind('absolute right-0 top-0')]}
                        onPress={() => {
                            navigation.dispatch(CommonActions.goBack());
                        }}>
                        <Close width={32} fill={ColorScheme.SVG.Default} />
                    </PlainButton>
                </View>

                {/* Content */}
                <View style={tailwind('mt-20 w-5/6')}>
                    <VText
                        style={[
                            tailwind('text-sm text-justify'),
                            {color: ColorScheme.Text.GrayedText},
                        ]}>
                        <VText
                            style={[
                                tailwind('font-bold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {`${capitalizeFirst(t('info'))}:`}
                        </VText>{' '}
                        {t('address_ownership_description')}
                    </VText>
                </View>

                {/* Input */}
                <View
                    style={[
                        styles.inputContainer,
                        tailwind('mt-10 w-5/6 border-gray-400 px-2'),
                    ]}>
                    <TextSingleInput
                        refs={addressInputRef}
                        placeholder={t('address_ownership_placeholder')}
                        placeholderTextColor={ColorScheme.Text.GrayedText}
                        isEnabled={true}
                        color={ColorScheme.Text.Default}
                        onChangeText={updateText}
                        onBlur={onBlur}
                    />
                </View>

                {/* Result */}
                <View style={[tailwind('mt-8')]}>
                    <Text
                        style={[
                            tailwind('text-base'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {resultMessage}
                    </Text>

                    {loading && (
                        <ActivityIndicator
                            style={[tailwind('mt-4')]}
                            size="small"
                            color={ColorScheme.SVG.Default}
                        />
                    )}
                </View>

                {/* Checker Button */}
                <LongBottomButton
                    disabled={loading}
                    style={[tailwind('mt-12 w-full items-center')]}
                    title={
                        resultMessage.includes('Address')
                            ? capitalizeFirst(t('clear'))
                            : t('check_address')
                    }
                    onPress={handleButtonCheck}
                    textColor={
                        address.trim().length > 0
                            ? ColorScheme.Text.Alt
                            : ColorScheme.Text.GrayedText
                    }
                    backgroundColor={
                        address.trim().length > 0
                            ? ColorScheme.Background.Inverted
                            : ColorScheme.Background.Secondary
                    }
                />
            </View>
        </SafeAreaView>
    );
};

export default AddressOwnership;

const styles = StyleSheet.create({
    inputContainer: {
        borderWidth: 1,
        borderRadius: 6,
    },
});
