/* eslint-disable react-hooks/exhaustive-deps */
// Import all data for use with Realm
// Include all data intended to use for context throughout App lifecycle
// export common reffed data in screens
import React, {
    createContext,
    useState,
    useEffect,
    useCallback,
    PropsWithChildren,
} from 'react';

import {useAsyncStorage} from '@react-native-async-storage/async-storage';

import {LanguageType, CurrencyType} from '../types/settings';

import {BaseWallet} from './wallet/base';

// App context props type
type Props = PropsWithChildren<{}>;

// App defaults
const isDevMode = __DEV__;

// Default context type
type defaultContextType = {
    appLanguage: LanguageType;
    appFiatCurrency: CurrencyType;
    useSatSymbol: boolean;
    hideTotalBalance: boolean;
    isWalletInitialized: boolean;
    wallets: BaseWallet[];
    currentWalletID: string;
    isDevMode: boolean;
    setAppLanguage: (languageObject: LanguageType) => void;
    setAppFiatCurrency: (currencyObject: CurrencyType) => void;
    setSatSymbol: (useSatSymbol: boolean) => void;
    setTotalBalanceHidden: (hideTotalBalance: boolean) => void;
    setWalletInitialized: (isWalletInitialized: boolean) => void;
    addWallet: (
        name: string,
        type: string,
        secret: string,
        network?: string,
        descriptor?: string,
    ) => void;
    resetAppData: () => void;
};

// Default app context values
const defaultContext: defaultContextType = {
    appLanguage: {
        name: 'English',
        code: 'en',
        dir: 'LTR',
    },
    appFiatCurrency: {
        short: 'USD',
        symbol: '$',
        locale: 'en-US',
    },
    wallets: [],
    currentWalletID: '',
    isDevMode: false,
    useSatSymbol: false,
    hideTotalBalance: false,
    isWalletInitialized: false,
    setAppLanguage: () => {},
    setAppFiatCurrency: () => {},
    setSatSymbol: () => {},
    setTotalBalanceHidden: () => {},
    setWalletInitialized: () => {},
    addWallet: () => {},
    resetAppData: () => {},
};

// Note: context 'value' will default to 'defaultContext' if no Provider is found
export const AppStorageContext =
    createContext<defaultContextType>(defaultContext);
export const AppStorageProvider = ({children}: Props) => {
    // |> States and async storage get and setters
    const [appLanguage, _setAppLanguage] = useState(defaultContext.appLanguage);
    const [appFiatCurrency, _setFiatCurrency] = useState(
        defaultContext.appFiatCurrency,
    );
    const [useSatSymbol, _setSatSymbol] = useState(defaultContext.useSatSymbol);
    // Will change to false once app in Beta version
    const [hideTotalBalance, _setTotalBalanceHidden] = useState(
        defaultContext.hideTotalBalance,
    );
    const [isWalletInitialized, _setWalletInitialized] = useState(
        defaultContext.isWalletInitialized,
    );
    const [wallets, _setWallets] = useState<BaseWallet[]>(
        defaultContext.wallets,
    );
    const [currentWalletID, _setCurrentWalletID] = useState(
        defaultContext.currentWalletID,
    );

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
            type: string,
            secret: string,
            network: string = 'tesnet',
            descriptor?: string,
        ) => {
            try {
                const newWallet = new BaseWallet(
                    name,
                    type,
                    secret,
                    network,
                    descriptor,
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
            await setAppLanguage(defaultContext.appLanguage);
            await setAppFiatCurrency(defaultContext.appFiatCurrency);
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
                isWalletInitialized,
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
