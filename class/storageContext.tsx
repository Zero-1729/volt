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
import {Unit} from '../types/wallet';
import {NetworkType} from 'bdk-rn/lib/lib/interfaces';

import {
    BaseWallet,
    BDKWalletTypeNames,
    BackupMaterialTypes,
} from './wallet/base';

import BdkRn from 'bdk-rn';

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
    isAdvancedMode: boolean;
    wallets: BaseWallet[];
    currentWalletID: string;
    isDevMode: boolean;
    setAppLanguage: (languageObject: LanguageType) => void;
    setAppFiatCurrency: (currencyObject: CurrencyType) => void;
    setSatSymbol: (useSatSymbol: boolean) => void;
    setTotalBalanceHidden: (hideTotalBalance: boolean) => void;
    setIsAdvancedMode: (isAdvancedMode: boolean) => void;
    updateWalletUnit: (id: string, unit: Unit) => void;
    renameWallet: (id: string, newName: string) => void;
    deleteWallet: (id: string) => void;
    restoreWallet: (
        backupMaterial: string,
        backupType: BackupMaterialTypes,
    ) => void;
    addWallet: (name: string, type: string, network?: NetworkType) => void;
    resetAppData: () => void;
    setCurrentWalletID: (id: string) => void;
    getWalletData: (id: string) => BaseWallet;
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
    isAdvancedMode: false,
    setAppLanguage: () => {},
    setAppFiatCurrency: () => {},
    setSatSymbol: () => {},
    setTotalBalanceHidden: () => {},
    setIsAdvancedMode: () => {},
    restoreWallet: () => {},
    addWallet: () => {},
    updateWalletUnit: () => {},
    renameWallet: () => {},
    deleteWallet: () => {},
    resetAppData: () => {},
    setCurrentWalletID: () => {},
    getWalletData: () => {
        return new BaseWallet('test wallet', 'bech32', '');
    }, // Function grabs wallet data through a fetch by index via ids
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
    const [isAdvancedMode, _setAdvancedMode] = useState(
        defaultContext.isAdvancedMode,
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
    const {getItem: _getIsAdvancedMode, setItem: _updateIsAdvancedMode} =
        useAsyncStorage('isAdvancedMode');
    const {getItem: _getCurrentWalletID, setItem: _updateCurrentWalletID} =
        useAsyncStorage('currentWalletID');

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

                throw new Error('Error setting language option');
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

                throw new Error('Unable to set currency option');
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

                throw new Error('Unable to set sat symbol option');
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

                throw new Error('Unable to set hide total balance option');
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

    const _setWalletInit = async (initialized: boolean) => {
        try {
            _setWalletInitialized(initialized);
            _updateWalletInitialized(JSON.stringify(initialized));
        } catch (e) {
            console.error(
                `[AsyncStorage] (Wallet initialized setting) Error loading data: ${e}`,
            );
        }
    };

    const _loadWalletInitialized = async () => {
        const init = await _getWalletInitialized();

        // Only update setting if a value already exists
        // ...otherwise, use default
        if (init !== null) {
            _setWalletInitialized(JSON.parse(init));
        }
    };

    const setIsAdvancedMode = useCallback(
        async (advanced: boolean) => {
            try {
                _setAdvancedMode(advanced);
                _updateIsAdvancedMode(JSON.stringify(advanced));
            } catch (e) {
                console.error(
                    `[AsyncStorage] (Advanced mode setting) Error loading data: ${e}`,
                );

                throw new Error('Unable to set advanced mode option');
            }
        },
        [_setAdvancedMode, _updateIsAdvancedMode],
    );

    const _loadIsAdvancedMode = async () => {
        const advanced = await _getIsAdvancedMode();

        // Only update setting if a value already exists
        // ...otherwise, use default
        if (advanced !== null) {
            _setAdvancedMode(JSON.parse(advanced));
        }
    };

    const setCurrentWalletID = useCallback(
        async (walletID: string) => {
            try {
                _setCurrentWalletID(walletID);
                _updateCurrentWalletID(JSON.stringify(walletID));
            } catch (e) {
                console.error(
                    `[AsyncStorage] (Current wallet ID setting) Error loading data: ${e}`,
                );

                throw new Error('Unable to set current wallet ID');
            }
        },
        [_setCurrentWalletID, _updateCurrentWalletID],
    );

    const _loadCurrentWalletID = async () => {
        const walletID = await _getCurrentWalletID();

        if (walletID !== null) {
            _setCurrentWalletID(JSON.parse(walletID));
        }
    };

    const getWalletData = (id: string): BaseWallet => {
        const index = wallets.findIndex(wallet => wallet.id === id);

        return wallets[index];
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

    const deleteWallet = useCallback(
        async (id: string) => {
            const index = wallets.findIndex(wallet => wallet.id === id);

            const tmp = [...wallets];
            tmp.splice(index, 1);

            // Assuming the user has deleted the last wallet
            // Reset wallet init flag
            if (tmp.length === 0) {
                _setWalletInit(false);
            }

            await setWallets(tmp);
        },
        [wallets, _updateWallets, _setWallets],
    );

    const updateWalletUnit = useCallback(
        async (id: string, unit: Unit) => {
            const index = wallets.findIndex(wallet => wallet.id === id);

            const tmp = [...wallets];
            tmp[index].units = unit;

            _setWallets(tmp);
            _updateWallets(JSON.stringify(tmp));
        },
        [wallets, _updateWallets, _setWallets],
    );

    const renameWallet = useCallback(
        async (id: string, newName: string) => {
            const index = wallets.findIndex(wallet => wallet.id === id);

            const tmp = [...wallets];
            tmp[index].name = newName;

            _setWallets(tmp);
            _updateWallets(JSON.stringify(tmp));
        },
        [wallets, _updateWallets, _setWallets],
    );

    const _addNewWallet = async (
        newWallet: BaseWallet,
        restored: boolean = false,
    ) => {
        // TODO: Ensure we aren't needlessly
        // overwriting extended key material for existing
        // xpub or descriptor

        // Set wallet ID
        _setCurrentWalletID(newWallet.id);

        // Generate mnemonic and other key material if needed
        if (!restored) {
            newWallet.generateMnemonic();
        }

        // If we have a mnemonic, generate extended key material
        if (newWallet.secret !== '') {
            // Get extended key material from BDK
            const extendedKeyResponse = await BdkRn.createExtendedKey({
                mnemonic: newWallet.secret,
                network: newWallet.network,
                password: '',
            });

            // Return an error if BDK key function fails
            if (extendedKeyResponse.error) {
                throw extendedKeyResponse.data;
            }

            // Update wallet fingerprint & xprv from extended key material
            const walletKeyInfo = extendedKeyResponse.data;
            newWallet.setXprv(walletKeyInfo.xpriv);
            newWallet.setFingerprint(walletKeyInfo.fingerprint);
        }

        // Get descriptor from BDK
        const descriptorResponse = await BdkRn.createDescriptor({
            type: BDKWalletTypeNames[newWallet.type],
            path: newWallet.derivationPath,
            mnemonic: newWallet.secret,
            network: newWallet.network,
            password: '',
        });

        // Return an error if BDK descriptor function fails
        if (descriptorResponse.error) {
            throw descriptorResponse.data;
        }

        // Update Wallet descriptor and fingerprint
        const walletDescriptor = descriptorResponse.data;
        newWallet._setDescriptor(walletDescriptor);

        // Set wallet as initialized
        await _setWalletInit(true);

        const tmp = wallets ? [...wallets, newWallet] : [newWallet];

        _setWallets(tmp);
        _updateWallets(JSON.stringify(tmp));
    };

    const restoreWallet = useCallback(
        async (
            backupMaterial: string,
            backupMaterialType: BackupMaterialTypes,
        ) => {
            // Handle material according to type
            let newWallet = new BaseWallet(
                'Restored wallet',
                'bech32', // Allow user to set in advanced mode or guess it from wallet scan
                backupMaterialType === 'mnemonic' ? backupMaterial : '',
                backupMaterialType === 'descriptor' ? backupMaterial : '',
                backupMaterialType === 'xprv' ? backupMaterial : '',
                backupMaterialType === 'xpub' ? backupMaterial : '',
            );

            _addNewWallet(newWallet, true);
        },
        [],
    );

    const addWallet = useCallback(
        async (name: string, type: string, network?: NetworkType) => {
            try {
                const newWallet = new BaseWallet(
                    name,
                    type,
                    '',
                    '',
                    '',
                    '',
                    network,
                );

                _addNewWallet(newWallet, false);
            } catch (e) {
                console.error(
                    `[AsyncStorage] (Add wallet) Error loading data: ${e}`,
                );

                throw new Error('Unable to add wallet');
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
            await _setWalletInit(false);
            await setWallets([]);
            await setCurrentWalletID('');
        } catch (e) {
            console.error(
                `[AsyncStorage] (Reset app data) Error loading data: ${e}`,
            );

            throw new Error('Unable to reset app data');
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
        _loadIsAdvancedMode();
    }, []);

    useEffect(() => {
        _loadWallets();
    }, []);

    useEffect(() => {
        _loadCurrentWalletID();
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
                resetAppData,
                isDevMode,
                wallets,
                restoreWallet,
                addWallet,
                currentWalletID,
                setCurrentWalletID,
                isAdvancedMode,
                setIsAdvancedMode,
                getWalletData,
                updateWalletUnit,
                renameWallet,
                deleteWallet,
            }}>
            {children}
        </AppStorageContext.Provider>
    );
};
