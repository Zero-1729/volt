import {BaseWallet} from '../base';
import {
    getAddressPath,
    generateAddressFromPath,
} from '../../../modules/wallet-utils';

import {TransactionType, addressType} from './../../../types/wallet';

export class SegWitP2SHWallet extends BaseWallet {
    generateNewAddress(): addressType {
        try {
            const addressPath = getAddressPath(
                this.index,
                false,
                this.network,
                this.type,
            );

            const address = generateAddressFromPath(
                addressPath,
                this.network,
                this.type,
                this.secret,
            );

            // Bump address index
            this.index++;

            return {
                address: address,
                path: this.derivationPath,
                change: false,
                index: this.index,
                memo: '',
            };
        } catch (e) {
            throw e;
        }
    }

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
