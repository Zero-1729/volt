/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {
    useMemo,
    useEffect,
    useState,
    useContext,
    useRef,
    ReactElement,
    useCallback,
} from 'react';
import {View, Text, useColorScheme, StyleSheet, Platform} from 'react-native';

import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {BottomModal} from './bmodal';
import Color from '../constants/Color';

import NativeWindowMetrics from '../constants/NativeWindowMetrics';
import Carousel, {ICarouselInstance} from 'react-native-reanimated-carousel';

import {LongButton} from './button';

import {useTailwind} from 'tailwind-rn';
import {useTranslation} from 'react-i18next';

import BitcoinNight from '../assets/svg/bitcoin-knight.svg';
import Success from './../assets/svg/check-circle-fill-24.svg';

import {MnemonicInput, PinNumpad} from './input';

import {setKeychainItem} from '../class/keychainContext';

import Toast, {ToastConfig} from 'react-native-toast-message';
import {toastConfig} from './toast';

import {useSharedValue} from 'react-native-reanimated';
import {capitalizeFirst} from '../modules/transform';
import {AppStorageContext} from '../class/storageContext';

type Slide = () => ReactElement;

type ResetPINProps = {
    pinPassRef: React.RefObject<BottomSheetModal>;
    triggerSuccess: () => void;
    onSelectPinPass: (idx: number) => void;
    pinMode: boolean;
    idx: number;
    testInfo: {
        mnemonic: boolean;
        isWatchOnly: boolean;
    };
};

const ResetPINCode = (props: ResetPINProps) => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    const snapPoints = useMemo(() => ['75'], []);

    const {setPINAttempts} = useContext(AppStorageContext);

    const [tmpPIN, setTmpPIN] = useState<string>('');
    const [confirmPIN, setConfirmPIN] = useState<string>('');
    const carouselRef = useRef<ICarouselInstance>(null);
    const progressValue = useSharedValue(0);

    const {getWalletData, currentWalletID} = useContext(AppStorageContext);
    const {t} = useTranslation('settings');

    const walletMnemonic = getWalletData(currentWalletID).mnemonic;
    const mnemonicList = walletMnemonic.split(' ');

    const [isCorrectMnemonic, setIsCorrectMnemonic] = useState(false);

    const updatePIN = (pin: string): void => {
        setTmpPIN(pin);
    };

    const updateConfirmPIN = (pin: string): void => {
        setConfirmPIN(pin);
    };

    const handleSuccessReset = useCallback(() => {
        props.triggerSuccess();
    }, [props]);

    useEffect(() => {
        if (isCorrectMnemonic) {
            carouselRef.current?.next();
        }
    }, [isCorrectMnemonic]);

    useEffect(() => {
        if (tmpPIN.length === 4) {
            carouselRef.current?.next();
        }
    }, [tmpPIN]);

    useEffect(() => {
        if (confirmPIN.length === 4) {
            if (tmpPIN === confirmPIN) {
                carouselRef.current?.next();

                // Set new PIN and reset attempts
                setKeychainItem('pin', confirmPIN);
                setPINAttempts(0);

                setConfirmPIN('');
            } else {
                carouselRef.current?.prev();
                setTmpPIN('');
            }

            setConfirmPIN('');
        }
    }, [confirmPIN]);

    const welcomePanel = useCallback((): ReactElement => {
        return (
            <View
                style={[tailwind('w-full h-full items-center justify-center')]}>
                <View style={[tailwind('items-center absolute top-0')]}>
                    <Text
                        style={[
                            tailwind('text-lg font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {t('reset_pin')}
                    </Text>
                </View>

                <View
                    style={[
                        tailwind('items-center w-5/6 absolute'),
                        {top: 56},
                    ]}>
                    <Text
                        style={[
                            tailwind('text-sm text-center'),
                            {color: ColorScheme.Text.DescText},
                        ]}>
                        {t('reset_pin_desc')}
                    </Text>
                </View>

                <View
                    style={[
                        tailwind('w-full items-center justify-center'),
                        {marginTop: -(32 + NativeWindowMetrics.height * 0.15)},
                    ]}>
                    <BitcoinNight height={256} width={256} />
                </View>

                <View
                    style={[
                        tailwind('absolute w-5/6'),
                        {
                            bottom: 24 + NativeWindowMetrics.height * 0.15,
                        },
                    ]}>
                    <LongButton
                        onPress={() => {
                            carouselRef.current?.next();
                        }}
                        textColor={ColorScheme.Text.Alt}
                        backgroundColor={ColorScheme.Background.Inverted}
                        title={capitalizeFirst(t('reset'))}
                    />
                </View>
            </View>
        );
    }, [ColorScheme, t, tailwind]);

    const mnemonicPanel = useCallback((): ReactElement => {
        return (
            <View style={[tailwind('h-full w-full items-center')]}>
                <View style={[tailwind('w-5/6 mt-2 mb-6')]}>
                    <Text
                        style={[
                            tailwind('text-lg text-center font-bold mb-4'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {t('mnemonic_test')}
                    </Text>
                    <Text
                        style={[
                            tailwind('text-sm text-center mb-4'),
                            {color: ColorScheme.Text.DescText},
                        ]}>
                        {t('mnemonic_test_desc')}
                    </Text>
                </View>

                {/* Checker for Mnemonic */}
                <View
                    style={[tailwind('w-5/6 items-center'), {marginLeft: 16}]}>
                    <MnemonicInput
                        mnemonicList={mnemonicList}
                        onMnemonicCheck={setIsCorrectMnemonic}
                    />
                </View>
            </View>
        );
    }, [ColorScheme, mnemonicList, t, tailwind]);

    const pinPanel = useCallback((): ReactElement => {
        return (
            <View style={[tailwind('w-full px-2 h-full items-center')]}>
                <Text
                    style={[
                        tailwind('text-center text-lg font-bold mt-4'),
                        {color: ColorScheme.Text.Default},
                    ]}>
                    {t('new_pin')}
                </Text>

                <View
                    style={[
                        tailwind('flex-row items-center'),
                        {marginTop: 98},
                    ]}>
                    {Array(4)
                        .fill(null)
                        .map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    tailwind('rounded-full'),
                                    {
                                        borderColor:
                                            ColorScheme.Background.Inverted,
                                        backgroundColor:
                                            tmpPIN[i] === undefined
                                                ? ColorScheme.Background.Primary
                                                : ColorScheme.Background
                                                      .Inverted,
                                    },
                                ]}
                            />
                        ))}
                </View>

                <View
                    style={[
                        tailwind('justify-center absolute'),
                        {
                            bottom:
                                NativeWindowMetrics.bottomButtonOffset +
                                NativeWindowMetrics.height * 0.15,
                        },
                    ]}>
                    <PinNumpad
                        pin={tmpPIN}
                        onPinChange={updatePIN}
                        pinLimit={4}
                        showBiometrics={false}
                    />
                </View>
            </View>
        );
    }, [ColorScheme, t, tailwind, tmpPIN]);

    const confirmPanel = useCallback((): ReactElement => {
        return (
            <View style={[tailwind('w-full px-2 h-full items-center')]}>
                <Text
                    style={[
                        tailwind('text-center text-lg font-bold mt-4'),
                        {color: ColorScheme.Text.Default},
                    ]}>
                    {t('retype_pin')}
                </Text>

                <View
                    style={[
                        tailwind('flex-row items-center'),
                        {marginTop: 98},
                    ]}>
                    {Array(4)
                        .fill(null)
                        .map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    tailwind('rounded-full'),
                                    {
                                        borderColor:
                                            ColorScheme.Background.Inverted,
                                        backgroundColor:
                                            confirmPIN[i] === undefined
                                                ? ColorScheme.Background.Primary
                                                : ColorScheme.Background
                                                      .Inverted,
                                    },
                                ]}
                            />
                        ))}
                </View>

                <View
                    style={[
                        tailwind('absolute'),
                        {
                            bottom:
                                NativeWindowMetrics.bottomButtonOffset +
                                NativeWindowMetrics.height * 0.15,
                        },
                    ]}>
                    <PinNumpad
                        pin={confirmPIN}
                        onPinChange={updateConfirmPIN}
                        pinLimit={4}
                        showBiometrics={false}
                    />
                </View>
            </View>
        );
    }, [ColorScheme, confirmPIN, t, tailwind]);

    const donePanel = useCallback((): ReactElement => {
        return (
            <View
                style={[tailwind('w-full h-full items-center justify-center')]}>
                <View style={[tailwind('items-center absolute top-0')]}>
                    <Text
                        style={[
                            tailwind('text-lg font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {t('reset_pin')}
                    </Text>
                </View>

                <View
                    style={[
                        tailwind('items-center w-5/6 absolute'),
                        {top: 56},
                    ]}>
                    <Text
                        style={[
                            tailwind('text-sm text-center'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        {t('done_pin_change_message')}
                    </Text>
                </View>

                <View
                    style={[
                        {
                            marginTop: -(
                                32 +
                                NativeWindowMetrics.height * 0.15
                            ),
                        },
                    ]}>
                    <Success
                        fill={ColorScheme.SVG.Default}
                        width={200}
                        height={200}
                    />
                </View>

                <View
                    style={[
                        tailwind('absolute w-5/6'),
                        {
                            bottom: 24 + NativeWindowMetrics.height * 0.15,
                        },
                    ]}>
                    <LongButton
                        onPress={handleSuccessReset}
                        textColor={ColorScheme.Text.Alt}
                        backgroundColor={ColorScheme.Background.Inverted}
                        title={capitalizeFirst(t('done'))}
                    />
                </View>
            </View>
        );
    }, [ColorScheme, handleSuccessReset, t, tailwind]);

    const panels = useMemo(
        (): Slide[] => [
            welcomePanel,
            mnemonicPanel,
            pinPanel,
            confirmPanel,
            donePanel,
        ],
        [welcomePanel, mnemonicPanel, pinPanel, confirmPanel, donePanel],
    );

    return (
        <BottomModal
            snapPoints={snapPoints}
            ref={props.pinPassRef}
            onUpdate={props.onSelectPinPass}
            backgroundColor={ColorScheme.Background.Primary}
            handleIndicatorColor={'#64676E'}
            backdrop={true}>
            <View
                style={[
                    tailwind('w-full h-full items-center relative'),
                    {
                        backgroundColor: ColorScheme.Background.Primary,
                    },
                ]}>
                {/* Main Carousel */}
                <View
                    style={[
                        styles.carouselContainer,
                        tailwind('h-full w-full'),
                        {zIndex: -9},
                    ]}>
                    <Carousel
                        ref={carouselRef}
                        style={[tailwind('w-full h-full')]}
                        data={panels}
                        enabled={false}
                        width={NativeWindowMetrics.width}
                        // Adjust height for iOS
                        // to account for top stack height
                        height={
                            Platform.OS === 'ios'
                                ? NativeWindowMetrics.height -
                                  NativeWindowMetrics.navBottom * 3.2
                                : NativeWindowMetrics.height
                        }
                        loop={false}
                        panGestureHandlerProps={{
                            activeOffsetX: [-10, 10],
                        }}
                        testID="ReceiveSlider"
                        renderItem={({index}): ReactElement => {
                            const Slide = panels[index];
                            return <Slide key={index} />;
                        }}
                        onProgressChange={(_, absoluteProgress): void => {
                            progressValue.value = absoluteProgress;
                        }}
                    />
                </View>

                <Toast config={toastConfig as ToastConfig} />
            </View>
        </BottomModal>
    );
};

export default ResetPINCode;

const styles = StyleSheet.create({
    dot: {
        width: 20,
        height: 20,
        borderWidth: 1,
        marginHorizontal: 6,
    },
    carouselContainer: {},
});
