import {Text, View, useColorScheme} from 'react-native';
import React from 'react';

import {useTailwind} from 'tailwind-rn';
import Color from '../constants/Color';
import {useTranslation} from 'react-i18next';

import {useCountdown} from '../modules/hooks';

type TimerProps = {
    day: number;
    hour: number;
    min: number;
    sec: number;
    color: string;
};

const Timer = (props: TimerProps) => {
    const ColorScheme = Color(useColorScheme());
    const tailwind = useTailwind();

    return (
        <View
            style={[
                tailwind('rounded-full py-1 px-4'),
                {backgroundColor: ColorScheme.Background.Inverted},
            ]}>
            <Text style={[tailwind('text-sm'), {color: props.color}]}>
                {`${props.min}:${props.sec}`}
            </Text>
        </View>
    );
};

type ExpiredProps = {
    color: string;
};

const Expired = (props: ExpiredProps) => {
    const {t} = useTranslation('wallet');

    return (
        <View>
            <Text style={{color: props.color}}>{t('expired_invoice')}</Text>
        </View>
    );
};

const ExpiryTimer = ({expiryDate}: {expiryDate: number}) => {
    const [days, hours, minutes, seconds] = useCountdown(expiryDate);

    const ColorScheme = Color(useColorScheme());
    const tailwind = useTailwind();

    if (days + hours + minutes + seconds <= 0) {
        return <Expired color={ColorScheme.Text.DescText} />;
    } else {
        return (
            <View style={[tailwind('flex-row items-center')]}>
                <Timer
                    day={days}
                    hour={hours}
                    min={minutes}
                    sec={seconds}
                    color={ColorScheme.Text.Alt}
                />
            </View>
        );
    }
};

export default ExpiryTimer;
