import AsyncStorage from '@react-native-async-storage/async-storage';
import RNSecureKeyStore, {ACCESSIBLE} from 'react-native-secure-key-store';
import {setGenericPassword, getGenericPassword} from 'react-native-keychain';
import {open} from 'realm';
import {randBytes} from './rng';

export class AppStorage {
    constructor() {}
    setItem = async (key: string, value: string, sensitive: boolean) => {
        //set generic password for keychain
        const buf = await randBytes(64);
        const passwordKey = buf.toString('hex');

        if (sensitive) {
            await setGenericPassword(key, passwordKey, {
                service: key,
            });

            //save to RNSecureKeyStore
            await AsyncStorage.setItem(key, passwordKey);
            await RNSecureKeyStore.set(passwordKey, value, {
                accessible: ACCESSIBLE.WHEN_UNLOCKED,
            });
        } else {
            await AsyncStorage.setItem(key, passwordKey);
            //save to realm
            let realm = await this.openRealm();
            realm.write(() => {
                realm.create('AppStorage', {passwordKey, value});
            });
        }
    };

    getItem = async (key: string, sensitive: boolean) => {
        let credentials = await getGenericPassword({service: key});

        if (!credentials) {
            console.warn('No credentials found');
            return;
        }
        let passwordKey = credentials.service;
        if (sensitive) {
            let storeKey = await AsyncStorage.getItem(passwordKey);
            if (!storeKey) {
                console.warn('No store key found');
                return;
            }
            let data = await RNSecureKeyStore.get(storeKey);
            return JSON.parse(data);
        } else {
            let storeKey = await AsyncStorage.getItem(key);
            if (!storeKey) {
                console.warn('No store key found');
                return;
            }
            let realm = await this.openRealm();
            let data = realm.objectForPrimaryKey('AppStorage', storeKey);
            if (!data) {
                console.warn('No data found');
                return;
            }
            return data.toJSON();
        }
    };

    private openRealm = async (): Promise<Realm> => {
        const path = 'keyvalue.realm';

        const schema = [
            {
                name: 'KeyValue',
                primaryKey: 'key',
                properties: {
                    key: {type: 'string', indexed: true},
                    value: 'string',
                },
            },
        ];
        return open({
            schema,
            path,
        });
    };
}
