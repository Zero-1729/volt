// All Base Wallet-related Types for App
import 'react';

import BigNumber from 'bignumber.js';
import {NetInfoState} from '@react-native-community/netinfo';

export type NetType = 'bitcoin' | 'testnet';

export type NetInfoType = NetInfoState | null;

// Wallet balance type
export type BalanceType = BigNumber;

// Wallet balance fiat rate
export type FiatRate = {
    rate: BalanceType;
    lastUpdated: Date;
    source: string;
};

// UTXO Type
export type UTXOType = {
    txid: string; // Transaction ID
    vout: number; // Transaction output index
    value: BalanceType; // Transaction output value in sats
    address: string; // Transaction output address
    flagged?: boolean; // Whether flagged by user to avoid spending, i.e. dust
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
};

// Transaction Type
export type TransactionType = {
    network: NetType; // Network type
    txid: string; // Transaction ID
    block_height: number; // Block height
    confirmed: boolean; // Whether transaction is confirmed
    confirmations?: number; // Number of confirmations
    size?: number; // Transaction size in bytes
    vsize?: number; // Transaction size in virtual bytes
    weight?: number; // Transaction weight
    fee: BalanceType; // Transaction fee in sats
    value: BalanceType; // Transaction value in sats
    timestamp: Date; // Transaction date
    type: string; // Transaction type, 'outbound' or 'inbound'
    inputs?: UTXOType[]; // Transaction inputs
    outputs?: UTXOType[]; // Transaction outputs
    address?: string; // Transaction address
    rbf?: boolean; // Whether transaction is RBF
    memo?: string; // Transaction memo
};

// Wallet Unit Type
export type Unit = {
    name: string; // Unit name, 'sats' or 'BTC'
    symbol: string; // Unit symbol '₿' or 'sats' (see https://satsymbol.com/)
};

// Address type
export type addressType = {
    address: string; // Address
    path: string; // Address derivation path
    index: number; // Address derivation index
    change: boolean; // Whether address is change
    memo: string; // Address memo
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

export type accountPaths = {
    bitcoin: string;
    testnet: string;
};
