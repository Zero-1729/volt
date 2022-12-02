// All Base Types for App
import 'react';

// App Types
// Base Wallet Type
type BaseWalletType = {
    name: string; // Wallet user defined name
    balance: number; // Wallet balance in sats
    UTXOs: UTXO[]; // List of wallet UTXOs
    isWatchOnly: boolean; // Is wallet watch only
    type: string; // Wallet address Type (Segwit, Legacy, etc.)
    address: string; // temporarily hold an address generated for receiving
    descriptor: string; // Wallet Descriptor (see: https://github.com/bitcoin/bitcoin/blob/master/doc/descriptors.md)
    birthday: string | Date; // Wallet creation date
};

// UTXO Type
type UTXOType = {
    txid: string; // Transaction ID
    vout: number; // Transaction output index
    value: number; // Transaction output value in sats
    address: string; // Transaction output address
    flagged: boolean; // Whether flagged by user to avoid spending, i.e. dust
};

// Base Net Configs
type NetworkConfigType = {
    name: string; // Mainnet, Testnet, etc.
    initNode?: string; // Initial node to connect to
};
