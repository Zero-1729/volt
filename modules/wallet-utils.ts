import * as BIP39 from 'bip39';
import * as BIP32Utils from 'bip32-utils';


import {
    descriptorSymbolsType,
    BackupMaterialTypes,
    BDKWalletTypes,
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

export const BDKWalletTypeNames: {[index: string]: BDKWalletTypes} = {
    bech32: 'wpkh',
    legacy: 'p2pkh',
    p2sh: 'shp2wpkh',
};

export const getExtendedKeyPrefix = (key: string): BackupMaterialTypes => {
    const prefix = key.substring(0, 4);
    const keyType = key.includes(prefix) ? 'xprv' : 'xpub';

    return keyType;
};
