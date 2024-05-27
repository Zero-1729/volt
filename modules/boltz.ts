import {TBoltzSwapInfo} from '../types/wallet';

const boltzExchangeLimitsFetch = async (): Promise<TBoltzSwapInfo> => {
    let returnedJSON;

    try {
        const response = await fetch(
            'https://api.boltz.exchange/v2/swap/reverse',
            {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            },
        );

        returnedJSON = await response.json();
    } catch (e: any) {
        throw new Error(
            `Error fetching limits from Boltz Exchange: ${e.message}`,
        );
    }

    try {
        const max = Number(returnedJSON?.BTC.BTC.limits.maximal);
        const min = Number(returnedJSON?.BTC.BTC.limits.minimal);

        return {
            minLimit: max,
            maxLimit: min,
        };
    } catch (e: any) {
        const detailed_error = returnedJSON?.status.error_message.split('.')[0];
        const msg = detailed_error ? detailed_error : e.message;

        throw new Error(`Error parsing limits from Boltz Exchange: ${msg}`);
    }
};

export const fetchBoltzSwapInfo = async (
    onSuccess: (rateObj: TBoltzSwapInfo) => void,
) => {
    try {
        // Grab data from Boltz API
        const returnedObj = await boltzExchangeLimitsFetch();

        // Trigger callback from RN component to update storage context
        onSuccess(returnedObj);

        // Return true to indicate success
        // i.e. limits fetched
        return true;
    } catch (e) {
        throw e;
    }
};
