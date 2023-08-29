// All Base Wallet-related Types for App
import 'react';

import BigNumber from 'bignumber.js';

import {SegWitNativeWallet} from '../class/wallet/segwit/wpkh';
import {SegWitP2SHWallet} from '../class/wallet/segwit/shp2wpkh';
import {LegacyWallet} from '../class/wallet/p2pkh';

import {LocalUtxo} from 'bdk-rn/lib/classes/Bindings';
import {FeesRecommended} from '@mempool/mempool.js/lib/interfaces';

import {Network} from 'bdk-rn/lib/lib/enums';
import {ENet} from './enums';

export type TNetwork = ENet | Network;

export type TWalletType = SegWitNativeWallet | LegacyWallet | SegWitP2SHWallet;
export type TComboWallet = TWalletType & TMiniWallet;

export type TMiniWallet = {
    name: string;
    type: string;
    network: string;
    balance: number;
    privateDescriptor: string;
    externalDescriptor?: string;
    internalDescriptor?: string;
    xpub: string;
};

export type TInvoiceData = {
    address: string;
    options?: {
        amount?: number;
        message?: string;
        label?: string;
    };
};

// Address set for BDK transaction functions
export type TAddressAmount = {
    address: string;
    amount: number;
};

// Wallet balance type
export type TBalance = BigNumber;

// Wallet balance fiat rate
export type TFiatRate = {
    rate: TBalance;
    lastUpdated: Date;
    source: string;
};

// UTXO Type
export type TUtxo = LocalUtxo & {
    txid: string; // Transaction ID
    vout: number; // Transaction output index
    value: TBalance; // Transaction output value in sats
    address: string; // Transaction output address
    flagged?: boolean; // Whether flagged by user to avoid spending, i.e. dust
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
};

// Transaction Type
export type TTransaction = {
    network: NetType; // Network type
    txid: string; // Transaction ID
    block_height: number; // Block height
    confirmed: boolean; // Whether transaction is confirmed
    confirmations: number; // Number of confirmations
    size: number; // Transaction size in bytes
    vsize: number; // Transaction size in virtual bytes
    weight: number; // Transaction weight
    fee: BalanceType; // Transaction fee in sats
    value: BalanceType; // Transaction value in sats
    received: BalanceType; // Transaction received value in sats
    sent: BalanceType; // Transaction sent value in sats
    timestamp: Date; // Transaction date
    type: string; // Transaction type, 'outbound' or 'inbound'
    inputs?: TUTXO[]; // Transaction inputs
    outputs?: TUTXO[]; // Transaction outputs
    address?: string; // Transaction address
    rbf: boolean; // Whether transaction is RBF
    isSelfOrBoost: boolean; // Whether transaction is CPFP, or RBF tx payed to self
    memo?: string; // Transaction memo
};

// Wallet Unit Type
export type TUnit = {
    name: string; // Unit name, 'sats' or 'BTC'
    symbol: string; // Unit symbol '₿' or 'sats' (see https://satsymbol.com/)
};

// Address type
export type TAddress = {
    address: string; // Address
    path: string; // Address derivation path
    index: number; // Address derivation index
    change: boolean; // Whether address is change
    memo: string; // Address memo
};

export type TDescriptorSymbols = string[];
export type TDescriptorObject = {
    external: Descriptor;
    internal: Descriptor;
    priv: Descriptor;
};
export type TDescriptor = string;

export type TBaseWalletArgs = {
    name: string;
    type: string;
    derivationPath?: string;
    mnemonic?: string;
    xprv?: string;
    xpub?: string;
    network?: ENet;
    fingerprint?: string;
};

export type TExtendedKeyInfo = {
    network: ENet;
    type: string; // Wallet type
};

export type TElectrumServerURLs = {
    bitcoin: string;
    testnet: string;
};

export type TAccountPaths = {
    bitcoin: string;
    testnet: string;
};

export type TMempoolFeeRates = FeesRecommended;
