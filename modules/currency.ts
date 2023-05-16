import BigNumber from "bignumber.js"

import {BalanceType, FiatRate} from "../types/wallet"

const sourcesAPI = {
    coingecko: {
        url: 'https://api.coingecko.com/api/v3/simple/price',
    }
}

export const sourceNames = {
    CoinGecko: 'coingecko',
}

const APIFetcher = {
    // Default source is coingecko given currency ticker support
    coingecko: async (ticker: string): Promise<BalanceType> => {
        const {url} = sourcesAPI.coingecko

        let returnedJSON;

        try {
            const response = await fetch(`${url}?ids=bitcoin&vs_currencies=${ticker}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            })

            returnedJSON = await response.json()
        } catch (e) {
            throw new Error(`Error fetching rate for ${ticker} from CoinGecko: ${e}`)
        }

        try {
            const rate = returnedJSON?.bitcoin[ticker]

            return new BigNumber(rate);
        } catch (e) {
            throw new Error(`Error parsing rate for ${ticker} from CoinGecko: ${e}`)
        }
    },
}

// Make single fire call to CoinGecko
const fetchPrice = async (ticker: string): Promise<BalanceType> => {
    const response = await APIFetcher.coingecko(ticker.toLowerCase());

    return response;
}

export const fetchFiatRate = async (ticker: string, fiatRate: FiatRate, cb: (rate: BalanceType) => void) => {
    const {lastUpdated} = fiatRate;
    // Same as Date.getTime()
    const currentTimestamp = +new Date();

    if (currentTimestamp - lastUpdated.getTime() <= 10 * 1000) {
        // Debounce
        console.info('Not updating fiat rate, last updated less than 10 seconds ago');
        return;
    }
    
    if (currentTimestamp - lastUpdated.getTime() <= 30 * 60 * 1000) {
        // Avoid updating too frequently
        console.info('Not updating fiat rate, last updated less than 30 minutes ago');
        return;
    }

    try {
        // Grab data from remote source, i.e., CoinGecko
        const rate = await fetchPrice(ticker);

        // Trigger callback from RN component to update storage context
        cb(rate);
    } catch (e) {
        throw new Error(`Error fetching fiat rate: ${e}`);
    }
};