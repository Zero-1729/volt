import * as BIP39 from 'bip39';

export const generateMnemonic = () => {
    return BIP39.generateMnemonic();
};

export const validateMnenomic = (mnemonic: string) => {
    const resp = BIP39.validateMnemonic(mnemonic);

    if (!resp) {
        throw new Error('Invalid mnemonic');
    }

    return resp;
};

export const mnemonicToSeedSync = (mnemonic: string) => {
    return BIP39.mnemonicToSeedSync(mnemonic);
};
