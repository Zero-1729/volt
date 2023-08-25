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

import {
    parseDescriptor,
    includeDescriptorKeyPath,
    createDescriptorFromXprv,
    createDescriptorFromString,
} from '../modules/descriptors';
import {generateMnemonic} from '../modules/bdk';

import {TLanguage, TCurrency} from '../types/settings';
import {EBackupMaterial, ENet} from '../types/enums';
import {
    TWalletType,
    TUnit,
    TBalance,
    TFiatRate,
    TUtxo,
    TTransaction,
    TBaseWalletArgs,
    TAddress,
    TElectrumServerURLs,
} from '../types/wallet';

import {BaseWallet} from './wallet/base';
import {SegWitNativeWallet} from './wallet/segwit/wpkh';
import {SegWitP2SHWallet} from './wallet/segwit/shp2wpkh';
import {LegacyWallet} from './wallet/p2pkh';

import {
    descriptorFromTemplate,
    fromDescriptorTemplatePublic,
} from '../modules/bdk';
import {
    getMetaFromMnemonic,
    getFingerprintFromXkey,
    getPubKeyFromXprv,
    getExtendedKeyPrefix,
    normalizeExtKey,
} from '../modules/wallet-utils';

import {extendedKeyInfo} from '../modules/wallet-defaults';

// App context props type
type Props = PropsWithChildren<{}>;

// App defaults
const isDevMode = __DEV__;

// Default context type
type defaultContextType = {
    appLanguage: TLanguage;
    appFiatCurrency: TCurrency;
    loadLock: boolean;
    appUnit: TUnit;
    fiatRate: TFiatRate;
    hideTotalBalance: boolean;
    isWalletInitialized: boolean;
    isAdvancedMode: boolean;
    wallets: TWalletType[];
    currentWalletID: string;
    isDevMode: boolean;
    electrumServerURL: TElectrumServerURLs;
    setAppLanguage: (languageObject: TLanguage) => void;
    setAppFiatCurrency: (currencyObject: TCurrency) => void;
    updateFiatRate: (fiatObj: TFiatRate) => void;
    setTotalBalanceHidden: (hideTotalBalance: boolean) => void;
    setIsAdvancedMode: (isAdvancedMode: boolean) => void;
    updateAppUnit: (unit: TUnit) => void;
    updateWalletTransactions: (
        id: string,
        transactions: TTransaction[],
    ) => void;
    updateWalletUTXOs: (id: string, utxo: TUtxo[]) => void;
    updateWalletBalance: (id: string, balance: TBalance) => void;
    updateWalletAddress: (id: string, address: TAddress) => void;
    renameWallet: (id: string, newName: string) => void;
    deleteWallet: (id: string) => void;
    restoreWallet: (
        backupMaterial: string,
        backupType: EBackupMaterial,
        backupNetwork: ENet,
    ) => void;
    addWallet: (name: string, type: string, network?: ENet) => void;
    resetAppData: () => void;
    setCurrentWalletID: (id: string) => void;
    getWalletData: (id: string) => TWalletType;
    setLoadLock: (loadLock: boolean) => void;
    setElectrumServerURL: (url: string) => void;
};

// Default app context values
const defaultContext: defaultContextType = {
    loadLock: false,
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
    hideTotalBalance: false,
    isWalletInitialized: false,
    isAdvancedMode: false,
    electrumServerURL: {
        // Default and alternates for testnet and bitcoin
        testnet: 'ssl://electrum.blockstream.info:60002',
        bitcoin: 'ssl://electrum.blockstream.info:50002',
    },
    setAppLanguage: () => {},
    setAppFiatCurrency: () => {},
    updateFiatRate: () => {},
    setTotalBalanceHidden: () => {},
    setIsAdvancedMode: () => {},
    restoreWallet: () => {},
    addWallet: () => {},
    updateAppUnit: () => {},
    updateWalletTransactions: () => {},
    updateWalletUTXOs: () => {},
    updateWalletBalance: () => {},
    updateWalletAddress: () => {},
    renameWallet: () => {},
    deleteWallet: () => {},
    resetAppData: () => {},
    setCurrentWalletID: () => {},
    getWalletData: () => {
        return new BaseWallet({name: 'test wallet', type: 'wpkh'});
    }, // Function grabs wallet data through a fetch by index via ids
    setLoadLock: () => {},
    setElectrumServerURL: () => {},
};

// Note: context 'value' will default to 'defaultContext' if no Provider is found
export const AppStorageContext =
    createContext<defaultContextType>(defaultContext);
export const AppStorageProvider = ({children}: Props) => {
    // |> States and async storage get and setters
    const [loadLock, _setLoadLock] = useState(defaultContext.loadLock);
    const [appLanguage, _setAppLanguage] = useState(defaultContext.appLanguage);
    const [appFiatCurrency, _setFiatCurrency] = useState(
        defaultContext.appFiatCurrency,
    );
    const [appUnit, _setAppUnit] = useState(defaultContext.appUnit);
    const [fiatRate, _setFiatRate] = useState(defaultContext.fiatRate);
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
    const [electrumServerURL, _setElectrumServerURL] = useState(
        defaultContext.electrumServerURL,
    );

    const {getItem: _getLoadLock, setItem: _updateLoadLock} =
        useAsyncStorage('loadLock');
    const {getItem: _getAppLanguage, setItem: _updateAppLanguage} =
        useAsyncStorage('appLanguage');
    const {getItem: _getFiatCurrency, setItem: _updateFiatCurrency} =
        useAsyncStorage('appFiatCurrency');
    const {getItem: _getAppUnit, setItem: _updateAppUnit} =
        useAsyncStorage('appUnit');
    const {getItem: _getFiatRate, setItem: _updateFiatRate} =
        useAsyncStorage('fiatRate');
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
    const {getItem: _getElectrumServerURL, setItem: _updateElectrumServerURL} =
        useAsyncStorage('electrumServerURL');

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

    const setAppLanguage = useCallback(
        async (languageObject: TLanguage) => {
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
        async (currency: TCurrency) => {
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
        async (fiat: TFiatRate) => {
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

    const setElectrumServerURL = useCallback(
        async (url: string) => {
            let electrumServers = {
                ...electrumServerURL,
                bitcoin: url,
            };

            try {
                _setElectrumServerURL(electrumServers);
                _updateElectrumServerURL(JSON.stringify(electrumServers));
            } catch (e) {
                console.error(
                    `[AsyncStorage] (Electrum server URL setting) Error loading data: ${e}`,
                );

                throw new Error('Unable to set electrum server URL');
            }
        },
        [_setElectrumServerURL, _updateElectrumServerURL],
    );

    const _loadElectrumServerURL = async () => {
        const url = await _getElectrumServerURL();

        // Only update setting if a value already exists
        // ...otherwise, use default
        if (url !== null) {
            _setElectrumServerURL(JSON.parse(url));
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
        let w!: TWalletType;

        const index = wallets.findIndex(wallet => wallet.id === id);
        const stringyW = wallets[index];

        // Silently just fail and return null
        if (index !== -1) {
            switch (stringyW.type) {
                case 'wpkh':
                    w = SegWitNativeWallet.fromJSON(JSON.stringify(stringyW));
                    break;
                case 'shp2wpkh':
                    w = SegWitP2SHWallet.fromJSON(JSON.stringify(stringyW));
                    break;
                case 'p2pkh':
                    w = LegacyWallet.fromJSON(JSON.stringify(stringyW));
                    break;
            }

            return w;
        } else {
            return stringyW;
        }
    };

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
                    case 'wpkh':
                        tmp = SegWitNativeWallet.fromJSON(serializedWallet);
                        break;
                    case 'shp2wpkh':
                        tmp = SegWitP2SHWallet.fromJSON(serializedWallet);
                        break;
                    case 'p2pkh':
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

    const updateAppUnit = useCallback(async (unit: TUnit) => {
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
        async (id: string, transactions: TTransaction[]) => {
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
        async (id: string, utxos: TUtxo[]) => {
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
        async (id: string, balance: TBalance) => {
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

    const updateWalletAddress = useCallback(
        async (id: string, address: TAddress) => {
            const index = wallets.findIndex(wallet => wallet.id === id);

            // Get the current wallet
            // Update the address in the current wallet
            const tmp = [...wallets];
            tmp[index].address = address;
            tmp[index].index += address.index;

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

    const _addNewWallet = async (newWallet: TWalletType) => {
        // Set wallet ID
        _setCurrentWalletID(newWallet.id);

        // If we have a mnemonic, generate extended key material
        // Function applied when newly generated wallet and if mnemonic imported
        if (newWallet.mnemonic !== '') {
            try {
                const metas = getMetaFromMnemonic(
                    newWallet.mnemonic,
                    newWallet.derivationPath,
                    newWallet.network,
                );

                newWallet.setXprv(metas.xprv);
                newWallet.setXpub(metas.xpub);
                newWallet.setFingerprint(metas.fingerprint);
            } catch (e) {
                throw e;
            }

            // Generate descriptors for mnemonic
            let InternalDescriptor!: string;
            let ExternalDescriptor!: string;
            let PrivateDescriptor!: string;

            ({InternalDescriptor, ExternalDescriptor, PrivateDescriptor} =
                await descriptorFromTemplate(
                    newWallet.mnemonic,
                    newWallet.type,
                    newWallet.network,
                ));

            // REM: We only store the string representation of the descriptors
            newWallet.setDescriptor({
                internal: InternalDescriptor,
                external: ExternalDescriptor,
                priv: PrivateDescriptor,
            });
        }

        // Declare and set if watch-only
        newWallet.setWatchOnly();

        // Generate new initial receive address
        const newAddress = newWallet.generateNewAddress();

        // Update temporary wallet address
        newWallet.setAddress(newAddress);

        // Set wallet as initialized
        if (!isWalletInitialized) {
            await _setWalletInit(true);
        }

        const tmp = [...wallets, newWallet];

        await _setWallets(tmp);
        await _updateWallets(JSON.stringify(tmp));

        // Update current walled ID
        await setCurrentWalletID(newWallet.id);
    };

    const restoreWallet = useCallback(
        async (
            backupMaterial: string,
            backupMaterialType: EBackupMaterial,
            backupNetwork: ENet,
        ) => {
            // Default network and wallet type
            var net = backupNetwork;
            var walletType = 'wpkh';

            var fingerprint = '';
            var path = '';

            var xpub = backupMaterialType === 'xpub' ? backupMaterial : '';
            var xprv = backupMaterialType === 'xprv' ? backupMaterial : '';

            // Adjust metas from descriptor
            if (backupMaterialType === 'descriptor') {
                // Grab the descriptor network and type
                // const parsedDescriptor = getDescriptorParts(backupMaterial);
                const parsedDescriptor = parseDescriptor(backupMaterial);

                // If we have a key missing the trailing path
                // We artificially include that here
                if (parsedDescriptor.key === parsedDescriptor.keyOnly) {
                    backupMaterial = includeDescriptorKeyPath(parsedDescriptor);
                }

                net = parsedDescriptor.network as ENet;
                walletType = parsedDescriptor.type;
                fingerprint = parsedDescriptor.fingerprint;
                path = parsedDescriptor.path;
                xpub =
                    getExtendedKeyPrefix(parsedDescriptor.keyOnly) === 'xpub'
                        ? parsedDescriptor.keyOnly
                        : '';
                xprv =
                    getExtendedKeyPrefix(parsedDescriptor.keyOnly) === 'xprv'
                        ? parsedDescriptor.keyOnly
                        : '';

                // Set xpub if we got an xprv
                if (xpub === '') {
                    xpub = getPubKeyFromXprv(xprv, net);
                }
            }

            // Adjust metas from xprv or xpub
            if (
                backupMaterialType === 'xprv' ||
                backupMaterialType === 'xpub'
            ) {
                // Get extended key info based on the first letter prefix
                const {network, type} = extendedKeyInfo[backupMaterial[0]];

                // Set the assumed default network and wallet type based on SLIP132
                net = network;
                walletType = type;

                // Fetch metas from xkey
                fingerprint = getFingerprintFromXkey(backupMaterial, network);

                // Set xpub
                if (backupMaterialType === 'xprv') {
                    xpub = getPubKeyFromXprv(backupMaterial, network);
                }
            }

            const walletArgs = {
                name: 'Restored Wallet',
                type: walletType, // Allow user to set in advanced mode or guess it from wallet scan
                mnemonic:
                    backupMaterialType === 'mnemonic' ? backupMaterial : '',
                descriptor:
                    backupMaterialType === 'descriptor' ? backupMaterial : '',
                xprv: xprv,
                xpub: xpub,
                network: net,
                path: path,
                fingerprint: fingerprint,
            };

            // Handle material according to type
            var newWallet!: TWalletType;

            // Ensure we have a valid wallet type
            if (!['wpkh', 'shp2wpkh', 'p2pkh'].includes(walletArgs.type)) {
                throw new Error('[restoreWallet] Invalid wallet type');
            }

            // Create wallet based on type
            switch (walletArgs.type) {
                case 'wpkh':
                    newWallet = new SegWitNativeWallet(
                        walletArgs as TBaseWalletArgs,
                    );
                    break;

                case 'shp2wpkh':
                    newWallet = new SegWitP2SHWallet(
                        walletArgs as TBaseWalletArgs,
                    );
                    break;

                case 'p2pkh':
                    newWallet = new LegacyWallet(walletArgs as TBaseWalletArgs);
                    break;
            }

            // Create descriptor from imported descriptor if available
            if (backupMaterialType === 'descriptor') {
                const retrievedDescriptors =
                    createDescriptorFromString(backupMaterial);

                newWallet.setDescriptor({
                    internal: retrievedDescriptors.internal, // InternalDescriptor,
                    external: retrievedDescriptors.external, // ExternalDescriptor,
                    priv: retrievedDescriptors.priv, // PrivateDescriptor,
                });
            }

            // Alternatively, generate Descriptor from Extended Keys
            if (
                backupMaterialType === 'xprv' ||
                backupMaterialType === 'xpub'
            ) {
                try {
                    let descriptor!: {
                        InternalDescriptor: string;
                        ExternalDescriptor: string;
                        PrivateDescriptor: string;
                    };

                    switch (backupMaterialType) {
                        case EBackupMaterial.Xpub:
                            descriptor = await fromDescriptorTemplatePublic(
                                // BDK expects a tpub or xpub, so we need to convert it
                                // if it's an exotic prefix
                                normalizeExtKey(walletArgs.xpub, 'pub'),
                                walletArgs.fingerprint,
                                walletArgs.type,
                                walletArgs.network,
                            );

                            break;

                        case EBackupMaterial.Xprv:
                            const {internal, external, priv} =
                                createDescriptorFromXprv(walletArgs.xprv);

                            descriptor = {
                                InternalDescriptor: internal,
                                ExternalDescriptor: external,
                                PrivateDescriptor: priv,
                            };

                            break;
                    }

                    newWallet.setDescriptor({
                        external: descriptor.ExternalDescriptor,
                        internal: descriptor.InternalDescriptor,
                        priv: descriptor.PrivateDescriptor,
                    });
                } catch (e) {
                    // Report any other related BDK errors
                    throw e;
                }
            }

            await _addNewWallet(newWallet);
        },
        [wallets, _updateWallets, _setWallets],
    );

    const addWallet = useCallback(
        async (name: string, type: string, network?: ENet) => {
            try {
                let newWallet!: TWalletType;

                // Ensure we have a valid wallet type
                if (!['wpkh', 'shp2wpkh', 'p2pkh'].includes(type)) {
                    throw new Error('[restoreWallet] Invalid wallet type');
                }

                // Generate mnemonic
                const mnemonic = await generateMnemonic();

                switch (type) {
                    case 'wpkh':
                        newWallet = new SegWitNativeWallet({
                            name: name,
                            type: type,
                            network: network,
                            mnemonic: mnemonic,
                        });

                        break;

                    case 'shp2wpkh':
                        newWallet = new SegWitP2SHWallet({
                            name: name,
                            type: type,
                            network: network,
                            mnemonic: mnemonic,
                        });
                        break;

                    case 'p2pkh':
                        newWallet = new LegacyWallet({
                            name: name,
                            type: type,
                            network: network,
                            mnemonic: mnemonic,
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
            await setAppLanguage(defaultContext.appLanguage);
            await setAppFiatCurrency(defaultContext.appFiatCurrency);
            await updateAppUnit(defaultContext.appUnit);
            await setTotalBalanceHidden(false);
            await _setWalletInit(false);
            await setWallets([]);
            await setCurrentWalletID('');
            await setIsAdvancedMode(false);
            await setElectrumServerURL(
                defaultContext.electrumServerURL.bitcoin,
            );
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
        _loadFiatCurrency();
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

    useEffect(() => {
        _loadElectrumServerURL();
    }, []);

    // Return provider
    return (
        <AppStorageContext.Provider
            value={{
                loadLock,
                setLoadLock,
                electrumServerURL,
                setElectrumServerURL,
                appLanguage,
                setAppLanguage,
                appFiatCurrency,
                setAppFiatCurrency,
                appUnit,
                fiatRate,
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
                updateAppUnit,
                updateWalletTransactions,
                updateWalletUTXOs,
                updateWalletBalance,
                updateWalletAddress,
                renameWallet,
                deleteWallet,
            }}>
            {children}
        </AppStorageContext.Provider>
    );
};
