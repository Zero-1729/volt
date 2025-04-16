import React, {useContext} from 'react';

import {Text, View, useColorScheme, Linking, StyleSheet} from 'react-native';

import VText from '../../components/text';

import {AppStorageContext} from '../../class/storageContext';

import {CommonActions} from '@react-navigation/native';

import {useNavigation} from '@react-navigation/core';

import {getBuildIdSync} from 'react-native-device-info';

import {SafeAreaView} from 'react-native-safe-area-context';

import RNHapticFeedback from 'react-native-haptic-feedback';

import {useTranslation} from 'react-i18next';

import {capitalizeFirst} from '../../modules/transform';

import Package from './../../package.json';
import BranchInfo from '../../data/git-branch-data.json';

import {RNHapticFeedbackOptions} from '../../constants/Haptic';

import {PlainButton} from '../../components/button';

import NativeDims from '../../constants/NativeWindowMetrics';

import Back from './../../assets/svg/arrow-left-24.svg';
import Right from './../../assets/svg/chevron-right-24.svg';
import Left from './../../assets/svg/chevron-left-24.svg';
import Github from './../../assets/svg/mark-github-24.svg';
import Squirrel from './../../assets/svg/squirrel-24.svg';
import VoltLogo from './../../assets/svg/volt-logo.svg';
import VoltText from './../../assets/svg/volt-text.svg';
import BranchIcon from './../../assets/svg/git-branch-16.svg';

import Font from '../../constants/Font';
import Color from '../../constants/Color';

const About = () => {
    const navigation = useNavigation();

    const ColorScheme = Color(useColorScheme());

    const {t, i18n} = useTranslation('settings');

    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const {isAdvancedMode} = useContext(AppStorageContext);

    return (
        <SafeAreaView>
            <View
                className="h-full justify-start items-center"
                style={{backgroundColor: ColorScheme.Background.Primary}}>
                <View className="w-5/6 mt-4 mb-16">
                    <PlainButton
                        className="items-center flex-row -ml-1"
                        onPress={() => {
                            navigation.goBack();
                        }}>
                        <Back
                            fill={ColorScheme.SVG.Default}
                        />
                        <Text
                            className="ml-2 text-sm font-bold"
                            style={[
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            {capitalizeFirst(t('settings'))}
                        </Text>
                    </PlainButton>
                </View>

                <View
                    className="justify-center w-full items-center mb-8">
                    <VText
                        className="text-2xl mb-4 w-5/6 font-medium"
                        style={[
                            {color: ColorScheme.Text.Default},
                            Font.RobotoText,
                        ]}>
                        {capitalizeFirst(t('about'))}
                    </VText>

                    <View
                        className="w-full"
                        style={[
                            styles.headingBarContainer,
                            {
                                backgroundColor: ColorScheme.HeadingBar,
                            },
                        ]}
                    />
                </View>

                <View className="w-full mb-1">
                    <View
                        className="flex-row items-center justify-center mb-4">
                        <VoltLogo
                            width={72}
                            height={72}
                            className="mr-3"
                        />
                        <VoltText width={98} fill={ColorScheme.SVG.Default} />
                    </View>

                    <Text
                        className="w-5/6 text-sm self-center text-center"
                        style={[
                            {color: ColorScheme.Text.AltGray},
                            Font.RobotoText,
                        ]}>
                        {t('about_description')}
                    </Text>
                </View>

                <View className="mb-2">
                    <Text
                        className="text-center"
                        style={{color: ColorScheme.Text.AltGray}}>
                        v{Package.version} (
                        {`${
                            isAdvancedMode
                                ? 'Build ' + getBuildIdSync() + ' '
                                : ''
                        }${capitalizeFirst(t('beta.1'))}`}
                        )
                    </Text>
                </View>

                <View className="mb-8 w-4/6 items-center">
                    {isAdvancedMode && BranchInfo.length > 0 && (
                        <View
                            className="flex-row px-4 py-1 rounded-full"
                            style={{
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                }}>
                            <BranchIcon
                                className="mr-1"
                                fill={ColorScheme.SVG.GrayFill}
                                width={12}
                            />
                            <Text
                                className="text-xs font-bold"
                                style={{color: ColorScheme.Text.AltGray}}
                                numberOfLines={1}
                                ellipsizeMode="head">
                                {BranchInfo}
                            </Text>
                        </View>
                    )}
                </View>

                <View className="w-5/6">
                    <PlainButton
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate({name: 'License'}),
                            );
                        }}>
                        <View
                            className={
                                `items-center ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } justify-between mt-2`
                            }>
                            <Text
                                className="text-sm font-medium"
                                style={[
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {capitalizeFirst(t('license'))}
                            </Text>

                            {langDir === 'left' ? (
                                <Right
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
                                />
                            ) : (
                                <Left
                                    width={16}
                                    stroke={ColorScheme.SVG.GrayFill}
                                    fill={ColorScheme.SVG.GrayFill}
                                />
                            )}
                        </View>
                    </PlainButton>
                </View>

                <View
                    className="w-full absolute items-center justify-center"
                    style={{bottom: NativeDims.bottom}}>
                    <PlainButton
                        onPress={() => {
                            RNHapticFeedback.trigger(
                                'impactLight',
                                RNHapticFeedbackOptions,
                            );

                            Linking.openURL(
                                'https://github.com/Zero-1729/volt/',
                            );
                        }}>
                        <View className="flex-row items-center mb-8">
                            <Github
                                width={32}
                                fill={ColorScheme.SVG.Default}
                            />
                            <Text
                                className="ml-2 text-xs font-medium"
                                style={[
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {t('source_code')}
                            </Text>
                        </View>
                    </PlainButton>

                    <PlainButton
                        onPress={() => {
                            RNHapticFeedback.trigger(
                                'impactLight',
                                RNHapticFeedbackOptions,
                            );

                            Linking.openURL(
                                'https://github.com/Zero-1729/volt/issues/',
                            );
                        }}>
                        <View className="flex-row items-center">
                            <Squirrel
                                width={32}
                                fill={ColorScheme.SVG.Default}
                            />
                            <Text
                                className="ml-2 text-xs font-medium"
                                style={[
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {t('report_bug')}
                            </Text>
                        </View>
                    </PlainButton>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default About;

const styles = StyleSheet.create({
    headingBarContainer: {
        height: 2,
    },
});
