// All Base Wallet-related Types for App
import 'react';

// UTXO Type
type UTXOType = {
    txid: string; // Transaction ID
    vout: number; // Transaction output index
    value: number; // Transaction output value in sats
    address: string; // Transaction output address
    flagged: boolean; // Whether flagged by user to avoid spending, i.e. dust
};

// Wallet Unit Type
type Unit = {
    name: string; // Unit name, 'sats' or 'BTC'
    symbol: string; // Unit symbol '₿' or 'sats' (see https://satsymbol.com/)
};

// Base Net Configs
type NetworkConfigType = {
    name: string; // Mainnet, Testnet, etc.
    initNode?: string; // Initial node to connect to
};

type descriptorSymbolsType = string[];

export type BackupMaterialTypes = 'mnemonic' | 'xprv' | 'xpub' | 'descriptor';

type BDKWalletTypes =
    | 'wpkh'
    | 'pkh'
    | 'p2pkh'
    | 'shp2wpkh'
    | 'MULTI'
    | 'p2shp2wpkh';
