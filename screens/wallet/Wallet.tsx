import React from 'react';
import {useColorScheme, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTailwind} from 'tailwind-rn';

import Color from '../../constants/Color';

const Wallet = () => {
    const tailwind = useTailwind();
    const ColorScheme = Color(useColorScheme());

    // Get card color from wallet type
    const CardColor = ColorScheme.WalletColors.bech32;

    // Receive Wallet ID and fetch wallet data to display
    // Include functions to change individual wallet settings
    return (
        <SafeAreaView>
            <View style={[tailwind('w-full h-full')]}>
                {/* Top panel */}
                <View
                    style={[tailwind('relative'), {backgroundColor: CardColor}]}
                />

                {/* Send and receive */}
                <View style={[tailwind('w-full h-48 justify-center')]} />

                {/* Transactions List */}
                <View />
            </View>
        </SafeAreaView>
    );
};

export default Wallet;
