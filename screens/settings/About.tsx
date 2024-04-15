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

import {useTailwind} from 'tailwind-rn';

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

    const tailwind = useTailwind();

    const {t, i18n} = useTranslation('settings');

    const langDir = i18n.dir() === 'rtl' ? 'right' : 'left';

    const {isAdvancedMode} = useContext(AppStorageContext);

    return (
        <SafeAreaView>
            <View
                style={[
                    tailwind('h-full justify-start items-center'),
                    {backgroundColor: ColorScheme.Background.Primary},
                ]}>
                <View style={tailwind('w-5/6 mt-4 mb-16')}>
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
                                tailwind('text-sm font-bold'),
                                {color: ColorScheme.Text.Default},
                                Font.RobotoText,
                            ]}>
                            {capitalizeFirst(t('settings'))}
                        </Text>
                    </PlainButton>
                </View>

                <View
                    style={tailwind('justify-center w-full items-center mb-8')}>
                    <VText
                        style={[
                            tailwind('text-2xl mb-4 w-5/6 font-medium'),
                            {color: ColorScheme.Text.Default},
                            Font.RobotoText,
                        ]}>
                        {capitalizeFirst(t('about'))}
                    </VText>

                    <View
                        style={[
                            styles.headingBarContainer,
                            tailwind('w-full'),
                            {
                                backgroundColor: ColorScheme.HeadingBar,
                            },
                        ]}
                    />
                </View>

                <View style={[tailwind('w-full mb-1')]}>
                    <View
                        style={[
                            tailwind(
                                'flex-row items-center justify-center mb-4',
                            ),
                        ]}>
                        <VoltLogo
                            width={72}
                            height={72}
                            style={[tailwind('mr-3')]}
                        />
                        <VoltText width={98} fill={ColorScheme.SVG.Default} />
                    </View>

                    <Text
                        style={[
                            tailwind('w-5/6 text-sm self-center text-center'),
                            {color: ColorScheme.Text.AltGray},
                            Font.RobotoText,
                        ]}>
                        {t('about_description')}
                    </Text>
                </View>

                <View style={[tailwind('mb-2')]}>
                    <Text
                        style={[
                            tailwind('text-center'),
                            {color: ColorScheme.Text.AltGray},
                        ]}>
                        v{Package.version} (
                        {`${
                            isAdvancedMode
                                ? 'Build ' + getBuildIdSync() + ' '
                                : ''
                        }${capitalizeFirst(t('beta'))}`}
                        )
                    </Text>
                </View>

                <View style={[tailwind('mb-8 w-4/6 items-center')]}>
                    {isAdvancedMode && BranchInfo.length > 0 && (
                        <View
                            style={[
                                tailwind('flex-row px-4 py-1 rounded-full'),
                                {
                                    backgroundColor:
                                        ColorScheme.Background.Greyed,
                                },
                            ]}>
                            <BranchIcon
                                style={[tailwind('mr-1')]}
                                fill={ColorScheme.SVG.GrayFill}
                                width={12}
                            />
                            <Text
                                style={[
                                    tailwind('text-xs font-bold'),
                                    {color: ColorScheme.Text.AltGray},
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="head">
                                {BranchInfo}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={tailwind('w-5/6')}>
                    <PlainButton
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate({name: 'Changelog'}),
                            );
                        }}>
                        <View
                            style={[
                                tailwind(
                                    `items-center ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } justify-between mt-2 mb-4`,
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm font-medium'),
                                    {color: ColorScheme.Text.Default},
                                    Font.RobotoText,
                                ]}>
                                {t('release_notes')}
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

                    <PlainButton
                        onPress={() => {
                            navigation.dispatch(
                                CommonActions.navigate({name: 'License'}),
                            );
                        }}>
                        <View
                            style={[
                                tailwind(
                                    `items-center ${
                                        langDir === 'right'
                                            ? 'flex-row-reverse'
                                            : 'flex-row'
                                    } justify-between mt-2`,
                                ),
                            ]}>
                            <Text
                                style={[
                                    tailwind('text-sm font-medium'),
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
                    style={[
                        tailwind('w-full absolute items-center justify-center'),
                        {bottom: NativeDims.bottom},
                    ]}>
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
                        <View style={tailwind('flex-row items-center mb-8')}>
                            <Github
                                width={32}
                                fill={ColorScheme.SVG.Default}
                                style={tailwind('mr-2')}
                            />
                            <Text
                                style={[
                                    tailwind('text-xs font-medium'),
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
                        <View style={tailwind('flex-row items-center')}>
                            <Squirrel
                                width={32}
                                fill={ColorScheme.SVG.Default}
                                style={tailwind('mr-2')}
                            />
                            <Text
                                style={[
                                    tailwind('text-xs font-medium'),
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
