import {Wallet} from 'bdk-rn';
import {
    TElectrumServerURLs,
    TNetwork,
    TWalletType,
    TTransaction,
} from '../types/wallet';
import {createBDKWallet, syncBdkWallet, getBdkWalletTransactions} from './bdk';

export const initWallet = async (wallet: TWalletType) => {
    // Create wallet
    return await createBDKWallet(wallet);
};

export const syncBDKWallet = async (
    wallet: Wallet,
    network: TNetwork,
    electrumServerURL: TElectrumServerURLs,
) => {
    // Sync wallet
    return await syncBdkWallet(wallet, () => {}, network, electrumServerURL);
};

export const fetchOnchainTransactions = async (
    w: Wallet,
    wallet: TWalletType,
    updated: boolean,
    electrumServerURL: TElectrumServerURLs,
) => {
    const {transactions, UTXOs} = await getBdkWalletTransactions(
        w,
        wallet.network === 'testnet'
            ? electrumServerURL.testnet
            : electrumServerURL.bitcoin,
    );

    // Store newly formatted transactions from mempool.space data
    const newTxs = updated ? [] : transactions;

    let tempReceiveAddress = wallet.address;

    if (updated) {
        // iterate over all the transactions and include the missing optional fields for the TTransaction
        for (let i = 0; i < transactions.length; i++) {
            const tmp: TTransaction = {
                ...transactions[i],
                address: '',
            };

            // Update new transactions list
            newTxs.push({...tmp});
        }

        return {
            txs: newTxs,
            address: tempReceiveAddress,
            utxo: UTXOs,
        };
    } else {
        return {
            txs: transactions,
            address: wallet.address,
            utxo: UTXOs,
        };
    }
};
