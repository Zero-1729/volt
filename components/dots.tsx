// Adapted from "https://github.com/synonymdev/bitkit/blob/master/src/components/SliderDots.tsx"
import React, {ReactElement} from 'react';
import {View, StyleSheet, useColorScheme} from 'react-native';
import Animated, {
    SharedValue,
    interpolate,
    useAnimatedStyle,
} from 'react-native-reanimated';
import Color from '../constants/Color';

const DOT_SIZE = 8;

const Dot = ({
    animValue,
    index,
    length,
}: {
    index: number;
    length: number;
    animValue: SharedValue<number>;
}): ReactElement => {
    const ColorScheme = Color(useColorScheme());

    const width = DOT_SIZE;

    const animStyle = useAnimatedStyle(() => {
        let inputRange = [index - 1, index, index + 1];
        let outputRange = [-width, 0, width];

        if (index === 0 && animValue?.value > length - 1) {
            inputRange = [length - 1, length, length + 1];
            outputRange = [-width, 0, width];
        }

        return {
            transform: [
                {
                    translateX: interpolate(
                        animValue?.value,
                        inputRange,
                        outputRange,
                    ),
                },
            ],
        };
    }, [animValue, index, length]);

    return (
        <View
            style={[
                styles.dotRoot,
                {backgroundColor: ColorScheme.Background.Greyed},
            ]}>
            <Animated.View
                style={[
                    styles.dot,
                    animStyle,
                    {backgroundColor: ColorScheme.Background.Inverted},
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    dotRoot: {
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE - 2,
        overflow: 'hidden',
        marginRight: 7,
    },
    dot: {
        borderRadius: DOT_SIZE - 2,
        flex: 1,
    },
});

export default Dot;
