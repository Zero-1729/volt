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
    TDescriptorSymbols,
    TMiniWallet,
    TNetwork,
    TTransaction,
    TWalletType,
    TInvoiceData,
} from '../types/wallet';
import {EBackupMaterial, ENet} from '../types/enums';

import {
    validExtendedKeyPrefixes,
    BJSNetworks,
    extendedKeyInfo,
    WalletPaths,
} from './wallet-defaults';

import {
    descriptorRegex,
    xprvPattern,
    xpubPattern,
    extendedKeyPattern,
} from './re';

const prefixInfo: {[index: string]: {network: string; type: string}} = {
    '1': {network: 'bitcoin', type: 'p2pkh'},
    // Handle special case
    // P2TR -> bc1p
    // WPKH -> bc1q
    bc1q: {network: 'bitcoin', type: 'wpkh'},
    bc1p: {network: 'bitcoin', type: 'p2tr'},
    '3': {network: 'bitcoin', type: 'shp2wpkh'},
    m: {network: 'testnet', type: 'p2pkh'},
    tb1q: {network: 'testnet', type: 'wpkh'},
    tb1p: {network: 'testnet', type: 'p2tr'},
    '2': {network: 'testnet', type: 'shp2wpkh'},
};

export const getUniqueTXs = (transactions: TTransaction[]): TTransaction[] => {
    const uniqueTXs: TTransaction[] = [];

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
    return descriptorRegex.test(expression);
};

// Descriptor Symbols
export const descriptorSymbols: TDescriptorSymbols = [
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

export const getExtendedKeyPrefix = (key: string): EBackupMaterial => {
    const prefix = _getPrefix(key);

    if (!isExtendedKey(key)) {
        throw new Error('Invalid extended key');
    }

    if (!validExtendedKeyPrefixes.has(prefix)) {
        throw new Error('Unsupported extended key');
    }

    return prefix.slice(1) === 'pub'
        ? EBackupMaterial.Xpub
        : EBackupMaterial.Xprv;
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

    return extendedKeyInfo[prefix[0]];
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

// Detect whether address valid bitcoin address
export const isValidAddress = (address: string): boolean => {
    try {
        bitcoin.address.fromBech32(address);
        return true;
    } catch (e) {
        return false;
    }
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
export const convertXKey = (xkey: string, key_prefix: string): string => {
    // Grab new xkey version to convert to
    const ver = validExtendedKeyPrefixes.get(key_prefix);
    const keyType = key_prefix === 'pub' ? 'public' : 'private';

    // Make sure the version is a valid one we support
    if (!ver) {
        throw new Error(`Invalid extended ${keyType} key version`);
    }

    try {
        // Get the decoded key from trimmed xkey
        const decoded = _deserializeExtendedKeyCheck(xkey.trim());

        // Cut off prefix to include new xkey version
        const data = decoded.subarray(4);

        // Re-attach data with new prefix
        const xKey = Buffer.concat([Buffer.from(ver, 'hex'), data]);

        // Return new Base58 formatted key
        return b58c.encode(xKey);
    } catch (e) {
        // Assume an invalid key if unable to disassemble and re-assemble
        throw new Error(`Invalid extended ${keyType} key`);
    }
};

const _get256Checksum = (data: string): string => {
    const hashed_data = _doubleSha256(Buffer.from(data, 'hex'));

    return hashed_data.slice(0, 4).toString('hex');
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

export const getRawRootFromXprv = (xprv: string) => {
    const network = extendedKeyInfo[xprv[0]].network;

    return bip32.fromBase58(normalizeExtKey(xprv, 'prv'), BJSNetworks[network]);
};

export const generateRootFromXKey = (
    xkey: string,
    net: string,
    addressPath: string,
): BIP32Interface => {
    const prefix = getExtendedKeyPrefix(xkey);
    let key = xkey;

    // We must normalize the xpub for bitcoinjs-lib
    if (prefix === EBackupMaterial.Xpub) {
        key = normalizeExtKey(xkey, 'pub');
    }

    let root = bip32.fromBase58(key, BJSNetworks[net]);

    // Check that xpub given is three levels deep
    if (prefix === EBackupMaterial.Xpub) {
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
    if (prefix === EBackupMaterial.Xprv) {
        root = root.derivePath(addressPath);
    }

    return root;
};

export const generateRootFromMnemonic = (
    mnemonic: string,
    path: string,
    net: string,
): BIP32Interface => {
    const seed = mnemonicToSeedSync(mnemonic);
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
    mnemonic: string,
): string => {
    const pubKey = generateRootFromMnemonic(mnemonic, addressPath, net);

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
        case 'p2pkh':
            const P2PKData = bitcoin.payments.p2pkh({
                pubkey: keyPair.publicKey,
                network,
            });

            address = P2PKData.address;
            break;

        case 'shp2wpkh':
            const P2SHData = bitcoin.payments.p2sh({
                redeem: bitcoin.payments.p2wpkh({
                    pubkey: keyPair.publicKey,
                    network,
                }),
                network,
            });

            address = P2SHData.address;
            break;
        case 'wpkh':
            const P2WPKHData = bitcoin.payments.p2wpkh({
                pubkey: keyPair.publicKey,
                network,
            });

            address = P2WPKHData.address;
            break;
        case 'p2tr':
            // Initialize ecc library
            bitcoin.initEccLib(ecc);

            // drop the DER header byte to get internal pubkey
            const internalPubKey = keyPair.publicKey.subarray(1, 33);

            const P2TRData = bitcoin.payments.p2tr({
                internalPubkey: internalPubKey,
                network: network,
            });

            address = P2TRData.address;
            break;
    }

    return address;
};

export const getMetaFromMnemonic = (
    mnemonic: string,
    walletPath: string,
    network: TNetwork,
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

export const getPubKeyFromXprv = (xprv: string, network: ENet) => {
    const keyInfo = extendedKeyInfo[_getPrefix(xprv)[0]];
    const key = normalizeExtKey(xprv, 'prv');

    const derivationPath = WalletPaths[keyInfo.type][network];

    let node = bip32.fromBase58(key, BJSNetworks[network]);

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

export const getFingerprintFromXkey = (xkey: string, network: ENet) => {
    // Normalize ext key in case of exotic key
    const normalizeSuffix =
        getExtendedKeyPrefix(xkey) === EBackupMaterial.Xpub ? 'pub' : 'prv';
    const key = normalizeExtKey(xkey, normalizeSuffix);

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

export const normalizeExtKey = (xkey: string, key_type: string) => {
    const network = extendedKeyInfo[_getPrefix(xkey)[0]].network;

    // Bitcoinjs-lib & BDK only support tpub/prv and xpub/prv prefixes
    // Convert exotic prefixes to tpub/prv or xpub/prv
    if (['u', 'v', 'y', 'z'].includes(xkey[0])) {
        const convertedKey = convertXKey(
            xkey,
            network === 'testnet' ? `t${key_type}` : `x${key_type}`,
        );

        return convertedKey;
    }

    return xkey;
};

export const getMiniWallet = (wallet: TWalletType) => {
    const balance = wallet.balance.toNumber();

    return {
        name: wallet.name,
        type: wallet.type,
        network: wallet.network,
        balance: balance,
        privateDescriptor: wallet.privateDescriptor,
        externalDescriptor: wallet.externalDescriptor,
        internalDescriptor: wallet.internalDescriptor,
        xpub: wallet.xpub,
    };
};

export const canSendToInvoice = (
    invoice: TInvoiceData,
    miniWallet: TMiniWallet,
): Boolean => {
    // check that network matches
    // Handle special case for WPKH & P2TR
    const prefixTip = invoice.address[0];
    const prefixStub =
        prefixTip === 'b' || prefixTip === 't'
            ? invoice.address.slice(0, 4)
            : prefixTip;
    const invoicePrefixInfo = prefixInfo[prefixStub];

    switch (invoicePrefixInfo?.type) {
        case 'p2pkh':
            // Can send to p2pkh if wallet is shp2wpkh, wpkh, p2tr, or p2pkh
            return (
                miniWallet.network === invoicePrefixInfo.network &&
                (miniWallet.type === invoicePrefixInfo.type ||
                    miniWallet.type === 'shp2wpkh' ||
                    miniWallet.type === 'wpkh' ||
                    miniWallet.type === 'p2tr')
            );
        case 'shp2wpkh':
            // Can send to shp2wpkh if wallet is wpkh, shp2wpkh, or p2tr
            return (
                miniWallet.network === invoicePrefixInfo.network &&
                (miniWallet.type === invoicePrefixInfo.type ||
                    miniWallet.type === 'wpkh' ||
                    miniWallet.type === 'p2tr')
            );
        case 'wpkh':
            // Can send to wpkh if wallet is shp2wpkh, wpkh, or p2tr
            return (
                miniWallet.network === invoicePrefixInfo.network &&
                (miniWallet.type === invoicePrefixInfo.type ||
                    miniWallet.type === 'shp2wpkh' ||
                    miniWallet.type === 'p2tr')
            );
        case 'p2tr':
            // Can send to p2tr if wallet is p2tr, wpkh, or shp2wpkh
            return (
                miniWallet.network === invoicePrefixInfo.network &&
                (miniWallet.type === invoicePrefixInfo.type ||
                    miniWallet.type === 'shp2wpkh' ||
                    miniWallet.type === 'wpkh' ||
                    miniWallet.type === 'p2tr')
            );
    }

    return false;
};

// We assume the bare minimum wallet material is an xpub
export const doesWalletExist = (
    xpub: string,
    wallets: any, // Assumes a list of objects with at least 'xpub' property
) => {
    return wallets.some((wallet: any) => wallet.xpub === xpub);
};
