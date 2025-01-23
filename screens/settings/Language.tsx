import React, {useContext} from 'react';

import {StyleSheet, View, FlatList, useColorScheme} from 'react-native';

import VText from '../../components/text';

import languages from '../../i18n/languages';

import {TLanguage} from '../../types/settings';

import {useNavigation} from '@react-navigation/core';

import {SafeAreaView} from 'react-native-safe-area-context';

import RNHapticFeedback from 'react-native-haptic-feedback';

import {RNHapticFeedbackOptions} from '../../constants/Haptic';

import {useTranslation} from 'react-i18next';

import {AppStorageContext} from '../../class/storageContext';

import {capitalizeFirst} from '../../modules/transform';

import {PlainButton} from '../../components/button';

import Back from './../../assets/svg/arrow-left-24.svg';
import Check from './../../assets/svg/check-circle-24.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

const Language = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const {t, i18n} = useTranslation('settings');

    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const HeadingBar = {
        height: 2,
        backgroundColor: ColorScheme.HeadingBar,
    };

    // Retrieved from general App context provider
    const {appLanguage, setAppLanguage} = useContext(AppStorageContext);

    const renderItem = ({item, index}: {item: TLanguage; index: number}) => {
        return (
            <PlainButton
                onPress={() => {
                    RNHapticFeedback.trigger('soft', RNHapticFeedbackOptions);

                    // We update the i18n locale language in `App.tsx` based on mutation here
                    setAppLanguage(item);
                }}>
                <View
                    className={
                        `w-5/6 self-center items-center ${
                                langDir === 'right'
                                    ? 'flex-row-reverse'
                                    : 'flex-row'
                            } justify-between mt-3 mb-6 relative`
                    }
                    style={[
                        index === 0 ? styles.paddedTop : {},
                    ]}>
                    <VText
                        className="text-sm"
                        style={[
                            {color: ColorScheme.Text.Default},
                            Font.RobotoText,
                        ]}>
                        {item.name}
                    </VText>

                    <View
                        className="flex-row items-center justify-between">
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
                className="w-full h-full"
                style={[
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <View
                    className="w-full h-full mt-4 items-center"
                    style={[
                        styles.flexed,
                    ]}>
                    <View className="w-5/6 mb-16">
                        <PlainButton
                            className="items-center flex-row -ml-1"
                            onPress={() => {
                                navigation.goBack();
                            }}>
                            <Back
                                className="mr-2"
                                fill={ColorScheme.SVG.Default}
                            />
                            <VText
                                className="text-sm font-medium"
                                style={[
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {capitalizeFirst(t('settings'))}
                            </VText>
                        </PlainButton>
                    </View>

                    <View
                        className="justify-center w-full items-center">
                        <View
                            className={
                                `${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } w-5/6 justify-between`
                            }>
                            <VText
                                className="text-2xl mb-4 font-medium"
                                style={[
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {capitalizeFirst(t('language'))}
                            </VText>

                            {/* Highlight current select language here */}
                            <View
                                className="px-4 py-0 flex-row items-center h-8 rounded-full"
                                style={[
                                    {
                                        backgroundColor:
                                            ColorScheme.Background.Inverted,
                                    },
                                ]}>
                                <VText
                                    className="text-sm font-bold"
                                    style={[
                                        {
                                            color: ColorScheme.Text.Alt,
                                            backgroundColor:
                                                ColorScheme.Background.Inverted,
                                        },
                                        Font.RobotoText,
                                    ]}>
                                    {/* We simply parse the language object */}
                                    {/* and display the language name meta for user context */}
                                    {appLanguage.name}
                                </VText>
                            </View>
                        </View>

                        <View className="w-full" style={[HeadingBar]} />
                    </View>

                    <FlatList
                        className="w-full"
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
    paddedTop: {
        paddingTop: 16,
    },
    flexed: {
        flex: 1,
    },
});
