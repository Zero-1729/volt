import React from 'react';
import {Text} from 'react-native';

import {VTextProps} from '../types/props';

import {useTranslation} from 'react-i18next';

const VText = (props: VTextProps) => {
    const {i18n} = useTranslation('common');

    const alignment = i18n.dir() === 'rtl' ? 'right' : 'left';

    return (
        <Text style={[{textAlign: alignment}, props.style]}>
            {props.children}
        </Text>
    );
};

export const VTextDouble = (props: VTextProps) => {
    const {i18n} = useTranslation('common');

    const alignment = i18n.dir() === 'rtl' ? 'right' : 'left';

    return (
        <Text
            numberOfLines={2}
            ellipsizeMode="middle"
            style={[{textAlign: alignment}, props.style]}>
            {props.children}
        </Text>
    );
};

export const VTextSingle = (props: VTextProps) => {
    const {i18n} = useTranslation('common');

    const alignment = i18n.dir() === 'rtl' ? 'right' : 'left';

    return (
        <Text
            numberOfLines={1}
            ellipsizeMode="middle"
            style={[{textAlign: alignment}, props.style]}>
            {props.children}
        </Text>
    );
};

export const VTextMulti = (props: VTextProps) => {
    const {i18n} = useTranslation('common');

    const alignment = i18n.dir() === 'rtl' ? 'right' : 'left';

    return (
        <Text
            numberOfLines={4}
            ellipsizeMode="middle"
            style={[{textAlign: alignment}, props.style]}>
            {props.children}
        </Text>
    );
};

export default VText;
