import {Buffer} from 'buffer';

import * as b58 from 'bs58';
import Crypto from 'react-native-quick-crypto';
import BigNumber from 'bignumber.js';

import * as bitcoin from 'bitcoinjs-lib';
import BIP32Factory from 'bip32';
import ecc from '@bitcoinerlab/secp256k1';

const bip32 = BIP32Factory(ecc);

import * as bip39 from '../modules/bip39-util';

import {
    descriptorSymbolsType,
    BackupMaterialTypes,
    BDKWalletTypes,
    extendedKeyInfoType,
    accountPaths,
    TransactionType,
} from '../types/wallet';

export const WalletTypeNames: {[index: string]: string[]} = {
    bech32: ['Native Segwit', 'Bech32'],
    legacy: ['Legacy', 'P2PKH'],
    p2sh: ['Segwit', 'P2SH'],
};

// Based on BIP44 definitions
// See here: https://en.bitcoin.it/wiki/BIP_0044#Registered_coin_types
/*
    Coin	            Account	    Chain	      Address	  Path
    --------------      -------     --------      -------     -------------------------
    Bitcoin	            first	     external	   first	    m / 44' / 0' / 0' / 0 / 0
    Bitcoin	            first	     external	   second	   m / 44' / 0' / 0' / 0 / 1

    Bitcoin	            first        change	       first	    m / 44' / 0' / 0' / 1 / 0
    Bitcoin	            first	     change	       second	   m / 44' / 0' / 0' / 1 / 1

    Bitcoin	            second	    external	  first	       m / 44' / 0' / 1' / 0 / 0
    Bitcoin	            second	    external	  second	  m / 44' / 0' / 1' / 0 / 1

    Bitcoin	            second	    change	      first	       m / 44' / 0' / 1' / 1 / 0
    Bitcoin	            second	    change	      second	  m / 44' / 0' / 1' / 1 / 1



    Bitcoin Testnet	    first	     external	   first	    m / 44' / 1' / 0' / 0 / 0
    Bitcoin Testnet	    first	     external	   second	   m / 44' / 1' / 0' / 0 / 1

    Bitcoin Testnet	    first	     change	       first	    m / 44' / 1' / 0' / 1 / 0
    Bitcoin Testnet	    first	     change	       second	   m / 44' / 1' / 0' / 1 / 1

    Bitcoin Testnet	    second	    external	  first	       m / 44' / 1' / 1' / 0 / 0
    Bitcoin Testnet	    second	    external	  second	  m / 44' / 1' / 1' / 0 / 1

    Bitcoin Testnet	    second	    change	      first	       m / 44' / 1' / 1' / 1 / 0
    Bitcoin Testnet	    second	    change	      second	  m / 44' / 1' / 1' / 1 / 1

*/
export const WalletPaths: {[index: string]: accountPaths} = {
    bech32: {bitcoin: "m/84'/0'/0'", testnet: "m/84'/1'/0'"},
    legacy: {bitcoin: "m/44'/0'/0'", testnet: "m/44'/1'/0'"},
    p2sh: {bitcoin: "m/49'/0'/0'", testnet: "m/49'/1'/0'"},
};

// BitcoinJS Networks
const BJSNetworks: {[index: string]: any} = {
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

// Version bytes as described here:
// https://github.com/satoshilabs/slips/blob/master/slip-0132.md
/*
    Coin	          Public Key	    Private Key	      Address Encoding	                BIP 32 Path
    --------------    ---------------    ------------     ------------------------------    ------------------------
    Bitcoin	          0488b21e - xpub   0488ade4 - xprv	  P2PKH  or P2SH	                m/44'/0'
    Bitcoin	          049d7cb2 - ypub   049d7878 - yprv	  P2WPKH in P2SH	                m/49'/0'
    Bitcoin	          04b24746 - zpub   04b2430c - zprv	  P2WPKH	                        m/84'/0'
    Bitcoin	          0295b43f - Ypub   0295b005 - Yprv	  Multi-signature P2WSH in P2SH	    -
    Bitcoin	          02aa7ed3 - Zpub   02aa7a99 - Zprv	  Multi-signature P2WSH	            -

    Bitcoin Testnet	  043587cf - tpub	04358394 - tprv	  P2PKH  or P2SH	                m/44'/1'
    Bitcoin Testnet	  044a5262 - upub	044a4e28 - uprv	  P2WPKH in P2SH	                m/49'/1'
    Bitcoin Testnet	  045f1cf6 - vpub	045f18bc - vprv	  P2WPKH	                        m/84'/1'
    Bitcoin Testnet	  024289ef - Upub	024285b5 - Uprv	  Multi-signature P2WSH in P2SH     -
    Bitcoin Testnet	  02575483 - Vpub	02575048 - Vprv   Multi-signature P2WSH	            -
*/
// Note: Currently do not support Y/Z and T/U/V privs and pubs
const _validExtendedKeyPrefixes = new Map([
    // xpub
    ['xpub', '0488b21e'],
    ['ypub', '049d7cb2'],
    ['zpub', '04b24746'],
    ['tpub', '043587cf'],
    ['upub', '044a5262'],
    ['vpub', '045f1cf6'],
    // xprv
    ['xprv', '0488ade4'],
    ['yprv', '049d7878'],
    ['zprv', '04b2430c'],
    ['tprv', '04358394'],
    ['uprv', '044a4e28'],
    ['vprv', '045f18bc'],
]);

export const xpubVersions = ['xpub', 'ypub', 'zpub', 'tpub', 'upub', 'vpub'];

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

// For now, we only support single key descriptors
// with three specific script types (legacy, P2SH, and Bech32)
//  i.e. ‘wpkh’, ‘pkh’, ‘sh’, ‘sh(wpkh(…))’
// Includes support fot optional (fingerprint + path prefix, e.g. [abce1234/49h/0h/0h])
// Includes support for optional child derivation path suffix (i.e., /0/*)
const _nativeWalletDescriptorRegex =
    /^((wpkh|pkh)\((\[([a-z0-9]{8})(\/[1-9]{2}h)*(\/([0-9]h|\*))*\])*([xyztuv]((pub|prv))[1-9A-HJ-NP-Za-km-z]{79,108})(\/[1-9]{2}h(\/[0-9]h)*(\/\*)?)?\))$/;
const _wrappedWalletDescriptorRegex =
    /^(sh\(wpkh\((\[([a-z0-9]{8})(\/[1-9]{2}h)*(\/([0-9]h|\*))*\])*([xyztuv]((pub|prv))[1-9A-HJ-NP-Za-km-z]{79,108})(\/[1-9]{2}h(\/[0-9]h)*(\/\*)?)?\)\))$/;

export const isDescriptorPattern = (expression: string) => {
    return (
        _nativeWalletDescriptorRegex.test(expression) ||
        _wrappedWalletDescriptorRegex.test(expression)
    );
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
const _extendedKeyPattern: RegExp =
    /^([XxyYzZtuUvV](pub|prv)[1-9A-HJ-NP-Za-km-z]{79,108})$/;
export const descXpubPattern: RegExp =
    /([xyztuv]pub[1-9A-HJ-NP-Za-km-z]{79,108})/g;
const _xpubPattern: RegExp = /^([xyztuv]pub[1-9A-HJ-NP-Za-km-z]{79,108})$/;
const _xprvPattern: RegExp = /^([xyztuv]prv[1-9A-HJ-NP-Za-km-z]{79,108})$/;

export const BDKWalletTypeNames: {[index: string]: BDKWalletTypes} = {
    bech32: 'wpkh',
    legacy: 'p2pkh',
    p2sh: 'shp2wpkh',
};

const _descriptorType: {[index: string]: string} = {
    pkh: 'legacy',
    wpkh: 'bech32',
    sh: 'p2sh',
};

const _getPrefix = (key: string): string => {
    return key.slice(0, 4);
};

export const getExtendedKeyPrefix = (key: string): BackupMaterialTypes => {
    const prefix = _getPrefix(key);

    if (!isExtendedKey(key)) {
        throw new Error('Invalid extended key');
    }

    if (!_validExtendedKeyPrefixes.has(prefix)) {
        throw new Error('Unsupported extended key');
    }

    return prefix.slice(1) === 'pub' ? 'xpub' : 'xprv';
};

export const isSupportedExtKey = (key: string): boolean => {
    return _xprvPattern.test(key) || _xpubPattern.test(key);
};

export const isExtendedKey = (key: string): boolean => {
    // Length Check
    if (key.length !== 111) {
        return false;
    }

    // Pattern check
    return _extendedKeyPattern.test(key);
};

// Get network and account path info from extended key
// Assume valid xprv/xpub given here
export const getInfoFromXKey = (key: string) => {
    const prefix = _getPrefix(key);

    return extendedKeyInfo[prefix];
};

export const isValidExtendedKey = (key: string): boolean => {
    // Validate an extended key by checking it's checksum matches the data
    const deserializedKey = _deserializeExtendedKey(key);
    // Grab last 4 bytes as checksum
    const checksum = deserializedKey.slice(-4).toString('hex');

    // Grab data minus checksum
    const data_chunk = deserializedKey.slice(0, -4);
    // Double sha256 data and grab first 4 bytes as checksum
    const hashedChecksum = _get256Checksum(data_chunk.toString('hex'));

    const isValid = hashedChecksum === checksum;

    if (!isValid) {
        throw new Error('Invalid extended key checksum');
    }

    return isValid;
};

// Deserialize Extended Key
const _deserializeExtendedKey = (key: string): Buffer => {
    const decodedBuffArray = b58.decode(key).buffer;
    return Buffer.from(decodedBuffArray);
};

const _doubleSha256 = (data: Buffer) => {
    const hashed = Crypto.createHash('sha256').update(data).digest();
    const hashed1 = Crypto.createHash('sha256').update(hashed).digest();

    // Return sha256(sha256(data))
    return hashed1;
};

// Based on Jlopp's code here:
// https://github.com/jlopp/xpub-converter
export const convertXPUB = (xpub: string, pub_prefix: string): string => {
    // Grab new xpub version to convert to
    const ver = _validExtendedKeyPrefixes.get(pub_prefix);

    // Make sure the version is a valid one we support
    if (!ver) {
        throw new Error('Invalid extended public key version');
    }

    try {
        // Get the decoded key from trimmed xpub
        const decoded = _deserializeExtendedKey(xpub.trim());

        // Cut off prefix to include new xpub version
        const data = decoded.slice(4);
        // Re-attach data with new prefix
        const nPub = Buffer.concat([Buffer.from(ver, 'hex'), data]);

        // Return new Base58 formatted key
        return b58.encode(nPub);
    } catch (e) {
        // Assume an invalid key if unable to disassemble and re-assemble
        throw new Error('Invalid extended public key');
    }
};

const _get256Checksum = (data: string): string => {
    const hashed_data = _doubleSha256(Buffer.from(data, 'hex'));

    return hashed_data.slice(0, 4).toString('hex');
};

// Get descriptor components
// Descriptor format:
// {script}({xprv/xpub})
// E.g. wpkh(tprv8ZgxMBicQKsPd97TPtNtP25LfqmXxDQa4fwJhtWcbc896RTiemtHnQmJNccVQJTH7eU3EpzqdyVJd9JPX1SQy9oKXfhm9o5mAHYEN3rcdV6)
// TODO: add support for Bitcoin core format pattern
// TODO: Check that there is no mismatch between attached derivation path and script prefix
export const getDescriptorParts = (descriptor: string) => {
    // extract descriptor prefix
    const parts = descriptor.split('(');

    // Gather data assuming non-nested script
    const components = {
        key: parts[1].split(')')[0],
        network:
            parts.length === 2
                ? extendedKeyInfo[parts[1].split(')')[0][0]].network
                : '',
        type: parts.length === 2 ? _descriptorType[parts[0].split(')')[0]] : '',
    };

    // Handle nested script case
    const prefix = descriptor.split('(')[0];

    if (prefix === 'sh' && parts[1] === 'wpkh' && parts.length === 3) {
        // Extract embedded key
        const key = parts[2].split(')')[0];

        components.key = key;

        // Set network and wallet type from descriptor
        components.network = extendedKeyInfo[key[0]].network;
        components.type = _descriptorType[prefix];
    }

    return components;
};

// Formats transaction data from BDK to format for wallet
export const formatTXFromBDK = (tx: any): TransactionType => {
    const formattedTx = {
        txid: tx.txid,
        confirmed: tx.confirmed,
        block_height: tx.block_height,
        timestamp: tx.block_timestamp,
        fee: new BigNumber(tx.fee),
        value: new BigNumber(tx.received.length !== '' ? tx.received : tx.sent),
        type: tx.received.length !== '' ? 'inbound' : 'outbound',
        network: tx.network,
    };

    // Returned formatted tx
    return formattedTx;
};

// Return a wallet address path from a given index and whether it is a change or receiving address
export const getAddressPath = (
    index: number,
    change: boolean,
    network: string,
    type: string,
): string => {
    // Get network prefix
    const prefix =
        network === 'mainnet'
            ? WalletPaths[type].bitcoin
            : WalletPaths[type].testnet;

    // Get change prefix
    const changePrefix = change ? '1' : '0';

    // Return address path
    // m / purpose' / coin_type' / account' / change / index
    return `${prefix}/${changePrefix}/${index}`;
};

export const generateAddressFromPath = (
    path: string,
    net: string,
    type: string,
    secret: string,
): string => {
    let address = '';

    const network = BJSNetworks[net];

    const seed = bip39.mnemonicToSeedSync(secret);
    const root = bip32.fromSeed(seed, network);
    const keyPair = root.derivePath(path);

    switch (type) {
        case 'legacy':
            const P2PKData = bitcoin.payments.p2pkh({
                pubkey: keyPair.publicKey,
                network,
            });

            address = P2PKData.address;
            break;

        case 'bech32':
            const P2WPKHData = bitcoin.payments.p2wpkh({
                pubkey: keyPair.publicKey,
                network,
            });

            address = P2WPKHData.address;
            break;

        case 'p2sh':
            const P2SHData = bitcoin.payments.p2sh({
                redeem: bitcoin.payments.p2wpkh({
                    pubkey: keyPair.publicKey,
                    network,
                }),
                network,
            });

            address = P2SHData.address;
            break;
    }

    return address;
};

// Creates a descriptor either from a mnemonic or an xprv
export const createDescriptor = (
    type: string,
    path: string,
    mnemonic: string,
    network: string,
    xprv: string,
    fingerprint?: string,
    childPath?: string,
) => {
    var descriptor = '';
    var closeNested = false;

    let _xprv = xprv;
    let _fingerprint = fingerprint;

    // Panic if multi info given
    if (xprv.length !== 0 && mnemonic.length !== 0) {
        throw new Error(
            '[CreateDescriptor] Must include either mnemonic or xprv, not both.',
        );
    }

    // Include wallet type
    // [SCRIPT]
    switch (type) {
        case 'p2sh':
            descriptor = descriptor.concat('sh(wpkh(');
            closeNested = true;

            break;
        case 'bech32':
            descriptor = descriptor.concat('wpkh(');
            break;
        case 'legacy':
            descriptor = descriptor.concat('pkh(');
            break;
    }

    // Include optional fingerprint
    // [KEY]
    // key origin
    descriptor = descriptor.concat('[');

    // Get Mnemonic meta if mnemonic provided
    if (mnemonic.length > 0) {
        if (!bip39.validateMnenomic(mnemonic)) {
            throw new Error('[CreateDescriptor] Invalid Mnemonic.');
        }

        const meta = bip39.getMetaFromMnemonic(
            mnemonic,
            bip39.BJSNetworks[network],
        );

        _xprv = meta.xprv;
        _fingerprint = meta.fingerprint;
    }

    // add optional fingerprint
    if (_fingerprint) {
        if (_fingerprint.length !== 8) {
            throw new Error(
                '[CreateDescriptor] Fingerprint length invalid, must be 8 hex characters long.',
            );
        }

        descriptor = descriptor.concat(_fingerprint);
    }

    // Add origin path and close key origin info
    descriptor = descriptor.concat(`/${path.slice(2)}`);
    descriptor = descriptor.concat(']');

    // Add descriptor key
    if (!_xprvPattern.test(_xprv)) {
        throw new Error('[CreateDescriptor] Unsupported xprv.');
    }

    if (!isValidExtendedKey(_xprv)) {
        throw new Error(
            '[CreateDescriptor] Failed checksum check, invalid xprv.',
        );
    }

    descriptor = descriptor.concat(_xprv);

    // Add optional hardened or unhardened child path
    // Note: The usage of hardened derivation steps requires providing the private key.
    if (childPath) {
        descriptor = descriptor.concat(childPath);
    }

    descriptor = descriptor.concat(')');

    if (closeNested) {
        descriptor = descriptor.concat(')');
    }

    return descriptor;
};
