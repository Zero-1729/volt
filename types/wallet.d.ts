// All Base Types for App
import 'react';

// App Types
// Base Wallet Type
type BaseWalletType = {
    id: string; // Wallet ID
    name: string; // Wallet user defined name
    balance: number; // Wallet balance in sats
    UTXOs: UTXO[]; // List of wallet UTXOs
    isWatchOnly: boolean; // Is wallet watch only
    descriptor: string; // Wallet descriptor
    type: string; // Wallet address Type (Segwit, Bech32, Taproot, Legacy, etc.)
    address: string; // temporarily hold an address generated for receiving
    descriptor: string; // Wallet Descriptor (see: https://github.com/bitcoin/bitcoin/blob/master/doc/descriptors.md)
    birthday: string | Date; // Wallet creation date
    secret: string; // Wallet secret (mnemonic, xpub, etc.)
    masterFingerprint: string; // Wallet master fingerprint
    isBIP39: boolean; // Is wallet BIP39
    balance: number; // Wallet balance in sats
    UTXOSs: UTXOType[]; // List of wallet UTXOs
    addresses: Array<string>; // List of wallet addresses
    address: string; // Temporarily generated receiving address
    syncedBalance: number; // Last balance synced from node
    lastSynced: number; // Timestamp of last wallet sync
    units: Unit; // Which unit to display wallet balance in
    network: string; // Can have 'mainnet', 'testnet', or 'signet' wallets
    hardwareWalletEnabled: boolean;
    hasBackedUp: boolean; // Whether user has backed up seed
};

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
