/* eslint-disable react-hooks/exhaustive-deps */
import {Text, View, useColorScheme, StyleSheet} from 'react-native';
import React, {useState, useEffect} from 'react';

import {useNavigation, CommonActions} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

import {SafeAreaView} from 'react-native-safe-area-context';

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../../constants/Haptic';

import {useTailwind} from 'tailwind-rn';
import Color from '../../constants/Color';

import {LongBottomButton} from '../../components/button';

import {useTranslation} from 'react-i18next';

import Success from '../../assets/svg/check-circle-fill-24.svg';
import Failed from '../../assets/svg/x-circle-fill-24.svg';
import {capitalizeFirst} from '../../modules/transform';

type Props = NativeStackScreenProps<WalletParamList, 'TransactionExported'>;

type TStatusInfo = {
    status: boolean;
    fname: string;
    message: string;
};

const TransactionExported = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const {t} = useTranslation('wallet');

    const [statusInfo, setStatusInfo] = useState<TStatusInfo>({
        status: false,
        fname: '',
        message: '',
    });

    useEffect(() => {
        setStatusInfo({
            status: route.params.status,
            fname: route.params.fname,
            message: route.params.errorMsg,
        });
    }, []);

    useEffect(() => {
        // vibrate on successful send
        if (statusInfo.status) {
            RNHapticFeedback.trigger('impactLight', RNHapticFeedbackOptions);
        }
    }, [statusInfo.status]);

    return (
        <SafeAreaView edges={['right', 'left', 'bottom']}>
            <View
                style={[
                    styles.statusContainer,
                    tailwind('w-full h-full relative justify-center'),
                    {
                        backgroundColor: ColorScheme.Background.Primary,
                    },
                ]}>
                <View style={[tailwind('h-full justify-center')]}>
                    <Text
                        style={[
                            tailwind(
                                'text-lg absolute font-bold text-center w-full top-6 px-4',
                            ),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {capitalizeFirst(t('export'))}
                    </Text>

                    <View
                        style={[
                            tailwind('-mt-12 justify-center px-4 items-center'),
                        ]}>
                        <View style={[tailwind('items-center')]}>
                            {!statusInfo.status && (
                                <Failed
                                    style={[tailwind('self-center')]}
                                    fill={ColorScheme.SVG.Default}
                                    height={128}
                                    width={128}
                                />
                            )}

                            {statusInfo.status && (
                                <Success
                                    style={[tailwind('self-center')]}
                                    fill={ColorScheme.SVG.Default}
                                    height={128}
                                    width={128}
                                />
                            )}
                        </View>

                        <View style={[tailwind('w-4/5 mt-4 items-center')]}>
                            <Text
                                style={[
                                    tailwind('text-lg font-bold'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {statusInfo.status
                                    ? capitalizeFirst(t('successful'))
                                    : capitalizeFirst(t('failed'))}
                            </Text>
                        </View>

                        <View style={[tailwind('items-center w-4/5')]}>
                            <Text
                                ellipsizeMode="middle"
                                numberOfLines={1}
                                style={[
                                    tailwind('text-sm text-center mt-4'),
                                    {
                                        color: ColorScheme.Text.GrayedText,
                                    },
                                ]}>
                                {statusInfo.status
                                    ? statusInfo.fname
                                    : statusInfo.message}
                            </Text>
                        </View>
                    </View>

                    <View
                        style={[
                            tailwind('absolute bottom-0 items-center w-full'),
                        ]}>
                        <LongBottomButton
                            onPress={() => {
                                navigation.dispatch(
                                    CommonActions.navigate('WalletRoot', {
                                        screen: 'WalletView',
                                        params: {
                                            reload: statusInfo.status,
                                        },
                                    }),
                                );
                            }}
                            title={t('back_to_wallet')}
                            textColor={ColorScheme.Text.Alt}
                            backgroundColor={ColorScheme.Background.Inverted}
                        />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default TransactionExported;

const styles = StyleSheet.create({
    statusContainer: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
});
