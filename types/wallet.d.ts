// All Base Wallet-related Types for App
import 'react';

import {NetworkType} from 'bdk-rn/lib/lib/interfaces';

export type NetType = NetworkType;

// UTXO Type
export type UTXOType = {
    txid: string; // Transaction ID
    vout: number; // Transaction output index
    value: number; // Transaction output value in sats
    address: string; // Transaction output address
    flagged: boolean; // Whether flagged by user to avoid spending, i.e. dust
};

// Wallet Unit Type
export type Unit = {
    name: string; // Unit name, 'sats' or 'BTC'
    symbol: string; // Unit symbol '₿' or 'sats' (see https://satsymbol.com/)
};

export type descriptorSymbolsType = string[];

export type BackupMaterialTypes = 'mnemonic' | 'xprv' | 'xpub' | 'descriptor';

export type baseWalletArgs = {
    name: string;
    type: string;
    secret?: string;
    descriptor?: string;
    xprv?: string;
    xpub?: string;
    network?: NetType;
};

export type BDKWalletTypes =
    | 'wpkh'
    | 'pkh'
    | 'p2pkh'
    | 'shp2wpkh'
    | 'MULTI'
    | 'p2shp2wpkh';

export type extendedKeyInfoType = {
    network: NetType;
    type: string; // Wallet type
};
