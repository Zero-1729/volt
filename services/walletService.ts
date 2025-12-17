import { WalletAPI } from './walletAPI';
import RNFS from 'react-native-fs';

import {
    InputType,
    BreezSdk,
    connect,
    Seed,
    EventListener,
    SdkEvent,
    GetInfoRequest,
    ListPaymentsRequest,
    ListPaymentsResponse,
    PrepareSendPaymentRequest,
    PrepareSendPaymentResponse,
    SendPaymentRequest,
    SendPaymentResponse,
    ReceivePaymentRequest,
    ReceivePaymentResponse,
    PrepareLnurlPayRequest,
    PrepareLnurlPayResponse,
    LnurlPayRequest,
    LnurlPayResponse,
    SdkError,
    SdkError_Tags,
    LightningAddressInfo,
    RegisterLightningAddressRequest,
    RecommendedFees,
} from '@breeztech/breez-sdk-spark-react-native';

// Local SDK instance
let sdk: BreezSdk | null  = null;

const parseSdkError = (error: SdkError): void => {
    try {
        switch (error.tag) {
            case SdkError_Tags.ChainServiceError:
            case SdkError_Tags.Generic:
            case SdkError_Tags.InvalidInput:
            case SdkError_Tags.InvalidUuid:
            case SdkError_Tags.LnurlError:
            case SdkError_Tags.MaxDepositClaimFeeExceeded:
            case SdkError_Tags.NetworkError:
            case SdkError_Tags.SparkError:
            case SdkError_Tags.StorageError:
                console.log(`[WalletAPI] SDK ${error.tag}:`, error.inner);
                throw error.inner;
        }
    } catch {
        throw error;
    }
};

// init Wallet
export const initWallet = async (mnemonic: string, config: any): Promise<void> => {
    // Check if SDK is already initialized
    if (sdk) {
        console.log('[WalletAPI] SDK is already initialized.');
        return;
    }

    const seed = new Seed.Mnemonic({ mnemonic, passphrase: undefined })

    try {
        // TODO: set logger
        sdk = await connect({ config, seed, storageDir: `${RNFS.DocumentDirectoryPath}/volt-${seed.inner}` });
        console.log('[WalletAPI] SDK initialized successfully.');
    } catch (error) {
        if (SdkError.instanceOf(error)) {
            throw parseSdkError(error);
        }

        console.log('[WalletAPI] Error initializing SDK:', error);
        throw error;
    }
};

export const isConnected = (): boolean => {
    return sdk != null;
};
export const disconnectWallet = async (): Promise<void> => {
    if (sdk) {
        try {
            await sdk.disconnect();
            sdk = null;
            console.log('[WalletAPI] SDK disconnected successfully.');
        } catch (error) {
            console.log('[WalletAPI] Error during SDK disconnection:', error);
            throw error;
        }
    }
};

// Event listeners
const addEventListener = async (callback: (event: SdkEvent) => void): Promise<string> => {
    if (!sdk) {
        throw new Error('SDK is not initialized.');
    }

    try {
        const listener: EventListener = {
            onEvent: async (event: SdkEvent) => {
                callback(event);
            }
        };

        const listenerId = await sdk.addEventListener(listener);
        console.log('[WalletAPI] Event listener added with ID:', listenerId);
        return listenerId;
    } catch (error) {
        console.log('[WalletAPI] Error adding event listener:', error);
        throw error;
    }
};
const removeEventListener = async (listenerId: string): Promise<void> => {
    if (!sdk || !listenerId) {
        return;
    }

    try {
        await sdk.removeEventListener(listenerId);
        console.log('[WalletAPI] Event listener removed with ID:', listenerId);
    } catch (error) {
        console.log('[WalletAPI] Error removing event listener ${listenerId}:', error);
        throw error;
    }
};

// Payment methods
const parseInput = async (input: string): Promise<InputType> => {
    if (!sdk) {
        throw new Error('SDK is not initialized.');
    }

    return await sdk.parse(input);
};

const prepareSendPayment = async (params: PrepareSendPaymentRequest): Promise<PrepareSendPaymentResponse> => {
    if (!sdk) {
        throw new Error('SDK is not initialized.');
    }

    return await sdk.prepareSendPayment(params);
}

const sendPayment = async (params: SendPaymentRequest): Promise<SendPaymentResponse> => {
    if (!sdk) {
        throw new Error('SDK is not initialized.');
    }

    return await sdk.sendPayment(params);
};
const receivePayment = async (params: ReceivePaymentRequest): Promise<ReceivePaymentResponse> => {
    if (!sdk) {
        throw new Error('SDK is not initialized.');
    }

    return await sdk.receivePayment(params);
};
const getFeesRecommendations = async (): Promise<RecommendedFees> => {
    if (!sdk) {
        throw new Error('cannot get fees recommendation')
    }

    return await sdk.recommendedFees();
};

const resetLightningAddress = async (): Promise<void> => {
    if (!sdk) {
        throw new Error('Error resetting Lightning Address');
    }

    return await sdk.deleteLightningAddress();
};

const setLightningAddress = async (request: RegisterLightningAddressRequest): Promise<LightningAddressInfo> => {
    if (!sdk) {
        throw new Error('Error setting Lightning Address');
    }

    return await sdk.registerLightningAddress(request);
};

const getLightningAddress = async (): Promise<LightningAddressInfo> => {
    if (!sdk) {
        throw new Error('Error getting Lightning Address');
    }

    const addressInfoOpt = await sdk.getLightningAddress();

    if (addressInfoOpt) {
        return addressInfoOpt;
    } else {
        throw new Error('No Lightning Address set');
    } 
};

// LnURL methods
const prepareLnurlPay = async (params: PrepareLnurlPayRequest): Promise<PrepareLnurlPayResponse> => {
    if (!sdk) {
        throw new Error('SDK is not initialized.');
    }

    return await sdk.prepareLnurlPay(params);
};
const lnurlPay = async (params: LnurlPayRequest): Promise<LnurlPayResponse> => {
    if (!sdk) {
        throw new Error('SDK is not initialized.');
    }

    return await sdk.lnurlPay(params);
};

// Transactions and Wallet Data
const walletInfo = async (synced: boolean = true): Promise<any> => {
    if (!sdk) {
        return null;
    }

    try {
        const request: GetInfoRequest = {ensureSynced: synced};
        return await sdk.getInfo(request);
    } catch (error) {
        console.log('[WalletAPI] Error fetching wallet info:', error);
        throw error;
    }
};
const listPayments = async (): Promise<any[]> => {
    if (!sdk) {
        return [];
    }

    try {
        const request: ListPaymentsRequest = {
            offset: 0,
            limit: 100,
            typeFilter: undefined,
            statusFilter: undefined,
            assetFilter: undefined,
            sparkHtlcStatusFilter: undefined,
            fromTimestamp: undefined,
            toTimestamp: undefined,
            sortAscending: undefined
        };
        const response: ListPaymentsResponse = await sdk.listPayments(request);
        return response.payments;
    } catch (error) {
        console.log('[WalletAPI] Error listing payments:', error);
        throw error;
    }
};

// Utilities & Preferences
const getUserPreferences = async (): Promise<any> => {
    if (!sdk) {
        throw new Error('SDK is not initialized.');
    }

    return await sdk.getUserSettings();
};
const setUserPreferences = async (settings: any): Promise<void> => {
    if (!sdk) {
        throw new Error('SDK is not initialized.');
    }

    return await sdk.updateUserSettings(settings);
};

// Export implemented WalletAPI
export const walletApi: WalletAPI = {
    // Setup and shutdown
    initWallet,
    isConnected,
    disconnectWallet,

    // Events
    addEventListener,
    removeEventListener,

    // Payment methods
    parseInput,
    prepareSendPayment,
    sendPayment,
    receivePayment,

    // LnURL methods
    prepareLnurlPay,
    lnurlPay,

    getFeesRecommendations,
    getLightningAddress,
    setLightningAddress,
    resetLightningAddress,

    // Transactions and Wallet Data
    walletInfo,
    listPayments,

    // Utilities & Preferences
    getUserPreferences,
    setUserPreferences,
};