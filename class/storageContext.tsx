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

import BigNumber from 'bignumber.js';

import {LanguageType, CurrencyType} from '../types/settings';
import {
    TWalletType,
    Unit,
    BalanceType,
    FiatRate,
    UTXOType,
    BackupMaterialTypes,
    TransactionType,
    NetType,
    baseWalletArgs,
    NetInfoType,
} from '../types/wallet';

import {BaseWallet} from './wallet/base';
import {SegWitNativeWallet} from './wallet/segwit/bech32';
import {SegWitP2SHWallet} from './wallet/segwit/p2sh';
import {LegacyWallet} from './wallet/legacy';

import {
    BDKWalletTypeNames,
    extendedKeyInfo,
    getDescriptorParts,
} from '../modules/wallet-utils';

import BdkRn from 'bdk-rn';

// App context props type
type Props = PropsWithChildren<{}>;

// App defaults
const isDevMode = __DEV__;

// Default context type
type defaultContextType = {
    networkState: NetInfoType;
    appLanguage: LanguageType;
    appFiatCurrency: CurrencyType;
    loadLock: boolean;
    appUnit: Unit;
    fiatRate: FiatRate;
    useSatSymbol: boolean;
    hideTotalBalance: boolean;
    isWalletInitialized: boolean;
    isAdvancedMode: boolean;
    wallets: TWalletType[];
    currentWalletID: string;
    isDevMode: boolean;
    setNetworkState: (networkState: NetInfoType) => void;
    setAppLanguage: (languageObject: LanguageType) => void;
    setAppFiatCurrency: (currencyObject: CurrencyType) => void;
    setSatSymbol: (useSatSymbol: boolean) => void;
    updateFiatRate: (fiatObj: FiatRate) => void;
    setTotalBalanceHidden: (hideTotalBalance: boolean) => void;
    setIsAdvancedMode: (isAdvancedMode: boolean) => void;
    updateAppUnit: (unit: Unit) => void;
    updateWalletTransactions: (
        id: string,
        transactions: TransactionType[],
    ) => void;
    updateWalletUTXOs: (id: string, utxo: UTXOType[]) => void;
    updateWalletBalance: (id: string, balance: BalanceType) => void;
    renameWallet: (id: string, newName: string) => void;
    deleteWallet: (id: string) => void;
    restoreWallet: (
        backupMaterial: string,
        backupType: BackupMaterialTypes,
    ) => void;
    addWallet: (name: string, type: string, network?: NetType) => void;
    resetAppData: () => void;
    setCurrentWalletID: (id: string) => void;
    getWalletData: (id: string) => TWalletType;
    getAllTransactions: () => TransactionType[];
    setLoadLock: (loadLock: boolean) => void;
};

// Default app context values
const defaultContext: defaultContextType = {
    loadLock: false,
    networkState: null,
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
    appUnit: {
        name: 'sats',
        symbol: 's',
    },
    wallets: [],
    fiatRate: {
        rate: new BigNumber(26000),
        lastUpdated: new Date(),
        source: 'CoinGecko',
    },
    currentWalletID: '',
    isDevMode: false,
    useSatSymbol: true, // To boost adoption and awareness of sat symbol
    hideTotalBalance: false,
    isWalletInitialized: false,
    isAdvancedMode: false,
    setNetworkState: () => {},
    setAppLanguage: () => {},
    setAppFiatCurrency: () => {},
    setSatSymbol: () => {},
    updateFiatRate: () => {},
    setTotalBalanceHidden: () => {},
    setIsAdvancedMode: () => {},
    restoreWallet: () => {},
    addWallet: () => {},
    updateAppUnit: () => {},
    updateWalletTransactions: () => {},
    updateWalletUTXOs: () => {},
    updateWalletBalance: () => {},
    renameWallet: () => {},
    deleteWallet: () => {},
    resetAppData: () => {},
    setCurrentWalletID: () => {},
    getAllTransactions: () => [],
    getWalletData: () => {
        return new BaseWallet({name: 'test wallet', type: 'bech32'});
    }, // Function grabs wallet data through a fetch by index via ids
    setLoadLock: () => {},
};

// Note: context 'value' will default to 'defaultContext' if no Provider is found
export const AppStorageContext =
    createContext<defaultContextType>(defaultContext);
export const AppStorageProvider = ({children}: Props) => {
    // |> States and async storage get and setters
    const [loadLock, _setLoadLock] = useState(defaultContext.loadLock);
    const [networkState, _setNetworkState] = useState<NetInfoType>(null);
    const [appLanguage, _setAppLanguage] = useState(defaultContext.appLanguage);
    const [appFiatCurrency, _setFiatCurrency] = useState(
        defaultContext.appFiatCurrency,
    );
    const [appUnit, _setAppUnit] = useState(defaultContext.appUnit);
    const [fiatRate, _setFiatRate] = useState(defaultContext.fiatRate);
    const [useSatSymbol, _setSatSymbol] = useState(defaultContext.useSatSymbol);
    // Will change to false once app in Beta version
    const [hideTotalBalance, _setTotalBalanceHidden] = useState(
        defaultContext.hideTotalBalance,
    );
    const [isWalletInitialized, _setWalletInitialized] = useState(
        defaultContext.isWalletInitialized,
    );
    const [wallets, _setWallets] = useState<TWalletType[]>(
        defaultContext.wallets,
    );
    const [currentWalletID, _setCurrentWalletID] = useState(
        defaultContext.currentWalletID,
    );
    const [isAdvancedMode, _setAdvancedMode] = useState(
        defaultContext.isAdvancedMode,
    );

    const {getItem: _getLoadLock, setItem: _updateLoadLock} =
        useAsyncStorage('loadLock');
    const {getItem: _getNetworkState, setItem: _updateNetworkState} =
        useAsyncStorage('networkState');
    const {getItem: _getAppLanguage, setItem: _updateAppLanguage} =
        useAsyncStorage('appLanguage');
    const {getItem: _getFiatCurrency, setItem: _updateFiatCurrency} =
        useAsyncStorage('appFiatCurrency');
    const {getItem: _getAppUnit, setItem: _updateAppUnit} =
        useAsyncStorage('appUnit');
    const {getItem: _getFiatRate, setItem: _updateFiatRate} =
        useAsyncStorage('fiatRate');
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
    const _loadLock = async () => {
        const ll = await _getLoadLock();

        if (ll !== null) {
            _setLoadLock(JSON.parse(ll));
        }
    };

    const setLoadLock = useCallback(
        async (lock: boolean) => {
            try {
                await _setLoadLock(lock);
                await _updateLoadLock(JSON.stringify(lock));
            } catch (e) {
                console.error(
                    `[AsyncStorage] (Load lock) Error loading data: ${e} [${lock}]`,
                );
                throw new Error('Error setting load lock');
            }
        },
        [_setLoadLock, _updateLoadLock],
    );

    const setNetworkState = useCallback(
        async (netState: NetInfoType) => {
            try {
                await _setNetworkState(netState);
                await _updateNetworkState(JSON.stringify(netState));
            } catch (e) {
                console.error(
                    `[AsyncStorage] (Network state) Error loading data: ${e} [${netState}]`,
                );

                throw new Error('Error setting network state');
            }
        },
        [_setNetworkState, _updateNetworkState],
    );

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

    const _loadNetworkState = async () => {
        const netState = await _getNetworkState();

        // Only update setting if a value already exists
        // ...otherwise, use default
        if (netState !== null) {
            _setNetworkState(JSON.parse(netState));
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

    const _loadFiatRate = async () => {
        const cachedFiatRate = await _getFiatRate();

        // Only update setting if value already exists
        // ...otherwise, use default
        if (cachedFiatRate !== null) {
            const parsedRate = JSON.parse(cachedFiatRate);

            const rehydratedFiatRate = {
                rate: new BigNumber(parsedRate.rate),
                lastUpdated: new Date(parsedRate.lastUpdated),
                source: 'CoinGecko',
            };
            _setFiatRate(rehydratedFiatRate);
        }
    };

    const updateFiatRate = useCallback(
        async (fiat: FiatRate) => {
            try {
                _setFiatRate(fiat);
                _updateFiatRate(JSON.stringify(fiat));
            } catch (e) {
                console.error(
                    `[AsyncStorage] (Fiat Rate) Error updating rate: ${e}`,
                );
            }
        },
        [_setFiatRate, _updateFiatRate],
    );

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

    const getWalletData = (id: string): TWalletType => {
        const index = wallets.findIndex(wallet => wallet.id === id);

        return wallets[index];
    };

    const getAllTransactions = useCallback(() => {
        const txs: TransactionType[] = [];

        wallets.forEach((wallet: TWalletType) => {
            wallet.transactions.forEach(tx => {
                txs.push(tx);
            });
        });

        return txs;
    }, []);

    const _loadWallets = async () => {
        const savedWallets = await _getWallets();

        if (savedWallets !== null) {
            const unserializedWallets = JSON.parse(savedWallets);

            let rehydratedWallets: TWalletType[] = [];

            // Restore wallets
            for (const walletObject of unserializedWallets) {
                // re-serialize and re-hydrate
                // ... this is necessary because we want to re-populate
                // ... the wallet object with the correct class methods
                const serializedWallet = JSON.stringify(walletObject);
                let tmp: TWalletType;

                switch (walletObject.type) {
                    case 'bech32':
                        tmp = SegWitNativeWallet.fromJSON(serializedWallet);
                        break;
                    case 'p2sh':
                        tmp = SegWitP2SHWallet.fromJSON(serializedWallet);
                        break;
                    case 'legacy':
                        tmp = LegacyWallet.fromJSON(serializedWallet);
                        break;
                    default:
                        throw new Error(
                            '[AsyncStorage] (Loading wallets) Unknown wallet type',
                        );
                }

                rehydratedWallets.push(tmp);
            }

            _setWallets(rehydratedWallets);
        }
    };

    const setWallets = useCallback(
        async (value: TWalletType[]) => {
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

            // delete current Wallet index
            await setCurrentWalletID('');

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

    const updateAppUnit = useCallback(async (unit: Unit) => {
        try {
            _setAppUnit(unit);
            _updateAppUnit(JSON.stringify(unit));
        } catch (e) {
            console.error(
                `[AsyncStorage] (App unit setting) Error loading data: ${e}`,
            );

            throw new Error('Unable to set app unit option');
        }
    }, []);

    const updateWalletTransactions = useCallback(
        async (id: string, transactions: TransactionType[]) => {
            const index = wallets.findIndex(wallet => wallet.id === id);

            // Get the current wallet
            // Update the transactions in the current wallet
            const tmp = [...wallets];
            tmp[index].transactions = transactions;

            // Update wallets list
            _setWallets(tmp);
            _updateWallets(JSON.stringify(tmp));
        },
        [wallets, _updateWallets, _setWallets],
    );

    const updateWalletUTXOs = useCallback(
        async (id: string, utxos: UTXOType[]) => {
            const index = wallets.findIndex(wallet => wallet.id === id);

            // Get the current wallet
            // Update the UTXOs in the current wallet
            const tmp = [...wallets];
            tmp[index].UTXOs = utxos;

            // Update wallets list
            _setWallets(tmp);
            _updateWallets(JSON.stringify(tmp));
        },
        [wallets, _updateWallets, _setWallets],
    );

    const updateWalletBalance = useCallback(
        async (id: string, balance: BalanceType) => {
            const index = wallets.findIndex(wallet => wallet.id === id);

            // Get the current wallet
            // Update the balance in the current wallet
            const tmp = [...wallets];
            tmp[index].balance = balance;

            // Update wallets list
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
        newWallet: TWalletType,
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
        // TODO: Fallback to generate xprv and fingerprint without BDK when offline
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
            newWallet.setXprv(walletKeyInfo.xprv);
            newWallet.setFingerprint(walletKeyInfo.fingerprint);
        }

        // Only generate if we don't already have one
        // We can only generate one if we have either a mnemonic
        // or an xprv, so check to see if either of those exist
        // TODO: Fallback to generate descriptor without BDK when offline
        if (newWallet.secret !== '' || newWallet.xprv !== '') {
            // Get descriptor from BDK
            const descriptorResponse = await BdkRn.createDescriptor({
                type: BDKWalletTypeNames[newWallet.type],
                path: newWallet.derivationPath,
                mnemonic: !restored ? newWallet.secret : '',
                network: newWallet.network,
                password: '',
                xprv: restored ? newWallet.xprv : '',
            });

            // Return an error if BDK descriptor function fails
            if (descriptorResponse.error) {
                throw new Error(descriptorResponse.data);
            }

            const walletDescriptor = descriptorResponse.data;
            newWallet.setDescriptor(walletDescriptor);
        }

        // Determine if watch only wallet
        newWallet.setWatchOnly();

        // TODO: need to watch out for address reuse
        // Generate new initial receive address
        const newAddress = newWallet.generateNewAddress();

        // Update temporary wallet address
        newWallet.setAddress(newAddress);

        // Set wallet as initialized
        await _setWalletInit(true);

        const tmp = wallets ? [...wallets, newWallet] : [newWallet];

        await _setWallets(tmp);
        await _updateWallets(JSON.stringify(tmp));
    };

    const restoreWallet = useCallback(
        async (
            backupMaterial: string,
            backupMaterialType: BackupMaterialTypes,
        ) => {
            // Default network and wallet type
            var net = 'testnet';
            var walletType = 'bech32';

            if (backupMaterialType === 'descriptor') {
                // Grab the descriptor network and type
                const desc = getDescriptorParts(backupMaterial);

                net = desc.network;
                walletType = desc.type;
            }

            const walletArgs = {
                name: 'Restored Wallet',
                type: walletType, // Allow user to set in advanced mode or guess it from wallet scan
                secret: backupMaterialType === 'mnemonic' ? backupMaterial : '',
                descriptor:
                    backupMaterialType === 'descriptor' ? backupMaterial : '',
                xprv: backupMaterialType === 'xprv' ? backupMaterial : '',
                xpub: backupMaterialType === 'xpub' ? backupMaterial : '',
                network: net,
            };

            if (
                backupMaterialType === 'xprv' ||
                backupMaterialType === 'xpub'
            ) {
                // Get extended key info based on the first letter prefix
                const {network, type} = extendedKeyInfo[backupMaterial[0]];

                // Set the assumed default network and wallet type based on SLIP132
                walletArgs.network = network;
                walletArgs.type = type;
            }

            // Handle material according to type
            let newWallet: TWalletType;

            // Ensure we have a valid wallet type
            if (!['bech32', 'p2sh', 'legacy'].includes(walletArgs.type)) {
                throw new Error('[restoreWallet] Invalid wallet type');
            }

            switch (walletArgs.type) {
                case 'bech32':
                    newWallet = new SegWitNativeWallet(
                        walletArgs as baseWalletArgs,
                    );
                    break;

                case 'p2sh':
                    newWallet = new SegWitP2SHWallet(
                        walletArgs as baseWalletArgs,
                    );
                    break;

                case 'legacy':
                    newWallet = new LegacyWallet(walletArgs as baseWalletArgs);
                    break;
            }

            await _addNewWallet(newWallet, true);
        },
        [],
    );

    const addWallet = useCallback(
        async (name: string, type: string, network?: NetType) => {
            try {
                let newWallet: TWalletType;

                // Ensure we have a valid wallet type
                if (!['bech32', 'p2sh', 'legacy'].includes(type)) {
                    throw new Error('[restoreWallet] Invalid wallet type');
                }

                switch (type) {
                    case 'bech32':
                        newWallet = new SegWitNativeWallet({
                            name: name,
                            type: type,
                            network: network,
                        });

                        break;

                    case 'p2sh':
                        newWallet = new SegWitP2SHWallet({
                            name: name,
                            type: type,
                            network: network,
                        });
                        break;

                    case 'legacy':
                        newWallet = new LegacyWallet({
                            name: name,
                            type: type,
                            network: network,
                        });
                        break;
                }

                await _addNewWallet(newWallet);
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
            await setSatSymbol(true);
            await setAppLanguage(defaultContext.appLanguage);
            await setAppFiatCurrency(defaultContext.appFiatCurrency);
            await updateAppUnit(defaultContext.appUnit);
            await setTotalBalanceHidden(false);
            await _setWalletInit(false);
            await setWallets([]);
            await setCurrentWalletID('');
            await setIsAdvancedMode(false);
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
        _loadLock();
    }, []);

    useEffect(() => {
        _loadAppLanguage();
    }, []);

    useEffect(() => {
        _getAppUnit();
    }, []);

    useEffect(() => {
        _loadNetworkState();
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

    useEffect(() => {
        _loadFiatRate();
    }, []);

    // Return provider
    return (
        <AppStorageContext.Provider
            value={{
                loadLock,
                setLoadLock,
                networkState,
                setNetworkState,
                appLanguage,
                setAppLanguage,
                appFiatCurrency,
                setAppFiatCurrency,
                appUnit,
                fiatRate,
                useSatSymbol,
                setSatSymbol,
                updateFiatRate,
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
                getAllTransactions,
                updateAppUnit,
                updateWalletTransactions,
                updateWalletUTXOs,
                updateWalletBalance,
                renameWallet,
                deleteWallet,
            }}>
            {children}
        </AppStorageContext.Provider>
    );
};
