import {Wallet} from 'bdk-rn';
import {getTxData} from './mempool';
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

    const addressLock = !updated;

    let tempReceiveAddress = wallet.address;
    let addressIndexCount = wallet.index;

    // Only attempt wallet address update if wallet balance is updated
    // TODO: avoid mempool for now and scrap this from BDK raw tx info (Script)
    if (updated) {
        // iterate over all the transactions and include the missing optional fields for the TTransaction
        for (let i = 0; i < transactions.length; i++) {
            const tmp: TTransaction = {
                ...transactions[i],
                address: '',
            };

            const TxData = await getTxData(
                transactions[i].txid,
                transactions[i].network,
            );

            // Transaction inputs (remote owned addresses)
            for (let j = 0; j < TxData.vin.length; j++) {
                // Add address we own based on whether we sent
                // the transaction and the value received matches
                if (
                    transactions[i].value === TxData.vin[j].prevout.value &&
                    transactions[i].type === 'outbound'
                ) {
                    tmp.address = TxData.vin[j].prevout.scriptpubkey_address;
                }

                // Check if receive address is used
                // Then push tx index
                if (
                    TxData.vin[j].prevout.scriptpubkey_address ===
                    wallet.address.address
                ) {
                    wallet.generateNewAddress();
                }
            }

            // Transaction outputs (local owned addresses)
            for (let k = 0; k < TxData.vout.length; k++) {
                // Add address we own based on whether we received
                // the transaction and the value received matches
                if (
                    transactions[i].value === TxData.vout[k].value &&
                    transactions[i].type === 'inbound'
                ) {
                    tmp.address = TxData.vout[k].scriptpubkey_address;

                    // Update temp address
                    if (
                        !addressLock &&
                        wallet.address.address ===
                            TxData.vout[k].scriptpubkey_address
                    ) {
                        tempReceiveAddress =
                            wallet.generateNewAddress(addressIndexCount);
                        addressIndexCount++;
                    }
                }
            }

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
