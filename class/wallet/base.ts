import Crypto from 'react-native-quick-crypto';

import * as bip39 from '../../modules/bip39';

import {Unit, UTXOType, NetType, baseWalletArgs} from './../../types/wallet';

import {
    WalletPaths,
    descXpubPattern,
} from '../../modules/wallet-utils';

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

    network: NetType;

    hardwareWalletEnabled: boolean;
    hasBackedUp: boolean;

    constructor(args: baseWalletArgs) {
        this.id = this._generateID(); // Unique wallet ID
        this.name = args.name; // Wallet name

        this.type = args.type; // Can have 'segwit native', 'segwit', 'legacy', etc. wallets

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
        this.network = args.network ? args.network : 'testnet'; // Can have 'bitcoin', 'testnet', or 'signet' wallets

        this.UTXOs = []; // Set of wallet UTXOs

        this.hardwareWalletEnabled = false;
        this.hasBackedUp = false; // Whether user has backed up seed

        this.derivationPath = WalletPaths[this.type][this.network]; // Wallet derivation path

        this.descriptor = args.descriptor ? args.descriptor : '';
        this.xprv = args.xprv ? args.xprv : '';
        this.xpub = args.xpub ? args.xpub : '';

        this.secret = args.secret ? args.secret : '';

        this.isWatchOnly = false; // Whether wallet is watch only

        // Retrieved and updated from BDK
        this.masterFingerprint = ''; // Wallet master fingerprint
    }

    generateMnemonic(): void {
        if (this.secret.length === 0) {
            this.secret = bip39.generateMnemonic();
        }
    }

    protected _generateID(): string {
        return Crypto.randomUUID();
    }

    setWatchOnly(isWatchOnly?: boolean) {
        // Assume wallet watch-only if no key material available
        // TODO: make this more robust
        // i.e., there maybe a watch-only wallet with a descriptor
        if (isWatchOnly === undefined) {
            const noPrivKeys =
                this.secret.length === 0 && this.xprv.length === 0;

            // Naively check if extended key present
            const noPrivKeyDescriptor = this.descriptor.match(descXpubPattern);

            if (noPrivKeys && noPrivKeyDescriptor) {
                this.isWatchOnly = true;
            }
            return;
        }

        this.isWatchOnly = isWatchOnly;
    }

    updateBalance(sats: number) {
        this.balance = sats;
    }

    updateName(text: string) {
        this.name = text;
    }

    setXprv(xprv: string) {
        this.xprv = xprv;
    }

    setXpub(xpub: string) {
        this.xpub = xpub;
    }

    setFingerprint(fingerprint: string) {
        this.masterFingerprint = fingerprint;
    }

    setDescriptor(descriptor: string) {
        this.descriptor = descriptor;
    }
}
