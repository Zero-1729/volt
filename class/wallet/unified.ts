import {BaseWallet} from './base';

import {TTransaction} from './../../types/wallet';

// Taproot and Lightning wallet
export class UnifiedLNWallet extends BaseWallet {
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
