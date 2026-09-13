import React from 'react';
import QRCode from 'react-qr-code';
import { View } from 'react-native';

const QRCodeStyled = ({ data, style, pieceSize, color, ...props }: any) => {
    const size = pieceSize ? Math.max(160, pieceSize * 32) : 220;
    return (
        <View style={style}>
            <QRCode value={data || ''} size={size} fgColor={color || '#000000'} />
        </View>
    );
};

export default QRCodeStyled;
