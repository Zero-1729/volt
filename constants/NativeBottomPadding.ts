import {Platform} from 'react-native';

import {initialWindowMetrics} from 'react-native-safe-area-context';

const insets = initialWindowMetrics.insets;

export default {
    bottom:
        Platform.OS === 'ios'
            ? insets.bottom - 18
            : insets.bottom > 16
            ? insets.bottom - 20 // Android with default 3 buttons
            : insets.bottom + 20, // Android with IOS-like bottom
} as const;
