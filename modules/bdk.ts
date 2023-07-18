import BigNumber from 'bignumber.js';

import BdkRn from 'bdk-rn';

import {BaseWallet} from '../class/wallet/base';

import {TransactionType} from '../types/wallet';

import {liberalAlert} from '../components/alert';

type SyncData = {
    balance: BigNumber;
    transactions: TransactionType[];
};

// Formats transaction data from BDK to format for wallet
export const formatTXFromBDK = (tx: any): TransactionType => {
    const formattedTx = {
        txid: tx.txid,
        confirmed: tx.confirmed,
        block_height: tx.block_height,
        timestamp: tx.block_timestamp,
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

    // Create wallet from current wallet data
    const createResponse = await BdkRn.createWallet({
        mnemonic: wallet.secret ? wallet.secret : '',
        descriptor:
            wallet.descriptor && wallet.secret === '' ? wallet.descriptor : '',
        password: '',
        network: wallet.network,
    });

    // Report error from wallet creation function
    if (createResponse.error) {
        liberalAlert('Error', createResponse.data, 'OK');
    }

    // Sync wallet
    const syncResponse = await BdkRn.syncWallet();

    // report any sync errors
    if (syncResponse.error) {
        liberalAlert('Error', syncResponse.data, 'OK');
        return {
            balance: wallet.balance,
            transactions: wallet.transactions,
        };
    }

    // Attempt call to get wallet balance
    const balanceResponse = await BdkRn.getBalance();

    if (balanceResponse.error) {
        // Report any errors in fetch attempt
        liberalAlert('Error', balanceResponse.data, 'OK');
        return {
            balance: wallet.balance,
            transactions: wallet.transactions,
        };
    }

    // Update wallet balance
    // Leave untouched if error fetching balance
    let balance: BigNum = wallet.balance;

    // Update balance amount (in sats)
    // only update if balance different from stored version
    if (balanceResponse.data !== wallet.balance) {
        // Receive balance in sats as string
        // convert to BigNumber
        balance = new BigNum(balanceResponse.data);
    }

    // Update transactions list
    const transactionResponse = await BdkRn.getTransactions();

    if (transactionResponse.error) {
        liberalAlert(
            'Error',
            `Could not fetch transactions ${transactionResponse.error}`,
            'OK',
        );
        return {
            balance: balance,
            transactions: wallet.transactions,
        };
    }

    // Receive transactions from BDK
    const {confirmed, pending} = transactionResponse.data;
    const tmp: TransactionType[] = [];

    // Update transactions list
    confirmed.forEach((transaction: any) => {
        tmp.push(
            formatTXFromBDK({
                confirmed: true,
                network: wallet.network,
                ...transaction,
            }),
        );
    });

    pending.forEach((transaction: any) => {
        tmp.push(
            formatTXFromBDK({
                confirmed: false,
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
    };
};
