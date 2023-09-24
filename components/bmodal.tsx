/* eslint-disable react-hooks/exhaustive-deps */
import {StyleSheet, useColorScheme, View} from 'react-native';
import React, {
    ReactElement,
    forwardRef,
    memo,
    useMemo,
    useCallback,
    useImperativeHandle,
} from 'react';

import {GestureHandlerRootView} from 'react-native-gesture-handler';

import BottomSheet, {
    BottomSheetView,
    BottomSheetBackgroundProps,
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

import {
    useSafeAreaFrame,
    useSafeAreaInsets,
} from 'react-native-safe-area-context';

import Color from '../constants/Color';
import {useTailwind} from 'tailwind-rn';

/* BottomSheet component wrapper to use across App */
type bottomProps = {
    children: ReactElement;
    index: number;
    onUpdate: (idx: number) => void;
    snapPoints: (string | number)[];
    backdrop?: boolean;
};

export const useSnapPoints = (
    size: 'small' | 'medium' | 'large' | 'calendar',
): number[] => {
    const {height} = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

    const snapPoints = useMemo(() => {
        if (size === 'large') {
            // only Header should be visible
            const preferredHeight = height - (60 + insets.top);
            return [preferredHeight];
        }
        if (size === 'medium') {
            // only Header + Balance should be visible
            const preferredHeight = height - (180 + insets.top);
            const maxHeight = height - (60 + insets.top);
            const minHeight = Math.min(600, maxHeight);
            return [Math.max(preferredHeight, minHeight)];
        }
        if (size === 'calendar') {
            // same as medium + 40px, to be just under search input
            const preferredHeight = height - (140 + insets.top);
            const maxHeight = height - (60 + insets.top);
            const minHeight = Math.min(600, maxHeight);
            return [Math.max(preferredHeight, minHeight)];
        }

        // small / default
        return [400 + Math.max(insets.bottom, 16)];
    }, [size, height, insets]);

    return snapPoints;
};

// We wrap in forwardRef to accept refs from parent components
// Then subsequently wrap in memo to avoid re-rendering when parent re-renders
const _BottomModal = forwardRef(
    (
        {children, index, onUpdate, snapPoints, backdrop}: bottomProps,
        ref,
    ): ReactElement => {
        const tailwind = useTailwind();
        const ColorScheme = Color(useColorScheme());

        const bottomSheetRef = React.useRef<BottomSheet>(null);

        useImperativeHandle(ref, () => ({
            snapToIndex(idx: number = 0): void {
                bottomSheetRef.current?.snapToIndex(idx);
            },
            expand(): void {
                bottomSheetRef.current?.snapToIndex(1);
            },
            close(): void {
                bottomSheetRef.current?.close();
            },
        }));

        const onSheetChange = (idx: number) => {
            onUpdate(idx);
        };

        const handleIndicatorStyle = useMemo(
            () => ({backgroundColor: ColorScheme.Background.Greyed}),
            [ColorScheme.Background.Greyed],
        );

        const renderBackdrop = useCallback(
            (props: BottomSheetBackdropProps) => {
                console.log('bg: drop');
                if (!backdrop) {
                    return null;
                }
                return (
                    <BottomSheetBackdrop
                        {...props}
                        disappearsOnIndex={-1}
                        appearsOnIndex={0}
                    />
                );
            },
            [backdrop],
        );

        const backgroundComponent = useCallback(
            ({style}: BottomSheetBackgroundProps) => (
                <View
                    style={[
                        tailwind('relative'),
                        styles.backgroundContainer,
                        {backgroundColor: ColorScheme.Background.Primary},
                        style,
                    ]}
                />
            ),
            [],
        );

        return (
            <GestureHandlerRootView style={styles.root}>
                <BottomSheet
                    backgroundComponent={backgroundComponent}
                    handleIndicatorStyle={handleIndicatorStyle}
                    handleStyle={styles.handleBar}
                    animateOnMount
                    enablePanDownToClose
                    keyboardBlurBehavior="restore"
                    ref={bottomSheetRef}
                    index={index}
                    onChange={onSheetChange}
                    backdropComponent={renderBackdrop}
                    snapPoints={snapPoints}
                    // https://github.com/gorhom/react-native-bottom-sheet/issues/770#issuecomment-1072113936
                    activeOffsetX={useMemo(() => [-999, 999], [])}
                    activeOffsetY={useMemo(() => [-5, 5], [])}
                    enableDynamicSizing={true}>
                    <BottomSheetView
                        style={[
                            tailwind('w-full relative'),
                            styles.sheetContainer,
                        ]}>
                        {children}
                    </BottomSheetView>
                </BottomSheet>
            </GestureHandlerRootView>
        );
    },
);

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    sheetContainer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        flex: 1,
    },
    handleBar: {
        alignSelf: 'center',
        height: 32,
        width: 32,
    },
    backgroundContainer: {
        overflow: 'hidden',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
});

export const BottomModal = memo(_BottomModal);
