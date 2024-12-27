import {Platform, PixelRatio} from 'react-native';

// density is 160 for 1px, 240 for 1.5px, 320 for 2px, 480 for 3px, 640 for 4px
// each density is 2 times the previous one
const baseDesnity = 160;
const density = PixelRatio.get();

import {initialWindowMetrics} from 'react-native-safe-area-context';

const Insets = initialWindowMetrics
    ? initialWindowMetrics.insets
    : {top: 0, left: 0, right: 0, bottom: 0};
const Frame = initialWindowMetrics
    ? initialWindowMetrics.frame
    : {x: 0, y: 0, width: 0, height: 0};

/* General Insets

    IOS -> 34
    Android -> ~15.14

*/

const BottomOffset =
    Platform.OS === 'ios'
        ? Insets.bottom - 18 // IOS -> 16
        : Insets.bottom > 16 //
        ? Insets.bottom - 22 // Android with default 3 buttons; Android -> -6.86
        : Insets.bottom + 26; // Android with IOS-like bottom; Android -> 41.14

export default {
    width: Frame.width,
    height: Frame.height,
    left: Insets.left,
    right: Insets.right,
    bottom: BottomOffset,
    bottomButtonOffset: BottomOffset + 32,
    navBottom:
        Platform.OS === 'ios'
            ? BottomOffset * 3 // 48
            : BottomOffset * 1.25, // -8.575 or 51.425
    pixelDensity: density,
    dpi: density * baseDesnity,
} as const;
