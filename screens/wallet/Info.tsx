import React from 'react';
import {Text, View, useColorScheme} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, CommonActions} from '@react-navigation/native';

import {PlainButton, LongBottomButton} from '../../components/button';

import {useTailwind} from 'tailwind-rn';
import Color from '../../constants/Color';

import Back from '../../assets/svg/arrow-left-24.svg';

const Info = () => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());
    const navigation = useNavigation();

    return (
        <SafeAreaView edges={['bottom', 'right', 'left']}>
            {/* Display Wallet Info, addresses, and other related data / settings */}
            <View style={[tailwind('w-full h-full items-center relative')]}>
                <PlainButton
                    style={[tailwind('items-center mt-6 flex-row w-5/6')]}
                    onPress={() => {
                        navigation.dispatch(CommonActions.goBack());
                    }}>
                    <Back
                        style={tailwind('mr-2')}
                        fill={ColorScheme.SVG.Default}
                    />
                    {/* Wallet name */}
                    <Text
                        style={[
                            tailwind('text-white font-bold'),
                            {color: ColorScheme.Text.Default},
                        ]}>
                        Wallet Name
                    </Text>
                </PlainButton>

                {/* Wallet Info */}
                {/* Wallet Addresses */}
                {/* Wallet Tools */}

                {/* Delete Wallet btn */}
                <LongBottomButton
                    title="Delete"
                    onPress={() => {
                        console.info('[Action] Delete Wallet');
                    }}
                    textColor={'red'}
                    backgroundColor={ColorScheme.Background.Greyed}
                    style={[tailwind('font-bold')]}
                />
            </View>
        </SafeAreaView>
    );
};

export default Info;
