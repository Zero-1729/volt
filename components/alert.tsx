import {Alert} from 'react-native';

export const alert = (heading: string, msg: string): void => {
    Alert.alert(heading, msg);
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
            onPress: onSuccess,
            style: 'destructive',
        },
    ]);
};
