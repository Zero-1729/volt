import './shim';

import React from 'react';
import {AppRegistry, StyleSheet} from 'react-native';

// For frameProcessor in 'react-native-vision-camera'
import 'react-native-reanimated';

import {name as appName} from './app.json';
import {AppStorageProvider} from './class/storageContext';

import {GestureHandlerRootView} from 'react-native-gesture-handler';

import {TailwindProvider} from 'tailwind-rn';
import utilities from './tailwind.json';

import App from './App';

const AppWithStorage = () => {
    return (
        <AppStorageProvider>
            <TailwindProvider utilities={utilities}>
                <GestureHandlerRootView style={styles.root}>
                    <App />
                </GestureHandlerRootView>
            </TailwindProvider>
        </AppStorageProvider>
    );
};

AppRegistry.registerComponent(appName, () => AppWithStorage);

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
});
