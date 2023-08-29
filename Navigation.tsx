import React from 'react';

import {createNativeStackNavigator} from '@react-navigation/native-stack';

import Home from './screens/Home';

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
import Send from './screens/wallet/Send';
import SendAmount from './screens/wallet/SendAmount';

import TransactionDetails from './screens/wallet/TransactionDetails';
import TransactionStatus from './screens/wallet/TransactionStatus';

import Apps from './screens/Apps';

// QR Code Scan screen
import Scan from './screens/Scan';

// Main app settings screens
import Settings from './screens/settings/Settings';

import Language from './screens/settings/Language';
import Currency from './screens/settings/Currency';
import Wallet from './screens/settings/Wallet';
import Network from './screens/settings/Network';

// Settings Tools
import SettingsTools from './screens/settings/tools/Index';
import ExtendedKey from './screens/settings/tools/ExtendedKey';

import About from './screens/settings/About';
import License from './screens/settings/License';
import Release from './screens/settings/Release';

import {
    TTransaction,
    TMiniWallet,
    TAddressAmount,
} from './types/wallet';

// Root Param List for screens
export type WalletParamList = {
    Receive: {
        amount: string;
        sats: string;
        fiat: string;
    };
    Send: {
        invoiceData: any;
        wallet: TMiniWallet;
    };
    WalletView: undefined;
    WalletInfo: undefined;
    WalletBackup: undefined;
    AddressOwnership: {
        wallet: TMiniWallet;
    };
    RequestAmount: undefined;
    SendAmount: {
        invoiceData: any;
        wallet: TMiniWallet;
    };
    TransactionDetails: {
        tx: TTransaction;
        source: string;
    };
    TransactionStatus: {
        payload: {
            addressAmounts: TAddressAmount[];
            feeRate: number;
        };
        wallet: TMiniWallet;
        network: string;
    };
};

export type ScanParamList = {
    Scan: {
        screen: string;
        wallet: TMiniWallet;
    };
};

const SettingsStack = createNativeStackNavigator();
const SettingsRoot = () => {
    return (
        <SettingsStack.Navigator screenOptions={{headerShown: false}}>
            <SettingsStack.Screen name="Settings" component={Settings} />
            <SettingsStack.Screen name="Currency" component={Currency} />
            <SettingsStack.Screen name="Language" component={Language} />
            <SettingsStack.Screen name="Wallet" component={Wallet} />
            <SettingsStack.Screen name="Network" component={Network} />
            <SettingsStack.Screen name="About" component={About} />
            <SettingsStack.Screen
                name="SettingsTools"
                component={SettingsTools}
            />

            <SettingsStack.Group screenOptions={{presentation: 'modal'}}>
                <SettingsStack.Screen name="License" component={License} />
                <SettingsStack.Screen name="Release" component={Release} />
                <SettingsStack.Screen name="XKeyTool" component={ExtendedKey} />
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

            <WalletStack.Group screenOptions={{presentation: 'modal'}}>
                <WalletStack.Screen name="Send" component={Send} />
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
                <WalletStack.Screen name="Receive" component={Receive} />
                <WalletStack.Screen
                    name="RequestAmount"
                    component={RequestAmount}
                />
                <WalletStack.Screen name="SendAmount" component={SendAmount} />
            </WalletStack.Group>
        </WalletStack.Navigator>
    );
};

const AddWalletStack = createNativeStackNavigator();
const AddWalletRoot = () => {
    return (
        <AddWalletStack.Navigator screenOptions={{headerShown: false}}>
            <AddWalletStack.Screen name="Add" component={Add} />
            <AddWalletStack.Screen name="Mnemonic" component={Mnemonic} />
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

const InitScreenStack = createNativeStackNavigator();
const initScreen = () => {
    return (
        <InitScreenStack.Navigator screenOptions={{headerShown: false}}>
            <InitScreenStack.Screen name="HomeScreen" component={Home} />
            <InitScreenStack.Screen
                name="AddWalletRoot"
                component={AddWalletRoot}
                options={{headerShown: false, presentation: 'modal'}}
            />
            <InitScreenStack.Screen name="WalletRoot" component={WalletRoot} />
            <InitScreenStack.Screen
                name="SettingsRoot"
                component={SettingsRoot}
            />
            <InitScreenStack.Group screenOptions={{presentation: 'modal'}}>
                <InitScreenStack.Screen name="ScanRoot" component={ScanRoot} />
            </InitScreenStack.Group>
            <InitScreenStack.Screen name="Apps" component={Apps} />
        </InitScreenStack.Navigator>
    );
};

export default initScreen;
