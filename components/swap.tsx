import React, {useMemo} from 'react';
import {Platform, View, useColorScheme} from 'react-native';

import VText from './text';

import {LongBottomButton, PlainButton} from './button';

import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {BottomModal} from './bmodal';
import Color from '../constants/Color';

import {useTailwind} from 'tailwind-rn';
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
    isOnline: boolean;
    loadingInfo: boolean;
};

const Swap = (props: SwapProps) => {
    const tailwind = useTailwind();
    const snapPoints = useMemo(() => ['46'], []);
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

    return (
        <BottomModal
            snapPoints={snapPoints}
            ref={props.swapRef}
            onUpdate={props.onSelectSwap}
            backgroundColor={ColorScheme.Background.Primary}
            handleIndicatorColor={'#64676E'}
            backdrop={true}>
            <View
                style={[
                    tailwind('w-full h-full relative'),
                    {
                        backgroundColor: ColorScheme.Background.Primary,
                    },
                ]}>
                <View style={[tailwind('w-full px-2 h-full items-center')]}>
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
                        style={[
                            tailwind(
                                `items-center p-4 mt-2 w-full mb-4 border rounded-md ${
                                    onchainBroke ||
                                    swapOutLoading ||
                                    !props.isOnline ||
                                    props.loadingInfo
                                        ? 'opacity-60'
                                        : 'opacity-100'
                                }`,
                            ),
                            {
                                borderColor: ColorScheme.Background.Greyed,
                            },
                        ]}>
                        <View
                            style={[
                                tailwind(
                                    `w-full ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    }`,
                                ),
                            ]}>
                            <VText
                                style={[
                                    tailwind('text-sm font-semibold'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {t('swap_in')}
                            </VText>
                            {selected === SwapType.SwapIn &&
                                !swapOutLoading &&
                                props.isOnline &&
                                !onchainBroke && (
                                    <CheckIcon
                                        style={[
                                            tailwind(
                                                `${
                                                    langDir === 'right'
                                                        ? 'mr-2'
                                                        : 'ml-2'
                                                }`,
                                            ),
                                        ]}
                                        fill={ColorScheme.Text.Default}
                                    />
                                )}
                        </View>
                        <VText
                            style={[
                                tailwind('w-full text-sm mt-2'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {t('swap_in_message')}
                        </VText>

                        {props.onchainBalance.lt(props.swapInfo.swapIn.min) && (
                            <View
                                style={[
                                    tailwind(
                                        'w-full items-center flex-row mt-2',
                                    ),
                                ]}>
                                <InfoIcon fill={ColorScheme.SVG.GrayFill} />
                                <VText
                                    style={[
                                        tailwind('text-sm ml-2'),
                                        {color: ColorScheme.Text.DescText},
                                    ]}>
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
                        style={[
                            tailwind(
                                `items-center p-4 w-full border rounded-md ${
                                    lightningBroke ||
                                    swapOutLoading ||
                                    !props.isOnline ||
                                    props.loadingInfo
                                        ? 'opacity-60'
                                        : 'opacity-100'
                                }`,
                            ),
                            {borderColor: ColorScheme.Background.Greyed},
                        ]}>
                        <View
                            style={[
                                tailwind(
                                    `w-full ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    }`,
                                ),
                            ]}>
                            <VText
                                style={[
                                    tailwind('text-sm font-semibold'),
                                    {color: ColorScheme.Text.Default},
                                ]}>
                                {t('swap_out')}
                            </VText>
                            {selected === SwapType.SwapOut &&
                                !lightningBroke &&
                                !swapOutLoading &&
                                props.isOnline && (
                                    <CheckIcon
                                        style={[
                                            tailwind(
                                                `${
                                                    langDir === 'right'
                                                        ? 'mr-2'
                                                        : 'ml-2'
                                                }`,
                                            ),
                                        ]}
                                        fill={ColorScheme.Text.Default}
                                    />
                                )}
                        </View>
                        <VText
                            style={[
                                tailwind('w-full text-sm mt-2'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {t('swap_out_message')}
                        </VText>

                        {props.lightningBalance.lt(
                            props.swapInfo.swapOut.min,
                        ) && (
                            <View
                                style={[
                                    tailwind(
                                        'w-full items-center flex-row mt-2',
                                    ),
                                ]}>
                                <InfoIcon fill={ColorScheme.SVG.GrayFill} />
                                <VText
                                    style={[
                                        tailwind('text-sm ml-2'),
                                        {color: ColorScheme.Text.DescText},
                                    ]}>
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

                    {(!props.isOnline || swapOutLoading) && (
                        <View
                            style={[
                                tailwind(
                                    `mt-4 items-center ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    }`,
                                ),
                            ]}>
                            <InfoIcon
                                width={16}
                                fill={ColorScheme.SVG.GrayFill}
                            />
                            <VText
                                style={[
                                    tailwind(
                                        `text-sm ${
                                            langDir === 'right'
                                                ? 'mr-2'
                                                : 'ml-2'
                                        }`,
                                    ),
                                    {color: ColorScheme.Text.DescText},
                                ]}>
                                {!props.isOnline
                                    ? t('no_internet_cannot_swap')
                                    : t('loading_swap_info')}
                            </VText>
                        </View>
                    )}

                    <View
                        style={[
                            tailwind('w-full absolute items-center'),
                            {bottom: bottomOffset},
                        ]}>
                        <LongBottomButton
                            disabled={
                                (onchainBroke && lightningBroke) ||
                                props.loadingInfo ||
                                swapOutLoading ||
                                !props.isOnline
                            }
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
