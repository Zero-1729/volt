import React from 'react';
import {AppRegistry} from 'react-native';

// For frameProcessor in 'react-native-vision-camera'
import 'react-native-reanimated';

import {name as appName} from './app.json';
import {AppStorageProvider} from './class/storageContext';

import {TailwindProvider} from 'tailwind-rn';
import utilities from './tailwind.json';

import App from './App';

const AppWithStorage = () => {
    return (
        <AppStorageProvider>
            <TailwindProvider utilities={utilities}>
                <App />
            </TailwindProvider>
        </AppStorageProvider>
    );
};

AppRegistry.registerComponent(appName, () => AppWithStorage);
