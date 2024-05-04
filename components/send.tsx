import React, {useMemo} from 'react';
import {View, useColorScheme, Text} from 'react-native';

import VText from './text';

import {PlainButton} from './button';

import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {BottomModal} from './bmodal';
import Color from '../constants/Color';

import {useTailwind} from 'tailwind-rn';
import {useTranslation} from 'react-i18next';
import {capitalizeFirst} from '../modules/transform';

import ScanIcon from '../assets/svg/scan.svg';
import PencilIcon from '../assets/svg/pencil-24.svg';

enum SendOptionsType {
    Scan = 'scan',
    Manual = 'manual',
}

type SendOptionsProps = {
    sendOptionsRef: React.RefObject<BottomSheetModal>;
    onSelectSendOption: (idx: number) => void;
    triggerSendOptions: (sendOptionsType: string) => void;
};

const SendOptions = (props: SendOptionsProps) => {
    const tailwind = useTailwind();
    const snapPoints = useMemo(() => ['35'], []);

    const {t, i18n} = useTranslation('wallet');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const ColorScheme = Color(useColorScheme());

    return (
        <BottomModal
            snapPoints={snapPoints}
            ref={props.sendOptionsRef}
            onUpdate={props.onSelectSendOption}
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
                    <View style={[tailwind('items-center mb-4')]}>
                        <Text
                            style={[
                                tailwind('text-base font-bold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {capitalizeFirst(t('send'))}
                        </Text>
                    </View>

                    {/* SendOptions: Scan */}
                    <PlainButton
                        onPress={() => {
                            props.triggerSendOptions(SendOptionsType.Scan);
                        }}
                        style={[
                            tailwind(
                                `items-center p-4 mt-2 ${
                                    langDir === 'right'
                                        ? 'flex-row-reverse'
                                        : 'flex-row'
                                } w-full mb-4 border rounded-md`,
                            ),
                            {
                                borderColor: ColorScheme.Background.Greyed,
                            },
                        ]}>
                        <View
                            style={tailwind(
                                `items-center ${
                                    langDir === 'right' ? 'ml-4' : 'mr-4'
                                } px-1`,
                            )}>
                            <ScanIcon fill={ColorScheme.SVG.Default} />
                        </View>
                        <View style={tailwind('items-center')}>
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
                                    {capitalizeFirst(t('scan'))}
                                </VText>
                            </View>
                            <VText
                                style={[
                                    tailwind('w-full text-sm'),
                                    {color: ColorScheme.Text.DescText},
                                ]}>
                                {t('scan_message')}
                            </VText>
                        </View>
                    </PlainButton>

                    {/* SendOptions Manual */}
                    <PlainButton
                        onPress={() => {
                            props.triggerSendOptions(SendOptionsType.Manual);
                        }}
                        style={[
                            tailwind(
                                `items-center ${
                                    langDir === 'right'
                                        ? 'flex-row-reverse'
                                        : 'flex-row'
                                } p-4 w-full border rounded-md`,
                            ),
                            {borderColor: ColorScheme.Background.Greyed},
                        ]}>
                        <View
                            style={tailwind(
                                `items-center ${
                                    langDir === 'right' ? 'ml-4' : 'mr-4'
                                } px-1`,
                            )}>
                            <PencilIcon fill={ColorScheme.SVG.Default} />
                        </View>
                        <View style={tailwind('items-center')}>
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
                                    {capitalizeFirst(t('manual'))}
                                </VText>
                            </View>
                            <VText
                                style={[
                                    tailwind('w-full text-sm'),
                                    {color: ColorScheme.Text.DescText},
                                ]}>
                                {t('manual_message')}
                            </VText>
                        </View>
                    </PlainButton>
                </View>
            </View>
        </BottomModal>
    );
};

export default SendOptions;
