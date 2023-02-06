/* eslint-disable react-hooks/exhaustive-deps */
// Import all data for use with Realm
// Include all data intended to use for context throughout App lifecycle
// export common reffed data in screens
import React, {createContext, useState, useEffect, useCallback} from 'react';
import {useAsyncStorage} from '@react-native-async-storage/async-storage';

import {LanguageType, CurrencyType} from '../types/settings';

import {BaseWallet} from './wallet/base';

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

    const isDevMode = __DEV__;

    // |> States and async storage get and setters
    const [appLanguage, _setAppLanguage] = useState(defaultAppLanguage);
    const [appFiatCurrency, _setFiatCurrency] = useState(defaultFiatCurrency);
    const [useSatSymbol, _setSatSymbol] = useState(true);
    // Will change to false once app in Beta version
    const [hideTotalBalance, _setTotalBalanceHidden] = useState(false);
    const [IsWalletInitialized, _setWalletInitialized] = useState(false);
    const [wallets, _setWallets] = useState<BaseWallet[]>([]);
    const [currentWalletID, _setCurrentWalletID] = useState('');

    const {getItem: _getAppLanguage, setItem: _updateAppLanguage} =
        useAsyncStorage('appLanguage');
    const {getItem: _getFiatCurrency, setItem: _updateFiatCurrency} =
        useAsyncStorage('appFiatCurrency');
    const {getItem: _getUseSatSymbol, setItem: _updateUseSatSymbol} =
        useAsyncStorage('useSatSymbol');
    const {
        getItem: _getTotalBalanceHidden,
        setItem: _updateTotalBalanceHidden,
    } = useAsyncStorage('hideTotalBalance');
    const {getItem: _getWalletInitialized, setItem: _updateWalletInitialized} =
        useAsyncStorage('isWalletInitialized');
    const {getItem: _getWallets, setItem: _updateWallets} =
        useAsyncStorage('wallets');

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

    const setSatSymbol = useCallback(
        async (useSat: boolean) => {
            try {
                _setSatSymbol(useSat);
                _updateUseSatSymbol(JSON.stringify(useSat));
            } catch (e) {
                console.error(
                    `[AsyncStorage] (Use sat symbol setting) Error loading data: ${e}`,
                );
            }
        },
        [_updateUseSatSymbol, _setSatSymbol],
    );

    const _loadUseSatSymbol = async () => {
        const useSatSym = await _getUseSatSymbol();

        if (useSatSym !== null) {
            _setSatSymbol(JSON.parse(useSatSym));
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

    const _loadWallets = async () => {
        const savedWallets = await _getWallets();

        if (savedWallets !== null) {
            _setWallets(JSON.parse(savedWallets));
        }
    };

    const setWallets = useCallback(
        async (value: BaseWallet[]) => {
            try {
                _setWallets(value);
                _updateWallets(JSON.stringify(value));
            } catch (e) {
                console.error(
                    `[AsyncStorage] (Wallets setting) Error setting data: ${e}`,
                );
            }
        },
        [_setWallets, _updateWallets],
    );

    const addWallet = useCallback(
        async (
            name: string,
            isWatchOnly: boolean,
            type: string,
            secret: string,
            descriptor?: string,
            network: string = 'tesnet',
        ) => {
            try {
                const newWallet = new BaseWallet(
                    name,
                    isWatchOnly,
                    type,
                    secret,
                    descriptor,
                    network,
                );

                _setCurrentWalletID(newWallet.id);

                const tmp = wallets ? [...wallets, newWallet] : [newWallet];

                _setWallets(tmp);
                _updateWallets(JSON.stringify(tmp));
            } catch (e) {
                console.error(
                    `[AsyncStorage] (Add wallet) Error loading data: ${e}`,
                );
            }
        },
        [wallets, _updateWallets, _setWallets],
    );

    // Resets app data
    const resetAppData = useCallback(async () => {
        try {
            await setAppLanguage(defaultAppLanguage);
            await setAppFiatCurrency(defaultFiatCurrency);
            await setTotalBalanceHidden(false);
            await setWalletInitialized(false);
            await setWallets([]);
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
        _loadUseSatSymbol();
    }, []);

    useEffect(() => {
        _loadTotalBalanceHidden();
    }, []);

    useEffect(() => {
        _loadWalletInitialized();
    }, []);

    useEffect(() => {
        _loadWallets();
    }, []);

    // Return provider
    return (
        <AppStorageContext.Provider
            value={{
                appLanguage,
                setAppLanguage,
                appFiatCurrency,
                setAppFiatCurrency,
                useSatSymbol,
                setSatSymbol,
                hideTotalBalance,
                setTotalBalanceHidden,
                IsWalletInitialized,
                setWalletInitialized,
                resetAppData,
                isDevMode,
                wallets,
                addWallet,
                currentWalletID,
            }}>
            {children}
        </AppStorageContext.Provider>
    );
};
