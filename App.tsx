import 'react-native-gesture-handler';

import React, {useEffect} from 'react';

import {StatusBar, useColorScheme, Linking} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {
    NavigationContainer,
    DefaultTheme,
    LinkingOptions,
} from '@react-navigation/native';

import Privacy from 'react-native-privacy-snapshot';

import InitScreen, {rootNavigation, navigationRef} from './Navigation';
import Color from './constants/Color';

import SplashScreen from 'react-native-splash-screen';

const App = () => {
    useEffect(() => {
        SplashScreen.hide();

        // Enable privacy blur for IOS; blur screen when screen inactive
        Privacy?.enabled(true);
    }, []);

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
