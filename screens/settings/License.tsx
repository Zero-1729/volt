import React from 'react';
import {
    Text,
    View,
    FlatList,
    useColorScheme,
    TouchableOpacity,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation} from '@react-navigation/core';

import {useTranslation} from 'react-i18next';
import {capitalizeFirst} from '../../modules/transform';

import Back from './../../assets/svg/arrow-left-24.svg';

import Font from './../../constants/Font';
import Color from '../../constants/Color';

import LICENSE from './../../data/LICENSE.json';

const License = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const {t} = useTranslation('settings');

    const renderItem = ({item}: {item: string | string[]}) => {
        return (
            <View className="mb-4">
                <Text
                    className="text-xs"
                    style={[
                        {color: ColorScheme.Text.Default},
                        Font.RobotoText,
                    ]}>
                    {item}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView edges={['left', 'bottom', 'right']}>
            <View className="w-full h-full items-center">
                <View
                    className="w-5/6 my-8 items-center justify-center flex-row"
                    style={[
                        {backgroundColor: ColorScheme.Background.Primary},
                    ]}>
                    <TouchableOpacity
                        className="absolute w-full left-0"
                        onPress={() => {
                            navigation.goBack();
                        }}>
                        <Back fill={ColorScheme.SVG.Default} />
                    </TouchableOpacity>
                    <Text
                        className="text-sm font-medium"
                        style={[
                            {color: ColorScheme.Text.Default},
                            Font.RobotoText,
                        ]}>
                        {capitalizeFirst(t('license'))}
                    </Text>
                </View>

                <View
                    className="self-center w-full h-full items-center">
                    <FlatList
                        className="w-5/6 pt-8"
                        data={LICENSE}
                        renderItem={renderItem}
                        keyExtractor={(_item, index) => `${index}`}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

export default License;
