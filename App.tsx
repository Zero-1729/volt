import 'react-native-gesture-handler';

import React, {
    ReactElement,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import {StatusBar, useColorScheme, Platform, NativeModules} from 'react-native';

import Toast from 'react-native-toast-message';

import {AppStorageContext} from './class/storageContext';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import i18n from './i18n';

import Privacy from 'react-native-privacy-snapshot';

import RootNavigator from './Navigation';
import OnboardingNavigator from './navigation/onboarding/OnboardingNavigator';
import Color from './constants/Color';

const App = () => {
    const [isReady, setIsReady] = useState<boolean>(false);

    const {appLanguage, isWalletInitialized} = useContext(AppStorageContext);

    const ColorScheme = Color(useColorScheme());

    const RootScreen = useCallback((): ReactElement => {
        if (!isReady) {
            return <></>;
        }

        if (isWalletInitialized) {
            return <RootNavigator />;
        }

        return <OnboardingNavigator />;
    }, [isReady, isWalletInitialized]);

    useEffect(() => {
        if (Platform.OS === 'android') {
            setTimeout(NativeModules.SplashScreenModule.hide, 100);
        }

        // Enable privacy blur for IOS; blur screen when screen inactive
        Privacy?.enabled(true);

        // Set app ready
        setIsReady(true);
    }, []);

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
            <RootScreen />
            <Toast />
        </SafeAreaProvider>
    );
};

export default App;
