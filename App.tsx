/* eslint-disable react-hooks/exhaustive-deps */
import 'react-native-gesture-handler';

import React, {
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import {StatusBar, useColorScheme, Linking, AppState} from 'react-native';

import {useRenderCount} from './modules/hooks';

import {AppStorageContext} from './class/storageContext';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {actionAlert} from './components/alert';

import {checkClipboardContents} from './modules/clipboard';
import {capitalizeFirst} from './modules/transform';
import {useTranslation} from 'react-i18next';

import {
    NavigationContainer,
    DefaultTheme,
    LinkingOptions,
} from '@react-navigation/native';

import i18n from './i18n';

import Privacy from 'react-native-privacy-snapshot';

import InitScreen, {rootNavigation, navigationRef} from './Navigation';
import Color from './constants/Color';

import SplashScreen from 'react-native-splash-screen';

const App = () => {
    const appState = useRef(AppState.currentState);
    const renderCount = useRenderCount();

    const [checkClipboard, setCheckClipboard] = useState<boolean>(false);
    const [deepLinkURL, setDeepLinkURL] = useState<string>('');

    const {appLanguage, wallets} = useContext(AppStorageContext);
    const {t} = useTranslation('wallet');

    const ColorScheme = Color(useColorScheme());

    let Theme = {
        dark: ColorScheme.isDarkMode,
        colors: {
            // Spread the colors from the default theme
            // and include the custom Navigator theme colors
            ...DefaultTheme.colors,
            ...ColorScheme.NavigatorTheme.colors,
        },
    };

    // Clipboard check
    const checkAndSetClipboard = async () => {
        // We only display dialogs if content is not empty and valid invoice
        const clipboardResult = await checkClipboardContents();
        let clipboardMessage!: string;

        // Set clipboard message
        if (clipboardResult.invoiceType === 'lightning') {
            clipboardMessage = t('read_clipboard_lightning_text', {
                spec: clipboardResult.spec,
            });
        }

        if (clipboardResult.invoiceType === 'bitcoin') {
            clipboardMessage = t('read_clipboard_bitcoin_text');
        }

        // If clipboard has contents, display dialog
        if (
            clipboardResult.hasContents &&
            clipboardResult.invoiceType !== 'unsupported'
        ) {
            actionAlert(
                capitalizeFirst(t('clipboard')),
                clipboardMessage,
                capitalizeFirst(t('pay')),
                capitalizeFirst(t('cancel')),
                () => {
                    rootNavigation.navigate('SelectWallet', {
                        invoice: clipboardResult.content,
                    });
                },
            );
        }
    };

    // Deep linking
    const linking: LinkingOptions<{}> = {
        prefixes: ['bitcoin'],
        config: {
            screens: {
                SelectWallet: '',
            },
        },
        subscribe(listener): () => void {
            // Deep linking when app open
            const onReceiveLink = ({url}: {url: string}) => {
                rootNavigation.navigate('SelectWallet', {invoice: url});

                return listener(url);
            };

            // Listen to incoming links from deep linking
            const subscription = Linking.addEventListener('url', onReceiveLink);

            return () => {
                // Clean up the event listeners
                subscription.remove();
            };
        },
    };

    // Check deep link & clipboard if app newly launched if app previously unopened
    const checkDeepLinkAndClipboard = useCallback(async (): Promise<void> => {
        // Check deep link
        const url = await Linking.getInitialURL();

        if (url) {
            setDeepLinkURL(url);
            return;
        }

        // Check clipboard
        setCheckClipboard(true);
    }, []);

    useEffect(() => {
        SplashScreen.hide();

        // Enable privacy blur for IOS; blur screen when screen inactive
        Privacy?.enabled(true);

        // Check for deep link if app newly launched
        // Ensure that we have wallets before checking
        if (renderCount <= 2) {
            checkDeepLinkAndClipboard();
        }

        // TODO: Add check for Auth when app is active
        const appStateSub = AppState.addEventListener(
            'change',
            (incomingState): void => {
                // Check and run clipboard fn if app is active in foreground
                // Ensure that we have wallets before checking
                if (
                    appState.current.match(/background/) &&
                    incomingState === 'active'
                ) {
                    // Check clipboard contents
                    setCheckClipboard(true);
                }

                // Update app state
                appState.current = incomingState;
            },
        );

        return () => {
            // Kill subscription
            appStateSub.remove();
        };
    }, []);

    useEffect(() => {
        if (checkClipboard && wallets.length) {
            checkAndSetClipboard();
            setCheckClipboard(false);
        }

        if (deepLinkURL && wallets.length > 0) {
            rootNavigation.navigate('SelectWallet', {invoice: deepLinkURL});
            setDeepLinkURL('');
        }
    }, [checkClipboard, wallets, deepLinkURL]);

    useEffect(() => {
        // Load language when app language change
        i18n.changeLanguage(appLanguage.code);
    }, [appLanguage]);

    return (
        <SafeAreaProvider
            style={{backgroundColor: ColorScheme.Background.Primary}}>
            <StatusBar
                barStyle={
                    ColorScheme.isDarkMode ? 'light-content' : 'dark-content'
                }
                backgroundColor={ColorScheme.Background.Primary}
            />

            <NavigationContainer
                ref={navigationRef}
                theme={Theme}
                linking={linking}>
                <InitScreen />
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default App;
