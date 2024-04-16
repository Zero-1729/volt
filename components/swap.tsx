import React, {useMemo} from 'react';
import {View, useColorScheme} from 'react-native';

import VText from './text';

import {LongButton, PlainButton} from './button';

import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {BottomModal} from './bmodal';
import Color from '../constants/Color';

import {useTailwind} from 'tailwind-rn';
import {useTranslation} from 'react-i18next';
import {capitalizeFirst} from '../modules/transform';
import NativeWindowMetrics from '../constants/NativeWindowMetrics';
import {
    ONCHAIN_SWAP_BALANCE_MIN,
    LIGHTNING_SWAP_BALANCE_MIN,
} from '../modules/wallet-defaults';

import CheckIcon from '../assets/svg/check-circle-fill-16.svg';
import BigNumber from 'bignumber.js';

enum SwapType {
    SwapIn = 'swap_in',
    SwapOut = 'swap_out',
}

type SwapProps = {
    swapRef: React.RefObject<BottomSheetModal>;
    onSelectSwap: (idx: number) => void;
    triggerSwap: (swapType: string) => void;
    onchainBalance: BigNumber;
    lightningBalance: BigNumber;
};

const Swap = (props: SwapProps) => {
    const tailwind = useTailwind();
    const snapPoints = useMemo(() => ['45'], []);
    const onchainBroke =
        props.onchainBalance.isLessThan(ONCHAIN_SWAP_BALANCE_MIN) ||
        props.onchainBalance.isZero();

    const lightningBroke =
        props.lightningBalance.isLessThan(LIGHTNING_SWAP_BALANCE_MIN) ||
        props.lightningBalance.isZero();

    const [selected, setSelected] = React.useState<SwapType>(
        onchainBroke ? SwapType.SwapOut : SwapType.SwapIn,
    );

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
                    tailwind('w-full h-full items-center relative'),
                    {
                        backgroundColor: ColorScheme.Background.Primary,
                    },
                ]}>
                <View style={[tailwind('w-full px-2 h-full items-center')]}>
                    {/* Swap In */}
                    <PlainButton
                        disabled={onchainBroke}
                        onPress={() => {
                            if (!onchainBroke) {
                                setSelected(SwapType.SwapIn);
                            }
                        }}
                        style={[
                            tailwind(
                                `items-center p-4 mt-2 w-full mb-4 border rounded-md ${
                                    onchainBroke ? 'opacity-60' : 'opacity-100'
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
                            {selected === SwapType.SwapIn && (
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
                    </PlainButton>

                    {/* Swap Out */}
                    <PlainButton
                        disabled={lightningBroke}
                        onPress={() => {
                            if (!lightningBroke) {
                                setSelected(SwapType.SwapOut);
                            }
                        }}
                        style={[
                            tailwind(
                                `items-center p-4 w-full border rounded-md ${
                                    lightningBroke
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
                            {selected === SwapType.SwapOut && (
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
                    </PlainButton>

                    <View
                        style={[
                            tailwind('w-4/5 absolute'),
                            {bottom: NativeWindowMetrics.bottom + 24},
                        ]}>
                        <LongButton
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
