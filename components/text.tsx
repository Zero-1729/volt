import React, {useContext} from 'react';
import {Text} from 'react-native';

import {VTextProps} from '../types/props';

import {AppStorageContext} from '../class/storageContext';

const VText = (props: VTextProps) => {
    const {appLanguage} = useContext(AppStorageContext);

    const alignment = appLanguage.dir === 'RTL' ? 'right' : 'left';

    return (
        <Text style={[{textAlign: alignment}, ...props.style]}>
            {props.children}
        </Text>
    );
};

export default VText;
