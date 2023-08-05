import {getFingerprintFromXkey} from './../../modules/wallet-utils';
import {extendedKeyPattern} from './../../modules/re';

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

        expect(getFingerprintFromXkey(xpub, 'testnet')).toBe(fingerprint);
    });
});
