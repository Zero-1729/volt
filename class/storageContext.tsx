// Import all data for use with Realm
// Include all data intended to use for context throughout App lifecycle
// export common reffed data in screens
import React, {createContext, useState, useEffect, useCallback} from 'react';
import {useAsyncStorage} from '@react-native-async-storage/async-storage';

import {LanguageType, CurrencyType} from '../types/settings';

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

    // The app default fiat currency for BTC balance price
    const defaultFiatCurrency: CurrencyType = {
        short: 'USD',
        symbol: '$',
        locale: 'en-US',
    };

    // States and async storage get and setters
    const [appLanguage, _setAppLanguage] = useState(defaultAppLanguage);
    const [appFiatCurrency, _setFiatCurrency] = useState(defaultFiatCurrency);
    // Will change to false once app in Beta version
    const [hideTotalBalance, _setTotalBalanceHidden] = useState(false);
    const {getItem: _getAppLanguage, setItem: _updateAppLanguage} =
        useAsyncStorage('appLanguage');
    const {getItem: _getFiatCurrency, setItem: _updateFiatCurrency} =
        useAsyncStorage('appFiatCurrency');
    const {
        getItem: _getTotalBalanceHidden,
        setItem: _updateTotalBalanceHidden,
    } = useAsyncStorage('hideTotalBalance');

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

    const setAppFiatCurrency = useCallback(
        async (currency: CurrencyType) => {
            try {
                _setFiatCurrency(currency);
                _updateFiatCurrency(JSON.stringify(currency));
            } catch (e) {
                console.error(
                    `[AsyncStorage] (Currency setting) Error loading data: ${e}`,
                );
            }
        },
        [_setFiatCurrency, _updateFiatCurrency],
    );

    const setTotalBalanceHidden = useCallback(
        async (hide: boolean) => {
            try {
                _setTotalBalanceHidden(hide);
                _updateTotalBalanceHidden(JSON.stringify(hide));
            } catch (e) {
                console.error(
                    `[AsyncStorage] (Hide Total balance setting) Error loading data: ${e}`,
                );
            }
        },
        [_setTotalBalanceHidden, _updateTotalBalanceHidden],
    );

    // Add effects
    useEffect(() => {
        _getAppLanguage();
    });

    useEffect(() => {
        _getFiatCurrency();
    });

    useEffect(() => {
        _getTotalBalanceHidden();
    });

    // Return provider
    return (
        <AppStorageContext.Provider
            value={{
                appLanguage,
                setAppLanguage,
                appFiatCurrency,
                setAppFiatCurrency,
                hideTotalBalance,
                setTotalBalanceHidden,
            }}>
            {children}
        </AppStorageContext.Provider>
    );
};
