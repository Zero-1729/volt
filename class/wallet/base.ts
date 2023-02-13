import Crypto from 'crypto';
import {Unit, UTXOType} from './../../types/wallet';

export class BaseWallet {
    public id: string;

    public name: string;
    readonly isWatchOnly: boolean;
    readonly type: string;

    readonly descriptor: string;
    readonly birthday: string | Date;
    readonly secret: string;

    readonly MasterFingerprint: string;
    readonly isBIP39: boolean;

    balance: number;

    private UTXOs: UTXOType[];

    private addresses: Array<string>;
    private address: string;

    syncedBalance: number;
    lastSynced: number;
    units: Unit;

    network: string;

    hardwareWalletEnabled: boolean;
    hasBackedUp: boolean;

    constructor(
        name: string,
        type: string,
        secret: string,
        descriptor?: string,
        network?: string,
        isWatchOnly?: boolean,
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
            symbol: 'sats',
        }; // Default unit to display wallet balance is sats

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

        this.isWatchOnly = !this.secret; // Whether wallet is watch only
    }

    private _generateID(): string {
        return Crypto.randomUUID();
    }

    public updateBalance(sats: number) {
        this.balance = sats;
    }
}
