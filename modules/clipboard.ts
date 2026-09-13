import {Platform} from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';

import {sleep} from './utils';
import {decodeInvoiceType} from './wallet-utils';

type ClipboardResult = {
    content: string;
    error: string;
    invoiceType: string;
    hasContents: boolean;
    spec?: string;
};

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

    const decodedInvoiceType = await decodeInvoiceType(clipboardContents);

    return {
        content: clipboardContents,
        error: '',
        invoiceType: decodedInvoiceType.type,
        hasContents: true,
        spec: decodedInvoiceType.spec,
    };
};
