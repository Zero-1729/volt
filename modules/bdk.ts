import BigNumber from 'bignumber.js';

import * as BDK from 'bdk-rn';
import {
    BlockchainElectrumConfig,
    Network,
    KeychainKind,
    BlockChainNames,
} from 'bdk-rn/lib/lib/enums';

import {TransactionDetails} from 'bdk-rn/lib/classes/Bindings';

import {
    TWalletType,
    TransactionType,
    UTXOType,
    ElectrumServerURLs,
    TNetwork,
    BalanceType,
} from '../types/wallet';

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

export const fromDescriptor = async (
    externalDescriptor: string,
    internalDescriptor: string,
    net: TNetwork,
) => {
    const external = await new BDK.Descriptor().create(
        externalDescriptor,
        net as Network,
    );
    const internal = await new BDK.Descriptor().create(
        internalDescriptor,
        net as Network,
    );

    // Used to rehydrate an external/internal descriptor from string
    return {
        ExternalDescriptor: await external.asString(),
        InternalDescriptor: await internal.asString(),
        PrivateDescriptor: await external.asStringPrivate(),
    };
};

// Formats transaction data from BDK to format for wallet
export const formatTXFromBDK = (tx: any): TransactionType => {
    let value = new BigNumber(Math.abs(tx.sent - tx.received));
    value = tx.sent > 0 ? value.minus(tx.fee) : value;

    const formattedTx = {
        txid: tx.txid,
        confirmed: tx.confirmed,
        block_height: tx.confirmationTime.height,
        timestamp: tx.confirmationTime.timestamp,
        fee: new BigNumber(tx.fee),
        value: value,
        received: new BigNumber(tx.received),
        sent: new BigNumber(tx.sent),
        type: tx.sent - tx.received > 0 ? 'outbound' : 'inbound',
        network: tx.network,
    };

    // Returned formatted tx
    return formattedTx;
};

// Test Electrum server connection
// TODO: replace this with a better method, and possibly move out to wallet-utils
export const getBlockHeight = async (url: string, callback: any) => {
    const config: BlockchainElectrumConfig = {
        url,
        retry: 1,
        timeout: 5,
        stopGap: 5,
        sock5: null,
        validateDomain: false,
    };

    let height!: number;

    try {
        const chain = await new BDK.Blockchain().create(
            config,
            BlockChainNames.Electrum,
        );

        height = await chain.getHeight();

        callback({status: true, blockHeight: height});
    } catch (e) {
        callback({status: false, blockHeight: height});
    }
};

// Generate External and Internal Descriptors from wallet DescriptorSecretKey ('from mnemonic')
export const descriptorFromTemplate = async (
    mnemonic: string,
    type: string,
    network: TNetwork,
): Promise<{
    InternalDescriptor: string;
    ExternalDescriptor: string;
    PrivateDescriptor: string;
}> => {
    // Create descriptor from mnemonic
    const bdkMnemonic = await new BDK.Mnemonic().fromString(mnemonic);

    const descriptorSecretKey = await new BDK.DescriptorSecretKey().create(
        network as Network,
        bdkMnemonic,
    );

    let internalDescriptor!: BDK.Descriptor;
    let externalDescriptor!: BDK.Descriptor;

    switch (type) {
        case 'wpkh': {
            externalDescriptor = await new BDK.Descriptor().newBip84(
                descriptorSecretKey,
                'external' as KeychainKind,
                network as Network,
            );
            internalDescriptor = await new BDK.Descriptor().newBip84(
                descriptorSecretKey,
                'internal' as KeychainKind,
                network as Network,
            );

            break;
        }
        case 'shp2wpkh': {
            externalDescriptor = await new BDK.Descriptor().newBip49(
                descriptorSecretKey,
                'external' as KeychainKind,
                network as Network,
            );
            internalDescriptor = await new BDK.Descriptor().newBip49(
                descriptorSecretKey,
                'internal' as KeychainKind,
                network as Network,
            );

            break;
        }
        case 'p2pkh': {
            externalDescriptor = await new BDK.Descriptor().newBip44(
                descriptorSecretKey,
                'external' as KeychainKind,
                network as Network,
            );
            internalDescriptor = await new BDK.Descriptor().newBip44(
                descriptorSecretKey,
                'internal' as KeychainKind,
                network as Network,
            );

            break;
        }
    }

    const PrivateDescriptor = await externalDescriptor.asStringPrivate();
    const ExternalDescriptor = await externalDescriptor.asString();
    const InternalDescriptor = await internalDescriptor.asString();

    return {
        ExternalDescriptor,
        InternalDescriptor,
        PrivateDescriptor,
    };
};

// Return External and Internal Descriptors from wallet DescriptorPublicKey ('i.e. other descriptors or single extended keys')
export const fromDescriptorTemplatePublic = async (
    pubKey: string,
    fingerprint: string,
    type: string,
    network: TNetwork,
): Promise<{
    InternalDescriptor: string;
    ExternalDescriptor: string;
    PrivateDescriptor: string;
}> => {
    const descriptorPublicKey = await new BDK.DescriptorPublicKey().fromString(
        pubKey,
    );

    let InternalDescriptor!: string;
    let ExternalDescriptor!: string;
    let PrivateDescriptor!: string;

    switch (type) {
        case 'wpkh': {
            const externalDescriptor =
                await new BDK.Descriptor().newBip84Public(
                    descriptorPublicKey,
                    fingerprint,
                    KeychainKind.External,
                    network as Network,
                );
            const internalDescriptor =
                await new BDK.Descriptor().newBip84Public(
                    descriptorPublicKey,
                    fingerprint,
                    KeychainKind.Internal,
                    network as Network,
                );

            ExternalDescriptor = await externalDescriptor.asString();
            InternalDescriptor = await internalDescriptor.asString();
            PrivateDescriptor = await externalDescriptor.asStringPrivate();

            break;
        }
        case 'shp2wpkh': {
            const externalDescriptor =
                await new BDK.Descriptor().newBip49Public(
                    descriptorPublicKey,
                    fingerprint,
                    KeychainKind.External,
                    network as Network,
                );
            const internalDescriptor =
                await new BDK.Descriptor().newBip49Public(
                    descriptorPublicKey,
                    fingerprint,
                    KeychainKind.Internal,
                    network as Network,
                );

            ExternalDescriptor = await externalDescriptor.asString();
            InternalDescriptor = await internalDescriptor.asString();
            PrivateDescriptor = await externalDescriptor.asStringPrivate();

            break;
        }
        case 'p2pkh': {
            const externalDescriptor =
                await new BDK.Descriptor().newBip44Public(
                    descriptorPublicKey,
                    fingerprint,
                    KeychainKind.External,
                    network as Network,
                );
            const internalDescriptor =
                await new BDK.Descriptor().newBip44Public(
                    descriptorPublicKey,
                    fingerprint,
                    KeychainKind.Internal,
                    network as Network,
                );

            ExternalDescriptor = await externalDescriptor.asString();
            InternalDescriptor = await internalDescriptor.asString();
            PrivateDescriptor = await externalDescriptor.asStringPrivate();

            break;
        }
    }

    return {
        InternalDescriptor,
        ExternalDescriptor,
        PrivateDescriptor,
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

// create a BDK wallet from a descriptor and metas
export const createBDKWallet = async (wallet: TWalletType) => {
    // Set Network
    const network =
        wallet.network === 'bitcoin' ? Network.Bitcoin : Network.Testnet;

    // Create descriptors
    let ExternalDescriptor!: BDK.Descriptor;
    let InternalDescriptor!: BDK.Descriptor;

    ({InternalDescriptor, ExternalDescriptor} = await descriptorsFromString(
        wallet,
    ));

    const bdkWallet = await new BDK.Wallet().create(
        ExternalDescriptor,
        InternalDescriptor,
        network,
        await new BDK.DatabaseConfig().memory(),
    );

    return bdkWallet;
};

// Sync newly created wallet with electrum server
export const syncWallet = async (
    wallet: BDK.Wallet,
    callback: any,
    network: TNetwork,
    electrumServer: ElectrumServerURLs,
): Promise<BDK.Wallet> => {
    // Electrum configuration
    const config: BlockchainElectrumConfig = {
        url:
            network === 'bitcoin'
                ? electrumServer.bitcoin
                : electrumServer.testnet,
        retry: 5,
        timeout: 5,
        stopGap: 100,
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

    const syncStatus = await wallet.sync(chain);

    // report any sync errors
    callback(syncStatus);

    return wallet;
};

// Fetch Wallet Balance using wallet descriptor, metas, and electrum server
export const getWalletBalance = async (
    wallet: BDK.Wallet,
    oldBalance: BalanceType,
    cachedTransactions: TransactionType[],
    cachedUTXOs: UTXOType[],
): Promise<SyncData> => {
    // Get wallet balance
    const retrievedBalance: Balance = await wallet.getBalance();

    // Update wallet balance
    // Leave untouched if error fetching balance
    let balance = new BigNumber(retrievedBalance.total);

    let updated = false;

    // Update balance amount (in sats)
    // only update if unconfirmed received or sent balance
    if (
        (retrievedBalance.untrustedPending !== 0 &&
            retrievedBalance.trustedPending !== 0) ||
        !balance.eq(oldBalance)
    ) {
        // Receive balance in sats as string
        // convert to BigNumber
        updated = true;
    }

    // Only fetch transactions when balance has been updated
    let TXs = cachedTransactions;
    let UTXOs: UTXOType[] = cachedUTXOs;
    let walletTXs = TXs;

    if (updated) {
        // Update transactions list
        TXs = (await wallet.listTransactions(false)) as (TransactionType &
            TransactionDetails)[];
        UTXOs = (await wallet.listUnspent()) as UTXOType[];

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
