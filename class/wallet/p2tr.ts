import {BaseWallet} from './base';

import {TTransaction} from './../../types/wallet';

export class TaprootWallet extends BaseWallet {
    buildTx() {
        throw new Error('Not implemented');
    }

    updatedTransaction() {
        throw new Error('Not implemented');
    }

    updateTransactions(transactions: TTransaction[]) {
        this.transactions = transactions;
    }
}
