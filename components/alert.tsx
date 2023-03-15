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

export const DeletionAlert = (
    heading: string,
    msg: string,
    onSuccess: () => void,
): void => {
    Alert.alert(heading, msg, [
        {
            text: 'Cancel',
            onPress: () => {},
            style: 'cancel',
        },
        {
            text: 'Delete',
            onPress: onSuccess,
            style: 'destructive',
        },
    ]);
};
