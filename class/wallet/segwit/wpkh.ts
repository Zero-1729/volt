import {BaseWallet} from '../base';

import {TTransaction} from '../../../types/wallet';

export class SegWitNativeWallet extends BaseWallet {
    buildTx() {
        throw new Error('Not implemented');
    }

    updatedTransaction() {
        throw new Error('Not implemented');
    }

    updateTransanctions(transactions: TTransaction[]) {
        this.transactions = transactions;
    }
}
