/**
 * @format
 */

// For frameProcessor in 'react-native-vision-camera'
import 'react-native-reanimated';

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
