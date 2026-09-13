import './shim';
import './global.css';

import React from 'react';
import {AppRegistry, StyleSheet} from 'react-native';

// For frameProcessor in 'react-native-vision-camera'
import 'react-native-reanimated';

import {name as appName} from './app.json';
import {AppStorageProvider} from './class/storageContext';

import {GestureHandlerRootView} from 'react-native-gesture-handler';

import App from './App';

const AppWithStorage = () => {
    return (
        <AppStorageProvider>
            <GestureHandlerRootView style={styles.root}>
                <App />
            </GestureHandlerRootView>
        </AppStorageProvider>
    );
};

AppRegistry.registerComponent(appName, () => AppWithStorage);

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
});
