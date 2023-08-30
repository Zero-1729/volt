import mempoolJS from '@mempool/mempool.js';

export const getTxData = async (txid: string, network: string) => {
    try {
        const {
            bitcoin: {transactions},
        } = mempoolJS({
            hostname: 'mempool.space',
            network: network,
        });

        // Get transaction data
        const tx = await transactions.getTx({txid});

        // Return transaction data
        return tx;
    } catch (e) {
        throw e;
    }
};

export const getAddressInfo = async (address: string, network: string) => {
    try {
        const {
            bitcoin: {addresses},
        } = mempoolJS({
            hostname: 'mempool.space',
            network: network,
        });

        // Get address data
        const data = await addresses.getAddress({address});

        // Return address data
        return data;
    } catch (e) {
        throw e;
    }
};

export const getFeeRates = async (network: string) => {
    try {
        const {
            bitcoin: {fees},
        } = mempoolJS({
            hostname: 'mempool.space',
            network: network,
        });

        const feesRecommended = await fees.getFeesRecommended();

        return feesRecommended;
    } catch (e) {
        throw e;
    }
};
