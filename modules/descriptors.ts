import * as secp256k1 from '@bitcoinerlab/secp256k1';
import * as descriptors from '@bitcoinerlab/descriptors';

import {BJSNetworks, extendedKeyInfo, WalletPaths} from './wallet-defaults';
import {getInfoFromXKey, getRawRootFromXprv} from './wallet-utils';
import {extendedKeyPatternG} from './re';

const validPathTypes: {[index: string]: string} = {
    "m/84'/0'/0'": 'wpkh:bitcoin',
    "m/84'/1'/0'": 'wpkh:testnet',
    "m/44'/0'/0'": 'p2pkh:bitcoin',
    "m/44'/1'/0'": 'p2pkh:testnet',
    "m/49'/0'/0'": 'shp2wpkh:bitcoin',
    "m/49'/1'/0'": 'shp2wpkh:testnet',
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

// and only save xprv version (derive 3-depth if masterNode is 0-depth xprv)
export const createDescriptorFromString = (
    expression: string,
): {external: string; internal: string; priv: string} => {
    // TODO: store the private versions of the descriptors
    const parsedDescriptor = parseDescriptor(expression);
    let xpub!: string;

    if (!parsedDescriptor.keyPath) {
        throw new Error('Descriptor must have a key path');
    }

    if (parsedDescriptor.keyPath.includes('1')) {
        throw new Error('Descriptor must be external key path (0/*)');
    }

    let strippedDescriptor: string = expression.includes('#')
        ? expression.slice(0, -9)
        : expression;
    let external: string = strippedDescriptor;
    let internal: string = strippedDescriptor;
    let priv: string = strippedDescriptor;

    // Get the public key if xprv descriptor
    if (!parsedDescriptor.isPublic) {
        const xprv = getRawRootFromXprv(parsedDescriptor.keyOnly);

        if (xprv.depth > 3) {
            throw new Error('xprv descriptor must be depth of 3 or 0');
        }

        // Clean up derivation path
        if (xprv.depth === 0) {
            xpub = xprv.derivePath(parsedDescriptor.path).neutered().toBase58();
        }

        if (xprv.depth === 3) {
            xpub = xprv.neutered().toBase58();
        }

        // Replace xprv with xpub
        strippedDescriptor = strippedDescriptor.replace(
            extendedKeyPatternG,
            xpub,
        );

        // Reformat to public descriptor format
        // script(xpub/key origin/keypath)
        strippedDescriptor = reformatDescriptorToBDK(strippedDescriptor);
    }

    // Update external if xpub-based
    external = strippedDescriptor;
    // Manipulate internal descriptor key path
    internal = strippedDescriptor.replace('0/*', '1/*');

    // Re-include checksums
    internal = internal + '#' + descriptors.checksum(internal);
    external = external + '#' + descriptors.checksum(external);
    priv = priv + '#' + descriptors.checksum(priv);

    // Reformat to private descriptor format if xprv-based descriptor
    // We assume the descriptor has keypath in it
    // wpkh(xprv.../84'/0'/0'/0/*)
    return {
        external: reformatDescriptorToBDK(external),
        internal: reformatDescriptorToBDK(internal),
        priv: reformatDescriptorToBDK(priv),
    };
};

// Create a descriptor from ext private key
export const createDescriptorFromXprv = (
    xprv: string,
): {external: string; internal: string; priv: string} => {
    // TODO: store the private versions of the descriptors
    // Expects to be given 'xprv' or 'tprv'
    const root = getRawRootFromXprv(xprv);
    const keyInfo = extendedKeyInfo[xprv[0]];

    let descriptorExternal!: string;
    let descriptorInternal!: string;
    let descriptorPrivate!: string;

    let External!: string;
    let Internal!: string;
    let Private!: string;

    // Only push it through
    if (root.depth === 0) {
        try {
            switch (keyInfo.type) {
                case 'wpkh':
                    descriptorPrivate = descriptors.keyExpressionBIP32({
                        masterNode: root,
                        originPath: WalletPaths.wpkh[keyInfo.network].slice(1),
                        keyPath: '/0/*',
                        isPublic: false,
                    });

                    descriptorExternal = descriptors.keyExpressionBIP32({
                        masterNode: root,
                        originPath: WalletPaths.wpkh[keyInfo.network].slice(1),
                        keyPath: '/0/*',
                        isPublic: true,
                    });

                    descriptorInternal = descriptors.keyExpressionBIP32({
                        masterNode: root,
                        originPath: WalletPaths.wpkh[keyInfo.network].slice(1),
                        keyPath: '/1/*',
                        isPublic: true,
                    });

                    // wrap descriptor in script
                    descriptorPrivate = `wpkh(${descriptorPrivate})`;
                    descriptorExternal = `wpkh(${descriptorExternal})`;
                    descriptorInternal = `wpkh(${descriptorInternal})`;

                    break;
                case 'shp2wpkh':
                    descriptorPrivate = descriptors.keyExpressionBIP32({
                        masterNode: root,
                        originPath:
                            WalletPaths.shp2wpkh[keyInfo.network].slice(1),
                        keyPath: '/0/*',
                        isPublic: false,
                    });

                    descriptorExternal = descriptors.keyExpressionBIP32({
                        masterNode: root,
                        originPath:
                            WalletPaths.shp2wpkh[keyInfo.network].slice(1),
                        keyPath: '/0/*',
                        isPublic: true,
                    });

                    descriptorInternal = descriptors.keyExpressionBIP32({
                        masterNode: root,
                        originPath:
                            WalletPaths.shp2wpkh[keyInfo.network].slice(1),
                        keyPath: '/1/*',
                        isPublic: true,
                    });

                    // wrap descriptor in script
                    descriptorPrivate = `sh(wpkh(${descriptorPrivate}))`;
                    descriptorExternal = `sh(wpkh(${descriptorExternal}))`;
                    descriptorInternal = `sh(wpkh(${descriptorInternal}))`;

                    break;
            }

            // Clean up descriptor to fit BDK format
            // wpkh(xprv.../84'/0'/0'/0/*)
            descriptorPrivate = reformatDescriptorToBDK(descriptorPrivate);
            descriptorExternal = reformatDescriptorToBDK(descriptorExternal);
            descriptorInternal = reformatDescriptorToBDK(descriptorInternal);

            // Re-include appropriate checksums
            descriptorPrivate =
                descriptorPrivate +
                '#' +
                descriptors.checksum(descriptorPrivate);
            descriptorExternal =
                descriptorExternal +
                '#' +
                descriptors.checksum(descriptorExternal);
            descriptorInternal =
                descriptorInternal +
                '#' +
                descriptors.checksum(descriptorInternal);

            Private = descriptorPrivate;
            External = descriptorExternal;
            Internal = descriptorInternal;
        } catch (e: any) {
            throw new Error(e.message);
        }
    } else {
        // Reformat single Shot
        const xpub = root.neutered().toBase58();

        switch (keyInfo.type) {
            case 'wpkh':
                descriptorPrivate =
                    'wpkh' +
                    '(' +
                    xprv +
                    WalletPaths.wpkh[keyInfo.network].slice(1) +
                    '/0/*)';
                descriptorExternal =
                    'wpkh' +
                    '(' +
                    xpub +
                    WalletPaths.wpkh[keyInfo.network].slice(1) +
                    '/0/*)';
                descriptorInternal =
                    'wpkh' +
                    '(' +
                    xpub +
                    WalletPaths.wpkh[keyInfo.network].slice(1) +
                    '/1/*)';

                break;
            case 'shp2wpkh':
                descriptorPrivate =
                    'sh(wpkh' +
                    '(' +
                    xprv +
                    WalletPaths.shp2wpkh[keyInfo.network].slice(1) +
                    '/0/*))';
                descriptorExternal =
                    'sh(wpkh' +
                    '(' +
                    xpub +
                    WalletPaths.shp2wpkh[keyInfo.network].slice(1) +
                    '/0/*))';
                descriptorInternal =
                    'sh(wpkh' +
                    '(' +
                    xpub +
                    WalletPaths.shp2wpkh[keyInfo.network].slice(1) +
                    '/1/*))';

                break;
        }

        // Reformat to BDK format
        descriptorPrivate = reformatDescriptorToBDK(descriptorPrivate);
        descriptorExternal = reformatDescriptorToBDK(descriptorExternal);
        descriptorInternal = reformatDescriptorToBDK(descriptorInternal);

        // Re-include checksums
        descriptorPrivate =
            descriptorPrivate + '#' + descriptors.checksum(descriptorPrivate);
        descriptorExternal =
            descriptorExternal + '#' + descriptors.checksum(descriptorExternal);
        descriptorInternal =
            descriptorInternal + '#' + descriptors.checksum(descriptorInternal);

        // Ready to shoot
        Private = descriptorPrivate;
        External = descriptorExternal;
        Internal = descriptorInternal;
    }

    return {
        priv: Private,
        external: External,
        internal: Internal,
    };
};

// Get descriptor components
// Descriptor format:
// {script}({fingerprint/path}?{xprv/xpub}{key path | (key path + path)})#checksum
export const parseDescriptor = (expression: string) => {
    // Rule of thumb is to always use the info from the descriptor
    // such as network, fingerprint, and path
    // before we look into meta info from extended keys.
    const descriptor = descriptors.DescriptorsFactory(secp256k1);

    // To check for network mismatch
    let networkFromPath = '';
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

        // Check if descriptor has a malformed checksum
        // i.e. whether too long or short
        if (expression.includes('#')) {
            // We report accordingly based on the length of the checksum
            const checksumLength = expression.split('#')[1].length;

            throw new Error(
                `Checksum is ${checksumLength < 9 ? 'incomplete' : 'too long'}`,
            );
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
        const splitDescriptorType = validPathTypes[extractedPath].split(':');

        networkFromPath = splitDescriptorType[1];
        descriptorType = splitDescriptorType[0];
    } catch (e: any) {
        // Report error if no valid path type is found
        // e.g. malformed path like m/0/* or m/84'/0/* from above step
        if (!extractedPath.includes('h') && !extractedPath.includes("'")) {
            throw new Error('Detected a missing wallet path');
        } else {
            // If descriptor type is not supported
            throw new Error('Detected an invalid wallet path');
        }
    }

    // Report if there is a mismatch between the descriptor's path network
    // and the network decoded from its extended key
    if (networkFromPath[0] !== network.bech32[0]) {
        throw new Error('Descriptor extended key and path network mismatch');
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
        originPath: descObjmap?.originPath
            ? descObjmap?.originPath
            : descObjmap?.path.split('/').splice(0, 4).join('/').slice(1),
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
