// Set of wallet default aliases, metadata, and types
import {ENet} from './../types/enums';
import {TAccountPaths, TExtendedKeyInfo} from '../types/wallet';

export const validWalletTypes = [
    'p2tr',
    'wpkh',
    'shp2wpkh',
    'p2pkh',
    'unified',
];

// Wallet name aliases
export const WalletTypeDetails: {[index: string]: string[]} = {
    unified: ['Lightning', 'bc1p', 'bc1p'],
    p2tr: ['Taproot', 'bc1p...', 'tb1p...'],
    wpkh: ['Native Segwit', 'bc1q...', 'tb1q...'],
    p2pkh: ['Legacy', '1...', 'm...'],
    shp2wpkh: ['Segwit', '3...', '2...'],
};

// Descriptor type reverse aliases
export const DescriptorType: {[index: string]: string} = {
    unified: 'Lightning',
    p2tr: 'P2TR',
    wpkh: 'WPKH',
    p2pkh: 'P2PKH',
    shp2wpkh: 'P2SH-P2WPKH',
};

// PATH DEFINITIONS

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
export const WalletPaths: {[index: string]: TAccountPaths} = {
    // Experimental
    unified: {bitcoin: "m/86'/0'/0'", testnet: "m/86'/1'/0'"},
    p2tr: {bitcoin: "m/86'/0'/0'", testnet: "m/86'/1'/0'"},
    wpkh: {bitcoin: "m/84'/0'/0'", testnet: "m/84'/1'/0'"},
    p2pkh: {bitcoin: "m/44'/0'/0'", testnet: "m/44'/1'/0'"},
    shp2wpkh: {bitcoin: "m/49'/0'/0'", testnet: "m/49'/1'/0'"},
};

// Network definitions
// BitcoinJS Networks
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

// Extended Key Definitions
// Version bytes as described here:
// https://github.com/satoshilabs/slips/blob/master/slip-0132.md
/*
    Coin	          Public Key	    Private Key	      Address Encoding	                BIP 32 Path
    --------------    ---------------    ------------     ------------------------------    ------------------------
    Bitcoin	          0488b21e - xpub   0488ade4 - xprv	  P2PKH  or P2SH (defaults P2TR)	(defaults to m/86'/0')
    Bitcoin	          049d7cb2 - ypub   049d7878 - yprv	  P2WPKH in P2SH	                m/49'/0'
    Bitcoin	          04b24746 - zpub   04b2430c - zprv	  P2WPKH	                        m/84'/0'
    Bitcoin	          0295b43f - Ypub   0295b005 - Yprv	  Multi-signature P2WSH in P2SH	    -
    Bitcoin	          02aa7ed3 - Zpub   02aa7a99 - Zprv	  Multi-signature P2WSH	            -

    Bitcoin Testnet	  043587cf - tpub	04358394 - tprv	  P2PKH  or P2SH (default P2TR)	    (defaults to m/86'/1')
    Bitcoin Testnet	  044a5262 - upub	044a4e28 - uprv	  P2WPKH in P2SH	                m/49'/1'
    Bitcoin Testnet	  045f1cf6 - vpub	045f18bc - vprv	  P2WPKH	                        m/84'/1'
    Bitcoin Testnet	  024289ef - Upub	024285b5 - Uprv	  Multi-signature P2WSH in P2SH     -
    Bitcoin Testnet	  02575483 - Vpub	02575048 - Vprv   Multi-signature P2WSH	            -
*/
// Note: Currently do not support Y/Z and T/U/V privs and pubs
export const validExtendedKeyPrefixes = new Map([
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

// Supported extended key versions
export const supportedExtVersions = ['x', 'y', 'z', 't', 'u', 'v'];

// Supported extended key version metadata definitions
export const extendedKeyInfo: {[index: string]: TExtendedKeyInfo} = {
    // mainnet / bitcoin
    x: {network: ENet.Bitcoin, type: 'p2tr'}, // Account path P2PKH only possible to import via descriptors; WPKH only possible to import via descriptors and zprv/pub
    y: {network: ENet.Bitcoin, type: 'shp2wpkh'}, // Account path P2SH(P2WPKH(...)) [3...]
    z: {network: ENet.Bitcoin, type: 'wpkh'}, // Account path P2WPKH [bc1...]

    // testnet
    t: {network: ENet.Testnet, type: 'p2tr'}, // Account path P2PKH only possible to import via descriptors; WPKH only possible to import via descriptors and zprv/pub
    u: {network: ENet.Testnet, type: 'shp2wpkh'}, // Account path P2SH(P2WPKH(...)) [3...]
    v: {network: ENet.Testnet, type: 'wpkh'}, // Account path P2WPKH [bc1...]
};

// Wallet Gap Limit
export const GAP_LIMIT = 20;

// Dust limit
export const DUST_LIMIT = 546;

// Wallet name character limit
export const WALLET_NAME_LENGTH = 15;

// Default wallet type
export const DEFAULT_WALLET_TYPE = 'unified';

// Balance minimums for inwallet swaps (sats)
export const LIGHTNING_SWAP_BALANCE_MIN = 50000; // Boltz
export const ONCHAIN_SWAP_BALANCE_MIN = 21000; // Boltz

export const electrumServerList = [
    // Blockstream
    {
        testnet: 'ssl://electrum.blockstream.info:60002',
        bitcoin: 'ssl://electrum.blockstream.info:50002',
    },
    // LukeChilds
    {
        testnet: 'ssl://bitcoin.lu.ke:60002',
        bitcoin: 'ssl://bitcoin.lu.ke:50002',
    },
    // Emzy
    {
        testnet: 'ssl://https://electrum.emzy.de:60002',
        bitcoin: 'ssl://https://electrum.emzy.de:50002',
    },
    // SethOfPrivacy
    {
        testnet: 'ssl://fulcrum.sethforprivacy.com:60002',
        bitcoin: 'ssl://fulcrum.sethforprivacy.com:50002',
    },
    // Bitaroo
    {
        testnet: 'ssl://electrum.bitaroo.net:60002',
        bitcoin: 'ssl://electrum.bitaroo.net:50002',
    },
];
