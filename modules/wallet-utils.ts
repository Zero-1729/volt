import {
    descriptorSymbolsType,
    BackupMaterialTypes,
    BDKWalletTypes,
    extendedKeyInfoType,
} from '../types/wallet';

export const WalletTypeNames: {[index: string]: string[]} = {
    bech32: ['Native Segwit', 'Bech32'],
    legacy: ['Legacy', 'P2PKH'],
    p2sh: ['Segwit', 'P2SH'],
};

export const WalletPaths: {[index: string]: string} = {
    bech32: "m/84'/0'/0'",
    legacy: "m/44'/0'/0'",
    p2sh: "m/49'/0'/0'",
};

export const extendedKeyInfo: {[index: string]: extendedKeyInfoType} = {
    // mainnet / bitcoin
    x: {network: 'bitcoin', type: 'legacy'}, // Account path P2PKH (legacy) [1...]
    y: {network: 'bitcoin', type: 'p2sh'}, // Account path P2SH(P2WPKH(...)) [3...]
    z: {network: 'bitcoin', type: 'bech32'}, // Account path P2WPKH [bc1...]

    // testnet
    t: {network: 'testnet', type: 'legacy'}, // Account path P2PKH (legacy) [1...]
    u: {network: 'testnet', type: 'p2sh'}, // Account path P2SH(P2WPKH(...)) [3...]
    v: {network: 'testnet', type: 'bech32'}, // Account path P2WPKH [bc1...]
};

// Note: Might support X/Y/Z and T/U/V privs and pubs
// For now, we only support these three account types for both mainnet & testnet
export const extendedPrivs = ['xprv', 'yprv', 'tprv', 'zprv', 'vprv'];
export const extendedPubs = ['xpub', 'ypub', 'tpub', 'zpub', 'vpub'];

export const BackupMaterialType: {[index: string]: BackupMaterialTypes} = {
    MNEMONIC: 'mnemonic',
    XPRIV: 'xprv',
    XPUB: 'xpub',
    DESCRIPTOR: 'descriptor',
};

export const descriptorSymbols: descriptorSymbolsType = [
    '[',
    ']',
    '(',
    ')',
    ',',
    "'",
    '/',
    ':',
    '_',
    '*',
];

export const extendedKeyPattern: RegExp =
    /^([XxyYzZtuUvV](pub|prv)[1-9A-HJ-NP-Za-km-z]{79,108})$/;
export const xpubPrefixPattern: RegExp = /^([xyztuv]pub)$/;
export const xprvPrefixPattern: RegExp = /^([xyztuv]prv)$/;
const _xpubPattern: RegExp = /^([xyztuv]pub[1-9A-HJ-NP-Za-km-z]{79,108})$/;
const _xprvPattern: RegExp = /^([xyztuv]prv[1-9A-HJ-NP-Za-km-z]{79,108})$/;

export const extendedKeyPrefix: RegExp = /^([xyztuv])(prv|pub)$/;
export const unsupportedExtendedKeyPrefix: RegExp = /^([XYZTUV])(prv|pub)$/;

export const BDKWalletTypeNames: {[index: string]: BDKWalletTypes} = {
    bech32: 'wpkh',
    legacy: 'p2pkh',
    p2sh: 'shp2wpkh',
};

const _getPrefix = (key: string): string => {
    return key.substring(0, 4);
};

export const getExtendedKeyPrefix = (key: string): BackupMaterialTypes => {
    const prefix = _getPrefix(key);

    if (isExtendedKey(key)) {
        throw new Error('Invalid extended key');
    }

    return xpubPrefixPattern.test(prefix) ? 'xpub' : 'xprv';
};

export const isExtendedPubKey = (key: string): boolean => {
    return _xpubPattern.test(key);
};

export const isExtendedPrvKey = (key: string): boolean => {
    return _xprvPattern.test(key);
};

export const isExtendedKey = (key: string): boolean => {
    // Length Check
    if (key.length !== 111) {
        return false;
    }

    // Pattern check
    return extendedKeyPattern.test(key);
};

// Get network and account path info from extended key
// Assume valid xprv/xpub given here
export const getInfoFromXKey = (key: string) => {
    const prefix = _getPrefix(key);

    return extendedKeyInfo[prefix];
};

export const isValidExtendedKey = (key: string): boolean => {
    // NOTE: We mean xpub and xpriv in the general BIP32 sense,
    // where tprv, yprv, zprv, vprv, are all considered xprvs
    // and similarly, tpub, ypub, zpub, vpub are all considered xpubs
    // TODO: perform checksum check
    return true;
};
