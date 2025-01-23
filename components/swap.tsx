import React, {useMemo} from 'react';
import {Platform, View, useColorScheme} from 'react-native';

import VText from './text';

import {LongBottomButton, PlainButton} from './button';

import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {BottomModal} from './bmodal';
import Color from '../constants/Color';

import {useTranslation} from 'react-i18next';
import {capitalizeFirst, formatSats} from '../modules/transform';
import NativeWindowMetrics from '../constants/NativeWindowMetrics';
import {SwapType} from '../types/enums';

import CheckIcon from '../assets/svg/check-circle-fill-16.svg';
import InfoIcon from '../assets/svg/info-16.svg';
import BigNumber from 'bignumber.js';

type SwapProps = {
    swapRef: React.RefObject<BottomSheetModal>;
    onSelectSwap: (idx: number) => void;
    triggerSwap: (swapType: SwapType) => void;
    onchainBalance: BigNumber;
    lightningBalance: BigNumber;
    swapInfo: {
        swapIn: {
            min: number;
            max: number;
        };
        swapOut: {
            min: number;
            max: number;
        };
    };
    swapInProgress: boolean; // Swap In in progress (i.e. swapping)
    breezConnected: boolean; // Breez connected
    isOnline: boolean;
    loadingInfo: boolean;
};

const Swap = (props: SwapProps) => {
    const snapPoints = useMemo(() => ['50'], []);
    const bottomOffset =
        NativeWindowMetrics.bottom - (Platform.OS === 'ios' ? 16 : 72);

    const onchainBroke =
        props.onchainBalance.isLessThan(props.swapInfo.swapIn.min) ||
        props.onchainBalance.isZero();

    const lightningBroke =
        props.lightningBalance.isLessThan(props.swapInfo.swapOut.min) ||
        props.lightningBalance.isZero();

    const [selected, setSelected] = React.useState<SwapType>(
        onchainBroke ? SwapType.SwapOut : SwapType.SwapIn,
    );

    const swapInfoUnavailable = Object.keys(props.swapInfo).length === 0;
    const swapOutLoading = swapInfoUnavailable || !props.swapInfo.swapOut.min;

    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const ColorScheme = Color(useColorScheme());

    const disableButton =
        (onchainBroke && lightningBroke) ||
        props.loadingInfo ||
        swapOutLoading ||
        !props.isOnline ||
        props.swapInProgress;

    const infoMessage =
        !props.isOnline && swapOutLoading
            ? t('no_internet_cannot_swap')
            : props.swapInProgress
            ? t('swap_in_progress')
            : !props.breezConnected
            ? t('not_connected_to_breez_services')
            : t('loading_swap_info');

    return (
        <BottomModal
            snapPoints={snapPoints}
            ref={props.swapRef}
            onUpdate={props.onSelectSwap}
            backgroundColor={ColorScheme.Background.Primary}
            handleIndicatorColor={'#64676E'}
            backdrop={true}>
            <View
                className="w-full h-full relative"
                style={{
                        backgroundColor: ColorScheme.Background.Primary,
                    }}>
                <View className="w-full px-2 h-full items-center">
                    {/* Swap In */}
                    <PlainButton
                        disabled={
                            onchainBroke || swapOutLoading || !props.isOnline
                        }
                        onPress={() => {
                            if (!onchainBroke && !swapOutLoading) {
                                setSelected(SwapType.SwapIn);
                            }
                        }}
                        className={
                            `items-center p-4 mt-2 w-full mb-4 border rounded-md ${
                                onchainBroke ||
                                swapOutLoading ||
                                !props.isOnline ||
                                props.loadingInfo ||
                                props.swapInProgress
                                    ? 'opacity-60'
                                    : 'opacity-100'
                            }`
                        }
                        style={{
                                borderColor: ColorScheme.Background.Greyed,
                            }}>
                        <View
                            className={
                                `w-full ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    }`
                            }>
                            <VText
                                className="text-sm font-semibold"
                                style={{color: ColorScheme.Text.Default}}>
                                {t('swap_in')}
                            </VText>
                            {selected === SwapType.SwapIn &&
                                !swapOutLoading &&
                                props.isOnline &&
                                !onchainBroke &&
                                !props.swapInProgress && (
                                    <CheckIcon
                                        className={
                                            `${
                                                    langDir === 'right'
                                                        ? 'mr-2'
                                                        : 'ml-2'
                                                }`
                                        }
                                        fill={ColorScheme.Text.Default}
                                    />
                                )}
                        </View>
                        <VText
                            className="w-full text-sm mt-2"
                            style={{color: ColorScheme.Text.DescText}}>
                            {t('swap_in_message')}
                        </VText>

                        {props.onchainBalance.lt(props.swapInfo.swapIn.min) && (
                            <View
                                className="w-full items-center flex-row mt-2">
                                <InfoIcon fill={ColorScheme.SVG.GrayFill} />
                                <VText
                                    className="text-sm ml-2"
                                    style={{color: ColorScheme.Text.DescText}}>
                                    {t('balance_below_min', {
                                        swap_min: formatSats(
                                            new BigNumber(
                                                props.swapInfo.swapIn.min,
                                            ),
                                        ),
                                    })}
                                </VText>
                            </View>
                        )}
                    </PlainButton>

                    {/* Swap Out */}
                    <PlainButton
                        disabled={
                            lightningBroke || swapOutLoading || !props.isOnline
                        }
                        onPress={() => {
                            if (!lightningBroke || !swapOutLoading) {
                                setSelected(SwapType.SwapOut);
                            }
                        }}
                        className={
                            `items-center p-4 w-full border rounded-md ${
                                    lightningBroke ||
                                    swapOutLoading ||
                                    !props.isOnline ||
                                    props.loadingInfo
                                        ? 'opacity-60'
                                        : 'opacity-100'
                                }`
                        }
                        style={{borderColor: ColorScheme.Background.Greyed}}>
                        <View
                            className={
                                `w-full ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    }`
                            }>
                            <VText
                                className="text-sm font-semibold"
                                style={{color: ColorScheme.Text.Default}}>
                                {t('swap_out')}
                            </VText>
                            {selected === SwapType.SwapOut &&
                                !lightningBroke &&
                                !swapOutLoading &&
                                props.isOnline && (
                                    <CheckIcon
                                        className={
                                            `${
                                                    langDir === 'right'
                                                        ? 'mr-2'
                                                        : 'ml-2'
                                                }`
                                        }
                                        fill={ColorScheme.Text.Default}
                                    />
                                )}
                        </View>
                        <VText
                            className="w-full text-sm mt-2"
                            style={{color: ColorScheme.Text.DescText}}>
                            {t('swap_out_message')}
                        </VText>

                        {props.lightningBalance.lt(
                            props.swapInfo.swapOut.min,
                        ) && (
                            <View
                                className="w-full items-center flex-row mt-2">
                                <InfoIcon fill={ColorScheme.SVG.GrayFill} />
                                <VText
                                    className="text-sm ml-2"
                                    style={{color: ColorScheme.Text.DescText}}>
                                    {t('balance_below_min', {
                                        swap_min: formatSats(
                                            new BigNumber(
                                                props.swapInfo.swapOut.min,
                                            ),
                                        ),
                                    })}
                                </VText>
                            </View>
                        )}
                    </PlainButton>

                    {(!props.isOnline ||
                        swapOutLoading ||
                        props.swapInProgress) && (
                        <View
                            className={
                                `mt-4 items-center ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    }`
                            }>
                            <InfoIcon
                                width={16}
                                fill={ColorScheme.SVG.GrayFill}
                            />
                            <VText
                                className={
                                    `text-sm ${
                                            langDir === 'right'
                                                ? 'mr-2'
                                                : 'ml-2'
                                        }`
                                }
                                style={{color: ColorScheme.Text.DescText}}>
                                {infoMessage}
                            </VText>
                        </View>
                    )}

                    <View
                        className="w-full absolute items-center"
                        style={{bottom: bottomOffset}}>
                        <LongBottomButton
                            disabled={disableButton}
                            title={capitalizeFirst(t('continue'))}
                            onPress={() => {
                                props.triggerSwap(selected);
                            }}
                            backgroundColor={ColorScheme.Background.Inverted}
                            textColor={ColorScheme.Text.Alt}
                        />
                    </View>
                </View>
            </View>
        </BottomModal>
    );
};

export default Swap;
