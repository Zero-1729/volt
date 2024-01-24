import 'i18next';

import {resources, defaultNS} from '../i18n';

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: typeof defaultNS;
        resources: (typeof resources)['en'];
        returnNull: false;
    }
}
