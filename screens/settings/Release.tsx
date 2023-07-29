import React from 'react';
import {Text, View, FlatList, useColorScheme} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation} from '@react-navigation/core';

import {useTailwind} from 'tailwind-rn';

import {PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

import Notes from './../../data/release-notes.json';

const Release = () => {
    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const navigation = useNavigation();

    const renderItem = ({item}: {item: string | string[]}) => {
        return (
            <View style={tailwind('mb-2')}>
                <Text
                    style={[
                        tailwind('text-sm text-justify'),
                        {color: ColorScheme.Text.Default},
                        Font.RobotoText,
                    ]}>
                    - {item}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView edges={['left', 'bottom', 'right']}>
            <View style={[tailwind('w-full h-full items-center')]}>
                <View
                    style={[
                        tailwind(
                            'w-5/6 my-8 items-center justify-center flex-row',
                        ),
                        {backgroundColor: ColorScheme.Background.Primary},
                    ]}>
                    <PlainButton
                        style={[tailwind('absolute w-full left-0')]}
                        onPress={() => {
                            navigation.goBack();
                        }}>
                        <Back fill={ColorScheme.SVG.Default} />
                    </PlainButton>
                    <Text
                        style={[
                            tailwind('text-sm font-medium'),
                            {color: ColorScheme.Text.Default},
                            Font.RobotoText,
                        ]}>
                        Release Notes
                    </Text>
                </View>

                <View
                    style={[
                        tailwind('self-center w-full h-full items-center'),
                    ]}>
                    <FlatList
                        contentContainerStyle={{paddingBottom: 100}}
                        style={[tailwind('w-5/6 pt-4')]}
                        data={Notes}
                        renderItem={renderItem}
                        keyExtractor={(_item, index) => `${index}`}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Release;
