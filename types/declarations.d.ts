declare module '*.svg' {
    import React from 'react';
    import {SvgProps} from 'react-native-svg';
    const content: React.FC<SvgProps>;
    export default content;
}

declare module 'bitcoinjs-lib';
declare module 'bip21';
declare module 'react-native-privacy-snapshot';
