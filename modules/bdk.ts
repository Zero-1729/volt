import BigNumber from 'bignumber.js';

import * as BDK from 'bdk-rn';
import {
    BlockchainElectrumConfig,
    Network,
    KeychainKind,
} from 'bdk-rn/lib/lib/enums';

import {BaseWallet} from '../class/wallet/base';

import {TransactionType} from '../types/wallet';

import {liberalAlert} from '../components/alert';

type SyncData = {
    balance: BigNumber;
    transactions: TransactionType[];
    UTXOs: any[];
};

const config: BlockchainElectrumConfig = {
    url: 'ssl://electrum.blockstream.info:60002',
    retry: 5,
    timeout: 5,
    stopGap: 5,
    sock5: null,
    validateDomain: false,
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

export const syncWallet = async (wallet: BaseWallet): Promise<SyncData> => {
    // Assumes a network check is performed before call
    const chain = await new BDK.Blockchain().create(config);
    const dbConfig = await new BDK.DatabaseConfig().memory();
    const mnemonic = await new BDK.Mnemonic().fromString(wallet.secret);

    // TODO: Add support for creating descriptor from xprv/xpub and existing descriptor
    const descriptorSecretKey = await new BDK.DescriptorSecretKey().create(
        wallet.network as Network,
        mnemonic,
    );

    // Create descriptors
    let ExternalDescriptor!: BDK.Descriptor;
    let InternalDescriptor!: BDK.Descriptor;

    switch (wallet.type) {
        case 'bech32': {
            ExternalDescriptor = await new BDK.Descriptor().newBip84(
                descriptorSecretKey,
                'external' as KeychainKind,
                wallet.network as Network,
            );
            InternalDescriptor = await new BDK.Descriptor().newBip84(
                descriptorSecretKey,
                'internal' as KeychainKind,
                wallet.network as Network,
            );

            break;
        }
        case 'p2sh': {
            ExternalDescriptor = await new BDK.Descriptor().newBip49(
                descriptorSecretKey,
                'external' as KeychainKind,
                wallet.network as Network,
            );
            InternalDescriptor = await new BDK.Descriptor().newBip49(
                descriptorSecretKey,
                'internal' as KeychainKind,
                wallet.network as Network,
            );

            break;
        }
        case 'legacy': {
            ExternalDescriptor = await new BDK.Descriptor().newBip44(
                descriptorSecretKey,
                'external' as KeychainKind,
                wallet.network as Network,
            );
            InternalDescriptor = await new BDK.Descriptor().newBip44(
                descriptorSecretKey,
                'internal' as KeychainKind,
                wallet.network as Network,
            );

            break;
        }
    }

    const w = await new BDK.Wallet().create(
        ExternalDescriptor, // Create a descriptor with BDK and store here
        InternalDescriptor,
        wallet.network as Network,
        dbConfig,
    );

    const syncStatus = await w.sync(chain);

    // report any sync errors
    if (!syncStatus) {
        liberalAlert('Error', 'Could not Sync Wallet', 'OK');

        return {
            balance: wallet.balance,
            transactions: wallet.transactions,
            UTXOs: wallet.UTXOs,
        };
    }

    const retrievedBalance = await w.getBalance();

    // Update wallet balance
    // Leave untouched if error fetching balance
    let balance = new BigNumber(wallet.balance);

    // Update balance amount (in sats)
    // only update if balance different from stored version
    if (!balance.eq(retrievedBalance.total)) {
        // Receive balance in sats as string
        // convert to BigNumber
        balance = new BigNumber(retrievedBalance.total);
    }

    // Update transactions list
    const TXs = await w.listTransactions();
    const UTXOs = await w.listUnspent();

    // Receive transactions from BDK
    const tmp: TransactionType[] = [];

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

    // Return updated wallet balance and transactions
    // Fallback to original wallet transactions if error fetching transactions
    return {
        balance: balance,
        transactions: tmp,
        UTXOs: UTXOs,
    };
};
