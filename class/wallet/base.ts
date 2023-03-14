import Crypto from 'crypto';

import {generateMnemonic} from '../../modules/bip39';

import {Unit, UTXOType} from './../../types/wallet';

import {NetworkType} from 'bdk-rn/lib/lib/interfaces';

export const WalletTypeNames: {[index: string]: string[]} = {
    bech32: ['Native Segwit', 'Bech32'],
    legacy: ['Legacy', 'P2PKH'],
    p2sh: ['Segwit', 'P2SH'],
};

export const WalletPaths: {[index: string]: string} = {
    bech32: "m/84'/0'/0'",
    legacy: "m/44'/0'/0'",
    p2sh: "m/49'/0'/0'",
};

export const extendedPrivs = ['xprv', 'yprv', 'tprv', 'zprv', 'vprv'];
export const extendedPubs = ['xpub', 'ypub', 'tpub', 'zpub', 'vpub'];

export type BackupMaterialTypes = 'mnemonic' | 'xprv' | 'xpub' | 'descriptor';
export const BackupMaterialType: {[index: string]: BackupMaterialTypes} = {
    MNEMONIC: 'mnemonic',
    XPRIV: 'xprv',
    XPUB: 'xpub',
    DESCRIPTOR: 'descriptor',
};

type descriptorSymbolsType = string[];
export const descriptorSymbols: descriptorSymbolsType = [
    '[',
    ']',
    '(',
    ')',
    ',',
    "'",
    '/',
    ':',
    '_',
    '*',
];

type BDKWalletTypes =
    | 'wpkh'
    | 'pkh'
    | 'p2pkh'
    | 'shp2wpkh'
    | 'MULTI'
    | 'p2shp2wpkh';

export const BDKWalletTypeNames: {[index: string]: BDKWalletTypes} = {
    bech32: 'wpkh',
    legacy: 'p2pkh',
    p2sh: 'shp2wpkh',
};

export class BaseWallet {
    id: string;
    name: string;

    isWatchOnly: boolean;
    type: string;

    descriptor: string;
    birthday: string | Date;

    secret: string;
    xprv: string;
    xpub: string;

    masterFingerprint: string;

    balance: number;

    UTXOs: UTXOType[];

    addresses: Array<string>;
    address: string;

    syncedBalance: number;
    lastSynced: number;
    units: Unit;

    derivationPath: string;

    network: NetworkType;

    hardwareWalletEnabled: boolean;
    hasBackedUp: boolean;

    constructor(
        name: string,
        type: string,
        secret?: string,
        descriptor?: string,
        xprv?: string,
        xpub?: string,
        network?: NetworkType,
    ) {
        this.id = this._generateID(); // Unique wallet ID
        this.name = name; // Wallet name

        this.type = type; // Can have 'segwit native', 'segwit', 'legacy', etc. wallets

        this.addresses = []; // List of addresses
        this.address = ''; // Temporarily generated receiving address
        this.birthday = Date(); // Timestamp of wallet creation
        this.units = {
            name: 'sats',
            symbol: 's',
        }; // Default unit to display wallet balance is sats

        this.balance = 0; // By default the balance is in sats
        this.syncedBalance = 0; // Last balance synced from node
        this.lastSynced = 0; // Timestamp of last wallet sync
        this.network = network ? network : 'testnet'; // Can have 'bitcoin', 'testnet', or 'signet' wallets

        this.UTXOs = []; // Set of wallet UTXOs

        this.hardwareWalletEnabled = false;
        this.hasBackedUp = false; // Whether user has backed up seed

        this.derivationPath = WalletPaths[this.type]; // Wallet derivation path

        this.secret = secret ? secret : generateMnemonic(); // mnemonic phrase
        this.descriptor = descriptor ? descriptor : '';
        this.xprv = xprv ? xprv : '';
        this.xpub = xpub ? xpub : '';

        // TODO: fetch from BDK
        this.masterFingerprint = ''; // Wallet master fingerprint

        // Assume wallet watch-only if no key material available
        // TODO: make this more robust
        // i.e., there maybe a watch-only wallet with a descriptor
        this.isWatchOnly =
            this.secret.length === 0 &&
            this.descriptor.length === 0 &&
            this.xprv.length === 0; // Whether wallet is watch only
    }

    protected _generateID(): string {
        return Crypto.randomUUID();
    }

    public updateBalance(sats: number) {
        this.balance = sats;
    }

    public updateName(text: string) {
        this.name = text;
    }

    _setFingerprint(fingerprint: string) {
        this.masterFingerprint = fingerprint;
    }

    _setDescriptor(descriptor: string) {
        this.descriptor = descriptor;
    }
}
