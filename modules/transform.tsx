import BigNumber from 'bignumber.js';

import DayJS from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import localizedFormat from 'dayjs/plugin/localizedFormat';
DayJS.extend(calendar);
DayJS.extend(localizedFormat);

// Include supported locales
import 'dayjs/locale/ar'; // Arabic
import 'dayjs/locale/en'; // English

export const SATS_TO_BTC_RATE = 100_000_000;
const SEPARATOR = ' ';

export const capitalizeFirst = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1);
};

export const convertBTCtoSats = (btc: string) => {
    const btcAmount = new BigNumber(btc);

    return btcAmount.multipliedBy(100000000).toString();
};

export const addCommas = (num: string, separator: string = ',') => {
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
};

export const _getBTCfromSats = (sats: BigNumber) => {
    return sats.toNumber() / SATS_TO_BTC_RATE;
};

export const formatSats = (sats: BigNumber) => {
    // REM: Based on: https://bitcoin.design/guide/designing-products/units-and-symbols/
    if (sats.lt(0.1) && !sats.eq(0)) {
        // Limit display to eight decimals
        // Anything lower is assumed to be an approximation
        // ... to zero
        if (sats.lt(0.00_000_001)) {
            return `≈ ${sats.toFixed(2)}`;
        }

        // Display in range of eight decimals (sats)
        return addCommas(sats.toFixed(8), SEPARATOR);
    }

    // If billions range of sats
    // We display with units
    if (sats.gt(SATS_TO_BTC_RATE)) {
        return formatWithUnits(sats.toNumber());
    }

    // Strip trailing zeros
    return addCommas(sats.toFixed(0), SEPARATOR);
};

export const formatBTC = (sats: BigNumber) => {
    // REM: Based on: https://bitcoin.design/guide/designing-products/units-and-symbols/
    const BTC = _getBTCfromSats(sats);

    // If below whole BTC, let's attempt to display that
    // in range of 11 decimals (msats)
    // However, if balance sub-msats,
    // indicate approximation with '≈ 0.00'
    if (BTC < 0.1 && BTC !== 0) {
        if (BTC < 0.00_000_000_001) {
            return `≈ ${BTC.toFixed(2)}`;
        }

        // Limit it to 1 sat - 1 milisats (11 decimals)
        return addCommas(BTC.toFixed(8), SEPARATOR);
    }

    return addCommas(BTC.toFixed(2), SEPARATOR);
};

const formatWithUnits = (value: number) => {
    const RATE = 1000;
    // Screen can handle units for thousand and million
    // so we only snip to 'xxx.xx' when value is in Billion, Trillion, etc.
    const UNITS = ['', 'k', 'M', 'B', 'T', 'Q'];
    const DECIMAL = 2;
    const EXP = Math.floor(Math.log(value) / Math.log(RATE));
    const Limit = 100_000_000; // The displayable value limit (i.e. < 100M)

    if (value > Limit) {
        // Avoid Zero Division
        const p = value !== 0 ? value / Math.pow(RATE, EXP) : 0;
        const val = parseFloat(p.toString()).toFixed(DECIMAL);
        const unit = UNITS[EXP] || UNITS[1];

        // Return formatted value with units
        return `${val} ${unit}`;
    }

    // Return value as is, if below a 100M
    return value.toFixed(2);
};

export const formatFiat = (fiat: BigNumber) => {
    // If below a cent, let's attempt to display that
    // 'Bullishly' speaking, Bitcoin will 'always' be worth more than a cent
    if (fiat.lt(0.01) && !fiat.eq(0)) {
        // We just let them know it's less than a cent
        // So approximately a zero (insignificant)
        return `≈ ${fiat.toFixed(2)}`;
    }

    // Amount in range of 100,000,000.00
    // (i.e. 14 digit characters)
    return addCommas(fiat.toFixed(2));
};

export const normalizeFiat = (sats: BigNumber, rate: BigNumber) => {
    // Get BTC to fiat value first
    const fiat = sats.eq(0)
        ? new BigNumber(0)
        : rate.multipliedBy(_getBTCfromSats(sats));

    return formatFiat(fiat);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getLocaleDecimalSeparator = (locale: string) => {
    // Returns the group separator for a given language locale, e.g. ',' for en-US
    return (1.1).toLocaleString(locale).substring(1, 2);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getLocaleGroupingSeparator = (locale: string) => {
    // Returns the decimal separator for a given language locale, e.g. '.' for en-US
    return (1000).toLocaleString(locale).substring(1, 2);
};

export const formatLocaleDate = (locale: string, date: number) => {
    const d = +date * 1000;
    const isToday = DayJS(date).isSame(DayJS(), 'day');
    const isEnglish = locale === 'en';

    return isToday
        ? isEnglish
            ? DayJS(date).calendar()
            : DayJS(date).locale(locale).format('L LT')
        : DayJS(d).locale(locale).format('LLL');
};

// Format a string of Mnemonic phrases into
// a numbered string of phrases
export const displayNumberedSeed = (seed: string) => {
    const words = seed.split(' ');

    // Return an array of numbered Mnemonic phrases
    return words.map((word, i) => `${i + 1}. ${word}`);
};

// Return language translated number
export const i18nNumber = (num: number, locale: string) => {
    return num.toLocaleString(locale);
};

export const calculateFiatEquivalent = (
    value: string,
    rate: BigNumber,
): BigNumber => {
    if (value.length > 0) {
        const satoshis = new BigNumber(value);

        return new BigNumber(
            satoshis.multipliedBy(0.00000001).multipliedBy(rate).toFixed(2),
        );
    }

    return new BigNumber(0);
};
