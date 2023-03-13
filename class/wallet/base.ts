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

    masterFingerprint: string;
    isBIP39: boolean;

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
        network?: NetworkType,
    ) {
        this.id = this._generateID(); // Unique wallet ID
        this.name = name; // Wallet name

        this.type = type; // Can have 'segwit native', 'segwit', 'legacy', etc. wallets

        this.addresses = []; // List of addresses
        this.address = ''; // Temporarily generated receiving address
        this.descriptor = descriptor ? descriptor : '';
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

        // TODO: fetch from BDK
        this.masterFingerprint = ''; // Wallet master fingerprint
        this.secret = secret ? secret : generateMnemonic(); // private key or recovery phrase
        this.isBIP39 = this.secret.includes(' ') ? true : false; // Whether wallet has a 'BIP39' seed

        this.isWatchOnly = !this.secret; // Whether wallet is watch only
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
