import i18n from 'i18next';
import ICU from 'i18next-icu';
import * as RNL from 'react-native-localize';
import {initReactI18next} from 'react-i18next';

import resources from './locales';

const getAppLanguage = (): string => {
    const {languageTag} = RNL.findBestLanguageTag(Object.keys(resources)) || {
        languageTag: 'en',
    };

    return languageTag;
};

// Main instance of i18next
// with ICU enabled plurals
const i18nICU = i18n.createInstance();
i18nICU
    .use(new ICU())
    .use(initReactI18next)
    .init({
        lng: getAppLanguage(),
        fallbackLng: 'en',
        resources,
        defaultNS: 'common',
        debug: false,
        cache: {enabled: true},
        interpolation: {
            escapeValue: false,
        },
        returnNull: false,
    });

export default i18nICU;

// i18Next instance for date and time formatting
// with ICU enabled plurals
export const i18nDateTimeICU = i18n.createInstance();
i18nDateTimeICU.init({
    lng: getAppLanguage(),
    fallbackLng: 'en',
    resources: {
        en: {
            intl: {
                dateTime: '{{v, datetime}}',
                relativeTime: '{{v, relativeTime}}',
            },
        },
    },
    defaultNS: 'intl',
    fallbackNS: 'intl',
    debug: false,
    cache: {enabled: true},
    interpolation: {
        escapeValue: false,
    },
    returnNull: false,
});
