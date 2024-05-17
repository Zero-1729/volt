// Fix issue with React Native and Buffer
if (typeof Buffer === 'undefined') {
    global.Buffer = require('buffer').Buffer;
}

// Polyfill TextEncoder/TextDecoder including TextEncoder().encodeInto
// https://github.com/anonyco/FastestSmallestTextEncoderDecoder
require('fastestsmallesttextencoderdecoder-encodeinto');

import {NumberFormat} from '@formatjs/intl-numberformat';

// React Native doesn't support full spec of Intl API yet.
if (!Intl.Locale) {
    require('@formatjs/intl-locale/polyfill');
}

if (!NumberFormat.formatToParts) {
    require('@formatjs/intl-numberformat/polyfill');
    require('@formatjs/intl-numberformat/locale-data/en');
    require('@formatjs/intl-numberformat/locale-data/ar');
}

if (!Intl.PluralRules) {
    require('@formatjs/intl-pluralrules/polyfill');
    require('@formatjs/intl-pluralrules/locale-data/en');
    require('@formatjs/intl-pluralrules/locale-data/ar');
}

if (!Intl.RelativeTimeFormat) {
    require('@formatjs/intl-relativetimeformat/polyfill');
    require('@formatjs/intl-relativetimeformat/locale-data/en');
    require('@formatjs/intl-relativetimeformat/locale-data/ar');
}
