import React from 'react';

import {
    StyleSheet,
    FlatList,
    Text,
    useColorScheme,
    View,
    Linking,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import tailwind from 'tailwind-rn';

import {PlainButton} from '../components/button';

import {AppCard} from '../types/props';

import Font from '../constants/Font';

import CoinprofileLogo from './../assets/svg/coinprofile.svg';
import BitrefillLogo from './../assets/svg/bitrefill.svg';
import ChangellyLogo from './../assets/svg/changelly.svg';

import Color from '../constants/Color';

const Apps = () => {
    const ColorScheme = Color(useColorScheme());

    // Apps
    const Services = [
        {
            key: 1,
            title: 'Coinprofile',
            description: 'Send Bitcoin to NGN Bank Accounts',
            icon: CoinprofileLogo,
            color: {
                backgroundColor: '#00B3E4',
            },
            textHue: {
                color: '#095569',
            },
            url: 'https://coinprofile.co',
        },
        {
            key: 2,
            title: 'Bitrefill',
            description: 'Buy Giftcards with your Bitcoin',
            icon: BitrefillLogo,
            color: {
                backgroundColor: '#2E70B7',
            },
            textHue: {
                color: '#A3C4E8',
            },
            url: 'https://bitrefill.com',
        },
        {
            key: 3,
            title: 'Changelly',
            description: 'Swap Bitcoin for other Crypto',
            icon: ChangellyLogo,
            color: {
                backgroundColor: '#2D3A34',
            },
            textHue: {
                color: '#1E9A61',
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
                            'bg-blue-600 w-full h-28 rounded-md items-center justify-center flex-row p-6 mb-4',
                        ),
                        item.color,
                    ]}>
                    <View style={[tailwind('flex h-5/6 w-5/6 justify-around')]}>
                        <Text
                            style={[
                                tailwind('text-xl text-white font-medium'),
                                Font.RobotoText,
                            ]}>
                            {item.title}
                        </Text>
                        <Text style={[tailwind('text-xs'), item.textHue]}>
                            {item.description}
                        </Text>
                    </View>
                    <item.icon />
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
                <View
                    style={[
                        tailwind('w-full h-12 mt-4 justify-center pl-9 mb-6'),
                    ]}>
                    <Text
                        style={[
                            tailwind('text-2xl font-medium'),
                            {color: ColorScheme.Text.Default},
                            Font.RobotoText,
                        ]}>
                        Apps
                    </Text>
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

const styles = StyleSheet.create({});
