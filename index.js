import React from 'react';
import {AppRegistry} from 'react-native';

// For frameProcessor in 'react-native-vision-camera'
import 'react-native-reanimated';

import {name as appName} from './app.json';
import {AppStorageProvider} from './class/storageContext';

import App from './App';

const AppWithStorage = () => {
    return (
        <AppStorageProvider>
            <App />
        </AppStorageProvider>
    );
};

AppRegistry.registerComponent(appName, () => AppWithStorage);
