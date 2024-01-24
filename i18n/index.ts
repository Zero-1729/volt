import i18next, {FormatFunction} from 'i18next';
import * as RNL from 'react-native-localize';
import {initReactI18next} from 'react-i18next';

import resources from './locales';

import {formatLocaleDate} from '../modules/transform';

// Default to common namespace
export const defaultNS = 'common';

const getAppLanguage = (): string => {
    return RNL.findBestLanguageTag(Object.keys(resources))?.languageTag ?? 'en';
};

// Interpolation function for date and number formatting
const interpolFormat: FormatFunction = (value: any, format: any, lng: any) => {
    // Format dates
    if (format === 'last_updated') {
        return formatLocaleDate(lng, value);
    }

    // Format numbers
    if (format === 'number') {
        return new Intl.NumberFormat(lng).format(value);
    }

    return value;
};

// Main instance of i18next
const i18n = i18next.createInstance();
i18n.use(initReactI18next).init({
    lng: getAppLanguage(),
    fallbackLng: 'en',
    resources,
    defaultNS,
    fallbackNS: defaultNS,
    debug: false,
    cache: {enabled: true},
    interpolation: {
        format: interpolFormat,
        escapeValue: false,
    },
    returnNull: false,
});

export default i18n;
