import * as BIP39 from 'bip39';
import BIP32Factory from 'bip32';
import ecc from '@bitcoinerlab/secp256k1';

const bip32 = BIP32Factory(ecc);

import {NetType} from '../types/wallet';

export const BJSNetworks: {[index: string]: any} = {
    bitcoin: {
        messagePrefix: '\x18Bitcoin Signed Message:\n',
        bech32: 'bc',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4,
        },
        pubKeyHash: 0x00,
        scriptHash: 0x05,
        wif: 0x80,
    },
    testnet: {
        messagePrefix: '\x18Bitcoin Signed Message:\n',
        bech32: 'tb',
        bip32: {
            public: 0x043587cf,
            private: 0x04358394,
        },
        pubKeyHash: 0x6f,
        scriptHash: 0xc4,
        wif: 0xef,
    },
};

export const generateMnemonic = () => {
    return BIP39.generateMnemonic();
};

export const validateMnenomic = (mnemonic: string) => {
    const resp = BIP39.validateMnemonic(mnemonic);

    if (!resp) {
        throw new Error('Invalid mnemonic');
    }

    return resp;
};

export const mnemonicToSeedSync = (mnemonic: string) => {
    return BIP39.mnemonicToSeedSync(mnemonic);
};

export const getMetaFromMnemonic = (mnemonic: string, network: NetType) => {
    const seed = mnemonicToSeedSync(mnemonic);
    const node = bip32.fromSeed(seed, BJSNetworks[network]);

    const {fingerprint} = node;

    return {
        xprv: node.toBase58(),
        xpub: node.neutered().toBase58(),
        fingerprint: fingerprint.toString('hex'),
    };
};
