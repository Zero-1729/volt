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

import {useTranslation} from 'react-i18next';

import BitcoinNight from '../assets/svg/bitcoin-knight.svg';
import Success from './../assets/svg/check-circle-fill-24.svg';

import {ExtKeyInput, MnemonicInput, PinNumpad} from './input';

import {setKeychainItem} from '../class/keychainContext';

import {Toasts} from '@backpackapp-io/react-native-toast';

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
    const ColorScheme = Color(useColorScheme());

    const snapPoints = useMemo(() => ['75'], []);

    const [tmpPIN, setTmpPIN] = useState<string>('');
    const [confirmPIN, setConfirmPIN] = useState<string>('');
    const [tmpKey, setTmpKey] = useState('');
    const [isCorrectExtKey, setCorrectExtKey] = useState(false);
    const [isCorrectMnemonic, setIsCorrectMnemonic] = useState(false);

    const carouselRef = useRef<ICarouselInstance>(null);
    const progressValue = useSharedValue(0);

    const {getWalletData, currentWalletID, setPINAttempts} =
        useContext(AppStorageContext);
    const {t} = useTranslation('settings');

    const walletMnemonic = getWalletData(currentWalletID).mnemonic;
    const mnemonicList = walletMnemonic.split(' ');
    const walletXpub = getWalletData(currentWalletID).xpub;

    const updateKey = useCallback((text: string) => {
        setTmpKey(text);
    }, []);

    const handleExtKeyCorrect = useCallback((matches: boolean) => {
        setCorrectExtKey(matches);
    }, []);

    const updatePIN = useCallback((pin: string): void => {
        setTmpPIN(pin);
    }, []);

    const updateConfirmPIN = useCallback((pin: string): void => {
        setConfirmPIN(pin);
    }, []);

    const handleSuccessReset = useCallback(() => {
        props.triggerSuccess();
    }, [props]);

    useEffect(() => {
        if (isCorrectExtKey) {
            carouselRef.current?.next();
        }
    }, [isCorrectExtKey]);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [confirmPIN]);

    const welcomePanel = useCallback((): ReactElement => {
        return (
            <View
                className="w-full justify-center items-center"
                style={{
                        height: NativeWindowMetrics.height * 0.75,
                    }}>
                <View className="items-center absolute top-0 w-5/6">
                    <Text
                        className="text-lg font-bold"
                        style={{color: ColorScheme.Text.Default}}>
                        {t('reset_pin')}
                    </Text>

                    <Text
                        className="text-sm text-center mt-4"
                        style={{color: ColorScheme.Text.DescText}}>
                        {props.testInfo.isWatchOnly
                            ? t('reset_pin_e_desc')
                            : t('reset_pin_m_desc')}
                    </Text>
                </View>

                <View
                    className="justify-center flex items-center"
                    style={{
                            marginTop: -(
                                NativeWindowMetrics.height *
                                0.75 *
                                0.15
                            ),
                        }}>
                    <BitcoinNight height={256} width={256} />
                </View>

                <View
                    className="absolute w-5/6"
                    style={{
                            bottom:
                                24 + NativeWindowMetrics.height * 0.75 * 0.1,
                        }}>
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
    }, [ColorScheme.Background.Inverted, ColorScheme.Text.Alt, ColorScheme.Text.Default, ColorScheme.Text.DescText, props.testInfo.isWatchOnly, t]);

    const mnemonicPanel = useCallback((): ReactElement => {
        return (
            <View className="h-full w-full items-center">
                <View className="w-5/6 mt-2 mb-6">
                    <Text
                        className="text-lg text-center font-bold mb-4"
                        style={{color: ColorScheme.Text.Default}}>
                        {t('mnemonic_test')}
                    </Text>
                    <Text
                        className="text-sm text-center mb-4"
                        style={{color: ColorScheme.Text.DescText}}>
                        {t('mnemonic_test_desc')}
                    </Text>
                </View>

                {/* Checker for Mnemonic */}
                <View
                    className="w-5/6 items-center"
                    style={{marginLeft: 16}}>
                    <MnemonicInput
                        mnemonicList={mnemonicList}
                        onMnemonicCheck={setIsCorrectMnemonic}
                    />
                </View>
            </View>
        );
    }, [ColorScheme, mnemonicList, t]);

    const extKeyPanel = useCallback((): ReactElement => {
        return (
            <View className="w-full h-full items-center">
                <View className="items-center h-full w-full">
                    <View
                        className="w-5/6 absolute top-0 flex-row justify-center">
                        <View className="self-center">
                            <Text
                                className="text-base font-bold"
                                style={{color: ColorScheme.Text.Default}}>
                                {t('ext_test')}
                            </Text>
                        </View>
                    </View>
                    <View
                        className="w-5/6 justify-center items-center"
                        style={{marginTop: 64, marginBottom: 32}}>
                        <Text
                            className="text-base text-center"
                            style={{color: ColorScheme.Text.DescText}}>
                            {t('ext_pub_test_desc')}
                        </Text>
                    </View>

                    {/* Ext Key */}
                    <View className="w-5/6">
                        <ExtKeyInput
                            handleCorrect={handleExtKeyCorrect}
                            onChangeText={updateKey}
                            value={tmpKey}
                            extKey={walletXpub}
                            color={ColorScheme.Text.Default}
                            placeholder={t('enter_ext_pub')}
                        />
                    </View>
                </View>
            </View>
        );
    }, [ColorScheme.Text.Default, ColorScheme.Text.DescText, handleExtKeyCorrect, t, tmpKey, updateKey, walletXpub]);

    const testPanel = props.testInfo.mnemonic ? mnemonicPanel : extKeyPanel;

    const pinPanel = useCallback((): ReactElement => {
        return (
            <View className="w-full px-2 h-full items-center">
                <Text
                    className="text-center text-lg font-bold mt-4"
                    style={{color: ColorScheme.Text.Default}}>
                    {t('new_pin')}
                </Text>

                <View
                    className="flex-row items-center"
                    style={{marginTop: 98}}>
                    {Array(4)
                        .fill(null)
                        .map((_, i) => (
                            <View
                                key={i}
                                className="rounded-full"
                                style={[
                                    styles.dot,
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
                    className="justify-center absolute"
                    style={{
                            bottom:
                                NativeWindowMetrics.bottomButtonOffset +
                                NativeWindowMetrics.height * 0.15,
                        }}>
                    <PinNumpad
                        pin={tmpPIN}
                        onPinChange={updatePIN}
                        pinLimit={4}
                        showBiometrics={false}
                    />
                </View>
            </View>
        );
    }, [ColorScheme.Background.Inverted, ColorScheme.Background.Primary, ColorScheme.Text.Default, t, tmpPIN, updatePIN]);

    const confirmPanel = useCallback((): ReactElement => {
        return (
            <View className="w-full px-2 h-full items-center">
                <Text
                    className="text-center text-lg font-bold mt-4"
                    style={{color: ColorScheme.Text.Default}}>
                    {t('retype_pin')}
                </Text>

                <View
                    className="flex-row items-center"
                    style={{marginTop: 98}}>
                    {Array(4)
                        .fill(null)
                        .map((_, i) => (
                            <View
                                key={i}
                                className="rounded-full"
                                style={[
                                    styles.dot,
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
                    className="absolute"
                    style={{
                            bottom:
                                NativeWindowMetrics.bottomButtonOffset +
                                NativeWindowMetrics.height * 0.15,
                        }}>
                    <PinNumpad
                        pin={confirmPIN}
                        onPinChange={updateConfirmPIN}
                        pinLimit={4}
                        showBiometrics={false}
                    />
                </View>
            </View>
        );
    }, [ColorScheme.Background.Inverted, ColorScheme.Background.Primary, ColorScheme.Text.Default, confirmPIN, t, updateConfirmPIN]);

    const donePanel = useCallback((): ReactElement => {
        return (
            <View
                className="w-full h-full items-center justify-center">
                <View className="items-center absolute top-0">
                    <Text
                        className="text-lg font-bold"
                        style={{color: ColorScheme.Text.Default}}>
                        {t('reset_pin')}
                    </Text>
                </View>

                <View
                    className="items-center w-5/6 absolute"
                    style={{top: 56}}>
                    <Text
                        className="text-sm text-center"
                        style={{color: ColorScheme.Text.Default}}>
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
                    className="absolute w-5/6"
                    style={{
                            bottom: 24 + NativeWindowMetrics.height * 0.15,
                        }}>
                    <LongButton
                        onPress={handleSuccessReset}
                        textColor={ColorScheme.Text.Alt}
                        backgroundColor={ColorScheme.Background.Inverted}
                        title={capitalizeFirst(t('done'))}
                    />
                </View>
            </View>
        );
    }, [ColorScheme, handleSuccessReset, t]);

    const panels = useMemo(
        (): Slide[] => [
            welcomePanel,
            testPanel,
            pinPanel,
            confirmPanel,
            donePanel,
        ],
        [welcomePanel, testPanel, pinPanel, confirmPanel, donePanel],
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
                className="w-full h-full items-center relative"
                style={{
                        backgroundColor: ColorScheme.Background.Primary,
                    }}>
                {/* Main Carousel */}
                <View
                    className="h-full w-full"
                    style={[
                        styles.carouselContainer,
                        {zIndex: -9},
                    ]}>
                    <Carousel
                        ref={carouselRef}
                        style={{
                            height: '100%',
                            width: '100%',
                        }}
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

                <Toasts extraInsets={{top: NativeWindowMetrics.height * -0.075}} />
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
