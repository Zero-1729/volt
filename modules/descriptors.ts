import * as secp256k1 from '@bitcoinerlab/secp256k1';
import * as descriptors from '@bitcoinerlab/descriptors';

import {BJSNetworks} from './wallet-defaults';
import {getInfoFromXKey} from './wallet-utils';
import {extendedKeyPatternG} from './re';

const validPathTypes: {[index: string]: string} = {
    "m/84'/0'/0'": 'bech32',
    "m/84'/1'/0'": 'bech32',
    "m/44'/0'/0'": 'legacy',
    "m/44'/1'/0'": 'legacy',
    "m/49'/0'/0'": 'p2sh',
    "m/49'/1'/0'": 'p2sh',
};

const _getDescriptorNetwork = (expression: string) => {
    // extract descriptor key
    const keyMaterial = extendedKeyPatternG.exec(expression);

    if (!keyMaterial) {
        throw new Error('Could not get network from descriptor');
    }

    const key = keyMaterial[0];

    // get network from key
    const network = getInfoFromXKey(key).network;

    return BJSNetworks[network];
};

// Get descriptor components
// Descriptor format:
// {script}({fingerprint/path}?{xprv/xpub}{key path | path})#checksum
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
        throw new Error('Could not parse descriptor');
    }

    const descObjmap = descriptorObj.expansionMap['@0'];

    // For now, we only support single key descriptors
    const partsByLeftBrace = expression.split('(');
    const partsByRightBrace = expression.split(')');

    var descriptorType!: string;

    try {
        descriptorType =
            validPathTypes[descObjmap?.path?.split('/').splice(0, 4).join('/')];
    } catch (e: any) {
        throw new Error('Descriptor contains an invalid wallet type');
    }

    const scripts =
        partsByLeftBrace.length === 3
            ? [partsByLeftBrace[0], partsByLeftBrace[1]]
            : [partsByLeftBrace[0]];

    return {
        key: descObjmap?.keyExpression,
        keyOnly: descObjmap?.bip32?.toBase58(),
        type: descriptorType,
        network:
            descObjmap?.bip32?.network.bech32 === 'bc' ? 'bitcoin' : 'testnet',
        fingerprint: descObjmap?.bip32?.fingerprint.toString('hex'),
        path: descObjmap?.path.split('/').splice(0, 4).join('/'),
        keyPath: descObjmap?.path.split('/').splice(4).join('/'),
        scriptPrefix: scripts.join('(') + '(',
        scriptSuffix: scripts.length === 3 ? '))' : ')',
        checksum:
            partsByRightBrace.slice(-1)[0][0] === '#'
                ? partsByRightBrace.slice(-1)[0]
                : '',
        isPublic: descObjmap?.bip32?.privateKey === undefined,
    };
};
