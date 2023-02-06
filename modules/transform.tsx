export const addCommas = (num: string, separator: string = ',') => {
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
};

export const _getBTCfromSats = (sats: number) => {
    return sats / 100_000_000;
};

export const normalizeSats = (sats: number) => {};

export const normalizeBTC = (sats: number) => {
    // TODO: adopt spec described here: https://bitcoin.design/guide/designing-products/units-and-symbols/
    const BTC = _getBTCfromSats(sats);

    if (BTC < 0.000_000_01) {
        return BTC.toFixed(8).toString();
    }

    return BTC.toString();
};

export const fromSatsToFiat = (sats: number, rate: number) => {
    // TODO: fixup
    const BTC = sats / 100_000_000;

    return BTC * rate;
};

export const normalizeFiat = (sats: number, rate: number) => {
    // Get BTC to fiat value first
    // Then get fiat equivalent formatted accordingly
    const fiat = fromSatsToFiat(sats, rate);

    if (fiat < 0.01) {
        return addCommas(fiat.toFixed(8));
    }

    return addCommas(fiat.toFixed(2));
};
