export const parseInput = async (..._args: any[]): Promise<any> => ({});
export const withdrawLnurl = async (..._args: any[]): Promise<any> => ({});
export const parseInvoice = async (..._args: any[]): Promise<any> => ({});
export const nodeInfo = async (..._args: any[]): Promise<any> => ({});
export const openChannelFee = async (..._args: any[]): Promise<any> => ({});
export const prepareOnchainPayment = async (..._args: any[]): Promise<any> => ({});
export const payOnchain = async (..._args: any[]): Promise<any> => ({});
export const connect = async (..._args: any[]): Promise<any> => ({});

export enum InputTypeVariant {
    LnUrlWithdraw = 'LnUrlWithdraw',
    LnUrlPay = 'LnUrlPay',
    Bolt11 = 'Bolt11',
    NodeId = 'NodeId',
    Url = 'Url',
}

export enum LnUrlWithdrawResultVariant {
    Ok = 'Ok',
    Timeout = 'Timeout',
    ErrorStatus = 'ErrorStatus',
}

export enum BreezEventVariant {
    InvoicePaid = 'InvoicePaid',
    PaymentSucceeded = 'PaymentSucceeded',
    PaymentFailed = 'PaymentFailed',
    Synced = 'Synced',
}

export enum SwapAmountType {
    Send = 'Send',
    Receive = 'Receive',
}

export type LnInvoice = any;
export type LnUrlWithdrawRequestData = any;
export type LnUrlErrorData = any;
export type ReverseSwapInfo = any;
export type PrepareOnchainPaymentResponse = any;
