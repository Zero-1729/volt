import * as BIP39 from 'bip39';

export const generateMnemonic = () => {
    return BIP39.generateMnemonic();
};
