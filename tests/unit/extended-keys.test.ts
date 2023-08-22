import {
    getFingerprintFromXkey,
    convertXKey,
    normalizeExtKey,
} from './../../modules/wallet-utils';
import {extendedKeyPattern} from './../../modules/re';

import {Net} from '../../types/enums';

describe('testing Extended key pattern regex', () => {
    test('extended keys patterns match', () => {
        const xpub =
            'xpub6CmNYqKyLZdq1BsTyixhuNkKoa3Dt6J9pgUXjA742t7b44xAwjXZak6GvYBPda15ZqKkWippbVkCHYvHMQGuuhVsu2ohkgaVioYcNxZmEvH';
        const xpub_too_long =
            'xpub6CmNYqKyLZdq1BsTyixhuNkKoa3Dt6J9pgUXjA742t7b44xAwjXZak6GvYBPda15ZqKkWippbVkCHYvHMQGuuhVsu2ohkgaVioYc000NxZmEvH';
        const xpub_non_standard =
            'xpub6CmNYqKyLZdq1BsTyIxhuNkKoa3Dt6J9pgUXjA742t7b44xAwjXZak6GvYBPda15ZqKkWippbVkCHYvHMQGuuhVsu2ohkgaVioYcNxZmEvH';

        expect(xpub).toMatch(extendedKeyPattern);
        expect(xpub_too_long).not.toMatch(extendedKeyPattern);
        expect(xpub_non_standard).not.toMatch(extendedKeyPattern);
    });
});

describe('testing fingerprint extraction from xpub', () => {
    test('extended fingerprint matches', () => {
        const xpub =
            'tpubD6NzVbkrYhZ4XopgwuDUxX9FnNeZUfidCDusmRfUkzLaVKY2zNNYtqj1frtBbqTSBcHKxsbtUjD4WSDGBwiMn7mLuuWEf5WzvJKMamGNGgG';
        const fingerprint = '188ed79c';

        expect(getFingerprintFromXkey(xpub, Net.Testnet)).toBe(fingerprint);
    });
});

describe('testing extended key version conversions', () => {
    test('extended keys match converted versions', () => {
        const xpub =
            'upub5EEjftjyQwjWrpRDC1LqLj3UJ3n9o3fEr912D2pTueBUjECfZFWEozahAJpmeKp44k5iftgMNoRpKKR4CJXBKrQ4CqfNCgqns87N4vWc9rq';
        const xprv =
            'zprvAWgYBBk7JR8Gk88z9R9VmnMDrtpkoBa9dtf6n42oSR4nmouy26Siju8bdQLf1CG7i9tQcu3RqyxzPhE99n7xgPMXaToxVbpyJEziEbX51Ur';

        const expectedXpub =
            'tpubDD7A78aQaGKQgWBR9GgoAufM95K9cJ8o979yumZGPa51dpK4PSr1pdDwTxnKAYj45Zy3XtyuHtKWfMkMkFcTbzu9sTVwdwxVGFthzgJt14k';
        const expectedXprv =
            'xprv9s21ZrQH143K3XkkUhaFMcADWxXruwb9ofcfDGF2gQK2fcHWWn7bVmpKazRV1NxGtseo7wrJvfFtd811iPHw5uzKqnR7KnBzknsRTS4qALz';

        const convertedXpub = convertXKey(xpub, 'tpub');
        const convertedXprv = convertXKey(xprv, 'xprv');

        // Test normalization fn
        // Only converts if exotic prefix detected
        const normalizedXPKey = normalizeExtKey(xpub, 'pub');

        expect(convertedXpub).toBe(expectedXpub);
        expect(convertedXprv).toBe(expectedXprv);
        expect(normalizedXPKey).toBe(convertedXpub);
    });
});
