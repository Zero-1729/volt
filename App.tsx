/* eslint-disable react-hooks/exhaustive-deps */
import 'react-native-gesture-handler';

import React, {
    ReactElement,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import {StatusBar, useColorScheme, NativeModules, Platform, View, StyleSheet} from 'react-native';

import {AppStorageContext} from './class/storageContext';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {WalletProvider, useWallet} from './contexts/walletContext'
import { _BREEZ_SDK_SPARK_API_ } from './modules/env';

import i18n from './i18n';

import Privacy from 'react-native-privacy-snapshot';

import RootNavigator from './Navigation';
import OnboardingNavigator from './navigation/onboarding/OnboardingNavigator';
import Color from './constants/Color';
import { defaultConfig, Network, PaymentType, SdkEvent, SdkEvent_Tags } from '@breeztech/breez-sdk-spark-react-native';

const App = () => {
    const ColorScheme = Color(useColorScheme());

    return (
        <SafeAreaProvider
            style={{backgroundColor: ColorScheme.Background.Primary}}>
            <StatusBar
                barStyle={
                    ColorScheme.isDarkMode ? 'light-content' : 'dark-content'
                }
                backgroundColor={ColorScheme.Background.Primary}
            />
            <WalletProvider>
                <AppContent />
            </WalletProvider>
        </SafeAreaProvider>
    );
};

const AppContent = () => {
    const {
        getWalletData,
        currentWalletID,
        setBreezEvent,
    } = useContext(AppStorageContext);
    const [isReady, setIsReady] = useState<boolean>(false);
    const _wallet = getWalletData(currentWalletID);

    const wallet = useWallet();

    const {appLanguage, isWalletInitialized} = useContext(AppStorageContext);

    const RootScreen = useCallback((): ReactElement => {
        if (!isReady) {
            return <></>;
        }

        if (!isWalletInitialized) {
            return <OnboardingNavigator />;
        }


        return <RootNavigator />;
    }, [isReady, isWalletInitialized]);

    useEffect(() => {
        // Enable privacy blur for IOS; blur screen when screen inactive
        Privacy?.enabled(true);

        if (Platform.OS === 'android') {
            setTimeout(NativeModules.SplashScreenModule.hide, 100);
        }

        const initNode = async () => {
            console.log('Initializing node...');
            if (isWalletInitialized && _wallet.type === 'unified') {
                if (wallet.isConnected()) {
                    console.log('Wallet already connected.');
                    return
                }

                const breezAPIKey = _BREEZ_SDK_SPARK_API_?.trim();
                if (!breezAPIKey) {
                    console.log('Breez API key is not set. Cannot connect to node.');
                    return;
                }

                class onBreezEventListener {
                    onEvent = async (event: SdkEvent) => {
                        if (event.tag === SdkEvent_Tags.Synced) {
                            // Data has been synchronized with the network. When this event is received,
                            // it is recommended to refresh the payment list and wallet balance.
                            console.log('[Breez SDK] Synced');
                        } else if (event.tag === SdkEvent_Tags.UnclaimedDeposits) {
                            // SDK was unable to claim some deposits automatically
                            // const unclaimedDeposits = event.inner.unclaimedDeposits
                        } else if (event.tag === SdkEvent_Tags.ClaimedDeposits) {
                            // Deposits were successfully claimed
                            // const claimedDeposits = event.inner.claimedDeposits
                        } else if (event.tag === SdkEvent_Tags.PaymentSucceeded) {
                        // A payment completed successfully
                            const payment = event.inner.payment

                            if (PaymentType.Send === payment.paymentType) {
                                console.log('[Breez SDK] Payment Sent: ', payment);

                                // Handle navigation to LNTransactionStatus in Wallet Send screen
                                setBreezEvent(event);
                            } else if (PaymentType.Receive === payment.paymentType) {
                                console.log(
                                    '[Breez SDK] Invoice Paid (Received Payment): ',
                                    event.inner,
                                );
            
                                // Handle navigation to LNTransactionStatus in Wallet Receive screen
                                setBreezEvent(event);
                            }
                        } else if (event.tag === SdkEvent_Tags.PaymentPending) {
                            // A payment is pending (waiting for confirmation)
                            // const pendingPayment = event.inner.payment
                        } else if (event.tag === SdkEvent_Tags.PaymentFailed) {
                            // A payment failed
                            const failedPayment = event.inner.payment
                            console.log('[Breez SDK] Payment Failed: ', failedPayment);

                            // Handle navigation to LNTransactionStatus in Wallet Receive & Send screen
                            setBreezEvent(event);
                        } else {
                            // Handle any future event types
                        }
                    }
                }

                // Set event listener
                const onBreezEvent = new onBreezEventListener().onEvent;

                console.log('Connecting to node with Breez API Key.');

                // Add API key, init wallet, and add event listeners
                try {
                    const config = defaultConfig(Network.Mainnet);
                    config.apiKey = breezAPIKey;
                    await wallet.initWallet(_wallet.mnemonic, config);
                    wallet.addEventListener(onBreezEvent)
                } catch (error) {
                    console.log('Error connecting to node:', error);
                }
            }
        };

        // turn on node
        initNode();

        // Set app ready
        setIsReady(true);
    }, []);

    useEffect(() => {
        // Load language when app language change
        i18n.changeLanguage(appLanguage.code);
    }, [appLanguage]);

      return (
        <View style={styles.container}>
            <RootScreen />
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default App;
