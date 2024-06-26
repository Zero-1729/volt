import crypto from 'react-native-quick-crypto';

import BigNumber from 'bignumber.js';

import {
    TUnit,
    TBalance,
    TTransaction,
    TUtxo,
    TBaseWalletArgs,
    TAddress,
    TDescriptorObject,
    TNetwork,
} from './../../types/wallet';
import {ENet} from './../../types/enums';

import {getAddressPath} from '../../modules/wallet-utils';

import {WalletPaths, GAP_LIMIT} from '../../modules/wallet-defaults';

import {parseDescriptor} from '../../modules/descriptors';
import {createBDKWallet, generateBDKAddress} from '../../modules/bdk';

export class BaseWallet {
    // Use static method to create wallet from JSON
    static fromJSON(json: string): BaseWallet {
        const obj = JSON.parse(json);

        const wallet = new BaseWallet({
            name: obj.name,
            type: obj.type,
            xprv: obj.xprv,
            xpub: obj.xpub,
            mnemonic: obj.mnemonic,
            network: obj.network as ENet,
            restored: obj.restored,
        });

        wallet.id = obj.id;
        wallet.index = obj.index as number;
        wallet.restored = obj.restored;

        wallet.gap_limit = obj.gap_limit;

        wallet.externalDescriptor = obj.externalDescriptor;
        wallet.internalDescriptor = obj.internalDescriptor;
        wallet.privateDescriptor = obj.privateDescriptor;

        wallet.addresses = obj.addresses;
        wallet.address = obj.address as TAddress;
        wallet.birthday = obj.birthday as Date;
        wallet.balance = {
            onchain: new BigNumber(obj.balance.onchain),
            lightning: new BigNumber(obj.balance.lightning),
        };
        wallet.transactions = obj.transactions as TTransaction[];
        wallet.payments = obj.payments as TTransaction[];
        wallet.UTXOs = obj.UTXOs as TUtxo[];
        wallet.syncedBalance = obj.syncedBalance as number;
        wallet.lastSynced = obj.lastSynced;
        wallet.units = obj.units as TUnit;
        wallet.masterFingerprint = obj.masterFingerprint;
        wallet.hardwareWalletEnabled = obj.hardwareWalletEnabled;
        wallet.hasBackedUp = obj.hasBackedUp;
        wallet.derivationPath = obj.derivationPath;
        wallet.setWatchOnly(obj.isWatchOnly);

        return wallet;
    }

    id: string;
    name: string;
    restored: boolean;

    index: number;

    isWatchOnly: boolean;
    type: string;

    externalDescriptor: string;
    internalDescriptor: string;
    privateDescriptor: string;

    birthday: string | Date;

    gap_limit: number;

    mnemonic: string;
    xprv: string;
    xpub: string;

    masterFingerprint: string;

    balance: TBalance;

    transactions: TTransaction[];
    payments: TTransaction[];
    UTXOs: TUtxo[];

    addresses: Array<string>;
    address: TAddress;

    syncedBalance: number;
    lastSynced: number;
    units: TUnit;

    derivationPath: string;

    network: TNetwork;

    hardwareWalletEnabled: boolean;
    hasBackedUp: boolean;

    constructor(args: TBaseWalletArgs) {
        this.id = this._generateID(); // Unique wallet ID
        this.name = args.name; // Wallet name
        this.index = 0; // Wallet address index
        this.restored = args.restored; // Whether wallet is restored

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

        this.balance = {onchain: new BigNumber(0), lightning: new BigNumber(0)}; // By default the balance is in sats
        this.gap_limit = GAP_LIMIT; // Gap limit for wallet
        this.syncedBalance = 0; // Last balance synced from node
        this.lastSynced = 0; // Timestamp of last wallet sync
        this.network = args.network ? args.network : ENet.Testnet; // Can have 'bitcoin' or 'testnet' wallet

        this.transactions = []; // List of onchain transactions
        this.payments = []; // Lightning payments
        this.UTXOs = []; // Set of wallet UTXOs

        this.hardwareWalletEnabled = false;
        this.hasBackedUp = false; // Whether user has backed up seed

        this.derivationPath = args.derivationPath
            ? args.derivationPath
            : WalletPaths[this.type][this.network]; // Wallet derivation path

        this.internalDescriptor = ''; // Wallet internal descriptor
        this.externalDescriptor = ''; // Wallet external descriptor
        this.privateDescriptor = ''; // Wallet external private descriptor (default to external public descriptor if no private key material)

        this.xprv = args.xprv ? args.xprv : '';
        this.xpub = args.xpub ? args.xpub : '';
        this.mnemonic = args.mnemonic ? args.mnemonic : '';

        this.isWatchOnly = false; // Whether wallet is watch only

        this.masterFingerprint = args.fingerprint ? args.fingerprint : ''; // Wallet master fingerprint
    }

    async generateNewAddress(index?: number): Promise<TAddress> {
        const addressPath = getAddressPath(
            this.index,
            false,
            this.network,
            this.type,
        );

        const idx = index ? index : this.index;

        try {
            const _w = await createBDKWallet(this);

            const _addressObj = await generateBDKAddress(_w, idx, false);

            // Bump index
            this.index += 1;

            return {
                address: _addressObj.asString,
                path: addressPath,
                change: false,
                index: _addressObj.index,
                memo: '',
            };
        } catch (e: any) {
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
                this.mnemonic.length === 0 && this.xprv.length === 0;

            // Get private descriptor info and check
            // if it contains a private extended key
            const privateDescriptorInfo = parseDescriptor(
                this.privateDescriptor,
            );

            // If no private keys and descriptor is public, then watch-only
            if (noPrivKeys && privateDescriptorInfo.isPublic) {
                this.isWatchOnly = true;

                // Zero out master fingerprint if watch-only
                this.masterFingerprint = '00000000';
            }

            return;
        }

        this.isWatchOnly = isWatchOnly;
    }

    updateBalance(balances: TBalance) {
        this.balance = balances;
    }

    updateName(text: string) {
        this.name = text;
    }

    buildTx() {
        throw new Error('Not implemented');
    }

    updatedTransaction() {
        throw new Error('Not implemented');
    }

    updateTransanctions(transactions: TTransaction[]) {
        this.transactions = transactions;
    }

    updatePayments(payments: TTransaction[]) {
        this.payments = payments;
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

    setDescriptor(descriptor: TDescriptorObject) {
        this.internalDescriptor = descriptor.internal;
        this.externalDescriptor = descriptor.external;

        // The external descriptor with private key
        this.privateDescriptor = descriptor.priv;
    }

    setAddress(address: TAddress) {
        this.address = address;
    }
}
