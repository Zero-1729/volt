/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    ReactElement,
    memo,
    useRef,
    useEffect,
    useContext,
    useCallback,
    useState,
} from 'react';
import {Linking, AppState, useColorScheme} from 'react-native';

import {AppStorageContext} from './class/storageContext';

import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
    NavigationContainer,
    createNavigationContainerRef,
    DefaultTheme,
    LinkingOptions,
    StackActions,
} from '@react-navigation/native';

import Toast from 'react-native-toast-message';

import {_BREEZ_SDK_API_KEY_, _BREEZ_INVITE_CODE_} from './modules/env';

import {
    BreezEvent,
    mnemonicToSeed,
    NodeConfig,
    nodeInfo,
    NodeConfigVariant,
    defaultConfig,
    EnvironmentType,
    connect,
    BreezEventVariant,
    ConnectRequest,
} from '@breeztech/react-native-breez-sdk';
import {checkNetworkIsReachable, getXPub256} from './modules/wallet-utils';

import Color from './constants/Color';

import {useRenderCount} from './modules/hooks';

import {checkClipboardContents} from './modules/clipboard';
import {capitalizeFirst} from './modules/transform';
import {useTranslation} from 'react-i18next';

import {actionAlert} from './components/alert';

import Home from './screens/Home';
import PayInvoice from './screens/wallet/PayInvoice';
import TransactionList from './screens/wallet/TransactionsList';

// Biometrics Screen
import LockScreen from './components/lock';

// Wallet screens
import Add from './screens/wallet/Add';
import RestoreActions from './screens/wallet/RestoreActions';
import CreateActions from './screens/wallet/CreateActions';
import Mnemonic from './screens/wallet/Mnemonic';
import WalletViewScreen from './screens/wallet/Wallet';
import Receive from './screens/wallet/Receive';
import Info from './screens/wallet/Info';
import Backup from './screens/wallet/Backup';
import Ownership from './screens/wallet/AddressOwnership';
import RequestAmount from './screens/wallet/RequestAmount';
import FeeSelection from './screens/wallet/FeeSelection';
import TransactionExported from './screens/wallet/TransactionExported';
import Send from './screens/wallet/Send';
import SendAmount from './screens/wallet/SendAmount';
import SendLN from './screens/wallet/SendLN';
import BoltNFC from './screens/wallet/BoltNFC';
import Xpub from './screens/wallet/Xpub';

// Swap screens
import SwapAmount from './screens/wallet/SwapAmount';
import SwapIn from './screens/wallet/SwapIn';
import SwapOut from './screens/wallet/SwapOut';

// Transaction details screen
import TransactionDetails from './screens/wallet/TransactionDetails';
import TransactionStatus from './screens/wallet/TransactionStatus';
import LNTransactionStatus from './screens/wallet/LNTransactionStatus';

// QR Code Scan screen
import Scan from './screens/Scan';

// Main app settings screens
import Settings from './screens/settings/Settings';

import Language from './screens/settings/Language';
import Currency from './screens/settings/Currency';
import Wallet from './screens/settings/Wallet';
import Network from './screens/settings/Network';

// PIN screens
import PINManager from './screens/settings/pin/PIN';
import ChangePIN from './screens/settings/pin/ChangePIN';
import SetPIN from './screens/settings/pin/SetPIN';
import WelcomePIN from './screens/settings/pin/Welcome';
import ConfirmPIN from './screens/settings/pin/ConfirmPIN';
import DonePIN from './screens/settings/pin/Done';
import SetBiometrics from './screens/settings/pin/SetBiometrics';
import ResetPIN from './screens/settings/pin/ResetPIN';
import MnemonicTest from './screens/settings/pin/MnemonicTest';
import ExtKeyTest from './screens/settings/pin/ExtKeyTest';

// Settings Tools
import SettingsTools from './screens/settings/tools/Index';
import ExtendedKey from './screens/settings/tools/ExtendedKey';
import MnemonicTool from './screens/settings/tools/MnemonicTool';

import About from './screens/settings/About';
import License from './screens/settings/License';
import Changelog from './screens/settings/Changelog';

import {
    TTransaction,
    TMiniWallet,
    TInvoiceData,
    TBreezPaymentDetails,
    TLnManualPayloadType,
    TSwapInfo,
} from './types/wallet';
import {ENet, EBreezDetails, SwapType} from './types/enums';
import {hasOpenedModals} from './modules/shared';
import {LnInvoice} from '@breeztech/react-native-breez-sdk';

import {useNetInfo} from '@react-native-community/netinfo';

// Make sure this is updated to match all screen routes below
const modalRoutes = [
    'FeeSelection',
    'WalletBackup',
    'AddressOwnership',
    'TransactionDetails',
    'TransactionStatus',
    'TransactionExported',
    'WalletXpub',
    // 'addWalletRoot', Screen not necessary as before wallet created
    'License',
    'Changelog',
    'XKeyTool',
    'MnemonicTool',
];

// Root Param List for Home Screen
export type InitStackParamList = {
    HomeScreen: {
        restoreMeta: {
            title: string;
            message: string;
            load: boolean;
        };
    };
    PayInvoice: {
        invoice: string;
    };
    AddWalletRoot: {
        onboarding: boolean;
    };
    WalletRoot: undefined;
    SettingsRoot: undefined;
    ScanRoot: undefined;
    TransactionList: undefined;
    LNTransactionStatus: {
        status: boolean;
        details: TBreezPaymentDetails;
        detailsType: EBreezDetails;
    };
    Mnemonic: undefined;
};

// Settings Param List for screens
export type SettingsParamList = {
    Settings: undefined;
    Currency: undefined;
    Language: undefined;
    Wallet: undefined;
    Network: undefined;
    About: undefined;

    PINManager: undefined;
    ChangePIN: undefined;
    WelcomePIN: undefined;
    SetPIN: {
        isChangePIN?: boolean;
        isPINReset?: boolean;
    };
    ConfirmPIN: {
        pin: string;
        isChangePIN?: boolean;
        isPINReset?: boolean;
    };
    DonePIN: {
        isChangePIN?: boolean;
        isPINReset?: boolean;
    };
    SetBiometrics: {
        standalone: boolean;
    };
    ResetPIN: {
        isPINReset: boolean;
        isChangePIN?: boolean;
    };
    MnemonicTest: {
        isPINReset: boolean;
        isChangePIN: boolean;
    };
    ExtKeyTest: {
        isPINReset: boolean;
        isChangePIN: boolean;
    };

    SettingsTools: undefined;
    License: undefined;
    Changelog: undefined;
    XKeyTool: undefined;
    MnemonicTool: undefined;
};

// Add Wallet Param List for screens
export type AddWalletParamList = {
    Add: {
        onboarding: boolean;
    };
    RestoreActions: {
        onboarding: boolean;
    };
    CreateActions: undefined;
};

// Root Param List for screens
export type WalletParamList = {
    Receive: {
        amount: string;
        sats: string;
        fiat: string;
        lnDescription?: string;
    };
    FeeSelection: {
        invoiceData: TInvoiceData;
        wallet: TMiniWallet;
    };
    Send: {
        feeRate: number;
        dummyPsbtVSize: number;
        invoiceData: TInvoiceData;
        wallet?: TMiniWallet;
        bolt11?: LnInvoice;
    };
    SwapAmount: {
        swapType: SwapType;
        swapMeta: TSwapInfo;
    };
    SwapIn: {
        feeRate?: number;
        onchainBalance: number;
        invoiceData: TInvoiceData;
        swapMeta: TSwapInfo;
    };
    SwapOut: {
        lnBalance: number;
        swapMeta: TSwapInfo;
        satsAmount: number;
        maxed: boolean;
    };
    WalletView: {
        reload: boolean;
    };
    WalletInfo: undefined;
    WalletBackup: undefined;
    AddressOwnership: {
        wallet: TMiniWallet;
    };
    RequestAmount: {
        boltNFCMode?: boolean; // from BoltNFC Quick Action
    };
    SendAmount: {
        invoiceData: any;
        wallet: TMiniWallet;
        isLightning?: boolean;
        isLnManual?: boolean;
        lnManualPayload?: TLnManualPayloadType;
    };
    SendLN: {
        lnManualPayload?: TLnManualPayloadType;
    };
    TransactionDetails: {
        tx: TTransaction;
        source: string;
        walletId: string;
    };
    TransactionExported: {
        status: boolean;
        fname: string;
        errorMsg: string;
    };
    TransactionStatus: {
        unsignedPsbt: string;
        wallet: TMiniWallet;
        network: string;
    };
    BoltNFC: {
        amountMsat: number;
        description: string;
        fromQuickActions: boolean;
    };
    WalletXpub: undefined;
};

export type ScanParamList = {
    Scan: {
        screen: string;
        wallet: TMiniWallet;
    };
};

const SettingsStack = createNativeStackNavigator<SettingsParamList>();
const SettingsRoot = () => {
    return (
        <SettingsStack.Navigator screenOptions={{headerShown: false}}>
            <SettingsStack.Screen name="Settings" component={Settings} />
            <SettingsStack.Screen name="Currency" component={Currency} />
            <SettingsStack.Screen name="Language" component={Language} />
            <SettingsStack.Screen name="Wallet" component={Wallet} />
            <SettingsStack.Screen name="Network" component={Network} />
            <SettingsStack.Screen name="About" component={About} />

            {/* Set PIN */}
            <SettingsStack.Screen name="PINManager" component={PINManager} />
            <SettingsStack.Screen name="ChangePIN" component={ChangePIN} />
            <SettingsStack.Screen name="WelcomePIN" component={WelcomePIN} />
            <SettingsStack.Screen name="SetPIN" component={SetPIN} />
            <SettingsStack.Screen name="ConfirmPIN" component={ConfirmPIN} />
            <SettingsStack.Screen name="DonePIN" component={DonePIN} />
            <SettingsStack.Screen
                name="SetBiometrics"
                component={SetBiometrics}
            />
            <SettingsStack.Screen name="ResetPIN" component={ResetPIN} />
            <SettingsStack.Screen
                name="MnemonicTest"
                component={MnemonicTest}
            />
            <SettingsStack.Screen name="ExtKeyTest" component={ExtKeyTest} />

            <SettingsStack.Screen
                name="SettingsTools"
                component={SettingsTools}
            />

            <SettingsStack.Group screenOptions={{presentation: 'modal'}}>
                <SettingsStack.Screen name="License" component={License} />
                <SettingsStack.Screen name="Changelog" component={Changelog} />
                <SettingsStack.Screen name="XKeyTool" component={ExtendedKey} />
                <SettingsStack.Screen
                    name="MnemonicTool"
                    component={MnemonicTool}
                />
            </SettingsStack.Group>
        </SettingsStack.Navigator>
    );
};

const ScanStack = createNativeStackNavigator<ScanParamList>();
const ScanRoot = () => {
    return (
        <ScanStack.Navigator screenOptions={{headerShown: false}}>
            <ScanStack.Screen name="Scan" component={Scan} />
        </ScanStack.Navigator>
    );
};

const WalletStack = createNativeStackNavigator<WalletParamList>();
const WalletRoot = () => {
    return (
        <WalletStack.Navigator screenOptions={{headerShown: false}}>
            <WalletStack.Screen
                name="WalletView"
                component={WalletViewScreen}
            />
            <WalletStack.Screen name="WalletInfo" component={Info} />

            <WalletStack.Screen name="Send" component={Send} />
            <WalletStack.Screen name="SendLN" component={SendLN} />
            <WalletStack.Screen name="SendAmount" component={SendAmount} />
            <WalletStack.Screen name="FeeSelection" component={FeeSelection} />
            <WalletStack.Screen name="Receive" component={Receive} />
            <WalletStack.Screen
                name="RequestAmount"
                component={RequestAmount}
            />
            <WalletStack.Screen name="BoltNFC" component={BoltNFC} />

            <WalletStack.Group screenOptions={{presentation: 'modal'}}>
                <WalletStack.Screen name="WalletBackup" component={Backup} />
                <WalletStack.Screen
                    name="AddressOwnership"
                    component={Ownership}
                />
                <WalletStack.Screen
                    name="TransactionDetails"
                    component={TransactionDetails}
                />
                <WalletStack.Screen
                    name="TransactionStatus"
                    component={TransactionStatus}
                />
                <WalletStack.Screen
                    name="TransactionExported"
                    component={TransactionExported}
                />
                <WalletStack.Screen name="WalletXpub" component={Xpub} />
                <WalletStack.Screen name="SwapAmount" component={SwapAmount} />
                <WalletStack.Screen name="SwapIn" component={SwapIn} />
                <WalletStack.Screen name="SwapOut" component={SwapOut} />
            </WalletStack.Group>
        </WalletStack.Navigator>
    );
};

const AddWalletStack = createNativeStackNavigator<AddWalletParamList>();
export const AddWalletRoot = () => {
    return (
        <AddWalletStack.Navigator screenOptions={{headerShown: false}}>
            <AddWalletStack.Screen name="Add" component={Add} />
            <AddWalletStack.Screen
                name="RestoreActions"
                component={RestoreActions}
            />
            <AddWalletStack.Screen
                name="CreateActions"
                component={CreateActions}
            />
        </AddWalletStack.Navigator>
    );
};

// Create a navigation container reference
export const navigationRef = createNavigationContainerRef<InitStackParamList>();
export const rootNavigation = {
    navigate<RouteName extends keyof InitStackParamList>(
        ...args: RouteName extends unknown
            ? undefined extends InitStackParamList[RouteName]
                ?
                      | [screen: RouteName]
                      | [
                            screen: RouteName,
                            params: InitStackParamList[RouteName],
                        ]
                : [screen: RouteName, params: InitStackParamList[RouteName]]
            : never
    ): void {
        if (navigationRef.isReady()) {
            // Close any outstanding modals first
            const currentRoute = navigationRef.current?.getCurrentRoute();
            if (hasOpenedModals(currentRoute, modalRoutes)) {
                navigationRef.current?.dispatch(StackActions.popToTop());
            }

            navigationRef.current?.navigate(...args);
        } else {
            // If navigation not ready
            console.log('Navigation not ready');
        }
    },
};

const InitScreenStack = createNativeStackNavigator<InitStackParamList>();
const RootNavigator = (): ReactElement => {
    const appState = useRef(AppState.currentState);
    const renderCount = useRenderCount();

    const {
        onboarding,
        wallets,
        setOnboarding,
        isAdvancedMode,
        getWalletData,
        currentWalletID,
        isWalletInitialized,
        mempoolInfo,
        setBreezEvent,
        setMempoolInfo,
    } = useContext(AppStorageContext);
    const walletState = useRef(wallets);
    const onboardingState = useRef(onboarding);
    const wallet = getWalletData(currentWalletID);
    const BreezSub = useRef<any>(null);
    const networkState = useNetInfo();
    const isNetOn = checkNetworkIsReachable(networkState);

    const [triggerClipboardCheck, setTriggerClipboardCheck] = useState(false);
    const [isAuth, setIsAuth] = useState(false);
    const mempoolRef = useRef(
        new WebSocket('wss://mempool.space/api/v1/ws'),
    ).current;

    const {t} = useTranslation('wallet');

    const ColorScheme = Color(useColorScheme());

    let Theme = {
        dark: ColorScheme.isDarkMode,
        colors: {
            ...DefaultTheme.colors,
            ...ColorScheme.NavigatorTheme.colors,
        },
    };

    // Clipboard check
    const checkAndSetClipboard = async () => {
        // We only display dialogs if content is not empty and valid invoice
        const clipboardResult = await checkClipboardContents();
        let clipboardMessage!: string;

        // Set clipboard message
        if (clipboardResult.invoiceType === 'lightning') {
            clipboardMessage = t('read_clipboard_lightning_text', {
                spec: clipboardResult.spec,
            });
        }

        if (clipboardResult.invoiceType === ENet.Bitcoin) {
            clipboardMessage = t('read_clipboard_bitcoin_text');
        }

        // If clipboard has contents, display dialog
        if (
            clipboardResult.hasContents &&
            clipboardResult.invoiceType !== 'unsupported'
        ) {
            actionAlert(
                capitalizeFirst(t('clipboard')),
                clipboardMessage,
                capitalizeFirst(t('pay')),
                capitalizeFirst(t('cancel')),
                () => {
                    rootNavigation.navigate('PayInvoice', {
                        invoice: clipboardResult.content,
                    });
                },
            );
        }
    };

    // Deep linking
    // Triggers while app still open
    const linking: LinkingOptions<{}> = {
        prefixes: ['bitcoin', 'lightning'],
        config: {
            screens: {
                PayInvoice: '',
            },
        },
        subscribe(listener): () => void {
            // Deep linking when app open
            const onReceiveLink = ({url}: {url: string}) => {
                if (!onboardingState.current && isAuth) {
                    rootNavigation.navigate('PayInvoice', {
                        invoice: url,
                    });
                }

                return listener(url);
            };

            // Listen to incoming links from deep linking
            const subscription = Linking.addEventListener('url', onReceiveLink);

            return () => {
                // Clean up the event listeners
                subscription?.remove();
            };
        },
    };

    // Check deep link & clipboard if app newly launched if app previously unopened
    const checkDeepLinkAndClipboard = async (): Promise<void> => {
        // Check deep link
        const url = await Linking.getInitialURL();

        if (url) {
            rootNavigation.navigate('PayInvoice', {invoice: url});
            return;
        }

        // Check clipboard
        checkAndSetClipboard();
    };

    const handleAuthSuccess = useCallback(() => {
        if (triggerClipboardCheck) {
            // Call clipboard
            checkDeepLinkAndClipboard();
        }

        setIsAuth(true);
        setTriggerClipboardCheck(false);
    }, [triggerClipboardCheck]);

    // Fetch and set Swap Info here
    const initMempoolSock = async () => {
        if (!checkNetworkIsReachable(networkState)) {
            return;
        }

        mempoolRef.onopen = () => {
            console.log('[Mempool] Connected');

            mempoolRef.send(
                JSON.stringify({
                    action: 'want',
                    data: ['stats'],
                }),
            );
        };

        mempoolRef.onmessage = (error: any) => {
            const _mempoolInfo = JSON.parse(error.data.toString()).mempoolInfo;
            const _fees = JSON.parse(error.data.toString()).fees;

            const mempoolUsage = _mempoolInfo?.usage;
            const mempoolMax = _mempoolInfo?.maxmempool;
            const feeEnv = _fees?.fastestFee
                ? _fees?.fastestFee
                : mempoolInfo.fastestFee;

            setMempoolInfo({
                mempoolCongested: mempoolUsage / mempoolMax >= 2.5,
                mempoolHighFeeEnv: feeEnv >= 150,
                economyFee: _fees?.economyFee
                    ? _fees?.economyFee
                    : mempoolInfo.economyFee,
                fastestFee: _fees?.fastestFee
                    ? _fees?.fastestFee
                    : mempoolInfo.fastestFee,
                minimumFee: _fees?.minimumFee
                    ? _fees?.minimumFee
                    : mempoolInfo.minimumFee,
                hourFee: _fees?.hourFee ? _fees?.hourFee : mempoolInfo.hourFee,
                halfHourFee: _fees?.halfHourFee
                    ? _fees?.halfHourFee
                    : mempoolInfo.halfHourFee,
            });
        };

        mempoolRef.onerror = (error: any) => {
            console.log('[Mempool] (error)', error.message);
        };
    };

    // Breez startup
    const initNode = async () => {
        // No point putting in any effort if mnemonic missing
        if (wallet?.mnemonic.length === 0) {
            return;
        }

        // Check network
        if (!checkNetworkIsReachable(networkState)) {
            return;
        }

        let restore_only = wallet.payments.length > 0 ? true : false;

        // Get node info
        try {
            const info = await nodeInfo();

            if (info?.id) {
                if (process.env.NODE_ENV === 'development' && isAdvancedMode) {
                    Toast.show({
                        topOffset: 54,
                        type: 'Liberal',
                        text1: t('Breez SDK'),
                        text2: t('Node already initialized'),
                        visibilityTime: 1750,
                    });
                }
                return;
            }
        } catch (error: any) {
            if (process.env.NODE_ENV === 'development' && isAdvancedMode) {
                Toast.show({
                    topOffset: 54,
                    type: 'Liberal',
                    text1: t('Breez SDK'),
                    text2: error.message,
                    visibilityTime: 2000,
                });
            }
        }

        // SDK events listener
        const onBreezEvent = (event: BreezEvent) => {
            if (event.type === BreezEventVariant.NEW_BLOCK) {
                console.log('[Breez SDK] New Block');
            }

            if (event.type === BreezEventVariant.SYNCED) {
                console.log('[Breez SDK] Synced');
            }

            if (event.type === BreezEventVariant.BACKUP_STARTED) {
                if (process.env.NODE_ENV === 'development' && isAdvancedMode) {
                    Toast.show({
                        topOffset: 54,
                        type: 'Liberal',
                        text1: t('Breez SDK'),
                        text2: t('breez_backup_started'),
                        visibilityTime: 1750,
                    });
                }
            }

            if (event.type === BreezEventVariant.BACKUP_SUCCEEDED) {
                if (process.env.NODE_ENV === 'development' && isAdvancedMode) {
                    console.log('[Breez SDK] Backup succeeded');
                    Toast.show({
                        topOffset: 54,
                        type: 'Liberal',
                        text1: t('Breez SDK'),
                        text2: t('breez_backup_success'),
                        visibilityTime: 1750,
                    });
                }
            }

            if (event.type === BreezEventVariant.BACKUP_FAILED) {
                console.log('[Breez SDK] Backup failed');
                console.log('[Breez SDK] Event details: ', event.details);

                Toast.show({
                    topOffset: 54,
                    type: 'Liberal',
                    text1: t('Breez SDK'),
                    text2: t('breez_backup_failed'),
                    visibilityTime: 1750,
                });
            }

            if (event.type === BreezEventVariant.INVOICE_PAID) {
                console.log('[Breez SDK] Invoice paid');
                console.log('[Breez SDK] Payment details: ', event.details);

                // Handle navigation to LNTransactionStatus in Wallet Receive screen
                setBreezEvent(event);
            }

            if (event.type === BreezEventVariant.PAYMENT_FAILED) {
                console.log('[Breez SDK] Payment failed');
                console.log('[Breez SDK] Event details: ', event.details);

                // Handle navigation to LNTransactionStatus in Wallet Receive & Send screen
                setBreezEvent(event);
            }

            if (event.type === BreezEventVariant.PAYMENT_SUCCEED) {
                console.log('[Breez SDK] Payment sent');
                console.log('[Breez SDK] Event details: ', event.details);

                // Handle navigation to LNTransactionStatus in Wallet Send screen
                setBreezEvent(event);
            }
        };

        // Create the default config
        const seed = await mnemonicToSeed(wallet.mnemonic);

        const nodeConfig: NodeConfig = {
            type: NodeConfigVariant.GREENLIGHT,
            config: {
                inviteCode: _BREEZ_INVITE_CODE_,
            },
        };

        const config = await defaultConfig(
            EnvironmentType.PRODUCTION,
            _BREEZ_SDK_API_KEY_,
            nodeConfig,
        );

        // Set directory for the wallet
        const xpub256 = getXPub256(wallet.xpub);
        config.workingDir = config.workingDir + `/volt/${xpub256}`;

        const connectionRequest: ConnectRequest = {
            config,
            seed,
            restoreOnly: restore_only,
        };

        try {
            // Connect to the Breez SDK make it ready for use
            BreezSub.current = await connect(connectionRequest, onBreezEvent);

            Toast.show({
                topOffset: 54,
                type: 'Liberal',
                text1: t('Breez SDK'),
                text2: t('breez_connected'),
                visibilityTime: 1750,
            });
        } catch (error: any) {
            if (process.env.NODE_ENV === 'development' && isAdvancedMode) {
                Toast.show({
                    topOffset: 54,
                    type: 'Liberal',
                    text1: t('Breez SDK'),
                    text2: error.message,
                    visibilityTime: 2000,
                });
            }
        }
    };

    useEffect(() => {
        // Block if newly onboarded
        if (walletState.current.length === 0) {
            return;
        }

        // Update if newly onboarded so we can check clippy and deep links later
        if (onboarding) {
            setOnboarding(false);
        }

        // Check for deep link if app newly launched
        // Ensure that we have wallets before checking
        if (renderCount <= 2 && !onboardingState.current) {
            // Call on trigger for Lock comp
            setTriggerClipboardCheck(true);
            initMempoolSock();
        }

        const appStateSub = AppState.addEventListener(
            'change',
            async (incomingState): Promise<void> => {
                const currentRoute = navigationRef.current?.getCurrentRoute();

                // Check whether we are in the pay invoice screen (i.e. handling deep link)
                // and block clipboard check;
                const isDeepLinkScreen = currentRoute?.name === 'PayInvoice';

                // Check and run clipboard fn if app is active in foreground
                // Ensure that we have wallets before checking
                if (
                    appState.current.match(/background/) &&
                    incomingState === 'active' &&
                    !isDeepLinkScreen &&
                    !onboardingState.current
                ) {
                    checkAndSetClipboard();
                }

                // Update app state
                appState.current = incomingState;
            },
        );

        // Init LN connection
        if (isWalletInitialized && wallet.type === 'unified') {
            initNode();
        }

        return () => {
            // Kill subscription
            BreezSub?.current?.remove();
            appStateSub?.remove();
            mempoolRef.close();
        };
    }, []);

    useEffect(() => {
        initNode();
        initMempoolSock();
    }, [isNetOn]);

    return (
        <NavigationContainer
            ref={navigationRef}
            linking={linking}
            theme={Theme}>
            <InitScreenStack.Navigator
                screenOptions={{headerShown: false}}
                initialRouteName={'HomeScreen'}>
                <InitScreenStack.Screen name="HomeScreen" component={Home} />
                <InitScreenStack.Screen name="ScanRoot" component={ScanRoot} />
                <InitScreenStack.Screen
                    name="LNTransactionStatus"
                    component={LNTransactionStatus}
                />
                <InitScreenStack.Screen
                    name="PayInvoice"
                    component={PayInvoice}
                />
                <InitScreenStack.Screen
                    name="AddWalletRoot"
                    component={AddWalletRoot}
                    options={{headerShown: false, presentation: 'modal'}}
                />
                <InitScreenStack.Screen
                    name="WalletRoot"
                    component={WalletRoot}
                />
                <InitScreenStack.Screen
                    name="SettingsRoot"
                    component={SettingsRoot}
                />
                <InitScreenStack.Group screenOptions={{presentation: 'modal'}}>
                    <InitScreenStack.Screen
                        name="Mnemonic"
                        component={Mnemonic}
                    />
                    <InitScreenStack.Screen
                        name="TransactionList"
                        component={TransactionList}
                    />
                </InitScreenStack.Group>
            </InitScreenStack.Navigator>

            {!isAuth && <LockScreen onSuccess={handleAuthSuccess} />}
        </NavigationContainer>
    );
};

export default memo(RootNavigator);
