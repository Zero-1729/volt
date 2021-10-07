import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    useColorScheme,
    TouchableOpacity,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation} from '@react-navigation/core';

import tailwind from 'tailwind-rn';

import Back from './../../assets/svg/arrow-left-24.svg';

import Font from './../../constants/Font';
import Color from '../../constants/Color';

import LICENSE from './../../data/LICENSE.json';

const License = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const renderItem = ({item}) => {
        return (
            <View style={tailwind('mb-4')}>
                <Text
                    style={[
                        tailwind('text-xs'),
                        Font.RegularText,
                        {color: ColorScheme.Text.Default},
                    ]}>
                    {item}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView>
            <View
                style={[
                    tailwind('w-5/6 self-center mt-4 mb-6'),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <TouchableOpacity
                    style={tailwind('items-center flex-row -ml-1')}
                    onPress={() => {
                        navigation.goBack();
                    }}>
                    <Back
                        style={tailwind('mr-2')}
                        fill={ColorScheme.SVG.Default}
                    />
                    <Text
                        style={[
                            tailwind('text-sm'),
                            Font.BoldText,
                            {color: ColorScheme.Text.Default},
                        ]}>
                        About
                    </Text>
                </TouchableOpacity>
            </View>

            <View
                style={[
                    tailwind(
                        'self-center items-center justify-center w-full h-full',
                    ),
                    {backgroundColor: ColorScheme.Background.Secondary},
                ]}>
                <FlatList
                    style={tailwind('w-5/6 mt-8')}
                    data={LICENSE}
                    renderItem={renderItem}
                    keyExtractor={(_item, index) => `${index}`}
                />
            </View>
        </SafeAreaView>
    );
};

export default License;

const styles = StyleSheet.create({});
