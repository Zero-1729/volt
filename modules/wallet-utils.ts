import {Buffer} from 'buffer';

import * as bip39 from 'bip39';
import * as b58 from 'bs58';
import * as b58c from 'bs58check';
import * as bitcoin from 'bitcoinjs-lib';

import {BIP32Factory, BIP32Interface} from 'bip32';
import ecc from '@bitcoinerlab/secp256k1';
import BigNumber from 'bignumber.js';

import {WalletTypeDetails, DUST_LIMIT} from './wallet-defaults';

const bip32 = BIP32Factory(ecc);

import {
    listPayments,
    parseInput,
    InputTypeVariant,
} from '@breeztech/react-native-breez-sdk';

import Crypto from 'react-native-quick-crypto';

import {
    TDescriptorSymbols,
    TMiniWallet,
    TNetwork,
    TWalletType,
    TInvoiceData,
    TTransaction,
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
    addressRegex,
} from './re';
import {NetInfoState} from '@react-native-community/netinfo';

export const prefixInfo: {[index: string]: {network: string; type: string}} = {
    '1': {network: ENet.Bitcoin, type: 'p2pkh'},
    // Handle special case
    // P2TR -> bc1p
    // WPKH -> bc1q
    bc1q: {network: ENet.Bitcoin, type: 'wpkh'},
    bc1p: {network: ENet.Bitcoin, type: 'p2tr'},
    '3': {network: ENet.Bitcoin, type: 'shp2wpkh'},
    m: {network: ENet.Testnet, type: 'p2pkh'},
    tb1q: {network: ENet.Testnet, type: 'wpkh'},
    tb1p: {network: ENet.Testnet, type: 'p2tr'},
    '2': {network: ENet.Testnet, type: 'shp2wpkh'},
};

export const getUniqueTXs = (transactions: TTransaction[]): TTransaction[] => {
    const uniqueTXs: TTransaction[] = [];

    transactions.forEach(tx => {
        if (
            !uniqueTXs.some(item =>
                item.isLightning ? item.id === tx.id : item.txid === tx.txid,
            )
        ) {
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
        throw new Error('invalid_ext_key_error');
    }

    if (!validExtendedKeyPrefixes.has(prefix)) {
        throw new Error('unsupported_ext_key_error');
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
    return address.match(addressRegex) !== null;
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
        network === ENet.Bitcoin
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
        case 'unified':
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
            network === ENet.Testnet ? `t${key_type}` : `x${key_type}`,
        );

        return convertedKey;
    }

    return xkey;
};

export const getMiniWallet = (wallet: TWalletType): TMiniWallet => {
    const balance = wallet.balance;

    return {
        name: wallet.name,
        type: wallet.type,
        network: wallet.network,
        balanceOnchain: balance.onchain.toNumber(),
        balanceLightning: balance.lightning.toNumber(),
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
    const prefixTip = invoice.address[0].toLowerCase();
    const prefixStub = (
        prefixTip === 'b' || prefixTip === 't'
            ? invoice.address.slice(0, 4)
            : prefixTip
    ).toLowerCase();
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
            // Can send to p2tr if wallet is p2tr or wpkh
            return (
                miniWallet.network === invoicePrefixInfo.network &&
                (miniWallet.type === invoicePrefixInfo.type ||
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

export const checkNetworkIsReachable = (networkState: NetInfoState) => {
    if (networkState.isInternetReachable === null) {
        return networkState.isConnected === null
            ? true
            : networkState.isConnected;
    } else {
        return networkState.isInternetReachable;
    }
};

// Function to check and report invoice and wallet error for payment
export const checkInvoiceAndWallet = (
    wallet: TMiniWallet,
    invoice: TInvoiceData,
    alert: any,
    singleMode: boolean,
) => {
    const balance = new BigNumber(wallet.balanceOnchain);
    const invoiceHasAmount = !!invoice?.options?.amount;
    const invoiceAmount = new BigNumber(Number(invoice?.options?.amount));

    // Strip out invoice address info
    // Note: convert to lowercase as BIP21 can include upper-cased addresses
    const addressTip = invoice.address[0].toLowerCase();

    const prefixStub =
        addressTip === 'b' || addressTip === 't'
            ? invoice.address.slice(0, 4).toLowerCase()
            : addressTip;
    const addressNetwork =
        prefixInfo[prefixStub].network === ENet.Bitcoin
            ? ENet.Bitcoin
            : ENet.Testnet;
    const addressType = prefixInfo[prefixStub].type;
    const addressTypeName = WalletTypeDetails[addressType][0];

    // Check network
    if (addressNetwork !== wallet.network) {
        alert(`Cannot pay invoice with a ${wallet.network} wallet`);
        return false;
    }

    // Check balance if zero
    if (balance.isZero()) {
        alert(
            `Wallet is empty, add funds to wallet ${
                singleMode ? '' : 'or select a different wallet.'
            }`,
        );
        return false;
    }

    // Check against dust limit
    if (
        invoiceHasAmount &&
        invoiceAmount.multipliedBy(100000000).isLessThanOrEqualTo(DUST_LIMIT)
    ) {
        alert('Invoice amount is below dust limit');
        return false;
    }

    // Check balance if too broke
    if (
        invoiceHasAmount &&
        invoiceAmount
            .multipliedBy(100000000)
            .isGreaterThan(wallet.balanceOnchain)
    ) {
        alert(
            `Wallet balance insufficient, add funds to wallet ${
                singleMode ? '' : 'or select a different wallet.'
            }`,
        );
        return false;
    }

    // Check can pay invoice with wallet
    // Check can send to address
    if (!canSendToInvoice(invoice, wallet)) {
        alert(`Wallet cannot pay to a ${addressTypeName} address`);
        return false;
    }

    return true;
};

export const getLNPayments = async (
    txCount: number,
): Promise<TTransaction[]> => {
    const payments = await listPayments({
        // TODO: figure out a more sane option for this
        limit: txCount + 10,
    });

    let txs: TTransaction[] = [];

    for (let i = 0; i < payments.length; i++) {
        txs.push({...payments[i], isLightning: true} as TTransaction);
    }

    // Return formatted LN payments
    return txs;
};

// Get seconds left until invoice expires
export const getInvoiceExpiryLeft = (
    timestamp: number,
    expiry: number,
): number => {
    return Math.floor(timestamp + expiry - +new Date() / 1_000);
};

export const isInvoiceExpired = (
    timestamp: number,
    expiry: number,
): boolean => {
    const timeElapsed = getInvoiceExpiryLeft(timestamp, expiry);

    return timeElapsed <= 0;
};

// Get countdown start
export const getCountdownStart = (timestamp: number, expiry: number) => {
    return Math.floor(timestamp + expiry - +new Date() / 1_000);
};

// Function for syncing and returning new BDK wallet balance and Breez balance

// Function for syncing and returning new BDK wallet and Breez transactions

const determinLnType = async (
    invoice: string,
): Promise<{
    type: string;
    invoice: string;
    invalid: boolean;
    spec: string;
}> => {
    const specType = await parseInput(invoice);
    let spec = '';

    switch (specType.type) {
        case InputTypeVariant.BOLT11:
            spec = 'bolt11';
            break;
        case InputTypeVariant.LN_URL_PAY:
        case InputTypeVariant.LN_URL_WITHDRAW:
        case InputTypeVariant.LN_URL_AUTH:
            spec = 'lnurl';
            break;
        default:
            return {
                type: 'unsupported',
                invoice: invoice,
                invalid: true,
                spec: spec,
            };
    }

    return {
        type: 'lightning',
        invoice: invoice,
        invalid: false,
        spec: spec,
    };
};

export const decodeInvoiceType = async (
    invoice: string,
): Promise<{
    type: string;
    spec?: string;
    invoice: string;
    invalid: boolean;
}> => {
    if (invoice.startsWith('bitcoin:')) {
        return {
            type: 'bitcoin',
            spec: 'bip21',
            invoice: invoice,
            invalid: false,
        };
    }

    // Check LN
    if (
        invoice.startsWith('lnbc') ||
        invoice.startsWith('lnurl') ||
        invoice.startsWith('lightning')
    ) {
        const determinedLnType = await determinLnType(invoice);

        return determinedLnType;
    }

    return {
        type: 'unsupported',
        invoice: invoice,
        invalid: true,
    };
};
