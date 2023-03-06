// All reuseable Props and Base Types for RN and App
import React, {PropsWithChildren} from 'react';
import {SvgProps} from 'react-native-svg';

import {Unit} from './wallet';

// Base Prop Type
type BaseProps = PropsWithChildren<{
    style?: React.CSSProperties | StyleProp<ViewStyle>;
    onPress?: () => void;
    disabled?: boolean;
}>;

type AppCard = BaseProps & {
    key: React.Key;
    title: string;
    description: string;
    icon: React.FC<SvgProps>;
    url: string;
    description: string;
    color: {
        backgroundColor: string;
    };
    textHue: {
        color: string;
    };
};

// Button prop type
type ButtonProps = BaseProps & {
    backgroundColor: string;
    color?: string;
    textColor?: string;
    title: string;
    props?:
        | React.ComponentPropsWithoutRef<'button'>
        | Readonly<TouchableOpacityProps>;
};

// Base Card Prop Type (for reuse)
type CardProps = BaseProps & {
    color?: string;
    backgroundColor?: string;
    label: string;
};

type WalletCardProps = CardProps & {
    walletBalance: number;
    walletType: string;
    isWatchOnly: boolean;
    hideBalance: boolean;
    unit: Unit;
    navCallback?: () => void;
};

// Base Text Input Prop Type (for reuse)
type TextInputProps = BaseProps & {
    color: string;
    isEnabled?: boolean;
    placeholder: string;
    placeholderTextColor?: string;
    onBlur?: () => void;
    onChangeText?:
        | ((text: string) => void)
        | React.Dispatch<React.SetStateAction<string>>;
};

// Text Long Input Prop Type
type TextLongInputProps = BaseProps &
    TextInputProps & {
        borderColor?: string;
        showFolder?: boolean;
        folderColor?: string;
        showScanIcon?: boolean;
        showTestnetToggle?: boolean;
        onSuccess: (data) => void | boolean;
        onCancel: (error) => void;
        onError: (error) => void;
        toggleSwitch?:
            | (() => void)
            | React.Dispatch<React.SetStateAction<boolean>>;
    };
