import React, {useCallback, useEffect, useState} from 'react';

import {StyleSheet, Text, View, FlatList, useColorScheme} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import languages from '../../loc/languages';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import tailwind from 'tailwind-rn';

import {PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';
import Check from './../../assets/svg/check-circle-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

const Language = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const HeadingBar = {
        height: 2,
        backgroundColor: ColorScheme.HeadingBar,
    };

    type LanguageType = {
        name: string;
        code: string;
        dir: string;
    };

    // The default App language
    const defaultLanguage: LanguageType = {
        name: 'English',
        code: 'en',
        dir: 'LTR',
    };

    // State only accepts string values,
    // so we need to stringify the language object
    const [appLanguage, setAppLanguage] = useState(
        JSON.stringify(defaultLanguage),
    );

    // Retrieve the stored current language value ('appLanguage')
    const getAppLanguage = async (item: string) => {
        try {
            const value = await AsyncStorage.getItem(item);

            // Check that value exists then
            // parse and return the language object
            if (value !== null) {
                return JSON.parse(value);
            }
        } catch (e) {
            console.error(
                '[AsyncStorage] (Language setting) Error loading data: ',
                e,
            );
        }
    };

    // Update the Async stored language value
    const updateAppLanguage = async (
        item: string,
        languageObject: LanguageType,
    ) => {
        try {
            // We need to stringify the language object
            // as AsyncStore data must be string not an object
            await AsyncStorage.setItem(item, JSON.stringify(languageObject));
        } catch (e) {
            console.error(
                `[AsyncStorage] (Language settings) Error saving data: ${e}`,
            );
        }
    };

    // Update the language value state and AsyncStore
    const updateLanguage = useCallback(async (languageObject: LanguageType) => {
        // Using state fn, so must stringify updated language object
        setAppLanguage(JSON.stringify(languageObject));
        updateAppLanguage('appLanguage', languageObject);
    }, []);

    // Load and set current language value data
    useEffect(() => {
        getAppLanguage('appLanguage').then((languageObject: LanguageType) => {
            if (languageObject) {
                setAppLanguage(JSON.stringify(languageObject));
            }
        });
    });

    const renderItem = ({item, index}: {item: LanguageType; index: number}) => {
        return (
            <PlainButton
                onPress={() => {
                    updateLanguage(item);
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
                        {JSON.parse(appLanguage).code === item.code && (
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
                            Selected: {JSON.parse(appLanguage).name}
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
