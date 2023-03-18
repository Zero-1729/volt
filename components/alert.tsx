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
): void => {
    RNHapticFeedback.trigger('notificationWarning', RNHapticFeedbackOptions);

    Alert.alert(heading, msg, [
        {
            text: primaryButtonText,
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
    RNHapticFeedback.trigger('soft', RNHapticFeedbackOptions);

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
