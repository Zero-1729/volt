import type {
  Config,
  GetInfoResponse,
  PrepareSendPaymentRequest,
  PrepareSendPaymentResponse,
  ReceivePaymentRequest,
  ReceivePaymentResponse,
  SendPaymentRequest,
  SendPaymentResponse,
  Payment,
  SdkEvent,
  InputType,
//   LightningAddressInfo,
  PrepareLnurlPayRequest,
  PrepareLnurlPayResponse,
  LnurlPayRequest,
  LnurlPayResponse,
//   DepositInfo,
//   Fee,
  UserSettings,
  UpdateUserSettingsRequest,
  RecommendedFees,
  LightningAddressInfo,
  RegisterLightningAddressRequest,
} from '@breeztech/breez-sdk-spark-react-native';

export interface WalletAPI {
    // Core wallet methods for wallet
    // Initialization, connection and disconnection
    initWallet: (mnemonic: string, config: Config) => Promise<void>;
    isConnected: () => boolean;
    disconnectWallet: () => Promise<void>;

    // Wallet events
    addEventListener: (callback: (event: SdkEvent) => void) => Promise<string>;
    removeEventListener: (listenerId: string) => Promise<void>;

    // Payment methods (parse, send, receive, etc.)
    // Parse input (invoice, LNURL, lightning address, on-chain address)
    parseInput: (input: string) => Promise<InputType>;

    // Payment actions
    prepareSendPayment: (request: PrepareSendPaymentRequest) => Promise<PrepareSendPaymentResponse>;
    sendPayment: (request: SendPaymentRequest) => Promise<SendPaymentResponse>;
    receivePayment: (request: ReceivePaymentRequest) => Promise<ReceivePaymentResponse>;

    // LnURL methods
    prepareLnurlPay: (request: PrepareLnurlPayRequest) => Promise<PrepareLnurlPayResponse>;
    lnurlPay: (request: LnurlPayRequest) => Promise<LnurlPayResponse>;

    // LnURL Utils
    getLightningAddress: () => Promise<LightningAddressInfo>;
    setLightningAddress: (request: RegisterLightningAddressRequest) => Promise<LightningAddressInfo>;
    resetLightningAddress: () => Promise<void>;

    // Transactions and Wallet Data
    walletInfo: () => Promise<GetInfoResponse | null>;
    listPayments: () => Promise<Payment[]>;

    // Utilities & Preferences
    // getSDKLogs: () => Promise<string>;
    getUserPreferences: () => Promise<UserSettings>;
    setUserPreferences: (settings: UpdateUserSettingsRequest) => Promise<void>;

    // Fees
    getFeesRecommendations: () => Promise<RecommendedFees>;

    // TODO: Mnemonic management
};