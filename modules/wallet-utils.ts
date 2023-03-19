import * as b58c from 'bs58check';
import {Buffer} from 'buffer';

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

// Version bytes as described here:
// https://github.com/satoshilabs/slips/blob/master/slip-0132.md
/*
    Bitcoin	0488b21e - xpub	0488ade4 - xprv	P2PKH or P2SH	m/44'/0'
    Bitcoin	049d7cb2 - ypub	049d7878 - yprv	P2WPKH in P2SH	m/49'/0'
    Bitcoin	04b24746 - zpub	04b2430c - zprv	P2WPKH	m/84'/0'
    Bitcoin	0295b43f - Ypub	0295b005 - Yprv	Multi-signature P2WSH in P2SH	-
    Bitcoin	02aa7ed3 - Zpub	02aa7a99 - Zprv	Multi-signature P2WSH	-

    Bitcoin Testnet	043587cf - tpub	04358394 - tprv	P2PKH or P2SH	m/44'/1'
    Bitcoin Testnet	044a5262 - upub	044a4e28 - uprv	P2WPKH in P2SH	m/49'/1'
    Bitcoin Testnet	045f1cf6 - vpub	045f18bc - vprv	P2WPKH	m/84'/1'
    Bitcoin Testnet	024289ef - Upub	024285b5 - Uprv	Multi-signature P2WSH in P2SH	-
    Bitcoin Testnet	02575483 - Vpub	02575048 - Vprv
*/
// Note: Might support Y/Z and T/U/V privs and pubs
const _validXpubPrefixes = new Map([
    // xpub
    ['xpub', '0488b21e'],
    ['ypub', '049d7cb2'],
    ['zpub', '04b24746'],
    ['tpub', '043587cf'],
    ['upub', '044a5262'],
    ['vpub', '045f1cf6'],
]);

const _validXprvPrefixes = new Map([
    // xprv
    ['xprv', '0488ade4'],
    ['yprv', '049d7878'],
    ['zprv', '04b2430c'],
    ['tprv', '04358394'],
    ['uprv', '044a4e28'],
    ['vprv', '045f18bc'],
]);

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

// Extended key regexes
export const extendedKeyPattern: RegExp =
    /^([XxyYzZtuUvV](pub|prv)[1-9A-HJ-NP-Za-km-z]{79,108})$/;
const _xpubPattern: RegExp = /^([xyztuv]pub[1-9A-HJ-NP-Za-km-z]{79,108})$/;
const _xprvPattern: RegExp = /^([xyztuv]prv[1-9A-HJ-NP-Za-km-z]{79,108})$/;

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

    if (!isExtendedKey(key)) {
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

// Based on Jlopp's code here:
// https://github.com/jlopp/xpub-converter
export const convert_xpub = (xpub: string, pub_prefix: string): string => {
    // Grab new xpub version to convert to
    const ver = _validXpubPrefixes.get(pub_prefix);

    // Make sure the version is a valid one we support
    if (!ver) {
        throw new Error('Invalid extended public key version');
    }

    try {
        // Get the decoded key from trimmed xpub
        const decoded = b58c.decode(xpub.trim());

        // Cut off prefix to include new xpub version
        const data = decoded.slice(4);
        // Re-attach data with new prefix
        const nPub = Buffer.concat([Buffer.from(ver, 'hex'), data]);

        // Return new Base58 formatted key
        return b58c.encode(nPub);
    } catch (e) {
        // Assume an invalid key if unable to disassemble and re-assemble
        throw new Error('Invalid extended public key');
    }
};
