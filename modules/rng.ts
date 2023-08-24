/**
 * @fileOverview creates an rng module that will bring all calls to 'crypto'
 * into one place to try and prevent mistakes when touching the crypto code.
 */

import Crypto from 'react-native-quick-crypto';

/**
 * Convert an ArrayBuffer to a hex string
 * @param  {ArrayBuffer} buffer The buffer to convert
 * @return {string}             The hex string
 *
 * @example
 * const hexString = bufferToHex(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).buffer);
 * console.log(hexString);
 * // '00010203040506070809'
 */
export const bufferToHex = (buffer: ArrayBuffer): string => {
    const byteArray = new Uint8Array(buffer);
    let hexString = '';

    for (let i = 0; i < byteArray.byteLength; i++) {
        hexString += ('0' + byteArray[i].toString(16)).slice(-2);
    }

    return hexString;
};

/**
 * Generate cryptographically secure random bytes using RNQC.
 * @param  {number}   size      The number of bytes of randomness
 * @return {Promise.<ArrayBuffer>}   The random bytes
 */
export const randBytes = async (size: number): Promise<ArrayBuffer> => {
    if (size < 1) {
        throw new Error(
            '[Crypto - RandBytes] Requested size must be greater than zero',
        );
    } else {
        return new Promise((resolve, reject) => {
            Crypto.randomBytes(size, (error, buffer) => {
                if (error) {
                    reject(error);
                } else if (!buffer) {
                    reject(
                        new Error(
                            '[Crypto - RandBytes] No buffer was returned',
                        ),
                    );
                } else {
                    resolve(buffer);
                }
            });
        });
    }
};

// Return generated random bytes as a hex string
export const randBytesHex = async (size: number): Promise<string> => {
    const buffer = await randBytes(size);
    return bufferToHex(buffer);
};
