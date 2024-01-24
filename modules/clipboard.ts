import {Platform} from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';

import {sleep} from './utils';

const LNSpecs = {
    lnbc: 'BOLT11',
    lnurl: 'LNURL',
    lightning: 'BOLT11',
};

type ClipboardResult = {
    content: string;
    error: string;
    invoiceType: string;
    hasContents: boolean;
    spec?: string;
};

// TODO: allow handling QR codes in clipboard
// TODO: detect and return error if malformed invoice (invoiceType = 'invalid')
export const checkClipboardContents = async (): Promise<ClipboardResult> => {
    // Delay for android to see clipboard contents
    if (Platform.OS === 'android') {
        sleep(100);
    }

    // for LN invoices, we need to know the spec kind
    let spec_kind = '';

    const clipboardContents = await Clipboard.getString();
    let invoiceType = 'unsupported';

    if (clipboardContents.length === 0) {
        return {
            content: '',
            error: 'clipboard_empty_error',
            invoiceType: invoiceType,
            hasContents: false,
            spec: spec_kind,
        };
    }

    if (clipboardContents.startsWith('bitcoin:')) {
        invoiceType = 'bitcoin';
    }

    if (
        clipboardContents.startsWith('lightning:') ||
        clipboardContents.toLowerCase().startsWith('lnbc') ||
        clipboardContents.toLowerCase().startsWith('lnurl')
    ) {
        invoiceType = 'lightning';
        spec_kind = LNSpecs.lightning;

        if (clipboardContents.toLowerCase().startsWith('lnbc')) {
            spec_kind = LNSpecs.lnbc;
        }

        if (clipboardContents.toLowerCase().startsWith('lnurl')) {
            spec_kind = LNSpecs.lnurl;
        }
    }

    return {
        content: clipboardContents,
        error: '',
        invoiceType: invoiceType,
        hasContents: true,
        spec: spec_kind,
    };
};
