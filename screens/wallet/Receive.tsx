import React from 'react';
import {useColorScheme, View, Text} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

const Receive = () => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    return (
        <SafeAreaView>
            <View>
                <Text>Receive</Text>
            </View>
        </SafeAreaView>
    );
};

export default Receive;
