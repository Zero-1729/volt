const SATS_TO_BTC_RATE = 100_000_000;
export const addCommas = (num: string, separator: string = ',') => {
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
};

export const _getBTCfromSats = (sats: number) => {
    return sats / SATS_TO_BTC_RATE;
};

export const normalizeSats = (sats: number) => {
    // TODO: adopt spec described here: https://bitcoin.design/guide/designing-products/units-and-symbols/
};

export const normalizeBTC = (sats: number) => {
    // TODO: adopt spec described here: https://bitcoin.design/guide/designing-products/units-and-symbols/
    const BTC = _getBTCfromSats(sats);

    if (BTC < 0.000_000_01) {
        return BTC.toFixed(8).toString();
    }

    return BTC.toString();
};

const formatWithUnits = (value: number) => {
    const RATE = 1000;
    // Screen can handle units for thousand and million
    // so we only snip to 'xxx.xx' when value is in Billion, Trillion, etc.
    const UNITS = ['', 'k', 'M', 'B', 'T', 'Q'];
    const DECIMAL = 2;
    const EXP = Math.floor(Math.log(value) / Math.log(RATE));
    const Limit = 1_000_000_000; // The displayable value limit (i.e. < 1B)

    if (value > Limit) {
        // Avoid Zero Division
        const p = value !== 0 ? value / Math.pow(RATE, EXP) : 0;
        const val = parseFloat(p.toString()).toFixed(DECIMAL);
        const unit = UNITS[EXP] || UNITS[1];

        // Return formatted value with units
        return `${val} ${unit}`;
    }

    // Return value as is, if below a billion
    return value.toFixed(2);
};

export const normalizeFiat = (sats: number, rate: number) => {
    // Get BTC to fiat value first
    const fiat = _getBTCfromSats(sats) * rate;

    // If below a cent, let's attempt to display that
    // 'Bullishly' speaking, Bitcoin will 'always' be worth more than a cent
    if (fiat < 0.01) {
        // Return spaced value only in range of eight decimals (sub-cent)
        // Otherwise, assume zero (insignificant balance)
        return fiat < 0.00000001
            ? fiat.toFixed(2)
            : addCommas(fiat.toFixed(8), ' ');
    }

    // Amount in range of 100,000,000.00
    // (i.e. 14 digit characters)
    return addCommas(formatWithUnits(fiat));
};
