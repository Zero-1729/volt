// All reuseable Props and Base Types for RN and App
import React, {PropsWithChildren} from 'react';
import {SvgProps} from 'react-native-svg';

import {Unit, TTransaction} from './wallet';
import BigNumber from 'bignumber.js';

// Base Prop Type
export type BaseProps = PropsWithChildren<{
    style?: React.CSSProperties | StyleProp<ViewStyle>;
    onPress?: () => void;
    disabled?: boolean;
    activeOpacity?: number;
}>;

export type VTextProps = {
    numberOfLines?: number;
    style?: React.CSSProperties | StyleProp<ViewStyle>;
    children?: React.ReactNode;
};

export type AppCard = BaseProps & {
    key: React.Key;
    title: string;
    titleColor: string;
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
    balance: BigNumber;
    walletType: string;
    isWatchOnly: boolean;
    hideBalance: boolean;
    loading: boolean;
    unit: Unit;
    network: string;
    navCallback?: () => void;
    maxedCard: boolean;
};

export type TxListItemProps = BaseProps & {
    tx: TTransaction;
    callback?: () => void;
};

export type TxBalanceProps = BaseProps & {
    balance: BigNumber;
    balanceFontSize?: string;
    fontColor?: string;
};

export type BalanceProps = BaseProps & {
    balance: BigNumber;
    // Below takes in a valid 'Tailwind' font size (i.e., 'text-2xl')
    fontColor: string;
    balanceFontSize?: string;
    loading: boolean;
    disableFiat: boolean; // false by default
    disabled?: boolean;
};

export type FiatBalanceProps = BaseProps & {
    balance: number;
    balanceFontSize?: string;
    amountSign?: string;
    loading: boolean;
    fontColor: string;
    ignoreHideBalance?: boolean;
};

// Base Text Input Prop Type (for reuse)
export type TextInputProps = BaseProps & {
    shavedHeight?: boolean;
    maxLength?: number;
    color: string;
    isEnabled?: boolean;
    placeholder: string;
    placeholderTextColor?: string;
    onBlur?: () => void;
    noTrans?: boolean;
    value?: string;
    refs?: React.RefObject<TextInput>;
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
        showTestnetToggle?: boolean;
        onChange?: React.Dispatch<React.SetStateAction>;
        onSuccess: (
            data: any,
        ) => void | boolean | Promise<boolean> | Promise<void>;
        onCancel: (error) => void;
        onError: (error) => void;
        toggleSwitch?:
            | (() => void)
            | React.Dispatch<React.SetStateAction<boolean>>;
    };

// Numpad Input Prop Type
export type NumpadRequestInputProps = BaseProps & {
    amount: string;
    isSats?: boolean;
    onAmountChange: (amount: string) => void;
    maxAmount?: string;
};

export type DisplaySatsAmountProps = BaseProps & {
    amount: BigNumber;
    isApprox?: boolean;
    fontSize: string;
    textColor?: string;
};

export type DisplayFiatAmountProps = BaseProps & {
    amount: string;
    isApprox?: boolean;
    fontSize: string;
};
