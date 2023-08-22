import React from 'react';
import {Text, View, useColorScheme} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, CommonActions} from '@react-navigation/native';

import {PlainButton} from '../../../components/button';

import {useTailwind} from 'tailwind-rn';

import Color from '../../../constants/Color';

import Back from '../../../assets/svg/arrow-left-24.svg';
import Right from '../../../assets/svg/chevron-right-24.svg';

const Index = () => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    const HeadingBar = {
        height: 2,
        backgroundColor: ColorScheme.HeadingBar,
    };

    return (
        <SafeAreaView>
            {/* Display Wallet Info, addresses, and other related data / settings */}
            <View style={[tailwind('w-full h-full items-center relative')]}>
                <View
                    style={[
                        tailwind(
                            'flex-row mt-6 w-5/6 justify-center items-center',
                        ),
                    ]}>
                    <PlainButton
                        style={[
                            tailwind(
                                'absolute w-full left-0 items-center flex-row',
                            ),
                        ]}
                        onPress={() => {
                            navigation.dispatch(CommonActions.goBack());
                        }}>
                        <Back fill={ColorScheme.SVG.Default} />
                    </PlainButton>
                    <Text
                        style={[
                            tailwind('font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Tools
                    </Text>
                </View>

                {/* View Divider */}
                <View style={[tailwind('w-full my-8'), HeadingBar]} />

                {/* Wallet Tools */}
                {/* Extended Key Converter */}
                <PlainButton
                    style={[tailwind('w-5/6 mb-6')]}
                    onPress={() => {
                        navigation.dispatch(
                            CommonActions.navigate({
                                name: 'XKeyTool',
                            }),
                        );
                    }}>
                    <View
                        style={[
                            tailwind('items-center flex-row justify-between'),
                        ]}>
                        <Text
                            style={[
                                tailwind('text-sm'),
                                {color: ColorScheme.Text.Default},
                            ]}>
                            Extended Key Converter
                        </Text>

                        <View style={[tailwind('items-center')]}>
                            <Right
                                width={16}
                                stroke={ColorScheme.SVG.GrayFill}
                                fill={ColorScheme.SVG.GrayFill}
                            />
                        </View>
                    </View>
                </PlainButton>
            </View>
        </SafeAreaView>
    );
};

export default Index;
