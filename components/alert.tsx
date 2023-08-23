import {Alert} from 'react-native';

import RNHapticFeedback from 'react-native-haptic-feedback';
import {RNHapticFeedbackOptions} from '../constants/Haptic';

export const errorAlert = (heading: string, msg: string): void => {
    RNHapticFeedback.trigger('notificationError', RNHapticFeedbackOptions);

    Alert.alert(heading, msg, [
        {
            text: 'Cancel',
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

export const conservativeAlert = (heading: string, msg: string): void => {
    RNHapticFeedback.trigger('notificationSuccess', RNHapticFeedbackOptions);

    Alert.alert(heading, msg, [
        {
            text: 'Ok',
            onPress: () => {},
        },
    ]);
};

export const DeletionAlert = (
    heading: string,
    msg: string,
    primaryButtonText: string,
    onSuccess: () => void,
): void => {
    Alert.alert(heading, msg, [
        {
            text: 'Cancel',
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
