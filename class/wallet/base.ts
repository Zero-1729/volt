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
    id: string;

    name: string;
    isWatchOnly: boolean;
    type: string;

    descriptor: string;
    birthday: string | Date;
    secret: string;

    MasterFingerprint: string;
    isBIP39: boolean;

    balance: number;

    UTXOs: UTXOType[];

    addresses: Array<string>;
    address: string;

    syncedBalance: number;
    lastSynced: number;
    units: Unit;

    network: string;

    hardwareWalletEnabled: boolean;
    hasBackedUp: boolean;

    constructor(
        name: string,
        isWatchOnly: boolean,
        type: string,
        secret: string,
        descriptor?: string,
        network?: string,
    ) {
        this.id = this._generateID(); // Unique wallet ID
        this.name = name; // Wallet name

        this.isWatchOnly = isWatchOnly; // Whether wallet is watch only
        this.type = WalletTypes[type]; // Can have 'segwit native', 'segwit', 'legacy', etc. wallets

        this.addresses = []; // List of addresses
        this.address = ''; // Temporarily generated receiving address
        this.descriptor = descriptor ? descriptor : '';
        this.birthday = Date(); // Timestamp of wallet creation

        this.units = Units.SATS; // Which unit to display wallet balance in

        this.balance = 0; // By default the balance is in sats
        this.syncedBalance = 0; // Last balance synced from node
        this.lastSynced = 0; // Timestamp of last wallet sync
        this.network = network ? network : 'mainnet'; // Can have 'mainnet', 'testnet', or 'signet' wallets

        this.UTXOs = []; // Set of wallet transactions

        this.hardwareWalletEnabled = false;
        this.hasBackedUp = false; // Whether user has backed up seed

        this.MasterFingerprint = ''; // Wallet master fingerprint
        this.secret = !isWatchOnly ? secret : ''; // private key or recovery phrase
        this.isBIP39 = false; // Whether wallet has a 'BIP39' seed
    }

    private _generateID() {
        return Crypto.randomUUID();
    }
}
