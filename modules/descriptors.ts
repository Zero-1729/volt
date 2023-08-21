import * as secp256k1 from '@bitcoinerlab/secp256k1';
import * as descriptors from '@bitcoinerlab/descriptors';

import {BJSNetworks, extendedKeyInfo} from './wallet-defaults';
import {getInfoFromXKey, getRawRootFromXprv} from './wallet-utils';
import {extendedKeyPatternG} from './re';

const validPathTypes: {[index: string]: string} = {
    "m/84'/0'/0'": 'wpkh',
    "m/84'/1'/0'": 'wpkh',
    "m/44'/0'/0'": 'p2pkh',
    "m/44'/1'/0'": 'p2pkh',
    "m/49'/0'/0'": 'shp2wpkh',
    "m/49'/1'/0'": 'shp2wpkh',
};

type DescriptorParts = {
    key: string;
    keyOnly: string;
    type: string;
    network: string;
    fingerprint: string;
    path: string;
    keyPath: string;
    scriptPrefix: string;
    scriptSuffix: string;
    checksum: string;
    isPublic: boolean;
};

const _getDescriptorNetwork = (expression: string) => {
    // extract descriptor key
    const keyMaterial = expression.match(extendedKeyPatternG);

    if (!keyMaterial) {
        throw new Error('Could not get network from descriptor');
    }

    const key = keyMaterial[0];

    // get network from key
    const network = getInfoFromXKey(key).network;

    return BJSNetworks[network];
};

const reformatDescriptorToBDK = (expression: string) => {
    const parsedDescriptor = parseDescriptor(expression);

    if (parsedDescriptor.isPublic) {
        // script([fingerprint+origin path]xkey/keypath)
        return (
            parsedDescriptor.scriptPrefix +
            '[' +
            parsedDescriptor.fingerprint +
            parsedDescriptor.originPath +
            ']' +
            parsedDescriptor.keyOnly +
            parsedDescriptor.keyPath +
            parsedDescriptor.scriptSuffix +
            parsedDescriptor.checksum
        );
    } else {
        // script(xkey/key origin/keypath)
        return (
            parsedDescriptor.scriptPrefix +
            parsedDescriptor.keyOnly +
            parsedDescriptor.path.slice(1) +
            parsedDescriptor.keyPath +
            parsedDescriptor.scriptSuffix +
            parsedDescriptor.checksum
        );
    }
};
// Create a descriptor from ext private key
export const createDescriptorFromXprv = (xprv: string) => {
    // Expects to be given 'xprv' or 'tprv'
    const root = getRawRootFromXprv(xprv);
    const keyInfo = extendedKeyInfo[xprv[0]];

    let descriptor!: string;

    try {
        switch (keyInfo.type) {
            case 'wpkh':
                descriptor = descriptors.scriptExpressions.wpkhBIP32({
                    masterNode: root,
                    network: BJSNetworks[keyInfo.network],
                    account: 0,
                    keyPath: '/0/*',
                    isPublic: false,
                });

                break;
            case 'shp2wpkh':
                descriptor = descriptors.scriptExpressions.shWpkhBIP32({
                    masterNode: root,
                    network: BJSNetworks[keyInfo.network],
                    account: 0,
                    keyPath: '/0/*',
                    isPublic: false,
                });

                break;
        }

        // Clean up descriptor to fit BDK format
        const parsedDescriptor = parseDescriptor(descriptor);

        // wpkh(xprv.../84'/0'/0'/0/*)
        const finalDescriptor =
            parsedDescriptor.scriptPrefix +
            parsedDescriptor.keyOnly +
            parsedDescriptor.path.slice(1) +
            parsedDescriptor.keyPath +
            parsedDescriptor.scriptSuffix;

        return finalDescriptor;
    } catch (e: any) {
        throw new Error(e.message);
    }
};

// Get descriptor components
// Descriptor format:
// {script}({fingerprint/path}?{xprv/xpub}{key path | (key path + path)})#checksum
export const parseDescriptor = (expression: string) => {
    const descriptor = descriptors.DescriptorsFactory(secp256k1);

    const network = _getDescriptorNetwork(expression);

    var descriptorObj!: any;

    try {
        descriptorObj = descriptor.expand({
            expression: expression,
            network: network,
        });
    } catch (e: any) {
        if (e.message.includes('invalid descriptor checksum')) {
            throw new Error('Invalid descriptor checksum');
        }

        throw new Error('Could not parse descriptor');
    }

    const descObjmap = descriptorObj.expansionMap['@0'];

    // For now, we only support single key descriptors
    const partsByLeftBrace = expression.split('(');
    const partsByRightBrace = expression.split(')');

    var descriptorType!: string;
    var extractedPath = descObjmap?.path
        ?.split('/')
        .splice(0, 4)
        .join('/')
        .replace(/h/g, "'");

    try {
        descriptorType = validPathTypes[extractedPath];
    } catch (e: any) {
        throw new Error('Descriptor contains an invalid wallet type');
    }

    const scripts =
        partsByLeftBrace.length === 3
            ? [partsByLeftBrace[0], partsByLeftBrace[1]]
            : [partsByLeftBrace[0]];

    // Take out fingerprint + path prefix
    const prefixStrippedKey = descObjmap?.keyExpression
        .split(']')
        .slice(1)
        .join('');

    return {
        key: prefixStrippedKey,
        keyOnly: descObjmap?.bip32?.toBase58(),
        type: descriptorType,
        network:
            descObjmap?.bip32?.network.bech32 === 'bc' ? 'bitcoin' : 'testnet',
        // get fingerprint provided by descriptor
        fingerprint: descObjmap?.masterFingerprint
            ? descObjmap?.masterFingerprint.toString('hex')
            : descObjmap?.bip32?.fingerprint.toString('hex'),
        path: descObjmap?.path.split('/').splice(0, 4).join('/'),
        originPath: descObjmap?.originPath,
        keyPath: '/' + descObjmap?.path.split('/').splice(4).join('/'),
        scriptPrefix: scripts.join('(') + '(',
        scriptSuffix: scripts.length === 3 ? '))' : ')',
        checksum:
            partsByRightBrace.slice(-1)[0][0] === '#'
                ? partsByRightBrace.slice(-1)[0]
                : '',
        isPublic: descObjmap?.bip32?.privateKey === undefined,
    };
};

export const includeDescriptorKeyPath = (descriptorObject: DescriptorParts) => {
    return `${descriptorObject.scriptPrefix}[${
        descriptorObject.fingerprint
    }${descriptorObject.path.slice(1)}]${descriptorObject.key}/0/*${
        descriptorObject.scriptSuffix
    }${descriptorObject.checksum}`;
};
