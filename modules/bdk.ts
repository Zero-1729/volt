import BigNumber from 'bignumber.js';

import * as BDK from 'bdk-rn';
import {
    BlockchainElectrumConfig,
    Network,
    KeychainKind,
    BlockChainNames,
} from 'bdk-rn/lib/lib/enums';

import {BaseWallet} from '../class/wallet/base';

import {TransactionType} from '../types/wallet';

import {liberalAlert} from '../components/alert';

const ElectrumURLs: {[index: string]: string} = {
    // Default and alternates for testnet and bitcoin
    // TODO: make this settable in the settings
    testnet: 'ssl://electrum.blockstream.info:60002',
    bitcoin: 'ssl://electrum.blockstream.info:50002',
};

type SyncData = {
    balance: BigNumber;
    transactions: TransactionType[];
    UTXOs: any[];
    updated: boolean; // whether the balance has been indeed updated
};

export const generateMnemonic = async () => {
    const mnemonic = await new BDK.Mnemonic().create();

    return mnemonic.asString();
};

// Formats transaction data from BDK to format for wallet
export const formatTXFromBDK = (tx: any): TransactionType => {
    const formattedTx = {
        txid: tx.txid,
        confirmed: tx.confirmed,
        block_height: tx.confirmationTime.height,
        timestamp: tx.confirmationTime.timestamp,
        fee: new BigNumber(tx.fee),
        value: new BigNumber(tx.received.length !== '' ? tx.received : tx.sent),
        type: tx.received.length !== '' ? 'inbound' : 'outbound',
        network: tx.network,
    };

    // Returned formatted tx
    return formattedTx;
};

const _sync = async (
    wallet: BaseWallet,
    callback: any,
): Promise<BDK.Wallet> => {
    // Electrum configuration
    const config: BlockchainElectrumConfig = {
        url: ElectrumURLs[wallet.network],
        retry: 5,
        timeout: 5,
        stopGap: 5,
        sock5: null,
        validateDomain: false,
    };

    // Assumes a network check is performed before call
    const chain = await new BDK.Blockchain().create(
        config,
        BlockChainNames.Electrum,
    );

    // Attempt to connect and get height
    // If fails, throw error
    try {
        await chain.getHeight();
    } catch (e) {
        console.info(`[Electrum] Failed to connect to server '${config.url}'`);
        throw e;
    }

    const dbConfig = await new BDK.DatabaseConfig().memory();

    // Set Network
    const network =
        wallet.network === 'bitcoin' ? Network.Bitcoin : Network.Testnet;

    // Create descriptors
    let descriptorSecretKey!: BDK.DescriptorSecretKey;
    let ExternalDescriptor!: BDK.Descriptor;
    let InternalDescriptor!: BDK.Descriptor;

    // Use descriptor from wallet
    if (wallet.secret === '') {
        // Case for descriptor wallet (no secret, just descriptor, xpub, or xprv)
        console.info('[BDK] No secret found, using descriptor instead');
        return new BDK.Wallet();
    } else {
        // Build descriptor from mnemonic
        const mnemonic = await new BDK.Mnemonic().fromString(wallet.secret);

        descriptorSecretKey = await new BDK.DescriptorSecretKey().create(
            network,
            mnemonic,
        );

        switch (wallet.type) {
            case 'bech32': {
                ExternalDescriptor = await new BDK.Descriptor().newBip84(
                    descriptorSecretKey,
                    'external' as KeychainKind,
                    network,
                );
                InternalDescriptor = await new BDK.Descriptor().newBip84(
                    descriptorSecretKey,
                    'internal' as KeychainKind,
                    network,
                );

                break;
            }
            case 'p2sh': {
                ExternalDescriptor = await new BDK.Descriptor().newBip49(
                    descriptorSecretKey,
                    'external' as KeychainKind,
                    network,
                );
                InternalDescriptor = await new BDK.Descriptor().newBip49(
                    descriptorSecretKey,
                    'internal' as KeychainKind,
                    network,
                );

                break;
            }
            case 'legacy': {
                ExternalDescriptor = await new BDK.Descriptor().newBip44(
                    descriptorSecretKey,
                    'external' as KeychainKind,
                    network,
                );
                InternalDescriptor = await new BDK.Descriptor().newBip44(
                    descriptorSecretKey,
                    'internal' as KeychainKind,
                    network,
                );

                break;
            }
        }
    }

    const w = await new BDK.Wallet().create(
        ExternalDescriptor, // Create a descriptor with BDK and store here
        InternalDescriptor,
        network,
        dbConfig,
    );

    const syncStatus = await w.sync(chain);

    // report any sync errors
    callback(syncStatus);

    return w;
};

export const getWalletBalance = async (
    wallet: BaseWallet,
): Promise<SyncData> => {
    const w = await _sync(wallet, (status: boolean) => {
        if (!status) {
            liberalAlert('Error', 'Could not Sync Wallet', 'OK');

            return w;
        }
    });

    const retrievedBalance = await w.getBalance();

    // Update wallet balance
    // Leave untouched if error fetching balance
    let balance = new BigNumber(wallet.balance);

    let updated = false;

    // Update balance amount (in sats)
    // only update if balance different from stored version
    if (!balance.eq(retrievedBalance.total)) {
        // Receive balance in sats as string
        // convert to BigNumber
        balance = new BigNumber(retrievedBalance.total);
        updated = true;
    }

    // Only fetch transactions when balance has been updated
    let TXs: any = wallet.transactions;
    let UTXOs: any = wallet.UTXOs;
    let tmp = TXs;

    if (updated) {
        // Update transactions list
        TXs = await w.listTransactions();
        UTXOs = await w.listUnspent();

        // Receive transactions from BDK
        tmp = [];

        // Update transactions list
        TXs.forEach((transaction: any) => {
            tmp.push(
                formatTXFromBDK({
                    confirmed: !!transaction.confirmationTime,
                    network: wallet.network,
                    ...transaction,
                }),
            );
        });
    }

    // Return updated wallet balance and transactions
    // Fallback to original wallet transactions if error fetching transactions
    return {
        balance: balance,
        transactions: tmp,
        UTXOs: UTXOs,
        updated: updated,
    };
};
