import {Alert} from 'react-native';

export const alert = (heading: string, msg: string): void => {
    Alert.alert(heading, msg);
};
