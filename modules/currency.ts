import BigNumber from 'bignumber.js';

import {TRateObject} from '../types/wallet';

const sourcesAPI = {
    coingecko: {
        url: 'https://api.coingecko.com/api/v3/simple/price',
    },
};

export const sourceNames = {
    CoinGecko: 'coingecko',
};

const APIFetcher = {
    // Default source is coingecko given currency ticker support
    coingecko: async (ticker: string): Promise<TRateObject> => {
        const {url} = sourcesAPI.coingecko;

        let returnedJSON;

        try {
            const response = await fetch(
                `${url}?ids=bitcoin&vs_currencies=${ticker}&include_24hr_change=true&include_last_updated_at=true`,
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
                `Error fetching rate for ${ticker.toUpperCase()} from CoinGecko: ${
                    e.message
                }`,
            );
        }

        try {
            const rate = new BigNumber(returnedJSON?.bitcoin[ticker]);
            const dailyChange = new BigNumber(
                returnedJSON?.bitcoin[`${ticker}_24h_change`],
            );
            const lastUpdated = returnedJSON?.bitcoin.last_updated_at;

            return {
                rate: rate,
                dailyChange: dailyChange,
                lastUpdated: lastUpdated,
            };
        } catch (e: any) {
            const detailed_error =
                returnedJSON?.status.error_message.split('.')[0];
            const msg = detailed_error ? detailed_error : e.message;

            throw new Error(
                `Error parsing rate for ${ticker} from CoinGecko: ${msg}`,
            );
        }
    },
};

// Make single fire call to CoinGecko
const fetchPrice = async (ticker: string): Promise<TRateObject> => {
    const response = await APIFetcher.coingecko(ticker.toLowerCase());

    // return fetched rate
    return response;
};

export const fetchFiatRate = async (
    ticker: string,
    fiatRate: TRateObject,
    onSuccess: (rateObj: TRateObject) => void,
    violate = false,
) => {
    const {lastUpdated} = fiatRate;

    // Same as Date.getTime()
    const currentTimestamp = +new Date();

    if (currentTimestamp - lastUpdated <= 5 * 1000) {
        // Debounce
        console.info(
            '[FiatRate] Not updating fiat rate, last updated less than 5 seconds ago',
        );

        // Return false to indicate no update
        return false;
    }

    if (currentTimestamp - lastUpdated <= 30 * 60 * 1000 && !violate) {
        // Avoid updating too frequently
        console.info(
            '[FiatRate] Not updating fiat rate, last updated less than 30 minutes ago',
        );

        // Return false to indicate no update
        return false;
    }

    try {
        // Grab data from remote source, i.e., CoinGecko
        const rateObj = await fetchPrice(ticker);

        // Trigger callback from RN component to update storage context
        await onSuccess(rateObj);

        // Return true to indicate success
        // i.e. rate fetched
        return true;
    } catch (e) {
        throw e;
    }
};
