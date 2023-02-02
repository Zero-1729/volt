// Import all data for use with Realm
// Include all data intended to use for context throughout App lifecycle
// export common reffed data in screens
import React, {createContext, useState, useEffect, useCallback} from 'react';
import {useAsyncStorage} from '@react-native-async-storage/async-storage';

import {LanguageType} from '../types/settings';

// Note: context 'value' will default to '{}' if no Provider is found
export const AppStorageContext = createContext({});
export const AppStorageProvider = ({children}) => {
    // Defaults
    // The app's default language
    const defaultAppLanguage: LanguageType = {
        name: 'English',
        code: 'en',
        dir: 'LTR',
    };

    // States and async storage get and setters
    const [appLanguage, _setAppLanguage] = useState(defaultAppLanguage);
    const {getItem: _getAppLanguage, setItem: _updateAppLanguage} =
        useAsyncStorage('appLanguage');

    // Create functions for getting, setting, and other manipulation of data
    const setAppLanguage = useCallback(
        async (languageObject: LanguageType) => {
            try {
                _setAppLanguage(languageObject);
                _updateAppLanguage(JSON.stringify(languageObject));
            } catch (e) {
                console.error(
                    `[AsyncStorage] (Language setting) Error loading data: ${e} [${languageObject}]`,
                );
            }
        },
        [_setAppLanguage, _updateAppLanguage],
    );

    // Add effects
    useEffect(() => {
        _getAppLanguage();
    });

    // Return provider
    return (
        <AppStorageContext.Provider
            value={{
                appLanguage,
                setAppLanguage,
            }}>
            {children}
        </AppStorageContext.Provider>
    );
};
