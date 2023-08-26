import BigNumber from 'bignumber.js';

import * as BDK from 'bdk-rn';
import {
    BlockchainElectrumConfig,
    Network,
    KeychainKind,
    BlockChainNames,
    AddressIndex,
} from 'bdk-rn/lib/lib/enums';

import {LocalUtxo, TransactionDetails} from 'bdk-rn/lib/classes/Bindings';

import {
    TWalletType,
    TTransaction,
    TUtxo,
    TElectrumServerURLs,
    TNetwork,
    TBalance,
} from '../types/wallet';
import {ENet} from '../types/enums';
import {Balance} from 'bdk-rn/lib/classes/Bindings';

export const generateMnemonic = async () => {
    const mnemonic = await new BDK.Mnemonic().create();

    return mnemonic.asString();
};

type formatTXFromBDKArgs = TransactionDetails & {
    network: string;
    confirmed: boolean;
    currentBlockHeight: number;
};

// Formats transaction data from BDK to format for wallet
export const formatTXFromBDK = async (
    tx: formatTXFromBDKArgs,
): Promise<TTransaction> => {
    let value = new BigNumber(Math.abs(tx.sent - tx.received));
    value = tx.sent > 0 ? value.minus(tx.fee as number) : value;

    const txRawData = tx.transaction;
    const rawInfo = {
        weight: await txRawData?.weight(),
        vsize: await txRawData?.vsize(),
        size: await txRawData?.size(),
        version: await txRawData?.version(),
        isLockTimeEnabled: await txRawData?.isLockTimeEnabled(),
        isRbf: await txRawData?.isExplicitlyRbf(),
    };

    // Determine whether CPFP transaction
    const isCpfp = rawInfo.isRbf && value.isZero();

    const txBlockHeight = tx.confirmationTime?.height as number;
    const blockConfirms =
        txBlockHeight > 0 ? tx.currentBlockHeight - txBlockHeight : 1;

    // Calculate time stamp
    // Note: we bump the time by 1 second so it shows up in the correct order
    // for CPFPs
    // TODO: handle timing calculation for multiple sequential CPFPs
    const timestamp =
        (tx.confirmationTime?.timestamp as number) + (isCpfp ? 1 : 0);

    const formattedTx = {
        txid: tx.txid,
        confirmed: tx.confirmed,
        confirmations: blockConfirms > 0 ? blockConfirms + 1 : 0,
        block_height: tx.confirmationTime?.height as number,
        timestamp: timestamp as any,
        fee: tx.fee as number,
        value: value.toNumber(),
        received: tx.received,
        sent: tx.sent,
        type: tx.sent - tx.received > 0 ? 'outbound' : 'inbound',
        network: tx.network === 'testnet' ? ENet.Testnet : ENet.Bitcoin,
        size: rawInfo.size as number,
        vsize: rawInfo.vsize as number,
        weight: rawInfo.weight as number,
        rbf: rawInfo.isRbf as boolean,
        cpfp: isCpfp as boolean,
        memo: '',
    };

    // Returned formatted tx
    return formattedTx;
};

// Test Electrum server connection
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

// Config for chain
const _getConfig = (
    network: string,
    electrumServer: TElectrumServerURLs,
    stopGap: number,
): BlockchainElectrumConfig => {
    return {
        url:
            network === ENet.Bitcoin
                ? electrumServer.bitcoin
                : electrumServer.testnet,
        retry: 5,
        timeout: 5,
        stopGap: stopGap,
        sock5: null,
        validateDomain: false,
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
export const syncBdkWallet = async (
    wallet: BDK.Wallet,
    callback: any,
    network: TNetwork,
    electrumServer: TElectrumServerURLs,
): Promise<BDK.Wallet> => {
    // Electrum configuration
    const config: BlockchainElectrumConfig = _getConfig(
        network,
        electrumServer,
        100,
    );

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
export const getBdkWalletBalance = async (
    wallet: BDK.Wallet,
    oldBalance: TBalance,
): Promise<{
    balance: BigNumber;
    updated: boolean;
}> => {
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

    // Return updated wallet balance
    return {
        balance: balance,
        updated: updated,
    };
};

// Get transactions from BDK wallet
// Assumes 'syncWallet' has been called
export const getBdkWalletTransactions = async (
    wallet: BDK.Wallet,
    url: string,
): Promise<{
    transactions: TTransaction[];
    UTXOs: TUtxo[];
}> => {
    let network = await wallet.network();

    // Get current block height
    let currentBlockHeight!: number;

    await getBlockHeight(
        url,
        (args: {status: boolean; blockHeight: number}) => {
            currentBlockHeight = args.blockHeight;
        },
    );

    // Only fetch transactions when balance has been updated
    let bdkTxs: TransactionDetails[] = [];
    let bdkUtxos: LocalUtxo[] = [];

    let walletTXs: TTransaction[] = [];

    // Update transactions list
    bdkTxs = await wallet.listTransactions(true);
    bdkUtxos = await wallet.listUnspent();

    // Update transactions list
    for (const tx of bdkTxs) {
        let reformattedData = await formatTXFromBDK({
            confirmed: !!tx.confirmationTime?.timestamp,
            network: network,
            currentBlockHeight: currentBlockHeight,
            ...tx,
        });

        walletTXs.push(reformattedData);
    }

    // Fallback to original wallet transactions if error fetching transactions
    return {transactions: walletTXs, UTXOs: bdkUtxos as TUtxo[]};
};

// generate address from BDK wallet
export const generateAddress = async (
    wallet: BDK.Wallet,
    change: boolean,
): Promise<{address: BDK.Address; asString: string; index: number}> => {
    const address = change
        ? await wallet.getInternalAddress(AddressIndex.New)
        : await wallet.getAddress(AddressIndex.New);

    const addressString = await address.address.asString();

    return {
        address: address.address,
        asString: addressString,
        index: address.index,
    };
};

// Creates a PSBT created a given address and sats amount, and returns the singed Psbt and broadcast status
export const fullsendBDKTransaction = async (
    amount: string,
    address: string,
    feeRate: number,
    bdkWallet: BDK.Wallet,
    network: string,
    electrumServer: TElectrumServerURLs,
    opReturnData?: string,
) => {
    // Get the scripts by converting each address to a BDK address
    // and extract the scripts from the BDK address
    const addr = await new BDK.Address().create(address);

    const script = await addr.scriptPubKey();

    // chain config chain before broadcasting
    const config = _getConfig(network, electrumServer, 5);

    // Create chain to use for broadcast of signed psbt
    const chain = await new BDK.Blockchain().create(
        config,
        BlockChainNames.Electrum,
    );

    // Sync wallet before any tx creation
    const w = await syncBdkWallet(
        bdkWallet,
        () => {},
        network as TNetwork,
        electrumServer,
    );

    // Get balance here and make sure can still spend
    const balance = await w.getBalance();
    console.log('[Balance] Current wallet balance pre-tx: ', balance);
    console.log('[FeeRate] getting fee rate...');

    // Fetch recommended feerate here
    // Can skip and just use from user in UI
    // Displayed from Mempool.space 'fetch'

    console.log(`[FeeRate] setting rate of: '${feeRate}'`);

    // Create transaction builder
    let tx = await new BDK.TxBuilder().create();

    // Reformat data for OP_RETURN
    // Only allow single text with length limit
    // Char limit and strict check in UI
    try {
        // Create actual transaction
        if (opReturnData) {
            // Create a Uint8Array from utf-8 string 'opReturnData'
            let dataList = new Uint8Array(opReturnData.length);

            // Fill each array element with the data
            for (let i = 0; i < opReturnData.length; i++) {
                dataList[i] = opReturnData.charCodeAt(i);
            }

            // Convert to array
            const dataArray = Array.from(dataList);

            tx = await tx.addData(dataArray);
            console.log(
                `[OP_RETRUN] wrote: '${opReturnData}' as array: `,
                dataArray,
            );
        }

        // Add essential tx data to tx builder
        // 1. Enable RBF always by default
        // 2. Fee rate
        // 3. Recipient and amount to send them
        // Note: can use 'tx.setRecipients([{script, amount: Number(amount)}])' for multiple recipients and mounts
        tx = await tx.enableRbf();
        tx = await tx.feeRate(feeRate);
        tx = await tx.addRecipient(script, Number(amount));

        // Finish building tx
        const finalTx = await tx.finish(w);

        // Sign the Psbt
        const signedPsbt = await w.sign(finalTx.psbt);

        // Extract the newly signed BDK transaction from the Psbt
        const transaction = await signedPsbt.extractTx();

        // Retrieve final tx id to check if it exists and move to broadcast tx
        const finalTxId = await transaction.txid();

        // Always check that the transaction id exists
        if (finalTxId) {
            // Broadcast transaction
            const broadcasted = await chain.broadcast(transaction);

            return {
                broadcasted: broadcasted,
                psbt: signedPsbt,
            };
        } else {
            console.error(
                '[Transaction] failed to create and broadcast transaction',
            );

            return {
                broadcasted: false,
                psbt: signedPsbt,
            };
        }
    } catch (e: any) {
        throw new Error(e.message);
    }
};

export const SingleBDKSend = async (
    amount: string,
    address: string,
    wallet: TWalletType,
    electrumServerUrl: TElectrumServerURLs,
) => {
    const _w = await createBDKWallet(wallet);

    const hardCodedFeeRate = 5;

    return await fullsendBDKTransaction(
        amount,
        address,
        hardCodedFeeRate,
        _w,
        wallet.network,
        electrumServerUrl,
    );
};
