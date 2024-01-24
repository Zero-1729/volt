import {Platform} from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';

import {sleep} from './utils';

type ClipboardResult = {
    content: string;
    error: string;
};

// TODO: allow handling QR codes in clipboard
export const checkClipboardContents = async (): Promise<ClipboardResult> => {
    // Delay for android to see clipboard contents
    if (Platform.OS === 'android') {
        sleep(100);
    }

    const clipboardContents = await Clipboard.getString();

    if (clipboardContents.length === 0) {
        return {
            content: '',
            error: 'Clipboard is empty',
        };
    }

    return {
        content: clipboardContents,
        error: '',
    };
};
