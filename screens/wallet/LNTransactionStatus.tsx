import {Text, View, useColorScheme, StyleSheet} from 'react-native';
import React, {useContext, useEffect} from 'react';

import {useNavigation, CommonActions} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

import {AppStorageContext} from '../../class/storageContext';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useTranslation} from 'react-i18next';

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../../constants/Haptic';
import NativeOffsets from '../../constants/NativeWindowMetrics';

import {capitalizeFirst} from '../../modules/transform';
import {useTailwind} from 'tailwind-rn';
import Color from '../../constants/Color';

import {EBreezDetails} from './../../types/enums';

import {LongBottomButton, PlainButton} from '../../components/button';

import Success from '../../assets/svg/check-circle-fill-24.svg';
import Failed from '../../assets/svg/x-circle-fill-24.svg';

type Props = NativeStackScreenProps<WalletParamList, 'LNTransactionStatus'>;

const LNTransactionStatus = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const {t} = useTranslation('wallet');

    const {isAdvancedMode} = useContext(AppStorageContext);

    const bottomOffset = NativeOffsets.bottom + 110;

    const getDetails = () => {
        const detailsType = route.params.detailsType;
        const details = route.params.details;

        switch (detailsType) {
            case EBreezDetails.Received:
            case EBreezDetails.Success:
                return capitalizeFirst(t('success'));
            case EBreezDetails.Failed:
                return details.error;
            default:
                return '';
        }
    };

    useEffect(() => {
        // vibrate on successful send
        if (route.params.status) {
            RNHapticFeedback.trigger('impactLight', RNHapticFeedbackOptions);
        }
    }, [route.params.status]);

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
                {!!route.params.status && (
                    <View style={[tailwind('h-full justify-center')]}>
                        <Text
                            style={[
                                tailwind(
                                    'text-lg absolute font-bold text-center w-full top-6 px-4',
                                ),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {capitalizeFirst(t('status'))}
                        </Text>

                        <View
                            style={[
                                tailwind(
                                    '-mt-12 justify-center px-4 items-center',
                                ),
                            ]}>
                            <View style={[tailwind('items-center')]}>
                                {!route.params.status && (
                                    <Failed
                                        style={[tailwind('self-center')]}
                                        fill={ColorScheme.SVG.Default}
                                        height={128}
                                        width={128}
                                    />
                                )}

                                {route.params.status && (
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
                                    {route.params.status
                                        ? t('tx_sent')
                                        : t('tx_failed')}
                                </Text>
                            </View>

                            {isAdvancedMode && (
                                <View style={[tailwind('items-center w-4/5')]}>
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
                                        {getDetails()}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {route.params.status && (
                            <PlainButton
                                style={[
                                    tailwind('absolute self-center'),
                                    {bottom: bottomOffset},
                                ]}
                                onPress={}>
                                <Text
                                    style={[
                                        tailwind('font-bold text-sm'),
                                        {color: ColorScheme.Text.DescText},
                                    ]}>
                                    prev_mempool
                                </Text>
                            </PlainButton>
                        )}

                        <View
                            style={[
                                tailwind(
                                    'absolute bottom-0 items-center w-full',
                                ),
                            ]}>
                            <LongBottomButton
                                onPress={() => {
                                    navigation.dispatch(
                                        CommonActions.navigate('WalletRoot', {
                                            screen: 'WalletView',
                                            params: {
                                                reload: route.params.status,
                                            },
                                        }),
                                    );
                                }}
                                title={t('back_to_wallet')}
                                textColor={ColorScheme.Text.Alt}
                                backgroundColor={
                                    ColorScheme.Background.Inverted
                                }
                            />
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

export default LNTransactionStatus;

const styles = StyleSheet.create({
    statusContainer: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
});
