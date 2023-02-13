import React, {useContext} from 'react';

import {StyleSheet, Text, View, FlatList, useColorScheme} from 'react-native';

import languages from '../../loc/languages';

import {LanguageType} from '../../types/settings';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import RNHapticFeedback from 'react-native-haptic-feedback';

import {useTailwind} from 'tailwind-rn';

import {AppStorageContext} from '../../class/storageContext';

import {PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';
import Check from './../../assets/svg/check-circle-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

const Language = (): JSX.Element => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const tailwind = useTailwind();

    const HeadingBar = {
        height: 2,
        backgroundColor: ColorScheme.HeadingBar,
    };

    const RNHapticFeedbackOptions = {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
    };

    // Retrieved from general App context provider
    const {appLanguage, setAppLanguage} = useContext(AppStorageContext);

    const renderItem = ({item, index}: {item: LanguageType; index: number}) => {
        return (
            <PlainButton
                onPress={() => {
                    RNHapticFeedback.trigger('soft', RNHapticFeedbackOptions);

                    setAppLanguage(item);
                }}>
                <View
                    style={[
                        tailwind(
                            'w-5/6 self-center items-center flex-row justify-between mt-3 mb-6',
                        ),
                        index === 0 ? styles.PaddedTop : {},
                    ]}>
                    <Text
                        style={[
                            tailwind('text-sm'),
                            {color: ColorScheme.Text.Default},
                            Font.RobotoText,
                        ]}>
                        {item.name}
                    </Text>

                    <View
                        style={[
                            tailwind('flex-row items-center justify-between'),
                        ]}>
                        {appLanguage.code === item.code && (
                            <Check width={16} fill={ColorScheme.SVG.Default} />
                        )}
                    </View>
                </View>
            </PlainButton>
        );
    };

    return (
        <SafeAreaView>
            <View
                style={[
                    tailwind('w-full h-full'),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <View
                    style={[
                        tailwind('w-full h-full mt-4 items-center'),
                        styles.Flexed,
                    ]}>
                    <View style={tailwind('w-5/6 mb-16')}>
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
                                Settings
                            </Text>
                        </PlainButton>
                    </View>

                    <View
                        style={tailwind('justify-center w-full items-center')}>
                        <Text
                            style={[
                                tailwind('text-2xl mb-4 w-5/6 font-medium'),
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            Language
                        </Text>

                        <View style={[tailwind('w-full'), HeadingBar]} />
                    </View>

                    {/* Highlight current select language here */}
                    <View
                        style={[
                            tailwind(
                                'w-full h-12 self-center items-center flex-row justify-between',
                            ),
                            {backgroundColor: ColorScheme.Background.Secondary},
                        ]}>
                        <Text
                            style={[
                                tailwind('text-sm pl-8 font-bold'),
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            {/* We simply parse the language object */}
                            {/* and display the language name meta for user context */}
                            Selected: {appLanguage.name}
                        </Text>
                    </View>

                    <FlatList
                        style={[tailwind('w-full')]}
                        data={languages}
                        renderItem={renderItem}
                        keyExtractor={item => item.code}
                        initialNumToRender={25}
                        contentInsetAdjustmentBehavior="automatic"
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Language;

const styles = StyleSheet.create({
    PaddedTop: {
        paddingTop: 16,
    },
    Flexed: {
        flex: 1,
    },
});
