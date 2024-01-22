import i18n from 'i18next';
import ICU from 'i18next-icu';
import * as RNL from 'react-native-localize';
import {initReactI18next} from 'react-i18next';

import resources from './locales';

// Default to common namespace
export const defaultNS = 'common';

const getAppLanguage = (): string => {
    const {languageTag} = RNL.findBestLanguageTag(Object.keys(resources)) || {
        languageTag: 'en',
    };

    return languageTag;
};

// Main instance of i18next
// with ICU enabled plurals
export const initI18n = async (language: string) => {
    const i18nICU = i18n.createInstance();

    return i18nICU
        .use(initReactI18next)
        .use(new ICU())
        .init({
            lng: language,
            fallbackLng: getAppLanguage(),
            resources,
            defaultNS,
            fallbackNS: defaultNS,
            debug: false,
            cache: {enabled: true},
            interpolation: {
                escapeValue: false,
            },
            returnNull: false,
        })
        .then(() => {
            let timeZone = RNL.getTimeZone();

            // if polyfill is used, we need to set default timezone
            // https://formatjs.io/docs/polyfills/intl-datetimeformat/#default-timezone
            if ('__setDefaultTimeZone' in Intl.DateTimeFormat) {
                // formatjs doesn't know GMT, that is used by default in github actions
                if (timeZone === 'GMT') {
                    timeZone = 'Etc/GMT';
                }

                try {
                    // @ts-ignore __setDefaultTimeZone doesn't exist in native API
                    Intl.DateTimeFormat.__setDefaultTimeZone(timeZone);
                } catch (e) {
                    console.log(
                        `error settings timezone to: ${timeZone} fallback to UTC`,
                    );
                    // @ts-ignore __setDefaultTimeZone doesn't exist in native API
                    Intl.DateTimeFormat.__setDefaultTimeZone('UTC');
                    timeZone = 'UTC';
                }
            }
        });
};

export default i18n;

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
