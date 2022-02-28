import React from 'react';
import {StyleSheet, Text, View, FlatList, useColorScheme} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation} from '@react-navigation/core';

import tailwind from 'tailwind-rn';

import {PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

import Notes from './../../data/release-notes.json';

const Release = () => {
    const ColorScheme = Color(useColorScheme());

    const navigation = useNavigation();

    const renderItem = ({item}) => {
        return (
            <View style={tailwind('mb-2')}>
                <Text
                    style={[
                        tailwind('text-xs text-justify'),
                        {color: ColorScheme.Text.Default},
                        Font.RobotoText,
                    ]}>
                    - {item}
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
                <PlainButton
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
                            tailwind('text-sm font-medium'),
                            {color: ColorScheme.Text.Default},
                            Font.RobotoText,
                        ]}>
                        About
                    </Text>
                </PlainButton>
            </View>

            <View
                style={[
                    tailwind('self-center w-full h-full items-center'),
                    {backgroundColor: ColorScheme.Background.Secondary},
                ]}>
                <View style={tailwind('w-5/6 mt-6')}>
                    <Text
                        style={[
                            tailwind('text-xl font-medium'),
                            {color: ColorScheme.Text.Default},
                            Font.RobotoText,
                        ]}>
                        Release Notes
                    </Text>
                </View>

                <FlatList
                    style={tailwind('w-5/6 mt-6')}
                    data={Notes}
                    renderItem={renderItem}
                    keyExtractor={(_item, index) => `${index}`}
                />
            </View>
        </SafeAreaView>
    );
};

export default Release;

const styles = StyleSheet.create({});
