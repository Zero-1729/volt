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
} from '../types/wallet';

import {
    validExtendedKeyPrefixes,
    BJSNetworks,
    extendedKeyInfo,
    WalletPaths,
    DescriptorType,
} from './wallet-defaults';

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

// Descriptor Regex
// For now, we only support single key descriptors
// with three specific script types (legacy, P2SH, and Bech32)
//  i.e. ‘wpkh’, ‘pkh’, ‘sh’, ‘sh(wpkh(…))’
// Includes support fot optional (fingerprint + path prefix, e.g. [abce1234/49h/0h/0h])
// Includes support for optional child derivation path suffix (i.e., /0/*)
const _nativeWalletDescriptorRegex =
    /^((wpkh|pkh)\((\[([a-e0-9]{8})(\/[1-9]{2}h)*(\/([0-9]h|\*))*\])*([xyztuv]((pub|prv))[1-9A-HJ-NP-Za-km-z]{79,108})(\/[0-9]+)*(\/\*)?\))$/;
const _wrappedWalletDescriptorRegex =
    /^(sh\(wpkh\((\[([a-e0-9]{8})(\/[1-9]{2}h)*(\/([0-9]h|\*))*\])*([xyztuv]((pub|prv))[1-9A-HJ-NP-Za-km-z]{79,108})(\/[0-9]+)*(\/\*)?\)\))$/;

export const isDescriptorPattern = (expression: string) => {
    return (
        _nativeWalletDescriptorRegex.test(expression) ||
        _wrappedWalletDescriptorRegex.test(expression)
    );
};

// Extended Key Regexes
const _extendedKeyPattern: RegExp =
    /^([XxyYzZtuUvV](pub|prv)[1-9A-HJ-NP-Za-km-z]{79,108})$/;
export const descXpubPattern: RegExp =
    /([xyztuv]pub[1-9A-HJ-NP-Za-km-z]{79,108})/g;
const _xpubPattern: RegExp = /^([xyztuv]pub[1-9A-HJ-NP-Za-km-z]{79,108})$/;
const _xprvPattern: RegExp = /^([xyztuv]prv[1-9A-HJ-NP-Za-km-z]{79,108})$/;

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

    const scripts = parts.length === 3 ? [parts[0], parts[1]] : [parts[0]];

    const data =
        parts.length === 3 ? parts[2].split(')')[0] : parts[1].split(')')[0];

    // handle case for fingerprint + path
    if (data[0] === '[') {
        if (/([a-e0-9]{8})/.test(data)) {
            let ret = /([a-e0-9]{8})/.exec(data);

            fingerprint = ret ? ret[0] : '';
        }

        if (/(\/[1-9]{2}h)(\/[0-9]h|\*)*/.test(data)) {
            let ret = /(\/[1-9]{2}h)(\/[0-9]h|\*)*/.exec(data);

            path = ret ? ret[0] : '';
        }

        key = data.split(']')[1];
        network = extendedKeyInfo[data.split(']')[1][0]].network;
    }

    // Gather data assuming non-nested script
    let components = {
        key: data,
        network: network,
        type: DescriptorType[scripts[0]],
        fingerprint: fingerprint,
        path: 'm/' + path.slice(1),
    };

    // Handle nested script case
    if (scripts[0] === 'sh' && scripts[1] === 'wpkh' && parts.length === 3) {
        // Extract embedded key
        key = data[0] === '[' ? data.split(']')[1] : data[0];

        components.key = key;

        // Set network and wallet type from descriptor
        components.network = extendedKeyInfo[key[0]].network;
        components.type = DescriptorType[scripts[0]];
        components.fingerprint = fingerprint;
        components.path = 'm/' + path.slice(1);
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
    addresPath: string,
): BIP32Interface => {
    const prefix = getExtendedKeyPrefix(xkey);

    let root = bip32.fromBase58(xkey, BJSNetworks[net]);

    // Check that xpub given is three levels deep
    if (prefix === 'xpub') {
        if (root.depth === 0) {
            throw new Error(
                '0-depth xpub missing private to generate hardened child key.',
            );
        }

        // derive address path for xpub (i.e. change and index), assume base path included before xpub generated (depth 3)
        // Then manually derive change and index
        const [change, index] = addresPath.split('/').slice(-2);

        root = root.derive(Number(change)).derive(Number(index));
    }

    // Derive root using address path if xprv given
    // Otherwise, assume xpub given is three level deep
    if (prefix === 'xprv') {
        root = root.derivePath(addresPath);
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

// Creates a descriptor either from a mnemonic or an xprv
export const createDescriptor = (
    type: string,
    path: string,
    mnemonic: string,
    network: NetType,
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
        if (!validateMnenomic(mnemonic)) {
            throw new Error('[CreateDescriptor] Invalid Mnemonic.');
        }

        const meta = getMetaFromMnemonic(mnemonic, path, network);

        _xprv = !_xprv ? meta.xprv : _xprv;
        _fingerprint = !_fingerprint ? meta.fingerprint : _fingerprint;
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

    // strip all "'" from descriptor with 'h'
    descriptor = descriptor.replace(/'/g, 'h');

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
    const node = bip32.fromBase58(xkey, BJSNetworks[network]);

    if (node.depth > 0) {
        return _getParentFingerprintHex(node.toBase58());
    }

    return node.fingerprint.toString('hex');
};

const _getParentFingerprintHex = (xkey: string): string => {
    const decoded = b58.decode(xkey);

    return Buffer.from(decoded.slice(5, 9)).toString('hex');
};
