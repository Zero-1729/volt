import {Alert} from 'react-native';

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../constants/Haptic';

export const errorAlert = (
    heading: string,
    msg: string,
    cancelText: string,
): void => {
    RNHapticFeedback.trigger('notificationError', RNHapticFeedbackOptions);

    Alert.alert(heading, msg, [
        {
            text: cancelText,
            onPress: () => {},
            style: 'cancel',
        },
    ]);
};

export const liberalAlert = (
    heading: string,
    msg: string,
    primaryButtonText: string,
    silent?: boolean,
): void => {
    if (!silent) {
        RNHapticFeedback.trigger(
            'notificationWarning',
            RNHapticFeedbackOptions,
        );
    }

    Alert.alert(heading, msg, [
        {
            text: primaryButtonText,
            onPress: () => {},
        },
    ]);
};

export const conservativeAlert = (
    heading: string,
    msg: string,
    okText: string,
): void => {
    RNHapticFeedback.trigger('notificationSuccess', RNHapticFeedbackOptions);

    Alert.alert(heading, msg, [
        {
            text: okText,
            onPress: () => {},
        },
    ]);
};

export const DeletionAlert = (
    heading: string,
    msg: string,
    primaryButtonText: string,
    cancelButtonText: string,
    onSuccess: () => void,
): void => {
    Alert.alert(heading, msg, [
        {
            text: cancelButtonText,
            onPress: () => {},
            style: 'cancel',
        },
        {
            text: primaryButtonText,
            onPress: () => {
                RNHapticFeedback.trigger(
                    'impactLight',
                    RNHapticFeedbackOptions,
                );

                onSuccess();
            },
            style: 'destructive',
        },
    ]);
};
