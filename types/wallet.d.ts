// All Base Wallet-related Types for App
import 'react';

import BigNumber from 'bignumber.js';

import {SegWitNativeWallet} from '../class/wallet/segwit/wpkh';
import {SegWitP2SHWallet} from '../class/wallet/segwit/shp2wpkh';
import {LegacyWallet} from '../class/wallet/p2pkh';

import {LocalUtxo} from 'bdk-rn/lib/classes/Bindings';

import {Network} from 'bdk-rn/lib/lib/enums';
import {Net} from './enums';

export type TNetwork = Net | Network;

export type TWalletType = SegWitNativeWallet | LegacyWallet | SegWitP2SHWallet;

// Wallet balance type
export type BalanceType = BigNumber;

// Wallet balance fiat rate
export type FiatRate = {
    rate: BalanceType;
    lastUpdated: Date;
    source: string;
};

// UTXO Type
export type UTXOType = LocalUtxo & {
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
    network: Net; // Network type
    txid: string; // Transaction ID
    block_height: number; // Block height
    confirmed: boolean; // Whether transaction is confirmed
    confirmations: number; // Number of confirmations
    size: number; // Transaction size in bytes
    vsize: number; // Transaction size in virtual bytes
    weight: number; // Transaction weight
    fee?: BalanceType; // Transaction fee in sats
    value: BalanceType; // Transaction value in sats
    received: BalanceType; // Transaction received value in sats
    sent: BalanceType; // Transaction sent value in sats
    timestamp: Date; // Transaction date
    type: string; // Transaction type, 'outbound' or 'inbound'
    inputs?: UTXOType[]; // Transaction inputs
    outputs?: UTXOType[]; // Transaction outputs
    address?: string; // Transaction address
    rbf: boolean; // Whether transaction is RBF
    memo?: string; // Transaction memo
};

// Wallet Unit Type
export type Unit = {
    name: string; // Unit name, 'sats' or 'BTC'
    symbol: string; // Unit symbol '₿' or 'sats' (see https://satsymbol.com/)
};

// Address type
export type AddressType = {
    address: string; // Address
    path: string; // Address derivation path
    index: number; // Address derivation index
    change: boolean; // Whether address is change
    memo: string; // Address memo
};

export type DescriptorSymbolsType = string[];
export type DescriptorObject = {
    external: Descriptor;
    internal: Descriptor;
    priv: Descriptor;
};
export type Descriptor = string;

export type BaseWalletArgs = {
    name: string;
    type: string;
    derivationPath?: string;
    mnemonic?: string;
    xprv?: string;
    xpub?: string;
    network?: Net;
    fingerprint?: string;
};

export type ExtendedKeyInfoType = {
    network: Net;
    type: string; // Wallet type
};

export type ElectrumServerURLs = {
    bitcoin: string;
    testnet: string;
};

export type AccountPaths = {
    bitcoin: string;
    testnet: string;
};
