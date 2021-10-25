import {Platform} from 'react-native';

import {initialWindowMetrics} from 'react-native-safe-area-context';

const insets = initialWindowMetrics.insets;
const frame = initialWindowMetrics.frame;

export default {
    width: frame.width,
    left: insets.left,
    right: insets.right,
    bottom:
        Platform.OS === 'ios'
            ? insets.bottom - 18
            : insets.bottom > 16
            ? insets.bottom - 22 // Android with default 3 buttons
            : insets.bottom + 26, // Android with IOS-like bottom
} as const;
