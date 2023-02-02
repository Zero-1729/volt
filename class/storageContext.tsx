/* eslint-disable react-hooks/exhaustive-deps */
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
    // |> States and async storage get and setters
    const [appLanguage, _setAppLanguage] = useState(defaultAppLanguage);
    const [appFiatCurrency, _setFiatCurrency] = useState(defaultFiatCurrency);
    // Will change to false once app in Beta version
    const [hideTotalBalance, _setTotalBalanceHidden] = useState(false);
    const [IsWalletInitialized, _setWalletInitialized] = useState(false);
    const [currentWalletName, _setCurrentWalletName] = useState('');

    const {getItem: _getAppLanguage, setItem: _updateAppLanguage} =
        useAsyncStorage('appLanguage');
    const {getItem: _getFiatCurrency, setItem: _updateFiatCurrency} =
        useAsyncStorage('appFiatCurrency');
    const {
        getItem: _getTotalBalanceHidden,
        setItem: _updateTotalBalanceHidden,
    } = useAsyncStorage('hideTotalBalance');
    const {getItem: _getWalletInitialized, setItem: _updateWalletInitialized} =
        useAsyncStorage('isWalletInitialized');
    const {getItem: _getCurrentWalletName, setItem: _updateCurrentWalletName} =
        useAsyncStorage('currentWalletName');

    // |> Create functions for getting, setting, and other data manipulation
    const setAppLanguage = useCallback(
        async (languageObject: LanguageType) => {
            try {
                await _setAppLanguage(languageObject);
                await _updateAppLanguage(JSON.stringify(languageObject));
            } catch (e) {
                console.error(
                    `[AsyncStorage] (Language setting) Error loading data: ${e} [${languageObject}]`,
                );
            }
        },
        [_setAppLanguage, _updateAppLanguage],
    );

    const _loadAppLanguage = async () => {
        const lang = await _getAppLanguage();

        // Only update setting if a value already exists
        // ...otherwise, use default
        if (lang !== null) {
            _setAppLanguage(JSON.parse(lang));
        }
    };

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

    const _loadFiatCurrency = async () => {
        const fiat = await _getFiatCurrency();

        // Only update setting if a value already exists
        // ...otherwise, use default
        if (fiat !== null) {
            _setFiatCurrency(JSON.parse(fiat));
        }
    };

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

    const _loadTotalBalanceHidden = async () => {
        const isHidden = await _getTotalBalanceHidden();

        // Only update setting if a value already exists
        // ...otherwise, use default
        if (isHidden !== null) {
            _setTotalBalanceHidden(JSON.parse(isHidden));
        }
    };

    const setWalletInitialized = useCallback(
        async (initialized: boolean) => {
            try {
                _setWalletInitialized(initialized);
                _updateWalletInitialized(JSON.stringify(initialized));
            } catch (e) {
                console.error(
                    `[AsyncStorage] (Wallet initialized setting) Error loading data: ${e}`,
                );
            }
        },
        [_updateWalletInitialized, _setWalletInitialized],
    );

    const _loadWalletInitialized = async () => {
        const init = await _getWalletInitialized();

        // Only update setting if a value already exists
        // ...otherwise, use default
        if (init !== null) {
            _setWalletInitialized(JSON.parse(init));
        }
    };

    const setCurrentWalletName = useCallback(
        async (walletName: string) => {
            try {
                _setCurrentWalletName(walletName);
                _updateCurrentWalletName(walletName);
            } catch (e) {
                console.error(
                    `[AsyncStorage] (Current wallet name setting) Error loading data: ${e}`,
                );
            }
        },
        [_updateCurrentWalletName, _setCurrentWalletName],
    );

    const _loadCurrentWalletName = async () => {
        const name = await _getCurrentWalletName();

        // Only update setting if a value already exists
        // ...otherwise, use default
        if (name !== null) {
            _setCurrentWalletName(name);
        }
    };

    // Resets app data
    const resetAppData = useCallback(async () => {
        try {
            await setAppLanguage(defaultAppLanguage);
            await setAppFiatCurrency(defaultFiatCurrency);
            await setTotalBalanceHidden(false);
            await setWalletInitialized(false);
            await setCurrentWalletName('');
        } catch (e) {
            console.error(
                `[AsyncStorage] (Reset app data) Error loading data: ${e}`,
            );
        }
    }, []);

    // Add effects
    // Load settings from disk on app start
    useEffect(() => {
        _loadAppLanguage();
    }, []);

    useEffect(() => {
        _loadFiatCurrency();
    }, []);

    useEffect(() => {
        _loadTotalBalanceHidden();
    }, []);

    useEffect(() => {
        _loadWalletInitialized();
    }, []);

    useEffect(() => {
        _loadCurrentWalletName();
    }, []);

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
                IsWalletInitialized,
                setWalletInitialized,
                currentWalletName,
                setCurrentWalletName,
                resetAppData,
            }}>
            {children}
        </AppStorageContext.Provider>
    );
};
