import BigNumber from 'bignumber.js';

import * as BDK from 'bdk-rn';
import {
    BlockchainElectrumConfig,
    Network,
    KeychainKind,
    BlockChainNames,
} from 'bdk-rn/lib/lib/enums';

import {BaseWallet} from '../class/wallet/base';

import {
    NetType,
    TWalletType,
    TransactionType,
    UTXOType,
    electrumServerURLs,
} from '../types/wallet';

import {liberalAlert} from '../components/alert';
import {Balance} from 'bdk-rn/lib/classes/Bindings';

type SyncData = {
    balance: BigNumber;
    transactions: TransactionType[];
    UTXOs: UTXOType[];
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

// Test Electrum server connection
// TODO: replace this with a better method, and possibly move out to wallet-utils
export const testElectrumServer = async (url: string, callback: any) => {
    const config: BlockchainElectrumConfig = {
        url,
        retry: 1,
        timeout: 5,
        stopGap: 5,
        sock5: null,
        validateDomain: false,
    };

    try {
        const chain = await new BDK.Blockchain().create(
            config,
            BlockChainNames.Electrum,
        );

        await chain.getHeight();

        callback(true);
    } catch (e) {
        callback(false);
    }
};

// Generate External and Internal Descriptors from wallet DescriptorSecretKey ('from mnemonic')
export const descriptorFromTemplate = async (
    secret: string,
    type: string,
    network: NetType,
): Promise<{
    InternalDescriptor: BDK.Descriptor;
    ExternalDescriptor: BDK.Descriptor;
}> => {
    // Create descriptor from mnemonic
    const mnemonic = await new BDK.Mnemonic().fromString(secret);

    const descriptorSecretKey = await new BDK.DescriptorSecretKey().create(
        network as Network,
        mnemonic,
    );

    let InternalDescriptor!: BDK.Descriptor;
    let ExternalDescriptor!: BDK.Descriptor;

    switch (type) {
        case 'bech32': {
            ExternalDescriptor = await new BDK.Descriptor().newBip84(
                descriptorSecretKey,
                'external' as KeychainKind,
                network as Network,
            );
            InternalDescriptor = await new BDK.Descriptor().newBip84(
                descriptorSecretKey,
                'internal' as KeychainKind,
                network as Network,
            );

            break;
        }
        case 'p2sh': {
            ExternalDescriptor = await new BDK.Descriptor().newBip49(
                descriptorSecretKey,
                'external' as KeychainKind,
                network as Network,
            );
            InternalDescriptor = await new BDK.Descriptor().newBip49(
                descriptorSecretKey,
                'internal' as KeychainKind,
                network as Network,
            );

            break;
        }
        case 'legacy': {
            ExternalDescriptor = await new BDK.Descriptor().newBip44(
                descriptorSecretKey,
                'external' as KeychainKind,
                network as Network,
            );
            InternalDescriptor = await new BDK.Descriptor().newBip44(
                descriptorSecretKey,
                'internal' as KeychainKind,
                network as Network,
            );

            break;
        }
    }

    return {
        InternalDescriptor,
        ExternalDescriptor,
    };
};


// Generate External and Internal Descriptors from wallet descriptor strings
export const descriptorsFromString = async (wallet: TWalletType) => {
    const InternalDescriptor = await new BDK.Descriptor().create(
        wallet.internalDescriptor,
        wallet.network as Network,
    );

    const ExternalDescriptor = await new BDK.Descriptor().create(
        wallet.externalDescriptor,
        wallet.network as Network,
    );

    return {
        InternalDescriptor,
        ExternalDescriptor,
    };
};

// Sync newly created wallet with electrum server
const _sync = async (
    wallet: BaseWallet,
    callback: any,
    electrumServer: electrumServerURLs,
): Promise<BDK.Wallet> => {
    // Electrum configuration
    const config: BlockchainElectrumConfig = {
        url:
            wallet.network === 'bitcoin'
                ? electrumServer.bitcoin
                : electrumServer.testnet,
        retry: 5,
        timeout: 5,
        stopGap: 5,
        sock5: null,
        validateDomain: false,
    };

    let chain!: BDK.Blockchain;

    // Attempt to connect and get height
    // If fails, throw error
    try {
        // Assumes a network check is performed before call
        chain = await new BDK.Blockchain().create(
            config,
            BlockChainNames.Electrum,
        );
    } catch (e) {
        console.info(`[Electrum] Failed to connect to server '${config.url}'`);
        throw e;
    }

    // Set Network
    const network =
        wallet.network === 'bitcoin' ? Network.Bitcoin : Network.Testnet;

    // Create descriptors
    let ExternalDescriptor!: BDK.Descriptor;
    let InternalDescriptor!: BDK.Descriptor;

    // Use descriptor from wallet
    if (wallet.secret === '') {
        // Case for descriptor wallet (no secret, just descriptor, xpub, or xprv)
        console.info('[BDK] No secret found, using descriptor instead');
        return new BDK.Wallet();
    }

    ({InternalDescriptor, ExternalDescriptor} = await descriptorsFromString(
        wallet,
    ));

    const w = await new BDK.Wallet().create(
        ExternalDescriptor,
        InternalDescriptor,
        network,
        await new BDK.DatabaseConfig().memory(),
    );

    const syncStatus = await w.sync(chain);

    // report any sync errors
    callback(syncStatus);

    return w;
};

// Fetch Wallet Balance using wallet descriptor, metas, and electrum server
export const getWalletBalance = async (
    wallet: BaseWallet,
    electrumServer: electrumServerURLs,
): Promise<SyncData> => {
    // Generate wallet from wallet descriptor and metas
    const w = await _sync(
        wallet,
        (status: boolean) => {
            if (!status) {
                liberalAlert('Error', 'Could not Sync Wallet', 'OK');

                return w;
            }
        },
        electrumServer,
    );

    // Get wallet balance
    const retrievedBalance: Balance = await w.getBalance();

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
    let TXs = wallet.transactions;
    let UTXOs: UTXOType[] = wallet.UTXOs;
    let walletTXs = TXs;

    if (updated) {
        // Update transactions list
        TXs = (await w.listTransactions(false)) as (TransactionType &
            TransactionDetails)[];
        UTXOs = (await w.listUnspent()) as UTXOType[];

        // Transactions to store in wallet
        walletTXs = [];

        // Update transactions list
        TXs.forEach((transaction: any) => {
            walletTXs.push(
                formatTXFromBDK({
                    confirmed: !!transaction.confirmationTime.timestamp,
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
        transactions: walletTXs,
        UTXOs: UTXOs,
        updated: updated,
    };
};
