import {Alert} from 'react-native';

export const errorAlert = (heading: string, msg: string): void => {
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
