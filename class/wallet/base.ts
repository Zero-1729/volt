import crypto from 'react-native-quick-crypto';

import BigNumber from 'bignumber.js';

import {
    Unit,
    BalanceType,
    TransactionType,
    UTXOType,
    NetType,
    baseWalletArgs,
    addressType,
    DescriptorObject,
} from './../../types/wallet';

import {
    descXpubPattern,
    getAddressPath,
    generateAddressFromMnemonic,
} from '../../modules/wallet-utils';

import {WalletPaths} from '../../modules/wallet-defaults';

export class BaseWallet {
    // Use static method to create wallet from JSON
    static fromJSON(json: string): BaseWallet {
        const obj = JSON.parse(json);

        const wallet = new BaseWallet({
            name: obj.name,
            type: obj.type,
            xprv: obj.xprv,
            xpub: obj.xpub,
            secret: obj.secret,
            network: obj.network,
        });

        wallet.id = obj.id;

        wallet.externalDescriptor = obj.externalDescriptor;
        wallet.internalDescriptor = obj.internalDescriptor;

        wallet.addresses = obj.addresses;
        wallet.address = obj.address;
        wallet.birthday = obj.birthday;
        wallet.balance = obj.balance;
        wallet.transactions = obj.transactions;
        wallet.UTXOs = obj.UTXOs;
        wallet.syncedBalance = obj.syncedBalance;
        wallet.lastSynced = obj.lastSynced;
        wallet.units = obj.units;
        wallet.masterFingerprint = obj.masterFingerprint;
        wallet.hardwareWalletEnabled = obj.hardwareWalletEnabled;
        wallet.hasBackedUp = obj.hasBackedUp;
        wallet.derivationPath = obj.derivationPath;
        wallet.setWatchOnly(obj.isWatchOnly);

        return wallet;
    }

    id: string;
    name: string;

    index: number;

    isWatchOnly: boolean;
    type: string;

    externalDescriptor: string;
    internalDescriptor: string;

    birthday: string | Date;

    secret: string;
    xprv: string;
    xpub: string;

    masterFingerprint: string;

    balance: BalanceType;

    transactions: TransactionType[];
    UTXOs: UTXOType[];

    addresses: Array<string>;
    address: addressType;

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

        this.index = 0; // Wallet address index

        this.type = args.type; // Can have 'segwit native', 'segwit', 'legacy', etc. wallets

        this.addresses = []; // List of addresses
        this.address = {
            address: '',
            path: '',
            index: 0,
            change: false,
            memo: '',
        }; // Temporarily generated receiving address
        this.birthday = Date(); // Timestamp of wallet creation
        this.units = {
            name: 'sats',
            symbol: 's',
        }; // Default unit to display wallet balance is sats

        this.balance = new BigNumber(0); // By default the balance is in sats
        this.syncedBalance = 0; // Last balance synced from node
        this.lastSynced = 0; // Timestamp of last wallet sync
        this.network = args.network ? args.network : 'testnet'; // Can have 'bitcoin' or 'testnet' wallet

        this.transactions = []; // List of wallet transactions
        this.UTXOs = []; // Set of wallet UTXOs

        this.hardwareWalletEnabled = false;
        this.hasBackedUp = false; // Whether user has backed up seed

        this.derivationPath = WalletPaths[this.type][this.network]; // Wallet derivation path

        this.internalDescriptor = ''; // Wallet internal descriptor
        this.externalDescriptor = ''; // Wallet external descriptor

        this.xprv = args.xprv ? args.xprv : '';
        this.xpub = args.xpub ? args.xpub : '';

        this.secret = args.secret ? args.secret : '';

        this.isWatchOnly = false; // Whether wallet is watch only

        // Retrieved and updated from BDK
        this.masterFingerprint = ''; // Wallet master fingerprint
    }

    generateNewAddress(): addressType {
        try {
            let index = this.index;
            let address!: string;

            const addressPath = getAddressPath(
                this.index,
                false,
                this.network,
                this.type,
            );

            // Generate address using either mnemonic or xpub
            // TODO: handle case for xpub
            if (this.secret.length > 0) {
                address = generateAddressFromMnemonic(
                    addressPath,
                    this.network,
                    this.type,
                    this.secret,
                );
            }

            // Bump address index
            this.index++;

            return {
                address: address,
                path: this.derivationPath,
                change: false,
                index: index,
                memo: '',
            };
        } catch (e) {
            throw e;
        }
    }

    protected _generateID(): string {
        return crypto.randomUUID();
    }

    setWatchOnly(isWatchOnly?: boolean) {
        // Assume wallet watch-only if no prvkey material available
        // i.e. no mnemonic, xprv, or descriptor with xprv
        if (isWatchOnly === undefined) {
            const noPrivKeys =
                this.secret.length === 0 && this.xprv.length === 0;

            // Naively check if extended pub key present
            // i.e. no prv key material in descriptor
            // Make sure descriptor is not empty, else assume no prv key material
            const noPrivKeyDescriptor =
                this.externalDescriptor !== ''
                    ? this.externalDescriptor.match(descXpubPattern)
                    : true;

            if (noPrivKeys && noPrivKeyDescriptor) {
                this.isWatchOnly = true;
            }
            return;
        }

        this.isWatchOnly = isWatchOnly;
    }

    updateBalance(sats: BalanceType) {
        this.balance = sats;
    }

    updateName(text: string) {
        this.name = text;
    }

    buildTx(args: any) {
        throw new Error('Not implemented');
    }

    updatedTransaction(tx: TransactionType) {
        throw new Error('Not implemented');
    }

    updateTransanctions(transactions: TransactionType[]) {
        this.transactions = transactions;
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

    setDescriptor(descriptor: DescriptorObject) {
        this.internalDescriptor = descriptor.internal;
        this.externalDescriptor = descriptor.external;
    }

    setAddress(address: addressType) {
        this.address = address;
    }
}
