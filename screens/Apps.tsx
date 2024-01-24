import React from 'react';

import {FlatList, useColorScheme, View, Linking} from 'react-native';

import VText from '../components/text';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';

import {capitalizeFirst} from '../modules/transform';

import {PlainButton} from '../components/button';

import {AppCard} from '../types/props';

import Font from '../constants/Font';

import {useTranslation} from 'react-i18next';

import CoinprofileLogo from '../assets/svg/coinprofile.svg';
import BitrefillLogo from '../assets/svg/bitrefill.svg';
import SideShiftLogo from '../assets/svg/sideshift.svg';

import Color from '../constants/Color';

const Apps = () => {
    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const {t, i18n} = useTranslation('apps');
    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    // Apps
    const Services: AppCard[] = [
        {
            key: 1,
            title: 'Coinprofile',
            description: t('coinprofile_description'),
            icon: CoinprofileLogo,
            color: {
                backgroundColor: '#00B3E4',
            },
            titleColor: '#fefefe',
            textHue: {
                color: '#095569',
            },
            url: 'https://coinprofile.co',
        },
        {
            key: 2,
            title: 'Bitrefill',
            description: t('bitrefill_description'),
            icon: BitrefillLogo,
            color: {
                backgroundColor: '#2E70B7',
            },
            titleColor: '#fefefe',
            textHue: {
                color: '#A3C4E8',
            },
            url: 'https://bitrefill.com',
        },
        {
            key: 3,
            title: 'SideShift',
            description: t('sideshift_description'),
            icon: SideShiftLogo,
            color: {
                backgroundColor: '#fefefe',
            },
            titleColor: '#110b0b',
            textHue: {
                color: '#110b0b',
            },
            url: 'https://changelly.com',
        },
    ];

    const renderItem = ({item}: {item: AppCard}) => {
        return (
            /* We'll eventually use WebView to have all the interaction in-App
            It would be even better if the services had APIs we could just wrap a UI over to make a lot more smooth UX-wise */

            <PlainButton
                onPress={() => {
                    Linking.openURL(item.url);
                }}>
                <View
                    key={item.key}
                    style={[
                        tailwind(
                            `bg-blue-600 w-full h-28 rounded-md items-center justify-center ${
                                langDir === 'right'
                                    ? 'flex-row-reverse'
                                    : 'flex-row'
                            } p-6 mb-4`,
                        ),
                        item.color,
                    ]}>
                    <View style={[tailwind('flex h-5/6 w-5/6 justify-around')]}>
                        <VText
                            style={[
                                tailwind('text-xl text-white font-medium'),
                                Font.RobotoText,
                                {color: item.titleColor},
                            ]}>
                            {item.title}
                        </VText>
                        <VText style={[tailwind('text-xs'), item.textHue]}>
                            {item.description}
                        </VText>
                    </View>
                    <item.icon width={42} height={42} />
                </View>
            </PlainButton>
        );
    };

    return (
        <SafeAreaView>
            <View
                style={[
                    tailwind('h-full items-center'),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                {/* Top bar */}
                <View style={[tailwind('w-5/6 h-12 mt-4 justify-center mb-6')]}>
                    <VText
                        style={[
                            tailwind('text-2xl font-medium'),
                            {color: ColorScheme.Text.Default},
                            Font.RobotoText,
                        ]}>
                        {capitalizeFirst(t('apps'))}
                    </VText>
                </View>

                {/* List of Apps */}
                <FlatList
                    style={tailwind('w-5/6')}
                    data={Services}
                    renderItem={renderItem}
                    keyExtractor={item => item.key.toString()}
                />
            </View>
        </SafeAreaView>
    );
};

export default Apps;
