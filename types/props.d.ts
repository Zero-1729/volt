// All reuseable Props and Base Types for RN and App
import React, {PropsWithChildren} from 'react';
import {SvgProps} from 'react-native-svg';

import {BalanceType, FiatRate, Unit} from './wallet';

// Base Prop Type
export type BaseProps = PropsWithChildren<{
    style?: React.CSSProperties | StyleProp<ViewStyle>;
    onPress?: () => void;
    disabled?: boolean;
    activeOpacity?: number;
}>;

export type AppCard = BaseProps & {
    key: React.Key;
    title: string;
    description: string;
    icon: React.FC<SvgProps>;
    url: string;
    color: {
        backgroundColor: string;
    };
    textHue: {
        color: string;
    };
};

// Button prop type
export type ButtonProps = BaseProps & {
    backgroundColor: string;
    color?: string;
    textColor?: string;
    title: string;
    props?:
        | React.ComponentPropsWithoutRef<'button'>
        | Readonly<TouchableOpacityProps>;
};

// Base Card Prop Type (for reuse)
export type CardProps = BaseProps & {
    color?: string;
    backgroundColor?: string;
    label: string;
};

export type WalletCardProps = CardProps & {
    id: string;
    walletBalance: BalanceType;
    walletType: string;
    isWatchOnly: boolean;
    hideBalance: boolean;
    unit: Unit;
    navCallback?: () => void;
};

export type TxBalanceProps = BaseProps & {
    balance: BalanceType;
    fiatRate?: FiatRate;
    BalanceFontSize?: string;
    fontColor?: string;
};

export type BalanceProps = BaseProps & {
    id: string; // current id of the wallet to show balance
    fiatRate?: FiatRate;
    // Below takes in a valid 'Tailwind' font size (i.e., 'text-2xl')
    BalanceFontSize?: string;
    SatsFontSize?: string;
    disableFiat: boolean; // false by default
};

// Base Text Input Prop Type (for reuse)
export type TextInputProps = BaseProps & {
    shavedHeight?: boolean;
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
export type TextLongInputProps = BaseProps &
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
