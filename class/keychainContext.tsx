import Keychain from 'react-native-keychain';
import {IKeychainResponse} from '../types/utils';

export const getKeychainItem = async (
    key: string,
): Promise<IKeychainResponse<string>> => {
    try {
        const credentials = await Keychain.getGenericPassword({service: key});

        if (credentials) {
            return {data: credentials.password, error: false};
        }

        return {data: 'No credentials stored', error: false};
    } catch (error: any) {
        return {data: error.message, error: true};
    }
};

export const setKeychainItem = async (
    key: string,
    value: string,
): Promise<IKeychainResponse<string>> => {
    try {
        const response = await Keychain.setGenericPassword(key, value);

        return {data: '', error: !!response};
    } catch (error: any) {
        return {data: error.message, error: true};
    }
};

export const resetKeychainItem = async (
    key: string,
): Promise<IKeychainResponse<boolean>> => {
    try {
        const response = await Keychain.resetGenericPassword({service: key});

        return {data: response, error: false};
    } catch (error: any) {
        return {data: error.message, error: true};
    }
};
