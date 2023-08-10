// Tests to check that descriptors are imported and generated correctly
import {parseDescriptor} from './../../modules/descriptors';

describe('testing descriptor type extraction', () => {
    test('descriptor type matches', () => {
        const descriptor =
            'wpkh([188ed79c/84h/1h/0h]tpubD6NzVbkrYhZ4XopgwuDUxX9FnNeZUfidCDusmRfUkzLaVKY2zNNYtqj1frtBbqTSBcHKxsbtUjD4WSDGBwiMn7mLuuWEf5WzvJKMamGNGgG/0/*)';
        const descriptor_type = 'wpkh';

        const parts = parseDescriptor(descriptor);

        expect(parts.type).toBe(descriptor_type);
    });
});

describe('testing descriptor checksum extraction', () => {
    test('descriptor checksum matches', () => {
        const descriptor =
            "wpkh([c65d79d8/84'/0'/0']xpub6CmNYqKyLZdq1BsTyixhuNkKoa3Dt6J9pgUXjA742t7b44xAwjXZak6GvYBPda15ZqKkWippbVkCHYvHMQGuuhVsu2ohkgaVioYcNxZmEvH/0/*)#ur90lsda";
        const descriptor_checksum = '#ur90lsda';

        const parts = parseDescriptor(descriptor);

        expect(parts.checksum).toBe(descriptor_checksum);
    });
});

describe('testing descriptor fingerprint extraction', () => {
    test('descriptor fingerprint matches', () => {
        const descriptor =
            'wpkh([188ed79c/84h/1h/0h]tpubD6NzVbkrYhZ4XopgwuDUxX9FnNeZUfidCDusmRfUkzLaVKY2zNNYtqj1frtBbqTSBcHKxsbtUjD4WSDGBwiMn7mLuuWEf5WzvJKMamGNGgG/0/*)';
        const descriptor_fingerprint = '188ed79c';

        const parts = parseDescriptor(descriptor);

        expect(parts.fingerprint).toBe(descriptor_fingerprint);
    });
});
