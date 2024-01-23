import i18next, {FormatFunction} from 'i18next';
import * as RNL from 'react-native-localize';
import {initReactI18next} from 'react-i18next';

import resources from './locales';

import DayJS from 'dayjs';

// Include supported locales
import 'dayjs/locale/af'; // Afrikaans
import 'dayjs/locale/ar'; // Arabic
import 'dayjs/locale/en'; // English
import 'dayjs/locale/es'; // Spanish
import 'dayjs/locale/es-us'; // Spanish (Latin America)
import 'dayjs/locale/fr'; // French
import 'dayjs/locale/sw'; // Swahili

import calendar from 'dayjs/plugin/calendar';
DayJS.extend(calendar);

// Default to common namespace
export const defaultNS = 'common';

const getAppLanguage = (): string => {
    return RNL.findBestLanguageTag(Object.keys(resources))?.languageTag ?? 'en';
};

// Interpolation function for date and number formatting
const interpolFormat: FormatFunction = (value: any, format: any, lng: any) => {
    if (format === 'last_updated') {
        if (lng === 'en') {
            return DayJS(value).calendar();
        } else {
            return DayJS(value).locale(lng).format('llll');
        }
    }

    return value;
};

// Main instance of i18next
// with ICU enabled plurals
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
