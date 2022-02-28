import React from 'react';

import {TextInput, Platform} from 'react-native';

import tailwind from 'tailwind-rn';

export const TextSingleInput = props => {
    return (
        <TextInput
            underlineColorAndroid="transparent"
            keyboardType={
                Platform.OS === 'android' ? 'visible-password' : 'default'
            }
            spellCheck={false}
            autoCorrect={false}
            autoCapitalize="none"
            selectTextOnFocus={true}
            {...props}
            style={[tailwind('py-4 px-2 rounded text-xs')]}
        />
    );
};

export const TextMultiInput = props => {
    return (
        <TextInput
            multiline
            underlineColorAndroid="transparent"
            keyboardType={
                Platform.OS === 'android' ? 'visible-password' : 'default'
            }
            spellCheck={false}
            autoCorrect={false}
            autoCapitalize="none"
            selectTextOnFocus={false}
            {...props}
            style={[
                tailwind('py-8 px-4 rounded text-xs h-48'),
                {textAlignVertical: 'top'},
            ]}
        />
    );
};
