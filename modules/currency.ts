import BigNumber from 'bignumber.js';

import {TRateObjectResponse, TRateResponse, TRateObject} from '../types/wallet';

const sourcesAPI = {
    coingecko: {
        url: 'https://api.coingecko.com/api/v3/simple/price',
    },
};

export const sourceNames = {
    CoinGecko: 'coingecko',
};

const supported_tickers = [
    'usd',
    'aed',
    'ars',
    'aud',
    'bdt',
    'bhd',
    'brl',
    'cad',
    'chf',
    'clp',
    'czk',
    'cny',
    'dkk',
    'eur',
    'gbp',
    'hkd',
    'huf',
    'idr',
    'ils',
    'inr',
    'jpy',
    'krw',
    'kwd',
    'lkr',
    'mmk',
    'mxn',
    'myr',
    'ngn',
    'nok',
    'nzd',
    'php',
    'pkr',
    'pln',
    'rub',
    'sar',
    'sek',
    'sgd',
    'thb',
    'try',
    'twd',
    'uah',
    'vef',
    'vnd',
    'zar',
];

const APIFetcher = {
    // Default source is coingecko given currency ticker support
    coingecko: async (ticker: string): Promise<TRateObjectResponse> => {
        const {url} = sourcesAPI.coingecko;
        const supported = supported_tickers.join(',');

        let returnedJSON;

        try {
            const response = await fetch(
                `${url}?ids=bitcoin&vs_currencies=${supported}&include_24hr_change=true&include_last_updated_at=true`,
                {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            // Grab the raw response here instead, check and parse JSON later
            const rawResponse = await response.text();

            // Check that it is not an error response
            if (
                rawResponse.startsWith('{ error') ||
                rawResponse.includes('Sorry, not able to access it right now.')
            ) {
                throw new Error(
                    `Error fetching rate for ${ticker.toUpperCase()} from CoinGecko: ${
                        rawResponse.split(':')[1].split('}')[0]
                    }`,
                );
            }

            returnedJSON = JSON.parse(rawResponse);
        } catch (error: any) {
            throw new Error(
                `Error fetching rate for ${ticker.toUpperCase()} from CoinGecko: ${
                    error.message
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
        } catch (error: any) {
            const detailed_error =
                returnedJSON?.status.error_message.split('.')[0];
            const msg = detailed_error ? detailed_error : error.message;

            throw new Error(
                `Error parsing rate for ${ticker} from CoinGecko: ${msg}`,
            );
        }
    },
};

export const fetchFiatRate = async (
    ticker: string,
    fiatRate: TRateObject,
): Promise<TRateResponse> => {
    const {lastUpdated} = fiatRate;

    // Same as Date.getTime()
    const currentTimestamp = +new Date();

    // Debounce
    if (currentTimestamp - lastUpdated <= 5 * 1000) {
        return {
            rate: null,
            success: false, // Return false to indicate no update
            error: 'Fiat rate not updated, last updated less than 5 seconds ago',
        };
    }

    if (currentTimestamp - lastUpdated <= 30 * 60 * 1000) {
        // Avoid updating too frequently
        return {
            rate: null,
            success: false, // Return false to indicate no update
            error: 'Fiat rate not updated, last updated less than 30 minutes ago',
        };
    }

    try {
        // Grab data from remote source, i.e., CoinGecko
        const rateObj = await APIFetcher.coingecko(ticker.toLowerCase());

        // Return 'success' true to indicate success
        // i.e. rate fetched
        return {rate: rateObj, success: true, error: ''};
    } catch (error: any) {
        return {error: error.message, success: false, rate: null};
    }
};
