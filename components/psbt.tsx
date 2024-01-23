import React, {useMemo} from 'react';
import {View, useColorScheme} from 'react-native';

import VText from './text';

import {LongButton} from './button';

import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {BottomModal} from './bmodal';
import Color from '../constants/Color';

import {useTailwind} from 'tailwind-rn';
import {useTranslation} from 'react-i18next';
import {capitalizeFirst} from '../modules/transform';

type ExportPsbtProps = {
    exportRef: React.RefObject<BottomSheetModal>;
    onSelectExport: (idx: number) => void;
    triggerExport: () => void;
};

const ExportPsbt = (props: ExportPsbtProps) => {
    const tailwind = useTailwind();
    const snapPoints = useMemo(() => ['30'], []);

    const {t} = useTranslation('wallet');

    const ColorScheme = Color(useColorScheme());

    return (
        <BottomModal
            snapPoints={snapPoints}
            ref={props.exportRef}
            onUpdate={props.onSelectExport}
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
                    {/* Export Signed Psbt */}
                    <View style={[tailwind('items-center px-4 mt-3 w-full')]}>
                        <VText
                            style={[
                                tailwind('w-full text-sm font-semibold'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            {t('unsigned_psbt')}
                        </VText>
                        <VText
                            style={[
                                tailwind('w-full text-sm mt-2'),
                                {color: ColorScheme.Text.DescText},
                            ]}>
                            {t('export_psbt_message')}
                        </VText>
                    </View>

                    <View style={[tailwind('w-4/5 absolute bottom-6')]}>
                        <LongButton
                            title={capitalizeFirst(t('export'))}
                            onPress={() => {
                                props.triggerExport();
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

export default ExportPsbt;
