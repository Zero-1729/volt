// The App language Type
// We need to know the name of the language, the code and the direction of the language
export type TLanguage = {
    name: string;
    code: string;
    dir: string;
};

// The App currency Type
// We need to know the short code of the currency, the locale and the symbol of the currency
export type TCurrency = {
    short: string;
    symbol: string;
    locale: string;
};
