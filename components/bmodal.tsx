/* eslint-disable react-hooks/exhaustive-deps */
import {StyleSheet, View} from 'react-native';
import React, {
    ReactElement,
    forwardRef,
    memo,
    useMemo,
    useCallback,
    useImperativeHandle,
} from 'react';

import {
    BottomSheetBackgroundProps,
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetModal,
} from '@gorhom/bottom-sheet';

import {useTailwind} from 'tailwind-rn';

/* BottomSheet component wrapper to use across App */
type bottomProps = {
    children: ReactElement;
    snapPoints: (string | number)[];
    backgroundColor: string;
    handleIndicatorColor: string;
    backdrop?: boolean;
    onUpdate?: (idx: number) => void;
};

// We wrap in forwardRef to accept refs from parent components
// Then subsequently wrap in memo to avoid re-rendering when parent re-renders
const _BottomModal = forwardRef(
    (
        {
            children,
            snapPoints,
            backgroundColor,
            handleIndicatorColor,
            backdrop,
            onUpdate,
        }: bottomProps,
        ref,
    ): ReactElement => {
        const tailwind = useTailwind();

        const bottomSheetRef = React.useRef<BottomSheetModal>(null);

        useImperativeHandle(ref, () => ({
            present(): void {
                bottomSheetRef.current?.present();
            },
            collapse(): void {
                bottomSheetRef.current?.close();
            },
        }));

        const onSheetChange = (idx: number) => {
            onUpdate?.(idx);
        };

        const handleIndicatorStyle = useMemo(
            () => ({backgroundColor: handleIndicatorColor}),
            [handleIndicatorColor],
        );

        const renderBackdrop = useCallback(
            (props: BottomSheetBackdropProps) => {
                if (!backdrop) {
                    return null;
                }

                return (
                    <BottomSheetBackdrop
                        {...props}
                        opacity={0.2}
                        disappearsOnIndex={-1}
                        appearsOnIndex={0}
                    />
                );
            },
            [],
        );

        const backgroundComponent = useCallback(
            ({style}: BottomSheetBackgroundProps) => (
                <View
                    style={[
                        tailwind('relative'),
                        styles.backgroundContainer,
                        {
                            backgroundColor: backgroundColor,
                        },
                        style,
                    ]}
                />
            ),
            [],
        );

        return (
            <View style={styles.root}>
                <BottomSheetModal
                    backgroundComponent={backgroundComponent}
                    handleIndicatorStyle={handleIndicatorStyle}
                    handleStyle={styles.handleBar}
                    enablePanDownToClose
                    keyboardBlurBehavior="restore"
                    ref={bottomSheetRef}
                    index={0}
                    onChange={onSheetChange}
                    backdropComponent={renderBackdrop}
                    snapPoints={snapPoints}
                    // https://github.com/gorhom/react-native-bottom-sheet/issues/770#issuecomment-1072113936
                    activeOffsetX={useMemo(() => [-999, 999], [])}
                    activeOffsetY={useMemo(() => [-5, 5], [])}>
                    {children}
                </BottomSheetModal>
            </View>
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
