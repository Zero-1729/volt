import {
    Text,
    View,
    useColorScheme,
    StyleSheet,
    Platform,
    AppState,
    Dimensions,
} from 'react-native';
import React, {useEffect, useRef, useCallback} from 'react';

import {
    useNavigation,
    CommonActions,
    useFocusEffect,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WalletParamList} from '../../Navigation';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useTranslation} from 'react-i18next';

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../../constants/Haptic';

import {capitalizeFirst} from '../../modules/transform';
import {useTailwind} from 'tailwind-rn';
import Color from '../../constants/Color';

import {EBreezDetails} from './../../types/enums';

import {LongBottomButton} from '../../components/button';

import Success from '../../assets/svg/check-circle-fill-24.svg';
import Failed from '../../assets/svg/x-circle-fill-24.svg';
import {FiatBalance} from '../../components/balance';

import Lottie from 'lottie-react-native';

import eNutsConfetti from '../../assets/lottie/e-nuts-confetti.json';

type Props = NativeStackScreenProps<WalletParamList, 'LNTransactionStatus'>;

const LNTransactionStatus = ({route}: Props) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const {height, width} = Dimensions.get('window');

    const lottieAnim = useRef<Lottie>(null);
    const appState = useRef(AppState.currentState);

    const {t} = useTranslation('wallet');

    const confettiSrc = eNutsConfetti;
    const receivedPayment = route.params.detailsType === 'received';

    const txTitle = () => {
        let msg!: string;

        switch (route.params.detailsType) {
            case EBreezDetails.Received:
                msg = t('payment_received');
                break;
            case EBreezDetails.Success:
                msg = t('payment_success');
                break;
            case EBreezDetails.Failed:
                msg = t('payment_failed');
                break;
        }

        return msg;
    };

    // TEMP: fix iOS animation autoPlay
    // @see https://github.com/lottie-react-native/lottie-react-native/issues/832
    useFocusEffect(
        useCallback(() => {
            if (Platform.OS === 'ios') {
                lottieAnim.current?.reset();
                setTimeout(() => {
                    lottieAnim.current?.play();
                }, 0);
            }
        }, []),
    );

    // TEMP: fix iOS animation on app to foreground
    useEffect(() => {
        const appStateSubscription = AppState.addEventListener(
            'change',
            nextAppState => {
                if (
                    appState.current.match(/inactive|background/) &&
                    nextAppState === 'active'
                ) {
                    console.log('yes');
                    lottieAnim.current?.play();
                }

                appState.current = nextAppState;
            },
        );

        return () => {
            appStateSubscription.remove();
        };
    }, []);

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
                    tailwind('w-full h-full justify-center'),
                    {
                        backgroundColor: ColorScheme.Background.Primary,
                    },
                ]}>
                {!!route.params.status && (
                    <View style={[tailwind('h-full justify-center')]}>
                        <View
                            style={[
                                styles.confettiContainer,
                                {width: width, height: height},
                            ]}
                            pointerEvents="none">
                            <Lottie
                                style={[styles.confetti]}
                                ref={lottieAnim}
                                onLayout={(_): void =>
                                    lottieAnim.current?.play()
                                }
                                source={confettiSrc}
                                resizeMode="cover"
                                autoPlay={!receivedPayment}
                                loop={!receivedPayment}
                            />
                        </View>

                        <Text
                            style={[
                                tailwind(
                                    'text-lg absolute font-bold text-center w-full top-6 px-4',
                                ),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('lightning_invoice')}
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

                            {route.params.detailsType === 'received' && (
                                <View
                                    style={[
                                        tailwind('mt-4 mb-2 items-center'),
                                    ]}>
                                    <FiatBalance
                                        balance={200000}
                                        loading={false}
                                        balanceFontSize={'text-2xl'}
                                        fontColor={ColorScheme.Text.Default}
                                        ignoreHideBalance={true}
                                    />
                                </View>
                            )}

                            <View
                                style={[
                                    tailwind(
                                        `w-4/5 ${
                                            route.params.detailsType ===
                                            'received'
                                                ? ''
                                                : 'mt-4'
                                        } items-center`,
                                    ),
                                ]}>
                                <Text
                                    style={[
                                        tailwind('text-lg'),
                                        {color: ColorScheme.Text.Default},
                                    ]}>
                                    {txTitle()}
                                </Text>
                            </View>

                            {route.params.detailsType === 'received' && (
                                <View style={[tailwind('items-center w-4/5')]}>
                                    <Text
                                        style={[
                                            tailwind(
                                                'text-sm text-center mt-2',
                                            ),
                                            {
                                                color: ColorScheme.Text
                                                    .GrayedText,
                                            },
                                        ]}>
                                        {route.params.details.description}
                                    </Text>
                                </View>
                            )}
                        </View>

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
                                title={capitalizeFirst(t('continue'))}
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
    confetti: {
        ...StyleSheet.absoluteFillObject,
        flex: 1,
    },
    confettiContainer: {
        ...StyleSheet.absoluteFillObject,
        flex: 1,
    },
});
