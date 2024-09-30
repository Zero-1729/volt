import {TagEvent} from 'react-native-nfc-manager';

// Return digestible NFC tag data or error
export const extractNFCTagData = (nfcTag: TagEvent) => {
    // Validate NFC tag data
    if (!nfcTag) {
        throw new Error('Invalid NFC tag data');
    }

    // Check whether card is empty
    if (!nfcTag.ndefMessage) {
        throw new Error('Empty NFC tag data');
    }

    // Grab the first NDEF record from the NFC tag
    const payload = nfcTag.ndefMessage[0].payload;

    const rawBytesText = Buffer.from(payload).toString('utf-8');
    const rawLnurl =
        rawBytesText[0] === '\x00' ? rawBytesText.slice(1) : rawBytesText;
    const lnurl =
        rawLnurl.startsWith('lnurlw://') || rawLnurl.startsWith('lnurl')
            ? rawLnurl
            : null;

    // Extract NFC tag data
    const nfcTagData = {
        tagId: nfcTag.id, // 14-digit
        tagType: nfcTag.type, // NFC Forum Type 4 (on Android)
        tagTechs: nfcTag.techTypes, // array including 'android.nfc.tech.Ndef'
        lnurl: lnurl, // null or lnurlw://...
        size: nfcTag.maxSize, // in bytes, e.g. 256
        rawTagMessage: nfcTag.ndefMessage, // array of NDEF records
    };

    // Return NFC tag data
    return nfcTagData;
};
