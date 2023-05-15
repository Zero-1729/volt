import BigNumber from "bignumber.js"

import {BalanceType} from "../types/wallet"

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

export const fetchFiatRate = async (ticker: string, cb: (rate: BalanceType) => void) => {
    // TODO: add check to ensure we aren't hitting API call rate limit
    try {
        // Grab data from remote source, i.e., CoinGecko
        const rate = await fetchPrice(ticker);

        // Trigger callback from RN component to update storage context
        cb(rate);
    } catch (e) {
        throw new Error(`Error fetching fiat rate: ${e}`);
    }
};