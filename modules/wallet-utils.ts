import {Buffer} from 'buffer';

import * as bip39 from 'bip39';
import * as b58 from 'bs58';
import * as b58c from 'bs58check';
import * as bitcoin from 'bitcoinjs-lib';

import {BIP32Factory, BIP32Interface} from 'bip32';
import ecc from '@bitcoinerlab/secp256k1';

const bip32 = BIP32Factory(ecc);

import Crypto from 'react-native-quick-crypto';

import {
    descriptorSymbolsType,
    BackupMaterialTypes,
    NetType,
    TransactionType,
} from '../types/wallet';

import {
    validExtendedKeyPrefixes,
    BJSNetworks,
    extendedKeyInfo,
    WalletPaths,
    DescriptorType,
    wrappedWalletDescriptorRegex,
    nativeWalletDescriptorRegex,
    xprvPattern,
    xpubPattern,
    extendedKeyPattern,
} from './wallet-defaults';

export const getUniqueTXs = (
    transactions: TransactionType[],
): TransactionType[] => {
    const uniqueTXs: TransactionType[] = [];

    transactions.forEach(tx => {
        if (!uniqueTXs.some(item => item.txid === tx.txid)) {
            uniqueTXs.push({...tx});
        }
    });

    return uniqueTXs;
};

export const validateMnenomic = (mnemonic: string) => {
    const resp = bip39.validateMnemonic(mnemonic);

    if (!resp) {
        throw new Error('Invalid mnemonic');
    }

    return resp;
};

export const mnemonicToSeedSync = (mnemonic: string) => {
    return bip39.mnemonicToSeedSync(mnemonic);
};

export const isDescriptorPattern = (expression: string) => {
    return (
        nativeWalletDescriptorRegex.test(expression) ||
        wrappedWalletDescriptorRegex.test(expression)
    );
};

// Descriptor Symbols
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

const _getPrefix = (key: string): string => {
    return key.slice(0, 4);
};

export const getExtendedKeyPrefix = (key: string): BackupMaterialTypes => {
    const prefix = _getPrefix(key);

    if (!isExtendedKey(key)) {
        throw new Error('Invalid extended key');
    }

    if (!validExtendedKeyPrefixes.has(prefix)) {
        throw new Error('Unsupported extended key');
    }

    return prefix.slice(1) === 'pub' ? 'xpub' : 'xprv';
};

export const isSupportedExtKey = (key: string): boolean => {
    return xprvPattern.test(key) || xpubPattern.test(key);
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

export const isValidExtendedKey = (
    key: string,
    silent: boolean = false,
): boolean => {
    // Validate an extended key by checking it's checksum matches the data
    const deserializedKey = _deserializeExtendedKey(key);
    // Grab last 4 bytes as checksum
    const checksum = deserializedKey.subarray(-4).toString('hex');

    // Grab data minus checksum
    const data_chunk = deserializedKey.subarray(0, -4);
    // Double sha256 data and grab first 4 bytes as checksum
    const hashedChecksum = _get256Checksum(data_chunk.toString('hex'));

    const isValid = hashedChecksum === checksum;

    if (!isValid && !silent) {
        throw new Error('Invalid extended key checksum');
    }

    return isValid;
};

// Deserialize Extended Key without Checksum
const _deserializeExtendedKeyCheck = (key: string): Buffer => {
    const decodedBuffArray = b58c.decode(key);
    return Buffer.from(decodedBuffArray);
};

// Deserialize Extended Key with Checksum
const _deserializeExtendedKey = (key: string): Buffer => {
    const decodedBuffArray = b58.decode(key);
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
    const ver = validExtendedKeyPrefixes.get(pub_prefix);

    // Make sure the version is a valid one we support
    if (!ver) {
        throw new Error('Invalid extended public key version');
    }

    try {
        // Get the decoded key from trimmed xpub
        const decoded = _deserializeExtendedKeyCheck(xpub.trim());

        // Cut off prefix to include new xpub version
        const data = decoded.subarray(4);

        // Re-attach data with new prefix
        const nPub = Buffer.concat([Buffer.from(ver, 'hex'), data]);

        // Return new Base58 formatted key
        return b58c.encode(nPub);
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
export const getDescriptorParts = (descriptor: string) => {
    // extract descriptor prefix
    const parts = descriptor.split('(');

    // use this to ensure we aren't using defaults but descriptor path
    let fingerprint = '';
    let path = '';
    let key = '';
    let network = '';
    let scriptPrefix = '';
    let scriptSuffix = '';

    const scripts = parts.length === 3 ? [parts[0], parts[1]] : [parts[0]];

    const data =
        parts.length === 3 ? parts[2].split(')')[0] : parts[1].split(')')[0];

    // handle case for fingerprint + path and key
    if (data[0] === '[') {
        if (/([a-f0-9]{8})/.test(data)) {
            let ret = /([a-f0-9]{8})/.exec(data);

            fingerprint = ret ? ret[0] : '';
        }

        if (/(\/[1-9]{2}h)(\/[0-9]h|\*)*/.test(data)) {
            let ret = /(\/[1-9]{2}h)(\/[0-9]h|\*)*/.exec(data);

            path = (ret ? ret[0] : '').replace(/h/g, "'").slice(1);
        }

        key = data.split(']')[1];
        network = extendedKeyInfo[data.split(']')[1][0]].network;
        scriptPrefix = scripts[0] + '(';
        scriptSuffix = ')';
    } else {
        // Full key, which may include trailing path
        // i.e. tprv8ZgxMBicQKsPdCaKK9HTNU45tMEbMDugaZc1mPzt9a2Wzdo31zRGMdoeKYKJz6aNg7oz9togxkV62bnGWYZ94VSAeETfPNWNhetjZY7hQPP/84'/1'/0'/0/*
        key = data;

        // Assuming a private descriptor with terminal path
        if (data.includes('/')) {
            path = data.split('/').slice(1, 4).join('/');
        }

        // Get network from key
        // No need to strip given we only need the first character
        network = extendedKeyInfo[key[0]].network;

        // Get fingerprint from stripped key
        fingerprint = getFingerprintFromXkey(
            key.split('/')[0],
            network as NetType,
        );
    }

    // Extract checksum if any
    let checksum = '';
    let checksumArray = parts.slice(-1)[0].split('#').slice(-1);

    if (checksum.includes('#')) {
        checksum = checksumArray[0];
    }

    // Gather data assuming non-nested script
    let components = {
        key: key,
        keyOnly: key.split('/')[0],
        network: network,
        type: DescriptorType[scripts[0]],
        fingerprint: fingerprint,
        path: 'm/' + path,
        scriptPrefix: scriptPrefix,
        scriptSuffix: scriptSuffix,
        checksum: checksum,
    };

    // Handle nested script case
    if (scripts[0] === 'sh' && scripts[1] === 'wpkh' && parts.length === 3) {
        // Extract embedded key
        key = data[0] === '[' ? data.split(']')[1] : data[0];

        components.key = key;
        components.keyOnly = key.split('/')[0];

        // Set network and wallet type from descriptor
        components.network = extendedKeyInfo[key[0]].network;
        components.type = DescriptorType[scripts[0]];
        components.fingerprint = fingerprint;
        components.path = 'm/' + path.slice(1);
        components.scriptPrefix = scripts[0] + '(' + scripts[1] + '(';
        components.scriptSuffix = '))';
    }

    return components;
};

// Return a wallet address path from a given index and whether it is a change or receiving address
export const getAddressPath = (
    index: number,
    change: boolean,
    network: string,
    type: string,
): string => {
    // Get network prefix
    // Uses unhardened derivation
    const prefix =
        network === 'bitcoin'
            ? WalletPaths[type].bitcoin
            : WalletPaths[type].testnet;

    // Get change prefix
    const changePrefix = change ? '1' : '0';

    // Return address path
    // m / purpose' / coin_type' / account' / change / index
    return `${prefix}/${changePrefix}/${index}`;
};

export const generateRootFromXKey = (
    xkey: string,
    net: string,
    addressPath: string,
): BIP32Interface => {
    const prefix = getExtendedKeyPrefix(xkey);
    let key = xkey;

    // We must normalize the xpub for bitcoinjs-lib
    if (prefix === 'xpub') {
        key = normalizeXpub(xkey);
    }

    let root = bip32.fromBase58(key, BJSNetworks[net]);

    // Check that xpub given is three levels deep
    if (prefix === 'xpub') {
        if (root.depth === 0) {
            throw new Error(
                '0-depth xpub missing private to generate hardened child key.',
            );
        }

        // derive address path for xpub (i.e. change and index), assume base path included before xpub generated (depth 3)
        // Then manually derive change and index
        const [change, index] = addressPath.split('/').slice(-2);

        root = root.derive(Number(change)).derive(Number(index));
    }

    // Derive root using address path if xprv given
    // Otherwise, assume xpub given is three level deep
    if (prefix === 'xprv') {
        root = root.derivePath(addressPath);
    }

    return root;
};

export const generateRootFromMnemonic = (
    secret: string,
    path: string,
    net: string,
): BIP32Interface => {
    const seed = mnemonicToSeedSync(secret);
    const root = bip32.fromSeed(seed, BJSNetworks[net]);

    return root.derivePath(path);
};

export const generateAddressFromXKey = (
    addressPath: string,
    net: string,
    type: string,
    xkey: string,
): string => {
    // XPub | Xprv -> Xpub, includes address path (coin/account/chain/change/index)
    const pubKeyRoot = generateRootFromXKey(xkey, net, addressPath);

    const address = _generateAddress(net, type, pubKeyRoot);

    return address;
};

export const generateAddressFromMnemonic = (
    addressPath: string,
    net: string,
    type: string,
    secret: string,
): string => {
    const pubKey = generateRootFromMnemonic(secret, addressPath, net);

    const address = _generateAddress(net, type, pubKey);

    return address;
};

const _generateAddress = (
    net: string,
    type: string,
    root: BIP32Interface,
): string => {
    let address = '';

    const network = BJSNetworks[net];

    // Assumed root includes full derivation path (i.e. m/84'/1'/0'/0/0)
    let keyPair = root;

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

export const getMetaFromMnemonic = (
    mnemonic: string,
    walletPath: string,
    network: NetType,
) => {
    const seed = mnemonicToSeedSync(mnemonic);
    const node = bip32.fromSeed(seed, BJSNetworks[network]);

    const xpub = node.derivePath(walletPath).neutered().toBase58();

    return {
        xprv: node.toBase58(),
        xpub: xpub,
        fingerprint: node.fingerprint.toString('hex'),
    };
};

export const getPubKeyFromXprv = (xprv: string, network: NetType) => {
    const keyInfo = extendedKeyInfo[_getPrefix(xprv)[0]];

    // TODO: handle zpub/prv case && other exotic prefixes
    const derivationPath = WalletPaths[keyInfo.type][network];

    let node = bip32.fromBase58(xprv, BJSNetworks[network]);

    // Report if not master of 3-depth node
    if (node.depth !== 0 && node.depth !== 3) {
        throw new Error(
            'Extended private key must be master or 3-depth child.',
        );
    }

    // Generate child 3-depth node if xprv is a master node
    // Else assume xprv is a 3-depth child node
    if (node.depth === 0) {
        node = node.derivePath(derivationPath);
    }

    return node.neutered().toBase58();
};

export const getFingerprintFromXkey = (xkey: string, network: NetType) => {
    let key = xkey;

    if (getExtendedKeyPrefix(xkey) === 'xpub') {
        key = normalizeXpub(xkey);
    }

    const node = bip32.fromBase58(key, BJSNetworks[network]);

    if (node.depth > 0) {
        return _getParentFingerprintHex(node.toBase58());
    }

    return node.fingerprint.toString('hex');
};

const _getParentFingerprintHex = (xkey: string): string => {
    const decoded = _deserializeExtendedKey(xkey);

    return Buffer.from(decoded.subarray(5, 9)).toString('hex');
};

export const normalizeXpub = (xpub: string) => {
    const network = extendedKeyInfo[_getPrefix(xpub)[0]].network;

    // Bitcoinjs-lib supports only tpub and xpub prefixes
    // Convert exotic prefixes to tpub or xpub
    if (['u', 'v', 'y', 'z'].includes(xpub[0])) {
        const convertedXPUB = convertXPUB(
            xpub,
            network === 'testnet' ? 'tpub' : 'xpub',
        );

        return convertedXPUB;
    }

    return xpub;
};
