import {BaseWallet} from './base';

import {TransactionType} from './../../types/wallet';

export class LegacyWallet extends BaseWallet {
    buildTx(args: any) {
        throw new Error('Not implemented');
    }

    updatedTransaction(tx: TransactionType) {
        throw new Error('Not implemented');
    }

    updateTransanctions(transactions: TransactionType[]) {
        this.transactions = transactions;
    }
}
