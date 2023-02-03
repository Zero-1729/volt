import Crypto from 'crypto';
import {Unit, UTXOType} from './../../types/wallet';

const Units = {
    BTC: {
        name: 'BTC',
        symbol: '₿',
    },
    SATS: {
        name: 'sats',
        symbol: 'sats',
    },
};

export class BaseWallet {
    _ID: string;

    name: string;
    isWatchOnly: boolean;
    type: string;

    _descriptor: string;
    birthday: string | Date;
    _secret: string;

    _MasterFingerprint: string;
    isBIP39: boolean;

    balance: number;

    UTXOs: UTXOType[];

    _addresses: Array<string>;
    _address: string;

    _syncedBalance: number;
    _lastSynced: number;
    _units: Unit;

    network: string;

    _hardwareWalletEnabled: boolean;
    _hasBackedUp: boolean;

    constructor(
        name: string,
        isWatchOnly: boolean,
        type: string,
        secret: string,
        descriptor?: string,
        network?: string,
    ) {
        this._ID = this._generateID(); // Unique wallet ID
        this.name = name; // Wallet name

        this.isWatchOnly = isWatchOnly; // Whether wallet is watch only
        this.type = type; // Can have 'segwit', 'legacy', or 'bech32' wallets

        this._addresses = []; // List of addresses
        this._address = ''; // Temporarily generated receiving address
        this._descriptor = descriptor ? descriptor : '';
        this.birthday = Date(); // Timestamp of wallet creation

        this._units = Units.SATS; // Which unit to display wallet balance in

        this.balance = 0; // By default the balance is in sats
        this._syncedBalance = 0; // Last balance synced from node
        this._lastSynced = 0; // Timestamp of last wallet sync
        this.network = network ? network : 'mainnet'; // Can have 'mainnet', 'testnet', or 'signet' wallets

        this.UTXOs = []; // Set of wallet transactions

        this._hardwareWalletEnabled = false;
        this._hasBackedUp = false; // Whether user has backed up seed

        this._MasterFingerprint = ''; // Wallet master fingerprint
        this._secret = secret; // private key or recovery phrase
        this.isBIP39 = false; // Whether wallet has a 'BIP39' seed
    }

    _generateID() {
        return Crypto.randomUUID();
    }
}
